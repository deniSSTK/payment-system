import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { TransactionStatus } from '../../../common/constants/transaction-status.enum';
import { TransactionType } from '../../../common/constants/transaction-type.enum';
import { MoneyUtil } from '../../../common/utils/money.util';
import { Transaction } from '../entities/transaction.entity';

export class TransactionResponseDto {
  @ApiProperty()
  id!: string;

  @ApiPropertyOptional({ nullable: true })
  sourceAccountId?: string | null;

  @ApiProperty()
  destinationAccountId!: string;

  @ApiProperty()
  initiatedByUserId!: string;

  @ApiProperty({ example: '150.75' })
  amount!: string;

  @ApiProperty({ enum: TransactionType })
  type!: TransactionType;

  @ApiProperty({ enum: TransactionStatus })
  status!: TransactionStatus;

  @ApiPropertyOptional()
  description?: string | null;

  @ApiPropertyOptional()
  failureReason?: string | null;

  @ApiPropertyOptional()
  processedAt?: Date | null;

  @ApiProperty()
  createdAt!: Date;

  @ApiProperty()
  updatedAt!: Date;

  static fromEntity(transaction: Transaction): TransactionResponseDto {
    return {
      id: transaction.id,
      sourceAccountId: transaction.sourceAccountId,
      destinationAccountId: transaction.destinationAccountId,
      initiatedByUserId: transaction.initiatedByUserId,
      amount: MoneyUtil.fromMinorUnits(transaction.amount),
      type: transaction.type,
      status: transaction.status,
      description: transaction.description,
      failureReason: transaction.failureReason,
      processedAt: transaction.processedAt,
      createdAt: transaction.createdAt,
      updatedAt: transaction.updatedAt,
    };
  }
}
