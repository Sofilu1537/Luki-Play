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

/** Payload encoded inside a short-lived login challenge token */
export interface LoginChallengePayload {
  sub: string;
  deviceId: string;
  aud: string;
}

export interface TokenService {
  generateTokenPair(payload: JwtPayload): Promise<TokenPair>;
  verifyAccessToken(token: string): Promise<JwtPayload>;
  verifyRefreshToken(token: string): Promise<JwtPayload>;
  /** Generate a short-lived token that proves credentials were validated */
  generateLoginChallenge(payload: LoginChallengePayload): Promise<string>;
  /** Verify and decode a login challenge token */
  verifyLoginChallenge(token: string): Promise<LoginChallengePayload>;
}
