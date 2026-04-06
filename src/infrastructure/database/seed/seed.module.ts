import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Account } from '../../../modules/accounts/entities/account.entity';
import { Role } from '../../../modules/roles/entities/role.entity';
import { User } from '../../../modules/users/entities/user.entity';
import { SeedService } from './seed.service';

@Module({
  imports: [TypeOrmModule.forFeature([Role, User, Account])],
  providers: [SeedService],
  exports: [SeedService],
})
export class SeedModule {}
