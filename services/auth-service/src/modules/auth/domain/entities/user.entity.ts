export enum UserRole {
  SUPERADMIN = 'superadmin',
  SOPORTE = 'soporte',
  CLIENTE = 'cliente',
}

export enum UserStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  SUSPENDED = 'suspended',
}

export class User {
  readonly id: string;
  readonly contractNumber: string | null;
  readonly email: string;
  passwordHash: string;
  readonly role: UserRole;
  status: UserStatus;
  readonly accountId: string | null;
  readonly createdAt: Date;

  constructor(props: {
    id: string;
    contractNumber: string | null;
    email: string;
    passwordHash: string;
    role: UserRole;
    status: UserStatus;
    accountId: string | null;
    createdAt: Date;
  }) {
    this.id = props.id;
    this.contractNumber = props.contractNumber;
    this.email = props.email;
    this.passwordHash = props.passwordHash;
    this.role = props.role;
    this.status = props.status;
    this.accountId = props.accountId;
    this.createdAt = props.createdAt;
  }

  isActive(): boolean {
    return this.status === UserStatus.ACTIVE;
  }

  isClient(): boolean {
    return this.role === UserRole.CLIENTE;
  }

  isCmsUser(): boolean {
    return this.role === UserRole.SUPERADMIN || this.role === UserRole.SOPORTE;
  }
}
