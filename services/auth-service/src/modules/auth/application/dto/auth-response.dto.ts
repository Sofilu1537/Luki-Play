import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class AuthTokensResponse {
  @ApiProperty()
  accessToken: string;

  @ApiProperty()
  refreshToken: string;
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
