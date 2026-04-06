import { Body, Controller, Inject, Post, Res, UseGuards } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ApiCookieAuth, ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Response } from 'express';
import { REFRESH_TOKEN_COOKIE_AUTH } from '../../../common/constants/auth.constants';
import { MessageResponseDto } from '../../../common/dto/message-response.dto';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import { Public } from '../../../common/decorators/public.decorator';
import { RefreshTokenGuard } from '../../../common/guards/refresh-token.guard';
import { JwtPayload } from '../../../common/interfaces/jwt-payload.interface';
import { CookieUtil } from '../../../common/utils/cookie.util';
import { UserResponseDto } from '../../users/dto/user-response.dto';
import { AUTH_SERVICE, IAuthService } from '../interfaces/auth-service.interface';
import { LoginDto } from '../dto/login.dto';
import { RegisterDto } from '../dto/register.dto';
import { SessionResponseDto } from '../dto/session-response.dto';

@ApiTags('Authentication')
@Controller('auth')
export class AuthController {
  constructor(
    @Inject(AUTH_SERVICE)
    private readonly authService: IAuthService,
    private readonly configService: ConfigService,
  ) {}

  @Post('register')
  @Public()
  @ApiOperation({ summary: 'Register a new client account' })
  @ApiOkResponse({ type: UserResponseDto })
  async register(@Body() dto: RegisterDto): Promise<UserResponseDto> {
    const user = await this.authService.register(dto);
    return UserResponseDto.fromEntity(user);
  }

  @Post('login')
  @Public()
  @ApiOperation({ summary: 'Login with email and password and receive auth cookies' })
  @ApiOkResponse({ type: SessionResponseDto })
  async login(
    @Body() dto: LoginDto,
    @Res({ passthrough: true }) response: Response,
  ): Promise<SessionResponseDto> {
    const session = await this.authService.login(dto);
    CookieUtil.setAuthCookies(
      response,
      this.configService,
      session.accessToken,
      session.refreshToken,
    );

    return {
      user: UserResponseDto.fromEntity(session.user),
    };
  }

  @Post('refresh')
  @Public()
  @UseGuards(RefreshTokenGuard)
  @ApiCookieAuth(REFRESH_TOKEN_COOKIE_AUTH)
  @ApiOperation({ summary: 'Refresh JWT cookie pair using the refresh token cookie' })
  @ApiOkResponse({ type: SessionResponseDto })
  async refresh(
    @CurrentUser() user: JwtPayload,
    @Res({ passthrough: true }) response: Response,
  ): Promise<SessionResponseDto> {
    const session = await this.authService.refreshTokens(user.sub, user.refreshToken ?? '');
    CookieUtil.setAuthCookies(
      response,
      this.configService,
      session.accessToken,
      session.refreshToken,
    );

    return {
      user: UserResponseDto.fromEntity(session.user),
    };
  }

  @Post('logout')
  @Public()
  @UseGuards(RefreshTokenGuard)
  @ApiCookieAuth(REFRESH_TOKEN_COOKIE_AUTH)
  @ApiOperation({ summary: 'Logout and clear auth cookies' })
  @ApiOkResponse({ type: MessageResponseDto })
  async logout(
    @CurrentUser() user: JwtPayload,
    @Res({ passthrough: true }) response: Response,
  ): Promise<MessageResponseDto> {
    await this.authService.logout(user.sub);
    CookieUtil.clearAuthCookies(response, this.configService);
    return { message: 'Logged out successfully.' };
  }
}
