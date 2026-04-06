import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AccessTokenGuard } from './common/guards/access-token.guard';
import { ActiveUserGuard } from './common/guards/active-user.guard';
import { RolesGuard } from './common/guards/roles.guard';
import { getDatabaseConfig } from './config/database.config';
import { SeedModule } from './infrastructure/database/seed/seed.module';
import { AccountsModule } from './modules/accounts/accounts.module';
import { AuthModule } from './modules/auth/auth.module';
import { RolesModule } from './modules/roles/roles.module';
import { TransactionsModule } from './modules/transactions/transactions.module';
import { UsersModule } from './modules/users/users.module';
import { WebhooksModule } from './modules/webhooks/webhooks.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      cache: true,
      envFilePath: '.env',
    }),
    TypeOrmModule.forRootAsync({
      useFactory: () => getDatabaseConfig(process.env),
    }),
    RolesModule,
    UsersModule,
    AuthModule,
    AccountsModule,
    TransactionsModule,
    WebhooksModule,
    SeedModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: AccessTokenGuard,
    },
    {
      provide: APP_GUARD,
      useClass: ActiveUserGuard,
    },
    {
      provide: APP_GUARD,
      useClass: RolesGuard,
    },
  ],
})
export class AppModule {}
