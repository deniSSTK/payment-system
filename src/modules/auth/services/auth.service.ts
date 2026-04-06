import { ForbiddenException, Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import type { SignOptions } from 'jsonwebtoken';
import { JwtPayload } from '../../../common/interfaces/jwt-payload.interface';
import { RoleName } from '../../../common/constants/role.enum';
import { LoginDto } from '../dto/login.dto';
import { RegisterDto } from '../dto/register.dto';
import { User } from '../../users/entities/user.entity';
import { IUsersService, USERS_SERVICE } from '../../users/interfaces/users-service.interface';
import { AuthSession, IAuthService } from '../interfaces/auth-service.interface';

@Injectable()
export class AuthService implements IAuthService {
  constructor(
    @Inject(USERS_SERVICE)
    private readonly usersService: IUsersService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async register(dto: RegisterDto): Promise<User> {
    const passwordHash = await bcrypt.hash(dto.password, 12);
    return this.usersService.createClient({ email: dto.email, passwordHash });
  }

  async login(dto: LoginDto): Promise<AuthSession> {
    const user = await this.usersService.findByEmailWithSecrets(dto.email);

    if (!user) {
      throw new UnauthorizedException('Invalid email or password.');
    }

    const passwordMatches = await bcrypt.compare(dto.password, user.passwordHash);

    if (!passwordMatches) {
      throw new UnauthorizedException('Invalid email or password.');
    }

    if (!user.isActive) {
      throw new ForbiddenException('Your account has been deactivated.');
    }

    return this.createSession(user);
  }

  async refreshTokens(userId: string, refreshToken: string): Promise<AuthSession> {
    const user = await this.usersService.findByIdWithSecrets(userId);

    if (!user || !user.refreshTokenHash) {
      throw new UnauthorizedException('Refresh session is not valid.');
    }

    const refreshTokenMatches = await bcrypt.compare(refreshToken, user.refreshTokenHash);

    if (!refreshTokenMatches) {
      throw new UnauthorizedException('Refresh session is not valid.');
    }

    if (!user.isActive) {
      throw new ForbiddenException('Your account has been deactivated.');
    }

    return this.createSession(user);
  }

  async logout(userId: string): Promise<void> {
    await this.usersService.clearRefreshTokenHash(userId);
  }

  private async createSession(user: User): Promise<AuthSession> {
    const payload = this.buildPayload(user);
    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload, {
        secret: this.configService.get<string>('JWT_ACCESS_SECRET', 'super-secret-access-key'),
        expiresIn: this.getJwtExpiration('JWT_ACCESS_TTL', '15m'),
      }),
      this.jwtService.signAsync(payload, {
        secret: this.configService.get<string>('JWT_REFRESH_SECRET', 'super-secret-refresh-key'),
        expiresIn: this.getJwtExpiration('JWT_REFRESH_TTL', '7d'),
      }),
    ]);

    const refreshTokenHash = await bcrypt.hash(refreshToken, 12);
    await this.usersService.updateRefreshTokenHash(user.id, refreshTokenHash);

    const freshUser = await this.usersService.findByIdOrFail(user.id);

    return {
      user: freshUser,
      accessToken,
      refreshToken,
    };
  }

  private buildPayload(user: User): JwtPayload {
    return {
      sub: user.id,
      email: user.email,
      role: user.role?.name ?? RoleName.CLIENT,
      isActive: user.isActive,
    };
  }

  private getJwtExpiration(key: string, fallback: string): SignOptions['expiresIn'] {
    return this.configService.get<string>(key, fallback) as SignOptions['expiresIn'];
  }
}
