import { Test, TestingModule } from '@nestjs/testing';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { CategoriesService } from './categories.service';
import { PrismaService } from '../prisma/prisma.service';

describe('CategoriesService', () => {
  let service: CategoriesService;
  let prisma: jest.Mocked<PrismaService>;

  const userId = 'user-1';

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CategoriesService,
        {
          provide: PrismaService,
          useValue: {
            category: {
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

    service = module.get(CategoriesService);
    prisma = module.get(PrismaService);
  });

  describe('create', () => {
    it('should throw ConflictException on duplicate name', async () => {
      const error = new Prisma.PrismaClientKnownRequestError(
        'Unique constraint failed',
        { code: 'P2002', clientVersion: '6.0.0' },
      );
      (prisma.category.create as jest.Mock).mockRejectedValue(error);

      await expect(
        service.create(userId, { name: 'Food' }),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('findOne', () => {
    it('should throw NotFoundException when category belongs to another user', async () => {
      (prisma.category.findFirst as jest.Mock).mockResolvedValue(null);

      await expect(service.findOne(userId, 'cat-1')).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});