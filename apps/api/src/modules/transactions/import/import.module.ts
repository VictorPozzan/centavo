import { Module } from '@nestjs/common';
import { ImportController } from './import.controller';
import { ImportService } from './import.service';
import { CsvParser } from './parsers/csv.parser';
import { OfxParser } from './parsers/ofx.parser';
import { TRANSACTION_PARSERS } from './parsers/transaction-parser.interface';

@Module({
  controllers: [ImportController],
  providers: [
    ImportService,
    CsvParser,
    OfxParser,
    {
      provide: TRANSACTION_PARSERS,
      useFactory: (csv: CsvParser, ofx: OfxParser) => [csv, ofx],
      inject: [CsvParser, OfxParser],
    },
  ],
})
export class ImportModule {}