import { IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RequestOtpDto {
  @ApiProperty({
    example: 'CONTRACT-001',
    description: 'Contract number of the user',
  })
  @IsString()
  @IsNotEmpty()
  contractNumber: string;
}

export class VerifyOtpDto {
  @ApiProperty({
    example: 'CONTRACT-001',
    description: 'Contract number of the user',
  })
  @IsString()
  @IsNotEmpty()
  contractNumber: string;

  @ApiProperty({
    example: '123456',
    description: 'OTP code received via email',
  })
  @IsString()
  @IsNotEmpty()
  code: string;
}
