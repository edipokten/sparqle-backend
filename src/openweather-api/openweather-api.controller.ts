import { Controller, Get, Query } from '@nestjs/common';
import { OpenweatherApiService } from './openweather-api.service';
import { LatLonDto } from 'src/shared/dto/openweather-api';

@Controller('wind')
export class OpenweatherApiController {
  constructor(private readonly openWeatherApiService: OpenweatherApiService) {}

  /**
   * Handles GET requests to fetch current wind data.
   * The endpoint expects query parameters for latitude and longitude.
   *
   * @param coords An object containing the latitude and longitude.
   * @returns An Observable that emits the wind data retrieved from the Openweather API.
   */
  @Get('current')
  async getWindData(@Query() coords: LatLonDto) {
    // Calls the OpenweatherApiService to fetch wind data for the provided coordinates
    return this.openWeatherApiService.getWindData(coords);
  }
}
