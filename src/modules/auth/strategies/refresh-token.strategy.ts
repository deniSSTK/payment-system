import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import type { Request } from 'express';
import {
  REFRESH_TOKEN_COOKIE,
  REFRESH_TOKEN_STRATEGY,
} from '../../../common/constants/auth.constants';
import { JwtPayload } from '../../../common/interfaces/jwt-payload.interface';

@Injectable()
export class RefreshTokenStrategy extends PassportStrategy(Strategy, REFRESH_TOKEN_STRATEGY) {
  constructor(configService: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        (request: { cookies?: Record<string, string> }) =>
          request?.cookies?.[REFRESH_TOKEN_COOKIE] ?? null,
      ]),
      passReqToCallback: true,
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('JWT_REFRESH_SECRET', 'super-secret-refresh-key'),
    });
  }

  validate(request: Request, payload: JwtPayload): JwtPayload {
    const cookies = request.cookies as Record<string, string> | undefined;

    return {
      ...payload,
      refreshToken: cookies?.[REFRESH_TOKEN_COOKIE],
    };
  }
}
