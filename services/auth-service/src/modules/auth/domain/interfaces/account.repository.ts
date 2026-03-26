import { Account } from '../entities/account.entity';

export const ACCOUNT_REPOSITORY = Symbol('ACCOUNT_REPOSITORY');

export interface AccountRepository {
  findById(id: string): Promise<Account | null>;
  findByContractNumber(contractNumber: string): Promise<Account | null>;
  save(account: Account): Promise<Account>;
}
