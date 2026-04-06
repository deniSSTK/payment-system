import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Account } from '../accounts/entities/account.entity';
import { User } from '../users/entities/user.entity';
import { WebhooksModule } from '../webhooks/webhooks.module';
import { TransactionsController } from './controllers/transactions.controller';
import { Transaction } from './entities/transaction.entity';
import { TRANSACTIONS_SERVICE } from './interfaces/transactions-service.interface';
import { TransactionsService } from './services/transactions.service';

@Module({
  imports: [TypeOrmModule.forFeature([Transaction, Account, User]), WebhooksModule],
  controllers: [TransactionsController],
  providers: [
    TransactionsService,
    {
      provide: TRANSACTIONS_SERVICE,
      useExisting: TransactionsService,
    },
  ],
  exports: [TRANSACTIONS_SERVICE],
})
export class TransactionsModule {}
