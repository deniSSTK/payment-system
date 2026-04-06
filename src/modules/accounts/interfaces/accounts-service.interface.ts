import type { TransactionResponseDto } from '../../transactions/dto/transaction-response.dto';
import type { DepositFundsDto } from '../dto/deposit-funds.dto';
import type { Account } from '../entities/account.entity';

export const ACCOUNTS_SERVICE = Symbol('ACCOUNTS_SERVICE');

export interface IAccountsService {
  getByUserId(userId: string): Promise<Account>;
  deposit(userId: string, dto: DepositFundsDto): Promise<TransactionResponseDto>;
}
