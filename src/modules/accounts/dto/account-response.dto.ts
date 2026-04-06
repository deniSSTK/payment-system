import { ApiProperty } from '@nestjs/swagger';
import { MoneyUtil } from '../../../common/utils/money.util';
import { Account } from '../entities/account.entity';

export class AccountResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  userId!: string;

  @ApiProperty({ example: '125.50' })
  balance!: string;

  @ApiProperty({ example: 'USD' })
  currency!: string;

  @ApiProperty()
  createdAt!: Date;

  @ApiProperty()
  updatedAt!: Date;

  static fromEntity(account: Account): AccountResponseDto {
    return {
      id: account.id,
      userId: account.userId,
      balance: MoneyUtil.fromMinorUnits(account.balance),
      currency: account.currency,
      createdAt: account.createdAt,
      updatedAt: account.updatedAt,
    };
  }
}
