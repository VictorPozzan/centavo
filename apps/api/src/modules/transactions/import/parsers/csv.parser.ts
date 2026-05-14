import { Injectable } from '@nestjs/common';
import { TransactionType } from '@prisma/client';
import * as crypto from 'crypto';
import { TransactionParser } from './transaction-parser.interface';
import {
  ParsedTransaction,
  ParserError,
  ParserResult,
} from '../types';

type NumberFormat = 'us' | 'br';

interface ColumnIndices {
  date: number;
  description: number;
  amount: number;
  type?: number;
}

const REQUIRED_HEADERS = ['date', 'description', 'amount'] as const;

@Injectable()
export class CsvParser implements TransactionParser {
  canHandle(fileName: string, content: string | Buffer): boolean {
    if (fileName.toLowerCase().endsWith('.csv')) return true;
    if (fileName.toLowerCase().endsWith('.tsv')) return true;

    const text = typeof content === 'string' ? content : content.toString('utf-8');
    const firstLine = text.split('\n')[0] ?? '';

    return REQUIRED_HEADERS.every((header) =>
      firstLine.toLowerCase().includes(header),
    );
  }

  async parse(content: string | Buffer): Promise<ParserResult> {
    const text = typeof content === 'string' ? content : content.toString('utf-8');
    const warnings: string[] = [];

    const delimiter = this.detectDelimiter(text);
    const lines = text.split(/\r?\n/).filter((line) => line.trim().length > 0);

    if (lines.length < 2) {
      throw new ParserError('CSV must contain a header and at least one row');
    }

    const headers = this.parseRow(lines[0], delimiter).map((h) =>
      h.toLowerCase().trim(),
    );
    const columns = this.mapColumns(headers);
    const numberFormat = this.detectNumberFormat(lines.slice(1), columns.amount, delimiter);

    const transactions: ParsedTransaction[] = [];

    for (let i = 1; i < lines.length; i++) {
      const lineNumber = i + 1;
      try {
        const parsed = this.parseTransactionLine(
          lines[i],
          delimiter,
          columns,
          numberFormat,
        );
        if (parsed) {
          transactions.push(parsed);
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Unknown error';
        warnings.push(`Line ${lineNumber} skipped: ${message}`);
      }
    }

    if (transactions.length === 0) {
      throw new ParserError('No valid transactions found in CSV file');
    }

    return {
      transactions,
      format: 'CSV',
      warnings,
    };
  }

  /**
   * Detects whether the file uses comma, semicolon or tab as delimiter.
   * Counts occurrences in the first line; the most frequent wins.
   */
  private detectDelimiter(text: string): string {
    const firstLine = text.split('\n')[0] ?? '';
    const counts = {
      ',': (firstLine.match(/,/g) ?? []).length,
      ';': (firstLine.match(/;/g) ?? []).length,
      '\t': (firstLine.match(/\t/g) ?? []).length,
    };
    const sorted = Object.entries(counts).sort(([, a], [, b]) => b - a);
    return sorted[0][1] > 0 ? sorted[0][0] : ',';
  }

  /**
   * Detects whether amount fields use US (1234.56) or BR (1.234,56) format.
   * Samples a few rows and chooses the format that yields more valid numbers.
   */
  private detectNumberFormat(
    rows: string[],
    amountIndex: number,
    delimiter: string,
  ): NumberFormat {
    const sample = rows.slice(0, 10);
    let usValid = 0;
    let brValid = 0;

    for (const row of sample) {
      const cells = this.parseRow(row, delimiter);
      const raw = cells[amountIndex]?.trim() ?? '';
      if (this.tryParseUs(raw) !== null) usValid++;
      if (this.tryParseBr(raw) !== null) brValid++;
    }

    return brValid > usValid ? 'br' : 'us';
  }

  private mapColumns(headers: string[]): ColumnIndices {
    const indices: Partial<ColumnIndices> = {
      date: this.findHeader(headers, ['date', 'data']),
      description: this.findHeader(headers, [
        'description', 'memo', 'descricao', 'historico', 'history',
      ]),
      amount: this.findHeader(headers, ['amount', 'value', 'valor']),
      type: this.findHeader(headers, ['type', 'tipo']),
    };
  
    for (const required of REQUIRED_HEADERS) {
      if (indices[required] === undefined || indices[required] === -1) {
        throw new ParserError(
          `Missing required column: "${required}". Found columns: ${headers.join(', ')}`,
        );
      }
    }
  
    return indices as ColumnIndices;
  }

  private findHeader(headers: string[], candidates: string[]): number {
    for (const candidate of candidates) {
      const index = headers.indexOf(candidate);
      if (index !== -1) return index;
    }
    return -1;
  }

  private parseTransactionLine(
    line: string,
    delimiter: string,
    columns: ColumnIndices,
    numberFormat: NumberFormat,
  ): ParsedTransaction | null {
    const cells = this.parseRow(line, delimiter);

    const rawDate = cells[columns.date]?.trim();
    const rawDescription = cells[columns.description]?.trim();
    const rawAmount = cells[columns.amount]?.trim();
    const rawType = columns.type !== undefined ? cells[columns.type]?.trim() : undefined;

    if (!rawDate || !rawDescription || !rawAmount) {
      throw new Error('missing date, description or amount');
    }

    const date = this.parseDate(rawDate);
    const amountNumber = numberFormat === 'br'
      ? this.tryParseBr(rawAmount)
      : this.tryParseUs(rawAmount);

    if (amountNumber === null) {
      throw new Error(`invalid amount "${rawAmount}"`);
    }

    const type = this.resolveType(rawType, amountNumber);
    const amount = Math.abs(amountNumber);

    if (amount === 0) {
      throw new Error('amount cannot be zero');
    }

    return {
      externalId: this.synthesizeId(rawDate, rawDescription, amountNumber),
      description: rawDescription,
      amount,
      type,
      date: date.toISOString(),
    };
  }

  /**
   * Naive CSV row parser. Handles quoted fields with embedded delimiters.
   */
  private parseRow(line: string, delimiter: string): string[] {
    const cells: string[] = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];

      if (char === '"') {
        if (inQuotes && line[i + 1] === '"') {
          current += '"';
          i++;
        } else {
          inQuotes = !inQuotes;
        }
      } else if (char === delimiter && !inQuotes) {
        cells.push(current);
        current = '';
      } else {
        current += char;
      }
    }
    cells.push(current);

