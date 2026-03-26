import {
  Controller,
  Post,
  Get,
  Delete,
  Body,
  Param,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
} from '@nestjs/swagger';
import { LoginAppUseCase } from '../../application/use-cases/login-app.use-case';
import { LoginCmsUseCase } from '../../application/use-cases/login-cms.use-case';
import { RefreshTokenUseCase } from '../../application/use-cases/refresh-token.use-case';
import { LogoutUseCase } from '../../application/use-cases/logout.use-case';
import { GetCurrentUserUseCase } from '../../application/use-cases/get-current-user.use-case';
import { ChangePasswordUseCase } from '../../application/use-cases/change-password.use-case';
import { ListActiveSessionsUseCase } from '../../application/use-cases/list-active-sessions.use-case';
import { RevokeSessionUseCase } from '../../application/use-cases/revoke-session.use-case';
import { RequestOtpUseCase } from '../../application/use-cases/request-otp.use-case';
import { VerifyOtpUseCase } from '../../application/use-cases/verify-otp.use-case';
import { LoginAppDto } from '../../application/dto/login-app.dto';
import { LoginCmsDto } from '../../application/dto/login-cms.dto';
import { RefreshTokenDto } from '../../application/dto/refresh-token.dto';
import { ChangePasswordDto } from '../../application/dto/change-password.dto';
import { RequestOtpDto, VerifyOtpDto } from '../../application/dto/otp.dto';
import {
  AuthTokensResponse,
  UserProfileResponse,
  SessionResponse,
  MessageResponse,
} from '../../application/dto/auth-response.dto';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { CurrentUser } from '../decorators/current-user.decorator';
import type { JwtPayload } from '../../domain/interfaces/token.service';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly loginAppUseCase: LoginAppUseCase,
    private readonly loginCmsUseCase: LoginCmsUseCase,
    private readonly refreshTokenUseCase: RefreshTokenUseCase,
    private readonly logoutUseCase: LogoutUseCase,
    private readonly getCurrentUserUseCase: GetCurrentUserUseCase,
    private readonly changePasswordUseCase: ChangePasswordUseCase,
    private readonly listActiveSessionsUseCase: ListActiveSessionsUseCase,
    private readonly revokeSessionUseCase: RevokeSessionUseCase,
    private readonly requestOtpUseCase: RequestOtpUseCase,
    private readonly verifyOtpUseCase: VerifyOtpUseCase,
  ) {}

  @Post('app/login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Login for APP clients using contract number' })
  @ApiResponse({ status: 200, type: AuthTokensResponse })
  @ApiResponse({ status: 401, description: 'Invalid credentials' })
  async loginApp(@Body() dto: LoginAppDto): Promise<AuthTokensResponse> {
    return this.loginAppUseCase.execute(dto);
  }

  @Post('cms/login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Login for CMS users (superadmin, soporte)' })
  @ApiResponse({ status: 200, type: AuthTokensResponse })
  @ApiResponse({ status: 401, description: 'Invalid credentials' })
  async loginCms(@Body() dto: LoginCmsDto): Promise<AuthTokensResponse> {
    return this.loginCmsUseCase.execute(dto);
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Refresh access token using refresh token (rotation)',
  })
  @ApiResponse({ status: 200, type: AuthTokensResponse })
  @ApiResponse({ status: 401, description: 'Invalid refresh token' })
  async refresh(@Body() dto: RefreshTokenDto): Promise<AuthTokensResponse> {
    return this.refreshTokenUseCase.execute(dto.refreshToken);
  }

  @Post('logout')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Logout and revoke current session' })
  @ApiResponse({ status: 200, type: MessageResponse })
  async logout(
    @CurrentUser() user: JwtPayload,
    @Body() dto: RefreshTokenDto,
  ): Promise<MessageResponse> {
    await this.logoutUseCase.execute(user.sub, dto.refreshToken);
    return { message: 'Logged out successfully' };
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current authenticated user profile' })
  @ApiResponse({ status: 200, type: UserProfileResponse })
  async me(@CurrentUser() user: JwtPayload): Promise<UserProfileResponse> {
    return this.getCurrentUserUseCase.execute(user.sub);
  }

  @Post('change-password')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Change current user password' })
  @ApiResponse({ status: 200, type: MessageResponse })
  async changePassword(
    @CurrentUser() user: JwtPayload,
    @Body() dto: ChangePasswordDto,
  ): Promise<MessageResponse> {
    await this.changePasswordUseCase.execute(user.sub, dto);
    return { message: 'Password changed successfully' };
  }

  @Get('sessions')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'List active sessions for current user' })
  @ApiResponse({ status: 200, type: [SessionResponse] })
  async sessions(@CurrentUser() user: JwtPayload): Promise<SessionResponse[]> {
    return this.listActiveSessionsUseCase.execute(user.sub);
  }

  @Delete('sessions/:id')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Revoke a specific session' })
  @ApiResponse({ status: 200, type: MessageResponse })
  async revokeSession(
    @CurrentUser() user: JwtPayload,
    @Param('id') sessionId: string,
  ): Promise<MessageResponse> {
    await this.revokeSessionUseCase.execute(user.sub, sessionId);
    return { message: 'Session revoked successfully' };
  }

  @Post('otp/request')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Request OTP code sent via email' })
  @ApiResponse({ status: 200, type: MessageResponse })
  @ApiResponse({ status: 404, description: 'User not found' })
  async requestOtp(@Body() dto: RequestOtpDto): Promise<MessageResponse> {
    return this.requestOtpUseCase.execute(dto);
  }

  @Post('otp/verify')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Verify OTP code' })
  @ApiResponse({ status: 200 })
  @ApiResponse({ status: 401, description: 'Invalid or expired OTP' })
  async verifyOtp(@Body() dto: VerifyOtpDto): Promise<{ verified: boolean }> {
    return this.verifyOtpUseCase.execute(dto);
  }
}
