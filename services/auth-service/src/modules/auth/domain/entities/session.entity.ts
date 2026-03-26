export enum Audience {
  APP = 'app',
  CMS = 'cms',
}

export class Session {
  readonly id: string;
  readonly userId: string;
  readonly deviceId: string;
  readonly audience: Audience;
  refreshTokenHash: string;
  readonly expiresAt: Date;
  readonly createdAt: Date;
  revokedAt: Date | null;

  constructor(props: {
    id: string;
    userId: string;
    deviceId: string;
    audience: Audience;
    refreshTokenHash: string;
    expiresAt: Date;
    createdAt: Date;
    revokedAt?: Date | null;
  }) {
    this.id = props.id;
    this.userId = props.userId;
    this.deviceId = props.deviceId;
    this.audience = props.audience;
    this.refreshTokenHash = props.refreshTokenHash;
    this.expiresAt = props.expiresAt;
    this.createdAt = props.createdAt;
    this.revokedAt = props.revokedAt ?? null;
  }

  isExpired(): boolean {
    return new Date() > this.expiresAt;
  }

  isRevoked(): boolean {
    return this.revokedAt !== null;
  }
}
