import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Transaction } from '../transactions/entities/transaction.entity';
import { Account } from './entities/account.entity';
import { AccountsController } from './controllers/accounts.controller';
import { ACCOUNTS_SERVICE } from './interfaces/accounts-service.interface';
import { AccountsService } from './services/accounts.service';

@Module({
  imports: [TypeOrmModule.forFeature([Account, Transaction])],
  controllers: [AccountsController],
  providers: [
    AccountsService,
    {
      provide: ACCOUNTS_SERVICE,
      useExisting: AccountsService,
    },
  ],
  exports: [ACCOUNTS_SERVICE, AccountsService, TypeOrmModule],
})
export class AccountsModule {}
