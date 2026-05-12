export type AccountType =
  | 'CHECKING'
  | 'SAVINGS'
  | 'CREDIT_CARD'
  | 'CASH'
  | 'INVESTMENT';

export interface Account {
  id: string;
  name: string;
  type: AccountType;
  createdAt: string;
  updatedAt: string;
}

export interface CreateAccountPayload {
  name: string;
  type: AccountType;
}

export type UpdateAccountPayload = Partial<CreateAccountPayload>;