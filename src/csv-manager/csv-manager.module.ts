import { Module } from '@nestjs/common';
import { CsvManagerService } from './csv-manager.service';
import { CsvModule } from 'nest-csv-parser';

@Module({
  imports: [CsvModule],
  providers: [CsvManagerService],
  exports: [CsvManagerService],
})
export class CsvManagerModule {}
