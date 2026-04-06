import { SetMetadata } from '@nestjs/common';
import type { RoleName } from '../constants/role.enum';

export const ROLES_KEY = 'roles';
export const Roles = (...roles: RoleName[]): MethodDecorator & ClassDecorator =>
  SetMetadata(ROLES_KEY, roles);
