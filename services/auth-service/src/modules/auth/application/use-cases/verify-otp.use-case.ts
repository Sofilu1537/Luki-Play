import {
  Inject,
  Injectable,
  UnauthorizedException,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import { USER_REPOSITORY } from '../../domain/interfaces/user.repository';
import type { UserRepository } from '../../domain/interfaces/user.repository';
import { OTP_SERVICE } from '../../domain/interfaces/otp.service';
import type { OtpService } from '../../domain/interfaces/otp.service';
import { VerifyOtpDto } from '../dto/otp.dto';

@Injectable()
export class VerifyOtpUseCase {
  private readonly logger = new Logger(VerifyOtpUseCase.name);

  constructor(
    @Inject(USER_REPOSITORY) private readonly userRepo: UserRepository,
    @Inject(OTP_SERVICE) private readonly otpService: OtpService,
  ) {}

  async execute(dto: VerifyOtpDto): Promise<{ verified: boolean }> {
    const user = await this.userRepo.findByContractNumber(dto.contractNumber);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const valid = await this.otpService.verify(user.id, dto.code);
    if (!valid) {
      this.logger.warn(`OTP verification failed for user ${user.id}`);
      throw new UnauthorizedException('Invalid or expired OTP');
    }

    this.logger.log(`OTP verified for user ${user.id}`);
    return { verified: true };
  }
}
