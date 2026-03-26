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

  constructor(props: {
    id: string;
    userId: string;
    deviceId: string;
    audience: Audience;
    refreshTokenHash: string;
    expiresAt: Date;
    createdAt: Date;
  }) {
    this.id = props.id;
    this.userId = props.userId;
    this.deviceId = props.deviceId;
    this.audience = props.audience;
    this.refreshTokenHash = props.refreshTokenHash;
    this.expiresAt = props.expiresAt;
    this.createdAt = props.createdAt;
  }

  isExpired(): boolean {
    return new Date() > this.expiresAt;
  }
}
