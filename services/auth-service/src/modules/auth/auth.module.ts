import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigModule, ConfigService } from '@nestjs/config';

// Domain interfaces
import { USER_REPOSITORY } from './domain/interfaces/user.repository';
import { SESSION_REPOSITORY } from './domain/interfaces/session.repository';
import { TOKEN_SERVICE } from './domain/interfaces/token.service';
import { HASH_SERVICE } from './domain/interfaces/hash.service';

// Infrastructure
import { InMemoryUserRepository } from './infrastructure/repositories/in-memory-user.repository';
import { InMemorySessionRepository } from './infrastructure/repositories/in-memory-session.repository';
import { JwtTokenService } from './infrastructure/jwt/jwt-token.service';
import { JwtStrategy } from './infrastructure/jwt/jwt.strategy';
import { BcryptHashService } from './infrastructure/persistence/bcrypt-hash.service';

// Use Cases
import { LoginAppUseCase } from './application/use-cases/login-app.use-case';
import { LoginCmsUseCase } from './application/use-cases/login-cms.use-case';
import { RefreshTokenUseCase } from './application/use-cases/refresh-token.use-case';
import { LogoutUseCase } from './application/use-cases/logout.use-case';
import { GetCurrentUserUseCase } from './application/use-cases/get-current-user.use-case';
import { ChangePasswordUseCase } from './application/use-cases/change-password.use-case';
import { ListActiveSessionsUseCase } from './application/use-cases/list-active-sessions.use-case';
import { RevokeSessionUseCase } from './application/use-cases/revoke-session.use-case';
import { InitQrLoginUseCase } from './application/use-cases/init-qr-login.use-case';
import { ConfirmQrLoginUseCase } from './application/use-cases/confirm-qr-login.use-case';

// Presentation
import { AuthController } from './presentation/controllers/auth.controller';

// External modules
import { BillingModule } from '../billing/billing.module';
import { CrmModule } from '../crm/crm.module';

@Module({
  imports: [
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_ACCESS_SECRET', 'dev-access-secret'),
        signOptions: {
          expiresIn: configService.get<string>('JWT_ACCESS_EXPIRY', '15m'),
        },
      }),
    }),
    BillingModule,
    CrmModule,
  ],
  controllers: [AuthController],
  providers: [
    // Infrastructure bindings
    { provide: USER_REPOSITORY, useClass: InMemoryUserRepository },
    { provide: SESSION_REPOSITORY, useClass: InMemorySessionRepository },
    { provide: TOKEN_SERVICE, useClass: JwtTokenService },
    { provide: HASH_SERVICE, useClass: BcryptHashService },
    JwtStrategy,

    // Use Cases
    LoginAppUseCase,
    LoginCmsUseCase,
    RefreshTokenUseCase,
    LogoutUseCase,
    GetCurrentUserUseCase,
    ChangePasswordUseCase,
    ListActiveSessionsUseCase,
    RevokeSessionUseCase,
    InitQrLoginUseCase,
    ConfirmQrLoginUseCase,
  ],
  exports: [TOKEN_SERVICE, HASH_SERVICE, USER_REPOSITORY],
})
export class AuthModule {}
