import { IsEnum, IsString, MaxLength, MinLength } from 'class-validator';
import { AccountType } from '@prisma/client';

export class CreateAccountDto {
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  name: string;

  @IsEnum(AccountType, {
    message: `type must be one of: ${Object.values(AccountType).join(', ')}`,
  })
  type: AccountType;
}