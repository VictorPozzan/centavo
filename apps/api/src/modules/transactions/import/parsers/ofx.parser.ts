import { Injectable } from '@nestjs/common';
import { TransactionType } from '@prisma/client';
import * as ofx from 'ofx-js';
import { TransactionParser } from './transaction-parser.interface';
import {
  ParsedTransaction,
  ParserError,
  ParserResult,
} from '../types';

/**
 * Shape of a single transaction as returned by ofx-js.
 * OFX uses string values for everything.
 */
interface OfxTransaction {
  TRNTYPE?: string;
  DTPOSTED?: string;
  TRNAMT?: string;
  FITID?: string;
  NAME?: string;
  MEMO?: string;
}

@Injectable()
export class OfxParser implements TransactionParser {
  canHandle(fileName: string, content: string | Buffer): boolean {
    const name = fileName.toLowerCase();
    if (name.endsWith('.ofx') || name.endsWith('.qfx')) return true;

    const text = typeof content === 'string' ? content : content.toString('utf-8');
    // OFX files contain an OFX header or the <OFX> tag near the top
    const head = text.slice(0, 500).toUpperCase();
    return head.includes('OFXHEADER') || head.includes('<OFX>');
  }

  async parse(content: string | Buffer): Promise<ParserResult> {
    const text = typeof content === 'string' ? content : content.toString('utf-8');
    const warnings: string[] = [];

    let parsed: unknown;
    try {
        parsed = await ofx.parse(text);
    } catch (err) {
        const message = err instanceof Error ? err.message : 'Unknown error';
        throw new ParserError(`Failed to parse OFX file: ${message}`);
    }

    const rawTransactions = this.extractTransactions(parsed);

    if (rawTransactions.length === 0) {
      throw new ParserError('No transactions found in OFX file');
    }

    const transactions: ParsedTransaction[] = [];

    rawTransactions.forEach((raw, index) => {
      try {
        const transaction = this.mapTransaction(raw);
        if (transaction) {
          transactions.push(transaction);
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Unknown error';
        warnings.push(`Transaction ${index + 1} skipped: ${message}`);
      }
    });

    if (transactions.length === 0) {
      throw new ParserError('No valid transactions could be extracted from OFX file');
    }

    return {
      transactions,
      format: 'OFX',
      warnings,
    };
  }

  /**
   * Navigates the parsed OFX structure to find the transaction list.
   * OFX nests transactions deep inside bank or credit card statement blocks,
   * and the exact path varies between bank and credit card files.
   */
  private extractTransactions(parsed: unknown): OfxTransaction[] {
    const root = parsed as Record<string, any>;
    const body = root?.OFX;

    if (!body) {
      throw new ParserError('Invalid OFX structure: missing OFX root element');
    }

    // Bank statements: OFX > BANKMSGSRSV1 > STMTTRNRS > STMTRS > BANKTRANLIST > STMTTRN
    // Credit card:     OFX > CREDITCARDMSGSRSV1 > CCSTMTTRNRS > CCSTMTRS > BANKTRANLIST > STMTTRN
    const statementBlock =
      body.BANKMSGSRSV1?.STMTTRNRS?.STMTRS ??
      body.CREDITCARDMSGSRSV1?.CCSTMTTRNRS?.CCSTMTRS;

    if (!statementBlock) {
      throw new ParserError(
        'Unsupported OFX format: could not find bank or credit card statement',
      );
    }

    const tranList = statementBlock.BANKTRANLIST?.STMTTRN;

    if (!tranList) {
      return [];
    }

    // ofx-js returns a single object if there's one transaction,
    // or an array if there are multiple. Normalize to always be an array.
    return Array.isArray(tranList) ? tranList : [tranList];
  }

  private mapTransaction(raw: OfxTransaction): ParsedTransaction | null {
    const rawAmount = raw.TRNAMT?.trim();
    const rawDate = raw.DTPOSTED?.trim();
    const fitId = raw.FITID?.trim();

    if (!rawAmount || !rawDate) {
      throw new Error('missing amount or date');
    }

    const amountNumber = Number(rawAmount);
    if (!Number.isFinite(amountNumber)) {
      throw new Error(`invalid amount "${rawAmount}"`);
    }

    const amount = Math.abs(amountNumber);
    if (amount === 0) {
      throw new Error('amount cannot be zero');
    }

    const date = this.parseOfxDate(rawDate);
    const type = this.resolveType(raw.TRNTYPE, amountNumber);
    const description = this.resolveDescription(raw);

    return {
      // FITID is the bank's own unique ID — perfect for deduplication.
      // Fall back to a synthesized value only if the bank omitted it.
      externalId: fitId
        ? `ofx-${fitId}`
        : `ofx-synth-${date.toISOString()}-${amount}`,
      description,
      amount,
      type,
      date: date.toISOString(),
    };
  }

  /**
   * OFX dates look like: 20260115120000.000[-3:GMT] or just 20260115.
   * We only care about the YYYYMMDD prefix.
   */
  private parseOfxDate(raw: string): Date {
    const match = raw.match(/^(\d{4})(\d{2})(\d{2})/);
    if (!match) {
      throw new Error(`invalid OFX date "${raw}"`);
    }

    const [, year, month, day] = match;
    const date = new Date(`${year}-${month}-${day}T00:00:00.000Z`);

    if (Number.isNaN(date.getTime())) {
      throw new Error(`invalid OFX date "${raw}"`);
    }

    return date;
  }

  private resolveType(
    rawType: string | undefined,
    amount: number,
  ): TransactionType {
    if (rawType) {
      const normalized = rawType.toUpperCase().trim();
      if (['CREDIT', 'DEP', 'DIRECTDEP', 'INT'].includes(normalized)) {
        return TransactionType.INCOME;
      }
      if (
        ['DEBIT', 'PAYMENT', 'CHECK', 'FEE', 'SRVCHG', 'ATM', 'POS'].includes(
          normalized,
        )
      ) {
        return TransactionType.EXPENSE;
      }
    }

    // Fallback: OFX uses negative amounts for money leaving the account
    return amount >= 0 ? TransactionType.INCOME : TransactionType.EXPENSE;
  }

  private resolveDescription(raw: OfxTransaction): string {
    const name = raw.NAME?.trim();
    const memo = raw.MEMO?.trim();

    if (name && memo && name !== memo) {
      return `${name} — ${memo}`;
    }
    return name || memo || 'Unknown transaction';
  }
}