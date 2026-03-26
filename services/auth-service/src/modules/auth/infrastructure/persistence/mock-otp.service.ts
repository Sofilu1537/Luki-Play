import { Injectable, Logger } from '@nestjs/common';
import { OtpService } from '../../domain/interfaces/otp.service';

/**
 * In-memory OTP service for development/testing.
 * Replace with real email-based OTP service for production.
 *
 * Mock behavior:
 * - Generates a fixed OTP code "123456" for any user
 * - Accepts "123456" as valid OTP code
 * - OTP expires after 5 minutes (tracked in memory)
 */
@Injectable()
export class MockOtpService implements OtpService {
  private readonly logger = new Logger(MockOtpService.name);
  private readonly otpStore: Map<string, { code: string; expiresAt: Date }> =
    new Map();

  private readonly OTP_TTL_MS = 5 * 60 * 1000; // 5 minutes
  private readonly MOCK_CODE = '123456';

  async generateAndSend(userId: string, email: string): Promise<void> {
    const expiresAt = new Date(Date.now() + this.OTP_TTL_MS);
    this.otpStore.set(userId, { code: this.MOCK_CODE, expiresAt });
    this.logger.log(
      `[MOCK] OTP ${this.MOCK_CODE} sent to ${email} for user ${userId} (expires: ${expiresAt.toISOString()})`,
    );
    return Promise.resolve();
  }

  async verify(userId: string, code: string): Promise<boolean> {
    const entry = this.otpStore.get(userId);
    if (!entry) {
      this.logger.warn(`[MOCK] OTP not found for user ${userId}`);
      return Promise.resolve(false);
    }

    if (new Date() > entry.expiresAt) {
      this.otpStore.delete(userId);
      this.logger.warn(`[MOCK] OTP expired for user ${userId}`);
      return Promise.resolve(false);
    }

    if (entry.code !== code) {
      this.logger.warn(`[MOCK] OTP mismatch for user ${userId}`);
      return Promise.resolve(false);
    }

    // OTP is single-use
    this.otpStore.delete(userId);
    this.logger.log(`[MOCK] OTP verified for user ${userId}`);
    return Promise.resolve(true);
  }
}
