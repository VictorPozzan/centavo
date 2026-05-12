import {
    ConflictException,
    Injectable,
    NotFoundException,
  } from '@nestjs/common';
  import { Category, Prisma } from '@prisma/client';
  import { PrismaService } from '../prisma/prisma.service';
  import { CreateCategoryDto } from './dto/create-category.dto';
  import { UpdateCategoryDto } from './dto/update-category.dto';
  
  @Injectable()
  export class CategoriesService {
    constructor(private readonly prisma: PrismaService) {}
  
    async create(userId: string, dto: CreateCategoryDto): Promise<Category> {
      try {
        return await this.prisma.category.create({
          data: { ...dto, userId },
        });
      } catch (err) {
        if (
          err instanceof Prisma.PrismaClientKnownRequestError &&
          err.code === 'P2002'
        ) {
          throw new ConflictException(
            `Category "${dto.name}" already exists`,
          );
        }
        throw err;
      }
    }
  
    findAll(userId: string): Promise<Category[]> {
      return this.prisma.category.findMany({
        where: { userId },
        orderBy: { name: 'asc' },
      });
    }
  
    async findOne(userId: string, id: string): Promise<Category> {
      const category = await this.prisma.category.findFirst({
        where: { id, userId },
      });
  
      if (!category) {
        throw new NotFoundException('Category not found');
      }
  
      return category;
    }
  
    async update(
      userId: string,
      id: string,
      dto: UpdateCategoryDto,
    ): Promise<Category> {
      await this.findOne(userId, id);
  
      try {
        return await this.prisma.category.update({
          where: { id },
          data: dto,
        });
      } catch (err) {
        if (
          err instanceof Prisma.PrismaClientKnownRequestError &&
          err.code === 'P2002'
        ) {
          throw new ConflictException(
            `Category "${dto.name}" already exists`,
          );
        }
        throw err;
      }
    }
  
    async remove(userId: string, id: string): Promise<void> {
      await this.findOne(userId, id);
      await this.prisma.category.delete({ where: { id } });
    }
  }