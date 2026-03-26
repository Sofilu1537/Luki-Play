import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import type {
  TokenService,
  JwtPayload,
  TokenPair,
} from '../../domain/interfaces/token.service';
import type { StringValue } from 'ms';

@Injectable()
export class JwtTokenService implements TokenService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async generateTokenPair(payload: JwtPayload): Promise<TokenPair> {
    const accessToken = await this.jwtService.signAsync(
      { ...payload },
      {
        secret: this.configService.get<string>('JWT_ACCESS_SECRET'),
        expiresIn: this.configService.get<StringValue>(
          'JWT_ACCESS_EXPIRY',
          '15m',
        ),
      },
    );

    const refreshToken = await this.jwtService.signAsync(
      { sub: payload.sub, aud: payload.aud },
      {
        secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
        expiresIn: this.configService.get<StringValue>(
          'JWT_REFRESH_EXPIRY',
          '7d',
        ),
      },
    );

    return { accessToken, refreshToken };
  }

  async verifyAccessToken(token: string): Promise<JwtPayload> {
    return this.jwtService.verifyAsync<JwtPayload>(token, {
      secret: this.configService.get<string>('JWT_ACCESS_SECRET'),
    });
  }

  async verifyRefreshToken(token: string): Promise<JwtPayload> {
    return this.jwtService.verifyAsync<JwtPayload>(token, {
      secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
    });
  }
}
