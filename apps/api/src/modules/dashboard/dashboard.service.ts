import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { DashboardQueryDto } from './dto/dashboard-query.dto';

interface DateRange {
  start: Date;
  end: Date;
}

@Injectable()
export class DashboardService {
  constructor(private readonly prisma: PrismaService) {}

  async getDashboard(userId: string, query: DashboardQueryDto) {
    const range = this.resolveRange(query);

    const [totals, balanceTimeline, expensesByCategory, topCategories, monthlyComparison] =
      await Promise.all([
        this.getTotals(userId, range),
        this.getBalanceTimeline(userId, range),
        this.getExpensesByCategory(userId, range),
        this.getTopCategories(userId, range),
        this.getMonthlyComparison(userId),
      ]);

    return {
      totals,
      balanceTimeline,
      expensesByCategory,
      topCategories,
      monthlyComparison,
    };
  }

  /**
   * KPI totals: income, expense, net, and savings rate.
   */
  private async getTotals(userId: string, range: DateRange) {
    const where: Prisma.TransactionWhereInput = {
      userId,
      date: { gte: range.start, lte: range.end },
    };

    const [incomeAgg, expenseAgg] = await Promise.all([
      this.prisma.transaction.aggregate({
        where: { ...where, type: 'INCOME' },
        _sum: { amount: true },
      }),
      this.prisma.transaction.aggregate({
        where: { ...where, type: 'EXPENSE' },
        _sum: { amount: true },
      }),
    ]);

    const income = incomeAgg._sum.amount ?? new Prisma.Decimal(0);
    const expense = expenseAgg._sum.amount ?? new Prisma.Decimal(0);
    const net = income.minus(expense);

    // Savings rate = (income - expense) / income. Null when income is 0.
    const savingsRate = income.greaterThan(0)
      ? Number(net.dividedBy(income).toFixed(4))
      : null;

    return {
      income: income.toFixed(2),
      expense: expense.toFixed(2),
      net: net.toFixed(2),
      savingsRate,
    };
  }

  /**
   * Balance timeline: aggregates income/expense per day within the range.
   * Uses raw SQL because Prisma doesn't support GROUP BY on date casts.
   */
  private async getBalanceTimeline(userId: string, range: DateRange) {
    interface Row {
      date: Date;
      income: string;
      expense: string;
    }

    const rows = await this.prisma.$queryRaw<Row[]>`
      SELECT
        DATE("date") AS date,
        COALESCE(SUM(CASE WHEN type = 'INCOME' THEN amount ELSE 0 END), 0) AS income,
        COALESCE(SUM(CASE WHEN type = 'EXPENSE' THEN amount ELSE 0 END), 0) AS expense
      FROM "Transaction"
      WHERE "userId" = ${userId}
        AND "date" >= ${range.start}
        AND "date" <= ${range.end}
      GROUP BY DATE("date")
      ORDER BY DATE("date") ASC
    `;

    return rows.map((row) => {
      const income = new Prisma.Decimal(row.income);
      const expense = new Prisma.Decimal(row.expense);
      return {
        date: row.date.toISOString().slice(0, 10),
        income: income.toFixed(2),
        expense: expense.toFixed(2),
        net: income.minus(expense).toFixed(2),
      };
    });
  }

