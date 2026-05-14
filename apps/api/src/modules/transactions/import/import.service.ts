import {
    BadRequestException,
    Injectable,
    Inject,
  } from '@nestjs/common';
  import { Prisma } from '@prisma/client';
  import { PrismaService } from '../../prisma/prisma.service';
  import {
    TransactionParser,
    TRANSACTION_PARSERS,
  } from './parsers/transaction-parser.interface';
  import { ParsedTransaction, ParserError } from './types';
  import { CommitImportDto } from './dto/commit-import.dto';
  
  export interface ImportPreviewItem {
    externalId: string;
    description: string;
    amount: number;
    type: ParsedTransaction['type'];
    date: string;
    isDuplicate: boolean;
    suggestedCategoryId: string | null;
  }
  
  export interface ImportPreviewResult {
    format: 'CSV' | 'OFX';
    items: ImportPreviewItem[];
    totalParsed: number;
    newCount: number;
    duplicateCount: number;
    warnings: string[];
  }
  
  @Injectable()
  export class ImportService {
    constructor(
      private readonly prisma: PrismaService,
      @Inject(TRANSACTION_PARSERS)
      private readonly parsers: TransactionParser[],
    ) {}
  
    async preview(
      userId: string,
      fileName: string,
      content: Buffer,
    ): Promise<ImportPreviewResult> {
      const parser = this.selectParser(fileName, content);
  
      let parseResult;
      try {
        parseResult = await parser.parse(content);
      } catch (err) {
        if (err instanceof ParserError) {
          throw new BadRequestException(err.message);
        }
        throw err;
      }
  
      const parsed = parseResult.transactions;
  
      // Deduplication: find which externalIds already exist for this user
      const externalIds = parsed.map((t) => t.externalId);
      const existing = await this.prisma.transaction.findMany({
        where: {
          userId,
          externalId: { in: externalIds },
        },
        select: { externalId: true },
      });
      const existingIds = new Set(existing.map((e) => e.externalId));
  
      // Auto-categorization based on user's history (implemented in 2.d).
      // For now, no suggestions — placeholder returns null for everything.
      const suggestions = await this.suggestCategories(userId, parsed);
  
      const items: ImportPreviewItem[] = parsed.map((t) => ({
        externalId: t.externalId,
        description: t.description,
        amount: t.amount,
        type: t.type,
        date: t.date,
        isDuplicate: existingIds.has(t.externalId),
        suggestedCategoryId: suggestions.get(t.externalId) ?? null,
      }));
  
      const duplicateCount = items.filter((i) => i.isDuplicate).length;
  
      return {
        format: parseResult.format,
        items,
        totalParsed: parsed.length,
        newCount: parsed.length - duplicateCount,
        duplicateCount,
        warnings: parseResult.warnings,
      };
    }
  
    async commit(
      userId: string,
      dto: CommitImportDto,
    ): Promise<{ importedCount: number; skippedCount: number }> {
      // Verify the account belongs to the user
      const account = await this.prisma.account.findFirst({
        where: { id: dto.accountId, userId },
        select: { id: true },
      });
      if (!account) {
        throw new BadRequestException('Account not found');
      }
  
      // Verify all referenced categories belong to the user
      const categoryIds = [
        ...new Set(
          dto.items
            .map((i) => i.categoryId)
            .filter((id): id is string => !!id),
        ),
      ];
      if (categoryIds.length > 0) {
        const categories = await this.prisma.category.findMany({
          where: { id: { in: categoryIds }, userId },
          select: { id: true },
        });
        if (categories.length !== categoryIds.length) {
          throw new BadRequestException(
            'One or more categories do not exist',
          );
        }
      }
  
      // Build the rows to insert
      const rows: Prisma.TransactionCreateManyInput[] = dto.items.map((item) => ({
        userId,
        accountId: dto.accountId,
        categoryId: item.categoryId ?? null,
        description: item.description,
        amount: new Prisma.Decimal(item.amount),
        type: item.type,
        date: new Date(item.date),
        externalId: item.externalId,
        source: 'CSV', // overwritten below per-item is overkill; see note
      }));
  
      // createMany with skipDuplicates handles the race condition where
      // a transaction was imported between preview and commit.
      const result = await this.prisma.transaction.createMany({
        data: rows,
        skipDuplicates: true,
      });
  
      return {
        importedCount: result.count,
        skippedCount: dto.items.length - result.count,
      };
    }
  
    private selectParser(
      fileName: string,
      content: Buffer,
    ): TransactionParser {
      const parser = this.parsers.find((p) => p.canHandle(fileName, content));
      if (!parser) {
        throw new BadRequestException(
          'Unsupported file format. Please upload a CSV or OFX/QFX file.',
        );
      }
      return parser;
    }
  
    /**
     * Placeholder for auto-categorization.
     * Will be properly implemented in sub-phase 2.d.
     */
    private async suggestCategories(
      _userId: string,
      _transactions: ParsedTransaction[],
    ): Promise<Map<string, string>> {
      return new Map();
    }
  }