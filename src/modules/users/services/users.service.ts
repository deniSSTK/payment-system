import {
  ConflictException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { RoleName } from '../../../common/constants/role.enum';
import { Account } from '../../accounts/entities/account.entity';
import { Role } from '../../roles/entities/role.entity';
import { CreateClientInput, IUsersService } from '../interfaces/users-service.interface';
import { User } from '../entities/user.entity';

@Injectable()
export class UsersService implements IUsersService {
  constructor(
    @InjectDataSource()
    private readonly dataSource: DataSource,
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
    @InjectRepository(Role)
    private readonly rolesRepository: Repository<Role>,
    @InjectRepository(Account)
    private readonly accountsRepository: Repository<Account>,
  ) {}

  async createClient(input: CreateClientInput): Promise<User> {
    const existingUser = await this.usersRepository
      .createQueryBuilder('user')
      .where('LOWER(user.email) = LOWER(:email)', { email: input.email })
      .getOne();

    if (existingUser) {
      throw new ConflictException('A user with this email already exists.');
    }

    const clientRole = await this.rolesRepository.findOne({ where: { name: RoleName.CLIENT } });

    if (!clientRole) {
      throw new InternalServerErrorException('Client role is not available.');
    }

    return this.dataSource.transaction(async (manager) => {
      const user = manager.create(User, {
        email: input.email.toLowerCase(),
        passwordHash: input.passwordHash,
        roleId: clientRole.id,
        isActive: true,
      });

      const savedUser = await manager.save(User, user);
      await manager.save(
        Account,
        manager.create(Account, {
          userId: savedUser.id,
          balance: '0',
        }),
      );

      return manager.findOneOrFail(User, {
        where: { id: savedUser.id },
        relations: { role: true, account: true },
      });
    });
  }

  async findByEmailWithSecrets(email: string): Promise<User | null> {
    return this.usersRepository
      .createQueryBuilder('user')
      .addSelect(['user.passwordHash', 'user.refreshTokenHash'])
      .leftJoinAndSelect('user.role', 'role')
      .leftJoinAndSelect('user.account', 'account')
      .where('LOWER(user.email) = LOWER(:email)', { email })
      .getOne();
  }

  async findByIdOrFail(id: string): Promise<User> {
    const user = await this.usersRepository.findOne({
      where: { id },
      relations: { role: true, account: true },
    });

    if (!user) {
      throw new NotFoundException('User not found.');
    }

    return user;
  }

  async findByIdWithSecrets(id: string): Promise<User | null> {
    return this.usersRepository
      .createQueryBuilder('user')
      .addSelect(['user.passwordHash', 'user.refreshTokenHash'])
      .leftJoinAndSelect('user.role', 'role')
      .leftJoinAndSelect('user.account', 'account')
      .where('user.id = :id', { id })
      .getOne();
  }

  async updateRefreshTokenHash(userId: string, refreshTokenHash: string): Promise<void> {
    await this.usersRepository.update({ id: userId }, { refreshTokenHash });
  }

  async clearRefreshTokenHash(userId: string): Promise<void> {
    await this.usersRepository.update({ id: userId }, { refreshTokenHash: null });
  }

  async setActive(userId: string, isActive: boolean): Promise<User> {
    const user = await this.findByIdOrFail(userId);
    user.isActive = isActive;

    if (!isActive) {
      user.refreshTokenHash = null;
    }

    await this.usersRepository.save(user);
    return this.findByIdOrFail(userId);
  }
}
