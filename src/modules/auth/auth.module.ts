import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ACCESS_TOKEN_STRATEGY } from '../../common/constants/auth.constants';
import { UsersModule } from '../users/users.module';
import { AuthController } from './controllers/auth.controller';
import { AUTH_SERVICE } from './interfaces/auth-service.interface';
import { AuthService } from './services/auth.service';
import { AccessTokenStrategy } from './strategies/access-token.strategy';
import { RefreshTokenStrategy } from './strategies/refresh-token.strategy';

@Module({
  imports: [
    UsersModule,
    PassportModule.register({ defaultStrategy: ACCESS_TOKEN_STRATEGY }),
    JwtModule.register({}),
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    AccessTokenStrategy,
    RefreshTokenStrategy,
    {
      provide: AUTH_SERVICE,
      useExisting: AuthService,
    },
  ],
  exports: [AUTH_SERVICE],
})
export class AuthModule {}
