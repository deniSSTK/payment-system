import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Role } from './entities/role.entity';
import { ROLES_SERVICE } from './interfaces/roles-service.interface';
import { RolesService } from './services/roles.service';

@Module({
  imports: [TypeOrmModule.forFeature([Role])],
  providers: [
    RolesService,
    {
      provide: ROLES_SERVICE,
      useExisting: RolesService,
    },
  ],
  exports: [ROLES_SERVICE, RolesService, TypeOrmModule],
})
export class RolesModule {}
