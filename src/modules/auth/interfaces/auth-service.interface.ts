import type { User } from '../../users/entities/user.entity';
import type { LoginDto } from '../dto/login.dto';
import type { RegisterDto } from '../dto/register.dto';

export const AUTH_SERVICE = Symbol('AUTH_SERVICE');

export interface AuthSession {
  user: User;
  accessToken: string;
  refreshToken: string;
}

export interface IAuthService {
  register(dto: RegisterDto): Promise<User>;
  login(dto: LoginDto): Promise<AuthSession>;
  refreshTokens(userId: string, refreshToken: string): Promise<AuthSession>;
  logout(userId: string): Promise<void>;
}
