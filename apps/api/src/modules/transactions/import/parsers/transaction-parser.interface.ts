import { ParserResult } from '../types';

export interface TransactionParser {
  /**
   * Returns true if this parser can handle the given file based on name/content.
   * Used by ImportService to choose the right parser at runtime.
   */
  canHandle(fileName: string, content: string | Buffer): boolean;

  /**
   * Parses the file content into normalized transactions.
   * Should not throw on individual bad lines — collect them as warnings.
   * Should throw ParserError only if the file is structurally invalid.
   */
  parse(content: string | Buffer): Promise<ParserResult>;
}

export const TRANSACTION_PARSERS = Symbol('TRANSACTION_PARSERS');