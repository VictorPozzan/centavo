import { Injectable, NotFoundException } from '@nestjs/common';
import { Account } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateAccountDto } from './dto/create-account.dto';
import { UpdateAccountDto } from './dto/update-account.dto';

@Injectable()
export class AccountsService {
  constructor(private readonly prisma: PrismaService) {}

  create(userId: string, dto: CreateAccountDto): Promise<Account> {
    return this.prisma.account.create({
      data: { ...dto, userId },
    });
  }

  findAll(userId: string): Promise<Account[]> {
    return this.prisma.account.findMany({
      where: { userId },
      orderBy: { createdAt: 'asc' },
    });
  }

  async findOne(userId: string, id: string): Promise<Account> {
    const account = await this.prisma.account.findFirst({
      where: { id, userId },
    });

    if (!account) {
      throw new NotFoundException('Account not found');
    }

    return account;
  }

  async update(userId: string, id: string, dto: UpdateAccountDto): Promise<Account> {
    await this.findOne(userId, id); // garante ownership

    return this.prisma.account.update({
      where: { id },
      data: dto,
    });
  }

  async remove(userId: string, id: string): Promise<void> {
    await this.findOne(userId, id);

    await this.prisma.account.delete({ where: { id } });
  }
}