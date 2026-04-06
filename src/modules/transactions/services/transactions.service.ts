import {
  BadRequestException,
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { RoleName } from '../../../common/constants/role.enum';
import { TransactionStatus } from '../../../common/constants/transaction-status.enum';
import { TransactionType } from '../../../common/constants/transaction-type.enum';
import { JwtPayload } from '../../../common/interfaces/jwt-payload.interface';
import { PaginatedResponse } from '../../../common/interfaces/paginated-response.interface';
import { MoneyUtil } from '../../../common/utils/money.util';
import { Account } from '../../accounts/entities/account.entity';
import { User } from '../../users/entities/user.entity';
import {
  WEBHOOK_SERVICE,
  IWebhookService,
} from '../../webhooks/interfaces/webhook-service.interface';
import { TransactionPaginationDto } from '../dto/transaction-pagination.dto';
import { TransactionResponseDto } from '../dto/transaction-response.dto';
import { TransferFundsDto } from '../dto/transfer-funds.dto';
import { Transaction } from '../entities/transaction.entity';
import { ITransactionsService } from '../interfaces/transactions-service.interface';

@Injectable()
export class TransactionsService implements ITransactionsService {
  private static readonly CLIENT_CANCEL_WINDOW_MS = 5 * 60 * 1000;

  constructor(
    @InjectDataSource()
    private readonly dataSource: DataSource,
    @InjectRepository(Transaction)
    private readonly transactionsRepository: Repository<Transaction>,
    @InjectRepository(Account)
    private readonly accountsRepository: Repository<Account>,
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
    @Inject(WEBHOOK_SERVICE)
    private readonly webhookService: IWebhookService,
  ) {}

  async transfer(currentUser: JwtPayload, dto: TransferFundsDto): Promise<TransactionResponseDto> {
    if (currentUser.sub === dto.destinationUserId) {
      throw new BadRequestException('You cannot transfer funds to your own account.');
    }

    const amountInMinorUnits = MoneyUtil.toMinorUnits(dto.amount);
    const amount = BigInt(amountInMinorUnits);

    if (amount <= 0n) {
      throw new BadRequestException('Transfer amount must be greater than zero.');
    }

    const [sourceAccount, destinationAccount, destinationUser] = await Promise.all([
      this.accountsRepository.findOne({ where: { userId: currentUser.sub } }),
      this.accountsRepository.findOne({ where: { userId: dto.destinationUserId } }),
      this.usersRepository.findOne({
        where: { id: dto.destinationUserId },
        relations: { role: true },
      }),
    ]);

    if (!sourceAccount) {
      throw new NotFoundException('Source account was not found.');
    }

    if (!destinationAccount || !destinationUser) {
      throw new NotFoundException('Destination account was not found.');
    }

    if (!destinationUser.isActive) {
      throw new BadRequestException('Destination user is not active.');
    }

    const pendingTransaction = await this.transactionsRepository.save(
      this.transactionsRepository.create({
        sourceAccountId: sourceAccount.id,
        destinationAccountId: destinationAccount.id,
        initiatedByUserId: currentUser.sub,
        amount: amountInMinorUnits,
        type: TransactionType.TRANSFER,
        description: dto.description ?? null,
        status: TransactionStatus.PENDING,
      }),
    );

    let completedTransaction: Transaction;

    try {
      await this.dataSource.transaction(async (manager) => {
        const accountRepository = manager.getRepository(Account);
        const orderedAccountIds = [sourceAccount.id, destinationAccount.id].sort();
        const lockedAccounts = new Map<string, Account>();

        for (const accountId of orderedAccountIds) {
          const account = await accountRepository
            .createQueryBuilder('account')
            .where('account.id = :accountId', { accountId })
            .setLock('pessimistic_write')
            .getOne();

          if (!account) {
            throw new NotFoundException('An account involved in the transfer no longer exists.');
          }

          lockedAccounts.set(accountId, account);
        }

        const lockedSourceAccount = lockedAccounts.get(sourceAccount.id);
        const lockedDestinationAccount = lockedAccounts.get(destinationAccount.id);

        if (!lockedSourceAccount || !lockedDestinationAccount) {
          throw new NotFoundException('Unable to lock both transfer accounts.');
        }

        const sourceBalance = BigInt(lockedSourceAccount.balance);

        if (sourceBalance < amount) {
          throw new BadRequestException('Insufficient balance.');
        }

        lockedSourceAccount.balance = (sourceBalance - amount).toString();
        lockedDestinationAccount.balance = (
          BigInt(lockedDestinationAccount.balance) + amount
        ).toString();

        await accountRepository.save([lockedSourceAccount, lockedDestinationAccount]);
        await manager.getRepository(Transaction).update(
          { id: pendingTransaction.id },
          {
            status: TransactionStatus.COMPLETED,
            processedAt: new Date(),
            failureReason: null,
          },
        );

        completedTransaction = await manager.getRepository(Transaction).findOneByOrFail({
          id: pendingTransaction.id,
        });
      });
    } catch (error) {
      await this.transactionsRepository.update(
        { id: pendingTransaction.id },
        {
          status: TransactionStatus.CANCELED,
          processedAt: new Date(),
          failureReason: error instanceof Error ? error.message : 'Transfer failed.',
        },
      );

      throw error;
    }

    void this.webhookService.dispatchTransactionWebhook(completedTransaction!);

    return TransactionResponseDto.fromEntity(completedTransaction!);
  }

  async cancel(currentUser: JwtPayload, transactionId: string): Promise<TransactionResponseDto> {
    const transaction = await this.transactionsRepository.findOneBy({ id: transactionId });

    if (!transaction) {
      throw new NotFoundException('Transaction not found.');
    }

    this.assertCancelAccess(currentUser, transaction);

    if (transaction.status === TransactionStatus.CANCELED) {
      throw new BadRequestException('Transaction has already been canceled.');
    }

    if (transaction.status === TransactionStatus.PENDING) {
      const canceledTransaction = await this.markCanceled(transaction, currentUser);
      return TransactionResponseDto.fromEntity(canceledTransaction);
    }

    if (transaction.status !== TransactionStatus.COMPLETED) {
      throw new BadRequestException('Only pending or completed transactions can be canceled.');
    }

    const canceledTransaction = await this.dataSource.transaction(async (manager) => {
      const accountRepository = manager.getRepository(Account);
      const transactionRepository = manager.getRepository(Transaction);
      const amount = BigInt(transaction.amount);

      if (transaction.type === TransactionType.TRANSFER) {
        await this.reverseTransfer(transaction, amount, accountRepository);
      } else if (transaction.type === TransactionType.DEPOSIT) {
        await this.reverseDeposit(transaction, amount, accountRepository);
      } else {
        throw new BadRequestException('Unsupported transaction type.');
      }

      await transactionRepository.update(
        { id: transaction.id },
        {
          status: TransactionStatus.CANCELED,
          processedAt: new Date(),
          failureReason: this.getCancellationReason(currentUser),
        },
      );

      return transactionRepository.findOneByOrFail({ id: transaction.id });
    });

    return TransactionResponseDto.fromEntity(canceledTransaction);
  }

  async findAll(dto: TransactionPaginationDto): Promise<PaginatedResponse<TransactionResponseDto>> {
    const page = dto.page ?? 1;
    const limit = dto.limit ?? 10;
    const offset = (page - 1) * limit;

    const queryBuilder = this.transactionsRepository
      .createQueryBuilder('transaction')
      .orderBy('transaction.createdAt', 'DESC')
      .skip(offset)
      .take(limit);

    if (dto.status) {
      queryBuilder.andWhere('transaction.status = :status', { status: dto.status });
    }

    const [transactions, total] = await queryBuilder.getManyAndCount();

    return {
      items: transactions.map((transaction) => TransactionResponseDto.fromEntity(transaction)),
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit) || 1,
      },
    };
  }

  private assertCancelAccess(currentUser: JwtPayload, transaction: Transaction): void {
    if (currentUser.role === RoleName.ADMIN) {
      return;
    }

    if (transaction.initiatedByUserId !== currentUser.sub) {
      throw new ForbiddenException('You can only cancel your own transactions.');
    }

    if (transaction.status === TransactionStatus.PENDING) {
      return;
    }

    const cancellationDeadline =
      transaction.createdAt.getTime() + TransactionsService.CLIENT_CANCEL_WINDOW_MS;

    if (Date.now() > cancellationDeadline) {
      throw new ForbiddenException('The cancellation window for this transaction has expired.');
    }
  }

  private async markCanceled(
    transaction: Transaction,
    currentUser: JwtPayload,
  ): Promise<Transaction> {
    await this.transactionsRepository.update(
      { id: transaction.id },
      {
        status: TransactionStatus.CANCELED,
        processedAt: new Date(),
        failureReason: this.getCancellationReason(currentUser),
      },
    );

    return this.transactionsRepository.findOneByOrFail({ id: transaction.id });
  }

  private async reverseTransfer(
    transaction: Transaction,
    amount: bigint,
    accountRepository: Repository<Account>,
  ): Promise<void> {
    if (!transaction.sourceAccountId) {
      throw new BadRequestException('Transfer transaction does not have a source account.');
    }

    const orderedAccountIds = [
      transaction.sourceAccountId,
      transaction.destinationAccountId,
    ].sort();
    const lockedAccounts = new Map<string, Account>();

    for (const accountId of orderedAccountIds) {
      const account = await accountRepository
        .createQueryBuilder('account')
        .where('account.id = :accountId', { accountId })
        .setLock('pessimistic_write')
        .getOne();

      if (!account) {
        throw new NotFoundException('An account involved in the transaction no longer exists.');
      }

      lockedAccounts.set(accountId, account);
    }

    const sourceAccount = lockedAccounts.get(transaction.sourceAccountId);
    const destinationAccount = lockedAccounts.get(transaction.destinationAccountId);

    if (!sourceAccount || !destinationAccount) {
      throw new NotFoundException('Unable to lock both transaction accounts.');
    }

    const destinationBalance = BigInt(destinationAccount.balance);

    if (destinationBalance < amount) {
      throw new BadRequestException('Insufficient funds for reversal');
    }

    destinationAccount.balance = (destinationBalance - amount).toString();
    sourceAccount.balance = (BigInt(sourceAccount.balance) + amount).toString();

    await accountRepository.save([sourceAccount, destinationAccount]);
  }

  private async reverseDeposit(
    transaction: Transaction,
    amount: bigint,
    accountRepository: Repository<Account>,
  ): Promise<void> {
    const destinationAccount = await accountRepository
      .createQueryBuilder('account')
      .where('account.id = :accountId', { accountId: transaction.destinationAccountId })
      .setLock('pessimistic_write')
      .getOne();

    if (!destinationAccount) {
      throw new NotFoundException('Destination account was not found.');
    }

    const destinationBalance = BigInt(destinationAccount.balance);

    if (destinationBalance < amount) {
      throw new BadRequestException('Insufficient funds for reversal');
    }

    destinationAccount.balance = (destinationBalance - amount).toString();
    await accountRepository.save(destinationAccount);
  }

  private getCancellationReason(currentUser: JwtPayload): string {
    return currentUser.role === RoleName.ADMIN
      ? 'Transaction canceled by admin.'
      : 'Transaction canceled by client.';
  }
}
