import { Account } from './account.types';
import { Category } from './category.types';

export type TransactionType = 'INCOME' | 'EXPENSE';
export type TransactionSource = 'MANUAL' | 'OFX' | 'CSV';

export interface Transaction {
  id: string;
  description: string;
  amount: string; // Prisma Decimal serializes as string
  type: TransactionType;
  date: string;
  notes: string | null;
  source: TransactionSource;
  accountId: string;
  categoryId: string | null;
  createdAt: string;
  updatedAt: string;
  account?: Pick<Account, 'id' | 'name' | 'type'>;
  category?: Pick<Category, 'id' | 'name' | 'color' | 'icon'> | null;
}

export interface CreateTransactionPayload {
  description: string;
  amount: number;
  type: TransactionType;
  date: string;
  notes?: string;
  accountId: string;
  categoryId?: string;
}

export type UpdateTransactionPayload = Partial<CreateTransactionPayload>;

export interface ListTransactionsQuery {
  startDate?: string;
  endDate?: string;
  type?: TransactionType;
  accountId?: string;
  categoryId?: string;
  limit?: number;
  offset?: number;
}

export interface PaginatedTransactions {
  data: Transaction[];
  total: number;
  limit: number;
  offset: number;
}

export interface TransactionSummary {
  income: string;
  expense: string;
  net: string;
  incomeCount: number;
  expenseCount: number;
}