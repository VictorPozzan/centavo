import { Type } from 'class-transformer';
import {
  IsDate,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  Min,
} from 'class-validator';
import { TransactionType } from '@prisma/client';

export class CreateTransactionDto {
  @IsString()
  @MaxLength(255)
  description: string;

  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0.01)
  @Type(() => Number)
  amount: number;

  @IsEnum(TransactionType)
  type: TransactionType;

  @IsDate()
  @Type(() => Date)
  date: Date;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  notes?: string;

  @IsUUID()
  accountId: string;

  @IsOptional()
  @IsUUID()
  categoryId?: string;
}