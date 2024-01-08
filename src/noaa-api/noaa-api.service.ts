import { HttpService } from '@nestjs/axios';
import { Injectable, Logger } from '@nestjs/common';
import * as moment from 'moment';
import * as fs from 'fs';
import { promises as fsPromises } from 'fs';
import axios, { AxiosResponse } from 'axios';
import { Readable } from 'stream';
import { exec } from 'child_process';
import { Cron, CronExpression } from '@nestjs/schedule';
import * as path from 'path';

@Injectable()
export class NoaaApiService {
  private readonly logger = new Logger(NoaaApiService.name);

  // Base URL for NOAA's GFS data and directories for storing downloaded data
  private readonly baseDir =
    'http://nomads.ncep.noaa.gov/cgi-bin/filter_gfs_1p00.pl';
  private readonly jsonData = './src/data/json-data'; // Directory for JSON data files
  private readonly gribData = './src/data/grib-data'; // Directory for GRIB data files

  constructor(private readonly httpService: HttpService) {}

  // Initializes module and starts data fetching process
  onModuleInit() {
    this.fetchAndProcessData();
  }

  // Scheduled task to fetch GRIB data every 5 minutes
  @Cron(CronExpression.EVERY_5_MINUTES)
  handleCron() {
    this.logger.debug('Running scheduled task to fetch GRIB data');
    this.fetchAndProcessData();
  }

  // Fetches the latest data based on the provided forecast hour
  async getLatestData(forecastHour: number = 0): Promise<any> {
    try {
      const targetMoment = moment().utc();
      const file = await this.constructFileName(targetMoment, forecastHour);

      if (!file) {
        throw new Error('No data files found.');
      }

      const filePath = path.join(this.jsonData, file);
      const fileContents = await fsPromises.readFile(filePath, 'utf8');

      return JSON.parse(fileContents);
    } catch (error) {
      this.logger.error('Error fetching the latest data:', error);
      throw error;
    }
  }

  // Constructs a filename based on the target moment and forecast hour
  private async constructFileName(
    targetMoment: moment.Moment,
    forecastHour: number,
    attempts: number = 0,
  ): Promise<string | null> {
    if (attempts > 4) {
      // Limit to 24 hours back (4 * 6 hours)
      return null;
    }

    const stamp =
      targetMoment.format('YYYYMMDD') + this.roundHours(targetMoment.hour(), 6);
    const period = this.roundHours(moment(targetMoment).hour(), 6);

    let fileNumber = this.roundHours(
      moment().subtract(period, 'hours').hour(),
      3,
    );
    if (forecastHour > 0) {
      const fileNumberInt = parseInt(fileNumber);
      const sum = fileNumberInt + forecastHour;
      fileNumber = this.roundHours(sum, 1);
    }

    const fileName = `${stamp}.f0${fileNumber}.json`;

    try {
      const filePath = path.join(this.jsonData, fileName);
      await fsPromises.access(filePath);
      return fileName;
    } catch (error) {
      // File does not exist, try 6 hours before
      return this.constructFileName(
        targetMoment.subtract(6, 'hours'),
        forecastHour,
        attempts + 1,
      );
    }
  }

  // Placeholder for getWind method
  async getWind(): Promise<any> {}

  // Fetches GRIB data for a specific target moment
  async getGribData(
    targetMoment: moment.Moment = moment.utc(),
    attempt: number = 0,
  ): Promise<string[]> {
    if (attempt > 1) {
      // Limiting attempts to 1 day back
      this.logger.log(
        'Data not available for the specified date and previous day.',
      );
      return [];
    }

    if (moment.utc().diff(targetMoment, 'days') > 1) {
      this.logger.log('Fetching data for the previous day.');
      return this.getGribData(targetMoment.subtract(1, 'days'), attempt + 1);
    }

    const t = this.roundHours(moment(targetMoment).hour(), 6);
    const date = moment(targetMoment).format('YYYYMMDD');
    const stamp = date + t;

    const filePromises = [];

    for (let i = 0; i <= 24; i += 3) {
      const fileSuffix = 'f' + String(i).padStart(3, '0');

      const fileName = 'gfs.t' + t + 'z.pgrb2.1p00.' + fileSuffix;

      const file = stamp + '.' + fileSuffix;

      const filePath = `./${this.gribData}/${file}`;

      const downloadPromise = this.downloadFile(
        date,
        t,
        fileName,
        file,
        filePath,
      ).then((result) => {
        if (result === 'NOT_FOUND') {
          // If file not found, log and return null
          this.logger.log(`File not found: ${file}`);
          return null;
        }
        return result;
      });

      filePromises.push(downloadPromise);
    }

    const results = await Promise.all(filePromises);
    const allFilesNotFound = results.every((result) => result === null);
    if (allFilesNotFound && attempt < 1) {
      // If all files are not found and attempt is less than the limit, retry 6 hours earlier
      this.logger.log('Retrying with data 6 hours earlier.');
      return this.getGribData(targetMoment.subtract(6, 'hours'), attempt + 1);
    }

    return results.filter((result) => result !== null);
  }

