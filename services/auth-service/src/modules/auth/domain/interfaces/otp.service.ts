export const OTP_SERVICE = Symbol('OTP_SERVICE');

export interface OtpService {
  /** Generate and send an OTP to the user's email */
  generateAndSend(userId: string, email: string): Promise<void>;
  /** Verify an OTP code for a given user */
  verify(userId: string, code: string): Promise<boolean>;
}