    return cells;
  }

  private tryParseUs(raw: string): number | null {
    let value = raw.trim();
    let negative = false;
  
    // Accounting format: (25.00) means -25.00
    if (value.startsWith('(') && value.endsWith(')')) {
      negative = true;
      value = value.slice(1, -1);
    }
  
    value = value.replace(/[$\s]/g, '');
  
    const lastDot = value.lastIndexOf('.');
    const lastComma = value.lastIndexOf(',');
  
    // In US format the decimal dot comes last.
    // If a comma comes after the last dot, this is BR format — reject it.
    if (lastComma > lastDot) {
      return null;
    }
  
    // Comma is only a thousands separator here, safe to remove.
    const cleaned = value.replace(/,/g, '');
    const num = Number(cleaned);
  
    if (!Number.isFinite(num)) return null;
    return negative ? -num : num;
  }

  private tryParseBr(raw: string): number | null {
    let value = raw.trim();
    let negative = false;
  
    // Accounting format: (25,00) means -25,00
    if (value.startsWith('(') && value.endsWith(')')) {
      negative = true;
      value = value.slice(1, -1);
    }
  
    value = value.replace(/[R$\s]/g, '');
  
    const lastDot = value.lastIndexOf('.');
    const lastComma = value.lastIndexOf(',');
  
    // In BR format the decimal comma comes last.
    // If a dot comes after the last comma, this is US format — reject it.
    if (lastDot > lastComma && lastComma !== -1) {
      return null;
    }
  
    // Dot is only a thousands separator here, comma is the decimal.
    const cleaned = value.replace(/\./g, '').replace(',', '.');
    const num = Number(cleaned);
  
    if (!Number.isFinite(num)) return null;
    return negative ? -num : num;
  }

  private parseDate(raw: string): Date {
    const isoMatch = raw.match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (isoMatch) {
      return new Date(`${isoMatch[1]}-${isoMatch[2]}-${isoMatch[3]}T00:00:00.000Z`);
    }

    const brMatch = raw.match(/^(\d{2})\/(\d{2})\/(\d{4})/);
    if (brMatch) {
      return new Date(`${brMatch[3]}-${brMatch[2]}-${brMatch[1]}T00:00:00.000Z`);
    }

    const usMatch = raw.match(/^(\d{2})-(\d{2})-(\d{4})/);
    if (usMatch) {
      return new Date(`${usMatch[3]}-${usMatch[1]}-${usMatch[2]}T00:00:00.000Z`);
    }

    const fallback = new Date(raw);
    if (Number.isNaN(fallback.getTime())) {
      throw new Error(`invalid date "${raw}"`);
    }
    return fallback;
  }

  private resolveType(
    rawType: string | undefined,
    amount: number,
  ): TransactionType {
    if (rawType) {
      const normalized = rawType.toLowerCase().trim();
      if (['income', 'credit', 'receita', 'entrada', 'c'].includes(normalized)) {
        return TransactionType.INCOME;
      }
      if (['expense', 'debit', 'despesa', 'saida', 'saída', 'd'].includes(normalized)) {
        return TransactionType.EXPENSE;
      }
    }

    return amount >= 0 ? TransactionType.INCOME : TransactionType.EXPENSE;
  }

  /**
   * Synthesizes a stable external ID by hashing the original row data.
   * Used for deduplication when CSV doesn't provide its own transaction IDs.
   */
  private synthesizeId(date: string, description: string, amount: number): string {
    const hash = crypto
      .createHash('sha256')
      .update(`${date}|${description}|${amount.toFixed(2)}`)
      .digest('hex');
    return `csv-${hash.slice(0, 16)}`;
  }
}