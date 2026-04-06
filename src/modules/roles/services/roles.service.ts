import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RoleName } from '../../../common/constants/role.enum';
import { Role } from '../entities/role.entity';
import { IRolesService } from '../interfaces/roles-service.interface';

@Injectable()
export class RolesService implements IRolesService {
  constructor(
    @InjectRepository(Role)
    private readonly rolesRepository: Repository<Role>,
  ) {}

  async findByName(name: RoleName): Promise<Role> {
    const role = await this.rolesRepository.findOne({ where: { name } });

    if (!role) {
      throw new NotFoundException(`Role ${name} was not found.`);
    }

    return role;
  }

  async ensureDefaults(): Promise<Role[]> {
    const defaults = [RoleName.ADMIN, RoleName.CLIENT];
    const roles: Role[] = [];

    for (const name of defaults) {
      let role = await this.rolesRepository.findOne({ where: { name } });

      if (!role) {
        role = await this.rolesRepository.save(this.rolesRepository.create({ name }));
      }

      roles.push(role);
    }

    return roles;
  }
}
