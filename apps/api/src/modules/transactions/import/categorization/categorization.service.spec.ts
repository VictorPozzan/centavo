import { Test, TestingModule } from '@nestjs/testing';
import { CategorizationService } from './categorization.service';
import { PrismaService } from '../../../prisma/prisma.service';
import { ParsedTransaction } from '../types';

describe('CategorizationService', () => {
  let service: CategorizationService;
  let prisma: jest.Mocked<PrismaService>;

  const userId = 'user-1';

  const makeTransaction = (
    description: string,
    externalId = description,
  ): ParsedTransaction => ({
    externalId,
    description,
    amount: 50,
    type: 'EXPENSE',
    date: '2026-05-01T00:00:00.000Z',
  });

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CategorizationService,
        {
          provide: PrismaService,
          useValue: {
            transaction: { findMany: jest.fn() },
            category: { findMany: jest.fn() },
          },
        },
      ],
    }).compile();

    service = module.get(CategorizationService);
    prisma = module.get(PrismaService);
  });

  describe('history-based matching', () => {
    it('suggests a category based on a similar past transaction', async () => {
      (prisma.transaction.findMany as jest.Mock).mockResolvedValue([
        { description: 'NETFLIX.COM', categoryId: 'cat-entertainment' },
      ]);
      (prisma.category.findMany as jest.Mock).mockResolvedValue([]);

      const result = await service.suggest(userId, [
        makeTransaction('NETFLIX.COM 02/2026'),
      ]);

      expect(result.get('NETFLIX.COM 02/2026')).toBe('cat-entertainment');
    });

    it('does not suggest when there is no meaningful overlap', async () => {
      (prisma.transaction.findMany as jest.Mock).mockResolvedValue([
        { description: 'NETFLIX.COM', categoryId: 'cat-entertainment' },
      ]);
      (prisma.category.findMany as jest.Mock).mockResolvedValue([]);

      const result = await service.suggest(userId, [
        makeTransaction('RANDOM UNRELATED STORE'),
      ]);

      expect(result.has('RANDOM UNRELATED STORE')).toBe(false);
    });

    it('favors the category with the most consistent history', async () => {
      (prisma.transaction.findMany as jest.Mock).mockResolvedValue([
        { description: 'AMAZON PURCHASE', categoryId: 'cat-work' },
        { description: 'AMAZON PURCHASE', categoryId: 'cat-work' },
        { description: 'AMAZON STORE', categoryId: 'cat-shopping' },
      ]);
      (prisma.category.findMany as jest.Mock).mockResolvedValue([]);

      const result = await service.suggest(userId, [
        makeTransaction('AMAZON PURCHASE ORDER'),
      ]);

      // cat-work has two consistent votes, should win over cat-shopping
      expect(result.get('AMAZON PURCHASE ORDER')).toBe('cat-work');
    });
  });

  describe('default rules matching', () => {
    it('suggests via predefined rule when user has a matching category', async () => {
      (prisma.transaction.findMany as jest.Mock).mockResolvedValue([]);
      (prisma.category.findMany as jest.Mock).mockResolvedValue([
        { id: 'cat-transport', name: 'Transport' },
        { id: 'cat-food', name: 'Food' },
      ]);

      const result = await service.suggest(userId, [
        makeTransaction('UBER TRIP SAO PAULO'),
      ]);

      expect(result.get('UBER TRIP SAO PAULO')).toBe('cat-transport');
    });

    it('does not suggest when user has no matching category for the rule', async () => {
      (prisma.transaction.findMany as jest.Mock).mockResolvedValue([]);
      (prisma.category.findMany as jest.Mock).mockResolvedValue([
        { id: 'cat-food', name: 'Food' },
      ]);

      const result = await service.suggest(userId, [
        makeTransaction('UBER TRIP SAO PAULO'),
      ]);

      // Rule matches UBER, but user has no Transport category
      expect(result.has('UBER TRIP SAO PAULO')).toBe(false);
    });

    it('matches category names case-insensitively', async () => {
      (prisma.transaction.findMany as jest.Mock).mockResolvedValue([]);
      (prisma.category.findMany as jest.Mock).mockResolvedValue([
        { id: 'cat-food', name: 'FOOD' },
      ]);

      const result = await service.suggest(userId, [
        makeTransaction('IFOOD DELIVERY'),
      ]);

      expect(result.get('IFOOD DELIVERY')).toBe('cat-food');
    });
  });

  describe('priority: history over rules', () => {
    it('prefers user history even when a default rule would also match', async () => {
      // User always categorizes UBER as "Business" — not the default "Transport"
      (prisma.transaction.findMany as jest.Mock).mockResolvedValue([
        { description: 'UBER TRIP', categoryId: 'cat-business' },
      ]);
      (prisma.category.findMany as jest.Mock).mockResolvedValue([
        { id: 'cat-transport', name: 'Transport' },
        { id: 'cat-business', name: 'Business' },
      ]);

      const result = await service.suggest(userId, [
        makeTransaction('UBER TRIP DOWNTOWN'),
      ]);

      // History wins: should be cat-business, not cat-transport
      expect(result.get('UBER TRIP DOWNTOWN')).toBe('cat-business');
    });
  });

  describe('edge cases', () => {
    it('returns empty map when there are no transactions', async () => {
      (prisma.transaction.findMany as jest.Mock).mockResolvedValue([]);
      (prisma.category.findMany as jest.Mock).mockResolvedValue([]);

      const result = await service.suggest(userId, []);

      expect(result.size).toBe(0);
    });

    it('handles descriptions that tokenize to nothing', async () => {
      (prisma.transaction.findMany as jest.Mock).mockResolvedValue([]);
      (prisma.category.findMany as jest.Mock).mockResolvedValue([]);

      const result = await service.suggest(userId, [
        makeTransaction('12 34 56'), // only digits — no tokens
      ]);

      expect(result.has('12 34 56')).toBe(false);
    });
  });
});