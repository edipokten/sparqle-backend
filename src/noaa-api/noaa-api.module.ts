import { Module } from '@nestjs/common';
import { NoaaApiController } from './noaa-api.controller';
import { NoaaApiService } from './noaa-api.service';
import { HttpModule } from '@nestjs/axios';
import { ScheduleModule } from '@nestjs/schedule';

@Module({
  imports: [HttpModule, ScheduleModule.forRoot()],
  controllers: [NoaaApiController],
  providers: [NoaaApiService],
})
export class NoaaApiModule {}
