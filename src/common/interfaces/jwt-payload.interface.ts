import type { RoleName } from '../constants/role.enum';

export interface JwtPayload {
  sub: string;
  email: string;
  role: RoleName;
  isActive: boolean;
  refreshToken?: string;
}
