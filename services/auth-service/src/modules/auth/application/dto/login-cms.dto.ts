import { IsEmail, IsNotEmpty, IsString, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class LoginCmsDto {
  @ApiProperty({ example: 'admin@lukiplay.com', description: 'CMS user email' })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({ example: 'securePass123', description: 'User password' })
  @IsString()
  @MinLength(6)
  password: string;

  @ApiProperty({ example: 'cms-browser-xyz', description: 'Unique device identifier' })
  @IsString()
  @IsNotEmpty()
  deviceId: string;
}