  // Fetches and processes data, handling any errors
  private async fetchAndProcessData() {
    try {
      const targetMoment = moment.utc();
      this.logger.log(`Fetching data for time: ${targetMoment.toISOString()}`);

      // Fetch the data
      const gribData = await this.getGribData(targetMoment);

      // Check if data is returned
      if (!gribData || gribData.length === 0) {
        this.logger.warn('No data fetched');
        return;
      }

      this.logger.log('Successfully fetched and processed GRIB data');
    } catch (error) {
      this.logger.error('Error fetching and processing GRIB data', error);
    }
  }

  // Downloads a file from NOAA's GFS data
  private async downloadFile(
    date: string,
    t: string,
    fileName: string,
    file: string,
    filePath: string,
  ): Promise<string | 'NOT_FOUND'> {
    const directory = filePath.substring(0, filePath.lastIndexOf('/'));
    if (!this.checkPath(directory, true)) {
      throw new Error(`Unable to create or access directory: ${directory}`);
    }

    const url = `${this.baseDir}?file=${fileName}&lev_10_m_above_ground=on&lev_surface=on&var_TMP=on&var_UGRD=on&var_VGRD=on&leftlon=0&rightlon=360&toplat=90&bottomlat=-90&dir=/gfs.${date}/${t}/atmos`;
    try {
      const response: AxiosResponse<Readable> =
        await this.httpService.axiosRef.get(url, { responseType: 'stream' });

      const writer = fs.createWriteStream(filePath);

      response.data.pipe(writer);

      return new Promise((resolve, reject) => {
        writer.on('finish', async () => {
          await this.convertGribToJson([file]);
          resolve(file);
        });
        writer.on('error', reject);
      });
    } catch (error) {
      if (
        axios.isAxiosError(error) &&
        error.response &&
        error.response.status === 404
      ) {
        // Handle 404 error specifically
        this.logger.log(`File not found: ${file}`);
        return 'NOT_FOUND';
      } else {
        // Handle other errors
        this.logger.error(`Error fetching file: ${file}`, error);
        throw error;
      }
    }
  }

  // Rounds hours to the nearest interval
  private roundHours(hours: number, interval: number): string {
    const result = Math.floor(hours / interval) * interval;
    return result < 10 ? '0' + result.toString() : result.toString();
  }

  // Checks and creates a path if it doesn't exist
  private checkPath(path: string, mkdir: boolean): boolean {
    try {
      fs.accessSync(path, fs.constants.F_OK);
      return true; // The path exists
    } catch (e) {
      if (mkdir) {
        fs.mkdirSync(path, { recursive: true }); // Create the directory, including parent directories as necessary
        return true;
      }
      return false; // The path does not exist and was not created
    }
  }

  // Converts GRIB data to JSON format
  private async convertGribToJson(stamps: string[]): Promise<void> {
    for (const stamp of stamps) {
      try {
        await this.convertFile(stamp);
      } catch (error) {
        this.logger.error(`Error converting file: ${stamp}`, error);
      }
    }
  }

  // Converts a single GRIB file to JSON
  private convertFile(stamp: string): Promise<void> {
    return new Promise((resolve, reject) => {
      // Ensure the output directory exists
      const jsonOutputDir = this.jsonData;
      if (!this.checkPath(jsonOutputDir, true)) {
        reject(`Unable to create or access directory: ${jsonOutputDir}`);
        return;
      }

      const command = `converter/bin/grib2json --data --output ${this.jsonData}/${stamp}.json --names --compact ${this.gribData}/${stamp}`;

      exec(command, { maxBuffer: 500 * 1024 }, (error) => {
        if (error) {
          this.logger.error(`Error in exec for file ${stamp}: ${error}`);
          reject(error);
        } else {
          this.logger.log(`Converted ${stamp} to JSON`);
          exec(`rm ${this.gribData}/${stamp}`);
          resolve();
        }
      });
    });
  }
}
