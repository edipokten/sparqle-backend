import { Module } from '@nestjs/common';
import { OpenweatherApiService } from './openweather-api.service';
import { OpenweatherApiController } from './openweather-api.controller';
import { HttpModule } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';

@Module({
  controllers: [OpenweatherApiController],
  providers: [OpenweatherApiService, ConfigService],
  imports: [HttpModule],
})
export class OpenweatherApiModule {}
