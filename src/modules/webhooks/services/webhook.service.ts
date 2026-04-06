import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';
import { MoneyUtil } from '../../../common/utils/money.util';
import type { Transaction } from '../../transactions/entities/transaction.entity';
import type { IWebhookService } from '../interfaces/webhook-service.interface';

@Injectable()
export class WebhookService implements IWebhookService {
  private readonly logger = new Logger(WebhookService.name);

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {}

  dispatchTransactionWebhook(transaction: Transaction): Promise<void> {
    setImmediate(() => {
      void this.sendTransactionWebhook(transaction);
    });

    return Promise.resolve();
  }

  private async sendTransactionWebhook(transaction: Transaction): Promise<void> {
    const webhookUrl = this.configService.get<string>('WEBHOOK_URL');

    if (!webhookUrl) {
      return;
    }

    try {
      await firstValueFrom(
        this.httpService.post(
          webhookUrl,
          {
            transactionId: transaction.id,
            type: transaction.type,
            sourceAccountId: transaction.sourceAccountId,
            destinationAccountId: transaction.destinationAccountId,
            initiatedByUserId: transaction.initiatedByUserId,
            amount: MoneyUtil.fromMinorUnits(transaction.amount),
            status: transaction.status,
            description: transaction.description,
            processedAt: transaction.processedAt,
            createdAt: transaction.createdAt,
          },
          {
            timeout: Number(this.configService.get<string>('WEBHOOK_TIMEOUT_MS', '5000')),
          },
        ),
      );
    } catch (error) {
      this.logger.error(
        `Failed to deliver webhook for transaction ${transaction.id}: ${
          error instanceof Error ? error.message : 'Unknown error'
        }`,
      );
    }
  }
}