  /**
   * Expenses grouped by category, including uncategorized as a synthetic group.
   * Returns top 10 + "Other" bucket aggregating the rest.
   */
  private async getExpensesByCategory(userId: string, range: DateRange) {
    const grouped = await this.prisma.transaction.groupBy({
      by: ['categoryId'],
      where: {
        userId,
        type: 'EXPENSE',
        date: { gte: range.start, lte: range.end },
      },
      _sum: { amount: true },
    });

    if (grouped.length === 0) return [];

    // Fetch category names and colors in one round trip
    const categoryIds = grouped
      .map((g) => g.categoryId)
      .filter((id): id is string => id !== null);

    const categories = await this.prisma.category.findMany({
      where: { id: { in: categoryIds } },
      select: { id: true, name: true, color: true },
    });
    const categoryMap = new Map(categories.map((c) => [c.id, c]));

    const total = grouped.reduce(
      (sum, g) => sum.plus(g._sum.amount ?? 0),
      new Prisma.Decimal(0),
    );

    const items = grouped
      .map((g) => {
        const amount = g._sum.amount ?? new Prisma.Decimal(0);
        const category = g.categoryId ? categoryMap.get(g.categoryId) : null;
        return {
          categoryId: g.categoryId,
          categoryName: category?.name ?? 'Uncategorized',
          color: category?.color ?? '#71717a',
          amount: amount.toFixed(2),
          percentage: total.greaterThan(0)
            ? Number(amount.dividedBy(total).toFixed(4))
            : 0,
          _sortKey: amount.toNumber(),
        };
      })
      .sort((a, b) => b._sortKey - a._sortKey);

    // Top 10 + Other bucket
    if (items.length <= 10) {
      return items.map(({ _sortKey, ...rest }) => rest);
    }

    const top = items.slice(0, 10);
    const rest = items.slice(10);
    const otherAmount = rest.reduce(
      (sum, item) => sum + Number(item.amount),
      0,
    );
    const otherPercentage = rest.reduce((sum, item) => sum + item.percentage, 0);

    return [
      ...top.map(({ _sortKey, ...rest }) => rest),
      {
        categoryId: null,
        categoryName: 'Other',
        color: '#52525b',
        amount: otherAmount.toFixed(2),
        percentage: Number(otherPercentage.toFixed(4)),
      },
    ];
  }

  /**
   * Top 5 categories by expense, with transaction counts.
   */
  private async getTopCategories(userId: string, range: DateRange) {
    const grouped = await this.prisma.transaction.groupBy({
      by: ['categoryId'],
      where: {
        userId,
        type: 'EXPENSE',
        date: { gte: range.start, lte: range.end },
      },
      _sum: { amount: true },
      _count: true,
      orderBy: { _sum: { amount: 'desc' } },
      take: 5,
    });

    if (grouped.length === 0) return [];

    const categoryIds = grouped
      .map((g) => g.categoryId)
      .filter((id): id is string => id !== null);

    const categories = await this.prisma.category.findMany({
      where: { id: { in: categoryIds } },
      select: { id: true, name: true },
    });
    const categoryMap = new Map(categories.map((c) => [c.id, c]));

    return grouped.map((g) => ({
      categoryId: g.categoryId,
      categoryName: g.categoryId
        ? categoryMap.get(g.categoryId)?.name ?? 'Uncategorized'
        : 'Uncategorized',
      amount: (g._sum.amount ?? new Prisma.Decimal(0)).toFixed(2),
      transactionCount: g._count,
    }));
  }

  /**
   * Last 6 months of income vs expense, regardless of the filter range.
   * This is the historical context comparison.
   */
  private async getMonthlyComparison(userId: string) {
    interface Row {
      month: Date;
      income: string;
      expense: string;
    }

    const rows = await this.prisma.$queryRaw<Row[]>`
      SELECT
        DATE_TRUNC('month', "date") AS month,
        COALESCE(SUM(CASE WHEN type = 'INCOME' THEN amount ELSE 0 END), 0) AS income,
        COALESCE(SUM(CASE WHEN type = 'EXPENSE' THEN amount ELSE 0 END), 0) AS expense
      FROM "Transaction"
      WHERE "userId" = ${userId}
        AND "date" >= NOW() - INTERVAL '6 months'
      GROUP BY DATE_TRUNC('month', "date")
      ORDER BY month ASC
    `;

    return rows.map((row) => ({
      month: row.month.toISOString().slice(0, 7), // YYYY-MM
      income: new Prisma.Decimal(row.income).toFixed(2),
      expense: new Prisma.Decimal(row.expense).toFixed(2),
    }));
  }

  /**
   * Resolves the date range from the query, defaulting to current month.
   */
  private resolveRange(query: DashboardQueryDto): DateRange {
    if (query.startDate && query.endDate) {
      return { start: query.startDate, end: query.endDate };
    }
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth(), 1);
    const end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
    return { start, end };
  }
}