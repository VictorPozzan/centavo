import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { TransactionsService } from './transactions.service';
import { PrismaService } from '../prisma/prisma.service';

describe('TransactionsService', () => {
  let service: TransactionsService;
  let prisma: jest.Mocked<PrismaService>;

  const userId = 'user-1';

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TransactionsService,
        {
          provide: PrismaService,
          useValue: {
            transaction: {
              create: jest.fn(),
              findMany: jest.fn(),
              findFirst: jest.fn(),
              update: jest.fn(),
              delete: jest.fn(),
              count: jest.fn(),
            },
            account: { findFirst: jest.fn() },
            category: { findFirst: jest.fn() },
            $transaction: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get(TransactionsService);
    prisma = module.get(PrismaService);
  });

  describe('create', () => {
    it('should reject creation if account belongs to another user', async () => {
      (prisma.account.findFirst as jest.Mock).mockResolvedValue(null);

      await expect(
        service.create(userId, {
          description: 'Test',
          amount: 100,
          type: 'EXPENSE',
          date: new Date(),
          accountId: 'acc-other',
        }),
      ).rejects.toThrow(BadRequestException);
      expect(prisma.transaction.create).not.toHaveBeenCalled();
    });

    it('should reject creation if category belongs to another user', async () => {
      (prisma.account.findFirst as jest.Mock).mockResolvedValue({ id: 'acc-1' });
      (prisma.category.findFirst as jest.Mock).mockResolvedValue(null);

      await expect(
        service.create(userId, {
          description: 'Test',
          amount: 100,
          type: 'EXPENSE',
          date: new Date(),
          accountId: 'acc-1',
          categoryId: 'cat-other',
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should create when ownership is valid', async () => {
      (prisma.account.findFirst as jest.Mock).mockResolvedValue({ id: 'acc-1' });
      (prisma.category.findFirst as jest.Mock).mockResolvedValue({ id: 'cat-1' });
      (prisma.transaction.create as jest.Mock).mockResolvedValue({ id: 'tx-1' });

      const result = await service.create(userId, {
        description: 'Lunch',
        amount: 50,
        type: 'EXPENSE',
        date: new Date('2026-05-10'),
        accountId: 'acc-1',
        categoryId: 'cat-1',
      });

      expect(result).toEqual({ id: 'tx-1' });
    });
  });

  describe('findOne', () => {
    it('should throw NotFoundException if transaction belongs to another user', async () => {
      (prisma.transaction.findFirst as jest.Mock).mockResolvedValue(null);

      await expect(service.findOne(userId, 'tx-1')).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});