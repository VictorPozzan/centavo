import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from '../modules/prisma/prisma.module';
import { AuthModule } from '../modules/auth/auth.module';
import { AccountsModule } from '../modules/accounts/accounts.module';
import { CategoriesModule } from '../modules/categories/categories.module';
import { TransactionsModule } from '../modules/transactions/transactions.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    PrismaModule,
    AuthModule,
    AccountsModule,
    CategoriesModule,
    TransactionsModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}