import { Injectable, Logger } from '@nestjs/common';
import { CsvParser } from 'nest-csv-parser';
import * as fs from 'fs';
import { DeliveryData, RawDeliveryData } from '../shared/dto/csv';

@Injectable()
export class CsvManagerService {
  private readonly logger = new Logger(CsvManagerService.name);
  // Path to the CSV file containing routing data.
  private readonly routingData = './src/data/routing-data/data.csv';

  constructor(private readonly csvParser: CsvParser) {}

  /**
   * Reads delivery data from a CSV file and converts it into DeliveryData objects.
   * @returns An array of DeliveryData objects.
   */
  async getDeliveries(): Promise<DeliveryData[]> {
    // Create a read stream for the CSV file.
    const readStream = fs.createReadStream(this.routingData);

    // Parse the CSV file content into an array of RawDeliveryData objects.
    const rawDeliveryData: RawDeliveryData[] = (
      await this.csvParser.parse(readStream, RawDeliveryData)
    ).list;

    // Convert each RawDeliveryData object into a DeliveryData object.
    const deliveryData = rawDeliveryData.map(
      (delivery) => new DeliveryData(delivery),
    );

    return deliveryData;
  }
}
