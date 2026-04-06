import { ApiProperty } from '@nestjs/swagger';
import { RoleName } from '../../../common/constants/role.enum';
import { User } from '../entities/user.entity';

export class UserResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  email!: string;

  @ApiProperty({ enum: RoleName })
  role!: RoleName;

  @ApiProperty()
  isActive!: boolean;

  @ApiProperty()
  createdAt!: Date;

  @ApiProperty()
  updatedAt!: Date;

  static fromEntity(user: User): UserResponseDto {
    return {
      id: user.id,
      email: user.email,
      role: user.role.name,
      isActive: user.isActive,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }
}
