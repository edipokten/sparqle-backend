import { IsNotEmpty, IsNumber } from 'class-validator';

export class ForecastDto {
  @IsNotEmpty()
  @IsNumber()
  forecast: number;
}
