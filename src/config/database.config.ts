import type { TypeOrmModuleOptions } from '@nestjs/typeorm';
import type { DataSourceOptions } from 'typeorm';
import { Account } from '../modules/accounts/entities/account.entity';
import { Role } from '../modules/roles/entities/role.entity';
import { Transaction } from '../modules/transactions/entities/transaction.entity';
import { User } from '../modules/users/entities/user.entity';

type SupportedOptions = DataSourceOptions & TypeOrmModuleOptions;

export function getDatabaseConfig(env: NodeJS.ProcessEnv): SupportedOptions {
  const isTsRuntime = __filename.endsWith('.ts');
  const migrations = isTsRuntime
    ? ['src/infrastructure/database/migrations/*.ts']
    : ['dist/infrastructure/database/migrations/*.js'];

  return {
    type: 'postgres',
    host: env.DB_HOST ?? 'localhost',
    port: Number(env.DB_PORT ?? 5432),
    username: env.DB_USER ?? 'postgres',
    password: env.DB_PASSWORD ?? 'postgres',
    database: env.DB_NAME ?? 'payment_system',
    entities: [Role, User, Account, Transaction],
    migrations,
    synchronize: false,
    logging: false,
    autoLoadEntities: false,
  };
}
