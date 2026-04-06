import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Account } from '../../accounts/entities/account.entity';
import { Role } from '../../roles/entities/role.entity';

@Entity({ name: 'users' })
export class User {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ unique: true })
  email!: string;

  @Column({ name: 'password_hash', select: false })
  passwordHash!: string;

  @Column({ name: 'refresh_token_hash', type: 'varchar', nullable: true, select: false })
  refreshTokenHash?: string | null;

  @Column({ name: 'is_active', default: true })
  isActive!: boolean;

  @Column({ name: 'role_id' })
  roleId!: string;

  @ManyToOne(() => Role, (role) => role.users, { eager: false, nullable: false })
  @JoinColumn({ name: 'role_id' })
  role!: Role;

  @OneToOne(() => Account, (account) => account.user)
  account?: Account;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;
}
