import { TransactionType } from '@prisma/client';

/**
 * Normalized representation of a transaction extracted from any source format.
 * All parsers produce this shape regardless of input file type.
 */
export interface ParsedTransaction {
  /** Unique identifier from the source file, if available (FITID in OFX, can be synthesized for CSV) */
  externalId: string;

  /** Free-text description from the source */
  description: string;

  /** Always positive — the parser determines the type separately */
  amount: number;

  type: TransactionType;

  /** ISO 8601 string in UTC */
  date: string;
}

export interface ParserResult {
  transactions: ParsedTransaction[];
  format: 'CSV' | 'OFX';
  warnings: string[];
}

export class ParserError extends Error {
  constructor(
    message: string,
    public readonly line?: number,
  ) {
    super(message);
    this.name = 'ParserError';
  }
}