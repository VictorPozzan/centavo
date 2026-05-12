import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { AccountsService } from './accounts.service';
import { PrismaService } from '../prisma/prisma.service';

describe('AccountsService', () => {
  let service: AccountsService;
  let prisma: jest.Mocked<PrismaService>;

  const userId = 'user-1';
  const otherUserId = 'user-2';

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AccountsService,
        {
          provide: PrismaService,
          useValue: {
            account: {
              create: jest.fn(),
              findMany: jest.fn(),
              findFirst: jest.fn(),
              update: jest.fn(),
              delete: jest.fn(),
            },
          },
        },
      ],
    }).compile();

    service = module.get(AccountsService);
    prisma = module.get(PrismaService);
  });

  describe('create', () => {
    it('should create an account with userId', async () => {
      (prisma.account.create as jest.Mock).mockResolvedValue({ id: 'acc-1' });

      await service.create(userId, { name: 'Nubank', type: 'CHECKING' });

      expect(prisma.account.create).toHaveBeenCalledWith({
        data: { name: 'Nubank', type: 'CHECKING', userId },
      });
    });
  });

  describe('findOne', () => {
    it('should return account when it belongs to user', async () => {
      const account = { id: 'acc-1', userId, name: 'Nubank' };
      (prisma.account.findFirst as jest.Mock).mockResolvedValue(account);

      const result = await service.findOne(userId, 'acc-1');

      expect(result).toEqual(account);
      expect(prisma.account.findFirst).toHaveBeenCalledWith({
        where: { id: 'acc-1', userId },
      });
    });

    it('should throw NotFoundException when account belongs to another user', async () => {
      (prisma.account.findFirst as jest.Mock).mockResolvedValue(null);

      await expect(service.findOne(otherUserId, 'acc-1')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw NotFoundException when account does not exist', async () => {
      (prisma.account.findFirst as jest.Mock).mockResolvedValue(null);

      await expect(service.findOne(userId, 'nonexistent')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('update', () => {
    it('should update only if user owns the account', async () => {
      (prisma.account.findFirst as jest.Mock).mockResolvedValue({
        id: 'acc-1',
        userId,
      });
      (prisma.account.update as jest.Mock).mockResolvedValue({
        id: 'acc-1',
        name: 'New Name',
      });

      await service.update(userId, 'acc-1', { name: 'New Name' });

      expect(prisma.account.update).toHaveBeenCalledWith({
        where: { id: 'acc-1' },
        data: { name: 'New Name' },
      });
    });

    it('should throw if account does not belong to user', async () => {
      (prisma.account.findFirst as jest.Mock).mockResolvedValue(null);

      await expect(
        service.update(userId, 'acc-1', { name: 'Hack' }),
      ).rejects.toThrow(NotFoundException);
      expect(prisma.account.update).not.toHaveBeenCalled();
    });
  });
});