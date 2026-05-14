import { Type } from 'class-transformer';
import {
  IsArray,
  IsDateString,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';
import { TransactionType } from '@prisma/client';

export class CommitImportItemDto {
  @IsString()
  @MaxLength(255)
  description: string;

  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0.01)
  amount: number;

  @IsEnum(TransactionType)
  type: TransactionType;

  @IsDateString()
  date: string;

  @IsString()
  @MaxLength(255)
  externalId: string;

  @IsOptional()
  @IsUUID()
  categoryId?: string | null;
}

export class CommitImportDto {
  @IsUUID()
  accountId: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CommitImportItemDto)
  items: CommitImportItemDto[];
}