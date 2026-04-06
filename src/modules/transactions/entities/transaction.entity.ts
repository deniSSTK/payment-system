import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { TransactionStatus } from '../../../common/constants/transaction-status.enum';
import { TransactionType } from '../../../common/constants/transaction-type.enum';
import { Account } from '../../accounts/entities/account.entity';
import { User } from '../../users/entities/user.entity';

@Entity({ name: 'transactions' })
export class Transaction {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'source_account_id', nullable: true })
  sourceAccountId?: string | null;

  @Column({ name: 'destination_account_id' })
  destinationAccountId!: string;

  @Column({ name: 'initiated_by_user_id' })
  initiatedByUserId!: string;

  @Column({ type: 'bigint' })
  amount!: string;

  @Column({
    type: 'enum',
    enum: TransactionType,
    default: TransactionType.TRANSFER,
  })
  type!: TransactionType;

  @Column({
    type: 'enum',
    enum: TransactionStatus,
    default: TransactionStatus.PENDING,
  })
  status!: TransactionStatus;

  @Column({ type: 'varchar', length: 255, nullable: true })
  description?: string | null;

  @Column({ name: 'failure_reason', type: 'varchar', length: 255, nullable: true })
  failureReason?: string | null;

  @Column({ name: 'processed_at', type: 'timestamptz', nullable: true })
  processedAt?: Date | null;

  @ManyToOne(() => Account, { nullable: true })
  @JoinColumn({ name: 'source_account_id' })
  sourceAccount?: Account | null;

  @ManyToOne(() => Account, { nullable: false })
  @JoinColumn({ name: 'destination_account_id' })
  destinationAccount?: Account;

  @ManyToOne(() => User, { nullable: false })
  @JoinColumn({ name: 'initiated_by_user_id' })
  initiatedByUser?: User;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;
}
