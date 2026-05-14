import { Injectable } from '@nestjs/common';
import { Category } from '@prisma/client';
import { PrismaService } from '../../../prisma/prisma.service';
import { ParsedTransaction } from '../types';
import { DEFAULT_RULES } from './default-rules';

interface HistoricalEntry {
  tokens: Set<string>;
  categoryId: string;
}

@Injectable()
export class CategorizationService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Suggests a category for each parsed transaction.
   * Returns a Map of externalId -> categoryId (only for transactions
   * that got a confident suggestion).
   *
   * Strategy:
   *  1. Try matching against the user's own categorization history
   *  2. Fall back to predefined keyword rules
   */
  async suggest(
    userId: string,
    transactions: ParsedTransaction[],
  ): Promise<Map<string, string>> {
    const suggestions = new Map<string, string>();

    const [history, categories] = await Promise.all([
      this.loadHistory(userId),
      this.loadCategories(userId),
    ]);

    for (const transaction of transactions) {
      const tokens = this.tokenize(transaction.description);

      // Layer 1: user history
      const fromHistory = this.matchHistory(tokens, history);
      if (fromHistory) {
        suggestions.set(transaction.externalId, fromHistory);
        continue;
      }

      // Layer 2: default rules
      const fromRules = this.matchDefaultRules(tokens, categories);
      if (fromRules) {
        suggestions.set(transaction.externalId, fromRules);
      }
    }

    return suggestions;
  }

  /**
   * Loads the user's previously categorized transactions and tokenizes
   * their descriptions for matching.
   */
  private async loadHistory(userId: string): Promise<HistoricalEntry[]> {
    const categorized = await this.prisma.transaction.findMany({
      where: {
        userId,
        categoryId: { not: null },
      },
      select: {
        description: true,
        categoryId: true,
      },
      orderBy: { createdAt: 'desc' },
      take: 500, // cap to keep the matching fast
    });

    return categorized.map((t) => ({
      tokens: this.tokenize(t.description),
      categoryId: t.categoryId as string,
    }));
  }

  private loadCategories(userId: string): Promise<Category[]> {
    return this.prisma.category.findMany({
      where: { userId },
    });
  }

  /**
   * Matches a transaction's tokens against the user's history.
   * Returns the categoryId of the best match, or null if no confident match.
   *
   * "Confident" means the Jaccard similarity between token sets is high enough.
   */
  private matchHistory(
    tokens: Set<string>,
    history: HistoricalEntry[],
  ): string | null {
    if (tokens.size === 0) return null;

    let bestScore = 0;
    let bestCategoryId: string | null = null;
    const categoryVotes = new Map<string, number>();

    for (const entry of history) {
      const score = this.jaccardSimilarity(tokens, entry.tokens);

      // Threshold: at least 50% token overlap to be considered a match
      if (score >= 0.5) {
        const currentVotes = categoryVotes.get(entry.categoryId) ?? 0;
        categoryVotes.set(entry.categoryId, currentVotes + score);
      }

      if (score > bestScore) {
        bestScore = score;
        bestCategoryId = entry.categoryId;
      }
    }

    // If multiple history entries point to the same category, that's a strong
    // signal — return the category with the highest accumulated score.
    if (categoryVotes.size > 0) {
      const ranked = [...categoryVotes.entries()].sort(
        ([, a], [, b]) => b - a,
      );
      return ranked[0][0];
    }

    return bestScore >= 0.5 ? bestCategoryId : null;
  }

  /**
   * Matches a transaction's tokens against the predefined keyword rules.
   * Returns the categoryId of a matching user category, or null.
   */
  private matchDefaultRules(
    tokens: Set<string>,
    categories: Category[],
  ): string | null {
    for (const rule of DEFAULT_RULES) {
      const hasKeyword = rule.keywords.some((keyword) =>
        tokens.has(keyword),
      );
      if (!hasKeyword) continue;

      // Found a keyword match — now find a user category whose name
      // matches one of the rule's candidate names
      const matchingCategory = categories.find((category) =>
        rule.categoryNames.some(
          (candidate) =>
            category.name.toLowerCase() === candidate.toLowerCase(),
        ),
      );

      if (matchingCategory) {
        return matchingCategory.id;
      }
    }

    return null;
  }

  /**
   * Normalizes a description into a set of significant tokens.
   * - uppercase
   * - removes accents
   * - removes digits and punctuation
   * - drops very short tokens (1-2 chars are usually noise)
   */
  private tokenize(description: string): Set<string> {
    const normalized = description
      .toUpperCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // strip accents
      .replace(/[0-9]/g, ' ') // remove digits
      .replace(/[^A-Z\s]/g, ' '); // remove punctuation

    const tokens = normalized
      .split(/\s+/)
      .map((t) => t.trim())
      .filter((t) => t.length >= 3); // drop noise

    return new Set(tokens);
  }

  /**
   * Jaccard similarity: size of intersection divided by size of union.
   * Returns a value between 0 (no overlap) and 1 (identical sets).
   */
  private jaccardSimilarity(a: Set<string>, b: Set<string>): number {
    if (a.size === 0 || b.size === 0) return 0;

    let intersection = 0;
    for (const token of a) {
      if (b.has(token)) intersection++;
    }

    const union = a.size + b.size - intersection;
    return union === 0 ? 0 : intersection / union;
  }
}