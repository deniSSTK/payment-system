import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { RoleName } from '../../../common/constants/role.enum';
import { User } from '../../users/entities/user.entity';

@Entity({ name: 'roles' })
export class Role {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({
    type: 'enum',
    enum: RoleName,
    unique: true,
  })
  name!: RoleName;

  @OneToMany(() => User, (user) => user.role)
  users?: User[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;
}
