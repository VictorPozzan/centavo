import { CsvParser } from './csv.parser';
import { ParserError } from '../types';

describe('CsvParser', () => {
  let parser: CsvParser;

  beforeEach(() => {
    parser = new CsvParser();
  });

  describe('canHandle', () => {
    it('returns true for .csv extension', () => {
      expect(parser.canHandle('statement.csv', '')).toBe(true);
    });

    it('returns true for .tsv extension', () => {
      expect(parser.canHandle('statement.tsv', '')).toBe(true);
    });

    it('returns true when content has CSV-like headers', () => {
      const content = 'date,description,amount\n2026-01-01,Test,100';
      expect(parser.canHandle('unknown.txt', content)).toBe(true);
    });

    it('returns false for unrelated files', () => {
      expect(parser.canHandle('image.png', 'binary garbage')).toBe(false);
    });
  });

  describe('parse — basic US format', () => {
    it('parses a simple CSV with comma delimiter', async () => {
      const csv = `date,description,amount
2026-01-15,Coffee shop,5.50
2026-01-16,Salary,3000.00`;

      const result = await parser.parse(csv);

      expect(result.format).toBe('CSV');
      expect(result.transactions).toHaveLength(2);
      expect(result.transactions[0]).toMatchObject({
        description: 'Coffee shop',
        amount: 5.5,
        type: 'INCOME',
        date: '2026-01-15T00:00:00.000Z',
      });
    });

    it('infers EXPENSE from negative amounts', async () => {
      const csv = `date,description,amount
2026-01-15,Coffee shop,-5.50`;

      const result = await parser.parse(csv);

      expect(result.transactions[0]).toMatchObject({
        amount: 5.5,
        type: 'EXPENSE',
      });
    });

    it('treats accounting format (parentheses) as negative', async () => {
      const csv = `date,description,amount
2026-01-15,Refund,(25.00)`;

      const result = await parser.parse(csv);

      expect(result.transactions[0]).toMatchObject({
        amount: 25,
        type: 'EXPENSE',
      });
    });
  });

  describe('parse — BR format', () => {
    it('detects comma decimal and semicolon delimiter', async () => {
      const csv = `data;descricao;valor
15/01/2026;Café;5,50
16/01/2026;Salário;3.000,00`;

      const result = await parser.parse(csv);

      expect(result.transactions).toHaveLength(2);
      expect(result.transactions[1]).toMatchObject({
        description: 'Salário',
        amount: 3000,
        date: '2026-01-16T00:00:00.000Z',
      });
    });

    it('handles BR amounts with thousands separator', async () => {
      const csv = `date,description,amount
15/01/2026,Big purchase,"1.234,56"`;

      const result = await parser.parse(csv);

      expect(result.transactions[0].amount).toBe(1234.56);
    });
  });

  describe('parse — explicit type column', () => {
    it('respects type column when present', async () => {
      const csv = `date,description,amount,type
2026-01-15,Refund,25,credit
2026-01-16,Purchase,50,debit`;

      const result = await parser.parse(csv);

      expect(result.transactions[0].type).toBe('INCOME');
      expect(result.transactions[1].type).toBe('EXPENSE');
    });

    it('handles Portuguese type values', async () => {
      const csv = `data,descricao,valor,tipo
15/01/2026,Reembolso,25,entrada
16/01/2026,Compra,50,saída`;

      const result = await parser.parse(csv);

      expect(result.transactions[0].type).toBe('INCOME');
      expect(result.transactions[1].type).toBe('EXPENSE');
    });
  });

  describe('parse — quoted fields', () => {
    it('preserves commas inside quoted descriptions', async () => {
      const csv = `date,description,amount
2026-01-15,"Coffee, croissant and tip",15.50`;

      const result = await parser.parse(csv);

      expect(result.transactions[0].description).toBe('Coffee, croissant and tip');
    });

    it('handles escaped double quotes', async () => {
      const csv = `date,description,amount
2026-01-15,"He said ""hi""",10`;

      const result = await parser.parse(csv);

      expect(result.transactions[0].description).toBe('He said "hi"');
    });
  });

  describe('parse — error handling', () => {
    it('throws ParserError when required headers are missing', async () => {
      const csv = `foo,bar,baz
1,2,3`;
      await expect(parser.parse(csv)).rejects.toThrow(ParserError);
      await expect(parser.parse(csv)).rejects.toThrow(/missing required column/i);
    });

    it('throws when file has only headers', async () => {
      const csv = `date,description,amount`;
      await expect(parser.parse(csv)).rejects.toThrow(ParserError);
    });

    it('skips invalid lines and reports warnings', async () => {
      const csv = `date,description,amount
2026-01-15,Valid,100
not-a-date,Invalid,50
2026-01-17,Also valid,200`;

      const result = await parser.parse(csv);

      expect(result.transactions).toHaveLength(2);
      expect(result.warnings).toHaveLength(1);
      expect(result.warnings[0]).toContain('Line 3');
    });

    it('throws when no valid transactions remain', async () => {
      const csv = `date,description,amount
bad,row,here
also,bad,row`;
      await expect(parser.parse(csv)).rejects.toThrow(/no valid transactions/i);
    });

    it('skips zero-amount rows', async () => {
      const csv = `date,description,amount
2026-01-15,Valid,100
2026-01-16,Zero,0`;

      const result = await parser.parse(csv);

      expect(result.transactions).toHaveLength(1);
      expect(result.warnings[0]).toContain('zero');
    });
  });

  describe('synthesizeId', () => {
    it('produces same ID for same row data', async () => {
      const csv1 = `date,description,amount
2026-01-15,Coffee,5.50`;
      const csv2 = `date,description,amount
2026-01-15,Coffee,5.50`;

      const r1 = await parser.parse(csv1);
      const r2 = await parser.parse(csv2);

      expect(r1.transactions[0].externalId).toBe(r2.transactions[0].externalId);
    });

    it('produces different IDs for different amounts', async () => {
      const csv = `date,description,amount
2026-01-15,Coffee,5.50
2026-01-15,Coffee,5.51`;

      const result = await parser.parse(csv);

      expect(result.transactions[0].externalId).not.toBe(
        result.transactions[1].externalId,
      );
    });
  });
});