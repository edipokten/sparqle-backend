import { Module } from '@nestjs/common';

import { NoaaApiModule } from './noaa-api/noaa-api.module';
import { RoutingModule } from './routing/routing.module';
import { CsvManagerService } from './csv-manager/csv-manager.service';
import { CsvManagerModule } from './csv-manager/csv-manager.module';
import { CsvModule } from 'nest-csv-parser';
import { OpenweatherApiModule } from './openweather-api/openweather-api.module';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    NoaaApiModule,
    RoutingModule,
    CsvManagerModule,
    CsvModule,
    OpenweatherApiModule,
  ],
  providers: [CsvManagerService],
})
export class AppModule {}
