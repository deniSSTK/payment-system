import { Body, Controller, Get, Inject, Param, ParseUUIDPipe, Patch } from '@nestjs/common';
import { ApiCookieAuth, ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { ACCESS_TOKEN_COOKIE_AUTH } from '../../../common/constants/auth.constants';
import { RoleName } from '../../../common/constants/role.enum';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import { Roles } from '../../../common/decorators/roles.decorator';
import { JwtPayload } from '../../../common/interfaces/jwt-payload.interface';
import { UpdateUserStatusDto } from '../dto/update-user-status.dto';
import { UserResponseDto } from '../dto/user-response.dto';
import { IUsersService, USERS_SERVICE } from '../interfaces/users-service.interface';

@ApiTags('Users')
@ApiCookieAuth(ACCESS_TOKEN_COOKIE_AUTH)
@Controller('users')
export class UsersController {
  constructor(
    @Inject(USERS_SERVICE)
    private readonly usersService: IUsersService,
  ) {}

  @Get('me')
  @ApiOperation({ summary: 'Get current authenticated user' })
  @ApiOkResponse({ type: UserResponseDto })
  async getCurrentUser(@CurrentUser() user: JwtPayload): Promise<UserResponseDto> {
    const currentUser = await this.usersService.findByIdOrFail(user.sub);
    return UserResponseDto.fromEntity(currentUser);
  }

  @Patch(':id/active')
  @Roles(RoleName.ADMIN)
  @ApiOperation({ summary: 'Activate or deactivate a user account' })
  @ApiOkResponse({ type: UserResponseDto })
  async updateStatus(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: UpdateUserStatusDto,
  ): Promise<UserResponseDto> {
    const user = await this.usersService.setActive(id, dto.isActive);
    return UserResponseDto.fromEntity(user);
  }
}
