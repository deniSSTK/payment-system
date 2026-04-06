import type { RoleName } from '../../../common/constants/role.enum';
import type { Role } from '../entities/role.entity';

export const ROLES_SERVICE = Symbol('ROLES_SERVICE');

export interface IRolesService {
  findByName(name: RoleName): Promise<Role>;
  ensureDefaults(): Promise<Role[]>;
}
