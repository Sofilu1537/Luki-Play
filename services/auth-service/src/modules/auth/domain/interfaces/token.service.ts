export const TOKEN_SERVICE = Symbol('TOKEN_SERVICE');

export interface JwtPayload {
  sub: string;
  role: string;
  permissions: string[];
  aud: string;
  accountId: string | null;
  entitlements: string[];
}

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

export interface TokenService {
  generateTokenPair(payload: JwtPayload): Promise<TokenPair>;
  verifyAccessToken(token: string): Promise<JwtPayload>;
  verifyRefreshToken(token: string): Promise<JwtPayload>;
}
