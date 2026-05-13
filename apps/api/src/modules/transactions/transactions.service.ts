import {
    BadRequestException,
    Injectable,
    NotFoundException,
  } from '@nestjs/common';
  import { Prisma, Transaction } from '@prisma/client';
  import { PrismaService } from '../prisma/prisma.service';
  import { CreateTransactionDto } from './dto/create-transaction.dto';
  import { UpdateTransactionDto } from './dto/update-transaction.dto';
  import { ListTransactionsDto } from './dto/list-transactions.dto';
  
  export interface PaginatedTransactions {
    data: Transaction[];
    total: number;
    limit: number;
    offset: number;
  }
  
  @Injectable()
  export class TransactionsService {
    constructor(private readonly prisma: PrismaService) {}
  
    async create(
      userId: string,
      dto: CreateTransactionDto,
    ): Promise<Transaction> {
      await this.assertAccountOwnership(userId, dto.accountId);
      if (dto.categoryId) {
        await this.assertCategoryOwnership(userId, dto.categoryId);
      }
  
      return this.prisma.transaction.create({
        data: { ...dto, userId, source: 'MANUAL' },
      });
    }
  
    async findAll(
      userId: string,
      filters: ListTransactionsDto,
    ): Promise<PaginatedTransactions> {
      const where: Prisma.TransactionWhereInput = {
        userId,
        ...(filters.type && { type: filters.type }),
        ...(filters.accountId && { accountId: filters.accountId }),
        ...(filters.categoryId && { categoryId: filters.categoryId }),
        ...((filters.startDate || filters.endDate) && {
          date: {
            ...(filters.startDate && { gte: filters.startDate }),
            ...(filters.endDate && { lte: filters.endDate }),
          },
        }),
      };
  
      const [data, total] = await this.prisma.$transaction([
        this.prisma.transaction.findMany({
          where,
          orderBy: [{ date: 'desc' }, { createdAt: 'desc' }],
          take: filters.limit,
          skip: filters.offset,
          include: {
            account: { select: { id: true, name: true, type: true } },
            category: { select: { id: true, name: true, color: true, icon: true } },
          },
        }),
        this.prisma.transaction.count({ where }),
      ]);
  
      return {
        data,
        total,
        limit: filters.limit ?? 50,
        offset: filters.offset ?? 0,
      };
    }
  
    async findOne(userId: string, id: string): Promise<Transaction> {
      const transaction = await this.prisma.transaction.findFirst({
        where: { id, userId },
        include: {
          account: { select: { id: true, name: true, type: true } },
          category: { select: { id: true, name: true, color: true, icon: true } },
        },
      });
  
      if (!transaction) {
        throw new NotFoundException('Transaction not found');
      }
  
      return transaction;
    }
  
    async update(
      userId: string,
      id: string,
      dto: UpdateTransactionDto,
    ): Promise<Transaction> {
      await this.findOne(userId, id);
  
      if (dto.accountId) {
        await this.assertAccountOwnership(userId, dto.accountId);
      }
      if (dto.categoryId) {
        await this.assertCategoryOwnership(userId, dto.categoryId);
      }
  
      return this.prisma.transaction.update({
        where: { id },
        data: dto,
      });
    }
  
    async remove(userId: string, id: string): Promise<void> {
      await this.findOne(userId, id);
      await this.prisma.transaction.delete({ where: { id } });
    }
  
    private async assertAccountOwnership(
      userId: string,
      accountId: string,
    ): Promise<void> {
      const account = await this.prisma.account.findFirst({
        where: { id: accountId, userId },
        select: { id: true },
      });
      if (!account) {
        throw new BadRequestException(`Account ${accountId} not found`);
      }
    }
  
    private async assertCategoryOwnership(
      userId: string,
      categoryId: string,
    ): Promise<void> {
      const category = await this.prisma.category.findFirst({
        where: { id: categoryId, userId },
        select: { id: true },
      });
      if (!category) {
        throw new BadRequestException(`Category ${categoryId} not found`);
      }
    }

    async getSummary(
      userId: string,
      filters: ListTransactionsDto,
    ): Promise<{
      income: string;
      expense: string;
      net: string;
      incomeCount: number;
      expenseCount: number;
    }> {
      const where: Prisma.TransactionWhereInput = {
        userId,
        ...(filters.accountId && { accountId: filters.accountId }),
        ...(filters.categoryId && { categoryId: filters.categoryId }),
        ...((filters.startDate || filters.endDate) && {
          date: {
            ...(filters.startDate && { gte: filters.startDate }),
            ...(filters.endDate && { lte: filters.endDate }),
          },
        }),
      };
    
      const [incomeAgg, expenseAgg] = await this.prisma.$transaction([
        this.prisma.transaction.aggregate({
          where: { ...where, type: 'INCOME' },
          _sum: { amount: true },
          _count: true,
        }),
        this.prisma.transaction.aggregate({
          where: { ...where, type: 'EXPENSE' },
          _sum: { amount: true },
          _count: true,
        }),
      ]);
    
      const income = incomeAgg._sum.amount ?? new Prisma.Decimal(0);
      const expense = expenseAgg._sum.amount ?? new Prisma.Decimal(0);
      const net = income.minus(expense);
    
      return {
        income: income.toFixed(2),
        expense: expense.toFixed(2),
        net: net.toFixed(2),
        incomeCount: incomeAgg._count,
        expenseCount: expenseAgg._count,
      };
    }
  }