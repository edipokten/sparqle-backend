import { Module } from '@nestjs/common';
import { RoutingController } from './routing.controller';
import { RoutingService } from './routing.service';
import { CsvManagerModule } from 'src/csv-manager/csv-manager.module';

@Module({
  controllers: [RoutingController],
  providers: [RoutingService],
  imports: [CsvManagerModule],
})
export class RoutingModule {}
