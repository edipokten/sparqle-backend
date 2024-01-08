import { Injectable, HttpException, HttpStatus, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { LatLonDto, WindDataDto } from 'src/shared/dto/openweather-api';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class OpenweatherApiService {
  private readonly apiKey: string;
  private readonly logger = new Logger(OpenweatherApiService.name);

  constructor(
    private httpService: HttpService,
    private configService: ConfigService,
  ) {
    // Fetch the API key from the configuration service
    this.apiKey = this.configService.get<string>('OPENWEATHER_API_KEY');
  }

  /**
   * Fetches wind data from the OpenWeather API for given coordinates.
   * @param coords Contains the latitude and longitude for which the wind data is requested.
   * @returns An Observable of WindDataDto containing wind speed and direction.
   */
  getWindData(coords: LatLonDto): Observable<WindDataDto> {
    // Construct the URL for the OpenWeather API request
    const url = `https://api.openweathermap.org/data/2.5/weather?lat=${coords.lat}&lon=${coords.lon}&appid=${this.apiKey}`;
    this.logger.log({ url });

    return this.httpService.get(url).pipe(
      map((response) => {
        // Extract wind data from the API response
        const currentWeather = response.data.wind;
        this.logger.log({ currentWeather });

        // Map the API response to WindDataDto format
        const windData: WindDataDto = {
          wind_speed: currentWeather.speed,
          wind_deg: currentWeather.deg,
        };
        return windData;
      }),
      catchError((error) => this.handleError(error)),
    );
  }

  /**
   * Handles errors that occur during the API call.
   * @param error The error object received.
   * @returns An Observable that throws an HttpException.
   */
  private handleError(error: any): Observable<never> {
    if (error.response) {
      // Handle known API errors with the response data
      return throwError(
        () => new HttpException(error.response.data, error.response.status),
      );
    } else if (error.request) {
      // Handle cases where no response was received
      return throwError(
        () =>
          new HttpException(
            'No response received from OpenWeather API',
            HttpStatus.SERVICE_UNAVAILABLE,
          ),
      );
    } else {
      // Handle other types of errors (e.g., network errors)
      return throwError(
        () =>
          new HttpException(
            'Error making request to OpenWeather API',
            HttpStatus.INTERNAL_SERVER_ERROR,
          ),
      );
    }
  }
}
