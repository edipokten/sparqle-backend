import { Controller, Get, HttpCode, HttpStatus, Query } from '@nestjs/common';
import { NoaaApiService } from './noaa-api.service';

@Controller('windmap')
export class NoaaApiController {
  constructor(private noaaApiService: NoaaApiService) {}

  /**
   * Endpoint to get the latest wind data.
   * It optionally takes a 'forecast' query parameter to specify the forecast hour.
   *
   * @param forecast - The forecast hour as a string. If not provided, the latest data is fetched.
   * @returns The wind data for the specified forecast hour or the latest data if no hour is specified.
   */
  @Get()
  @HttpCode(HttpStatus.OK)
  async getLatestData(@Query('forecast') forecast: string) {
    // Parse the 'forecast' query parameter to an integer. If not provided, set it to undefined.
    const forecastHour = forecast ? parseInt(forecast) : undefined;

    // Fetch the data from the NOAA API service using the provided forecast hour.
    const data = await this.noaaApiService.getLatestData(forecastHour);

    return data;
  }
}
