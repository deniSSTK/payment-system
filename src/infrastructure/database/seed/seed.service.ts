import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcrypt';
import { DataSource, Repository } from 'typeorm';
import { RoleName } from '../../../common/constants/role.enum';
import { MoneyUtil } from '../../../common/utils/money.util';
import { Account } from '../../../modules/accounts/entities/account.entity';
import { Role } from '../../../modules/roles/entities/role.entity';
import { User } from '../../../modules/users/entities/user.entity';

@Injectable()
export class SeedService implements OnApplicationBootstrap {
  private readonly logger = new Logger(SeedService.name);
  private isSeeding = false;

  constructor(
    @InjectDataSource()
    private readonly dataSource: DataSource,
    private readonly configService: ConfigService,
    @InjectRepository(Role)
    private readonly rolesRepository: Repository<Role>,
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
    @InjectRepository(Account)
    private readonly accountsRepository: Repository<Account>,
  ) {}

  async onApplicationBootstrap(): Promise<void> {
    const enabled = this.configService.get<string>('SEED_ENABLE', 'true') === 'true';

    if (!enabled || this.isSeeding) {
      return;
    }

    await this.seed();
  }

  async seed(): Promise<void> {
    this.isSeeding = true;

    try {
      await this.ensureRoles();
      await this.ensureAdminUser();
    } finally {
      this.isSeeding = false;
    }
  }

  private async ensureRoles(): Promise<void> {
    for (const name of [RoleName.ADMIN, RoleName.CLIENT]) {
      const role = await this.rolesRepository.findOne({ where: { name } });

      if (!role) {
        await this.rolesRepository.save(this.rolesRepository.create({ name }));
        this.logger.log(`Created role ${name}.`);
      }
    }
  }

  private async ensureAdminUser(): Promise<void> {
    const adminEmail = this.configService.get<string>('SEED_ADMIN_EMAIL', 'admin@example.com');
    const adminPassword = this.configService.get<string>('SEED_ADMIN_PASSWORD', 'Admin12345!');
    const initialBalance = this.configService.get<string>('SEED_ADMIN_INITIAL_BALANCE', '1000.00');

    const existingAdmin = await this.usersRepository
      .createQueryBuilder('user')
      .leftJoinAndSelect('user.role', 'role')
      .leftJoinAndSelect('user.account', 'account')
      .where('LOWER(user.email) = LOWER(:email)', { email: adminEmail })
      .getOne();

    if (existingAdmin) {
      if (!existingAdmin.account) {
        await this.accountsRepository.save(
          this.accountsRepository.create({
            userId: existingAdmin.id,
            balance: MoneyUtil.toMinorUnits(initialBalance),
          }),
        );
      }

      this.logger.log(`Admin user ${adminEmail} already exists.`);
      return;
    }

    const adminRole = await this.rolesRepository.findOne({ where: { name: RoleName.ADMIN } });

    if (!adminRole) {
      throw new Error('Admin role is missing. Run role seed first.');
    }

    const passwordHash = await bcrypt.hash(adminPassword, 12);

    await this.dataSource.transaction(async (manager) => {
      const adminUser = await manager.save(
        User,
        manager.create(User, {
          email: adminEmail.toLowerCase(),
          passwordHash,
          roleId: adminRole.id,
          isActive: true,
        }),
      );

      await manager.save(
        Account,
        manager.create(Account, {
          userId: adminUser.id,
          balance: MoneyUtil.toMinorUnits(initialBalance),
        }),
      );
    });

    this.logger.log(`Seeded admin user ${adminEmail}.`);
  }
}
