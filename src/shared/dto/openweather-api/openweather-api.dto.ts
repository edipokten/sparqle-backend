import { IsNotEmpty, IsNumber } from 'class-validator';

export class LatLonDto {
  @IsNotEmpty()
  @IsNumber()
  lat: number;
  @IsNotEmpty()
  @IsNumber()
  lon: number;
}
export class WindDataDto {
  wind_speed: number;
  wind_deg: number;
}
