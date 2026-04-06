import type { Transaction } from '../../transactions/entities/transaction.entity';

export const WEBHOOK_SERVICE = Symbol('WEBHOOK_SERVICE');

export interface IWebhookService {
  dispatchTransactionWebhook(transaction: Transaction): Promise<void>;
}
