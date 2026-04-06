import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import {
  ACCESS_TOKEN_COOKIE,
  ACCESS_TOKEN_STRATEGY,
} from '../../../common/constants/auth.constants';
import { JwtPayload } from '../../../common/interfaces/jwt-payload.interface';

@Injectable()
export class AccessTokenStrategy extends PassportStrategy(Strategy, ACCESS_TOKEN_STRATEGY) {
  constructor(configService: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        (request: { cookies?: Record<string, string> }) =>
          request?.cookies?.[ACCESS_TOKEN_COOKIE] ?? null,
      ]),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('JWT_ACCESS_SECRET', 'super-secret-access-key'),
    });
  }

  validate(payload: JwtPayload): JwtPayload {
    return payload;
  }
}
