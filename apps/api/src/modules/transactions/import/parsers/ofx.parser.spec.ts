import { OfxParser } from './ofx.parser';
import { ParserError } from '../types';

/**
 * Minimal but valid OFX 2.x bank statement with two transactions.
 */
const VALID_BANK_OFX = `OFXHEADER:100
DATA:OFXSGML
VERSION:102
SECURITY:NONE
ENCODING:USASCII

<OFX>
  <BANKMSGSRSV1>
    <STMTTRNRS>
      <STMTRS>
        <BANKTRANLIST>
          <STMTTRN>
            <TRNTYPE>DEBIT</TRNTYPE>
            <DTPOSTED>20260115120000</DTPOSTED>
            <TRNAMT>-45.50</TRNAMT>
            <FITID>2026011501</FITID>
            <NAME>COFFEE SHOP</NAME>
          </STMTTRN>
          <STMTTRN>
            <TRNTYPE>CREDIT</TRNTYPE>
            <DTPOSTED>20260116</DTPOSTED>
            <TRNAMT>3000.00</TRNAMT>
            <FITID>2026011601</FITID>
            <NAME>SALARY DEPOSIT</NAME>
          </STMTTRN>
        </BANKTRANLIST>
      </STMTRS>
    </STMTTRNRS>
  </BANKMSGSRSV1>
</OFX>`;

const SINGLE_TRANSACTION_OFX = `OFXHEADER:100
<OFX>
  <BANKMSGSRSV1>
    <STMTTRNRS>
      <STMTRS>
        <BANKTRANLIST>
          <STMTTRN>
            <TRNTYPE>DEBIT</TRNTYPE>
            <DTPOSTED>20260115</DTPOSTED>
            <TRNAMT>-10.00</TRNAMT>
            <FITID>SINGLE01</FITID>
            <MEMO>Single transaction</MEMO>
          </STMTTRN>
        </BANKTRANLIST>
      </STMTRS>
    </STMTTRNRS>
  </BANKMSGSRSV1>
</OFX>`;

const CREDIT_CARD_OFX = `OFXHEADER:100
<OFX>
  <CREDITCARDMSGSRSV1>
    <CCSTMTTRNRS>
      <CCSTMTRS>
        <BANKTRANLIST>
          <STMTTRN>
            <TRNTYPE>DEBIT</TRNTYPE>
            <DTPOSTED>20260120</DTPOSTED>
            <TRNAMT>-89.99</TRNAMT>
            <FITID>CC202601201</FITID>
            <NAME>ONLINE STORE</NAME>
          </STMTTRN>
        </BANKTRANLIST>
      </CCSTMTRS>
    </CCSTMTTRNRS>
  </CREDITCARDMSGSRSV1>
</OFX>`;

describe('OfxParser', () => {
  let parser: OfxParser;

  beforeEach(() => {
    parser = new OfxParser();
  });

  describe('canHandle', () => {
    it('returns true for .ofx extension', () => {
      expect(parser.canHandle('statement.ofx', '')).toBe(true);
    });

    it('returns true for .qfx extension', () => {
      expect(parser.canHandle('statement.qfx', '')).toBe(true);
    });

    it('returns true when content has OFX header', () => {
      expect(parser.canHandle('unknown.txt', VALID_BANK_OFX)).toBe(true);
    });

    it('returns false for unrelated content', () => {
      expect(parser.canHandle('data.csv', 'date,description,amount')).toBe(false);
    });
  });

  describe('parse — bank statement', () => {
    it('parses all transactions from a bank statement', async () => {
      const result = await parser.parse(VALID_BANK_OFX);

      expect(result.format).toBe('OFX');
      expect(result.transactions).toHaveLength(2);
    });

    it('maps a DEBIT transaction as EXPENSE with positive amount', async () => {
      const result = await parser.parse(VALID_BANK_OFX);
      const debit = result.transactions[0];

      expect(debit).toMatchObject({
        description: 'COFFEE SHOP',
        amount: 45.5,
        type: 'EXPENSE',
        date: '2026-01-15T00:00:00.000Z',
      });
    });

    it('maps a CREDIT transaction as INCOME', async () => {
      const result = await parser.parse(VALID_BANK_OFX);
      const credit = result.transactions[1];

      expect(credit).toMatchObject({
        description: 'SALARY DEPOSIT',
        amount: 3000,
        type: 'INCOME',
        date: '2026-01-16T00:00:00.000Z',
      });
    });

    it('uses FITID as the external ID', async () => {
      const result = await parser.parse(VALID_BANK_OFX);

      expect(result.transactions[0].externalId).toBe('ofx-2026011501');
      expect(result.transactions[1].externalId).toBe('ofx-2026011601');
    });
  });

  describe('parse — single transaction', () => {
    it('handles a file with exactly one transaction', async () => {
      const result = await parser.parse(SINGLE_TRANSACTION_OFX);

      expect(result.transactions).toHaveLength(1);
      expect(result.transactions[0]).toMatchObject({
        description: 'Single transaction',
        amount: 10,
        type: 'EXPENSE',
      });
    });
  });

  describe('parse — credit card statement', () => {
    it('parses transactions from a credit card statement', async () => {
      const result = await parser.parse(CREDIT_CARD_OFX);

      expect(result.transactions).toHaveLength(1);
      expect(result.transactions[0]).toMatchObject({
        description: 'ONLINE STORE',
        amount: 89.99,
        type: 'EXPENSE',
      });
    });
  });

  describe('parse — error handling', () => {
    it('throws ParserError for completely invalid content', async () => {
      await expect(parser.parse('this is not ofx at all')).rejects.toThrow(
        ParserError,
      );
    });

    it('throws ParserError when OFX has no transactions', async () => {
      const emptyOfx = `OFXHEADER:100
<OFX>
  <BANKMSGSRSV1>
    <STMTTRNRS>
      <STMTRS>
        <BANKTRANLIST>
        </BANKTRANLIST>
      </STMTRS>
    </STMTTRNRS>
  </BANKMSGSRSV1>
</OFX>`;
      await expect(parser.parse(emptyOfx)).rejects.toThrow(ParserError);
    });
  });
});