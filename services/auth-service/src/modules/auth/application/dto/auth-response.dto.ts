import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class LoginChallengeResponse {
  @ApiProperty({
    description: 'Whether OTP verification is required to complete login',
  })
  otpRequired: boolean;

  @ApiProperty({
    description: 'Short-lived token proving credentials were validated',
  })
  loginToken: string;

  @ApiProperty({ description: 'Message indicating OTP was sent' })
  message: string;

  @ApiProperty({ description: 'Whether the user can access OTT content' })
  canAccessOtt: boolean;

  @ApiPropertyOptional({
    description: 'Restriction message if OTT access is blocked',
  })
  restrictionMessage: string | null;
}

export class AuthTokensResponse {
  @ApiProperty()
  accessToken: string;

  @ApiProperty()
  refreshToken: string;

  @ApiProperty({ description: 'Whether the user can access OTT content' })
  canAccessOtt: boolean;

  @ApiPropertyOptional({
    description: 'Restriction message if OTT access is blocked',
  })
  restrictionMessage: string | null;
}

export class UserProfileResponse {
  @ApiProperty()
  id: string;

  @ApiPropertyOptional()
  contractNumber: string | null;

  @ApiProperty()
  email: string;

  @ApiProperty()
  role: string;

  @ApiProperty()
  status: string;

  @ApiPropertyOptional()
  accountId: string | null;

  @ApiPropertyOptional()
  contractType: string | null;

  @ApiPropertyOptional()
  serviceStatus: string | null;

  @ApiProperty()
  canAccessOtt: boolean;

  @ApiPropertyOptional()
  restrictionMessage: string | null;

  @ApiProperty({ type: [String] })
  permissions: string[];

  @ApiPropertyOptional({ type: [String] })
  entitlements: string[];
}

export class SessionResponse {
  @ApiProperty()
  id: string;

  @ApiProperty()
  deviceId: string;

  @ApiProperty()
  audience: string;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  expiresAt: Date;
}

export class MessageResponse {
  @ApiProperty()
  message: string;
}
