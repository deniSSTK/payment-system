import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Account } from '../accounts/entities/account.entity';
import { Role } from '../roles/entities/role.entity';
import { User } from './entities/user.entity';
import { USERS_SERVICE } from './interfaces/users-service.interface';
import { UsersController } from './controllers/users.controller';
import { UsersService } from './services/users.service';

@Module({
  imports: [TypeOrmModule.forFeature([User, Role, Account])],
  controllers: [UsersController],
  providers: [
    UsersService,
    {
      provide: USERS_SERVICE,
      useExisting: UsersService,
    },
  ],
  exports: [USERS_SERVICE, UsersService, TypeOrmModule],
})
export class UsersModule {}
