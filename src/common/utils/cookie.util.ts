import type { ConfigService } from '@nestjs/config';
import type { Response } from 'express';
import { ACCESS_TOKEN_COOKIE, REFRESH_TOKEN_COOKIE } from '../constants/auth.constants';

export class CookieUtil {
  static setAuthCookies(
    response: Response,
    configService: ConfigService,
    accessToken: string,
    refreshToken: string,
  ): void {
    const secure = configService.get<string>('COOKIE_SECURE', 'false') === 'true';
    const sameSite = (configService.get<string>('COOKIE_SAME_SITE', 'lax') ?? 'lax') as
      | 'lax'
      | 'strict'
      | 'none';

    response.cookie(ACCESS_TOKEN_COOKIE, accessToken, {
      httpOnly: true,
      secure,
      sameSite,
      maxAge: CookieUtil.parseDurationToMs(
        configService.get<string>('JWT_ACCESS_TTL', '15m'),
        15 * 60 * 1000,
      ),
    });

    response.cookie(REFRESH_TOKEN_COOKIE, refreshToken, {
      httpOnly: true,
      secure,
      sameSite,
      maxAge: CookieUtil.parseDurationToMs(
        configService.get<string>('JWT_REFRESH_TTL', '7d'),
        7 * 24 * 60 * 60 * 1000,
      ),
    });
  }

  static clearAuthCookies(response: Response, configService: ConfigService): void {
    const secure = configService.get<string>('COOKIE_SECURE', 'false') === 'true';
    const sameSite = (configService.get<string>('COOKIE_SAME_SITE', 'lax') ?? 'lax') as
      | 'lax'
      | 'strict'
      | 'none';

    response.clearCookie(ACCESS_TOKEN_COOKIE, { httpOnly: true, secure, sameSite });
    response.clearCookie(REFRESH_TOKEN_COOKIE, { httpOnly: true, secure, sameSite });
  }

  private static parseDurationToMs(value: string, fallback: number): number {
    const match = /^(\d+)([smhd])$/.exec(value);

    if (!match) {
      return fallback;
    }

    const amount = Number(match[1]);
    const unit = match[2];
    const multipliers: Record<string, number> = {
      s: 1000,
      m: 60 * 1000,
      h: 60 * 60 * 1000,
      d: 24 * 60 * 60 * 1000,
    };

    return amount * multipliers[unit];
  }
}
