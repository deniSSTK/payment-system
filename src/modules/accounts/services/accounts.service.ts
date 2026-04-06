import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { TransactionStatus } from '../../../common/constants/transaction-status.enum';
import { TransactionType } from '../../../common/constants/transaction-type.enum';
import { MoneyUtil } from '../../../common/utils/money.util';
import { TransactionResponseDto } from '../../transactions/dto/transaction-response.dto';
import { Transaction } from '../../transactions/entities/transaction.entity';
import { DepositFundsDto } from '../dto/deposit-funds.dto';
import { IAccountsService } from '../interfaces/accounts-service.interface';
import { Account } from '../entities/account.entity';

@Injectable()
export class AccountsService implements IAccountsService {
  constructor(
    @InjectDataSource()
    private readonly dataSource: DataSource,
    @InjectRepository(Account)
    private readonly accountsRepository: Repository<Account>,
  ) {}

  async getByUserId(userId: string): Promise<Account> {
    const account = await this.accountsRepository.findOne({ where: { userId } });

    if (!account) {
      throw new NotFoundException('Account not found.');
    }

    return account;
  }

  async deposit(userId: string, dto: DepositFundsDto): Promise<TransactionResponseDto> {
    const amountInMinorUnits = MoneyUtil.toMinorUnits(dto.amount);
    const amount = BigInt(amountInMinorUnits);

    if (amount <= 0n) {
      throw new BadRequestException('Deposit amount must be greater than zero.');
    }

    const transaction = await this.dataSource.transaction(async (manager) => {
      const accountRepository = manager.getRepository(Account);
      const transactionRepository = manager.getRepository(Transaction);

      const account = await accountRepository
        .createQueryBuilder('account')
        .where('account.user_id = :userId', { userId })
        .setLock('pessimistic_write')
        .getOne();

      if (!account) {
        throw new NotFoundException('Account not found.');
      }

      account.balance = (BigInt(account.balance) + amount).toString();
      await accountRepository.save(account);

      return transactionRepository.save(
        transactionRepository.create({
          sourceAccountId: null,
          destinationAccountId: account.id,
          initiatedByUserId: userId,
          amount: amountInMinorUnits,
          type: TransactionType.DEPOSIT,
          status: TransactionStatus.COMPLETED,
          description: dto.description ?? null,
          processedAt: new Date(),
          failureReason: null,
        }),
      );
    });

    return TransactionResponseDto.fromEntity(transaction);
  }
}
