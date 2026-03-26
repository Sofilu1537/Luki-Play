import { Injectable, Logger } from '@nestjs/common';

/**
 * Placeholder for QR login initialization.
 * Will generate a QR code token for cross-device authentication.
 */
@Injectable()
export class InitQrLoginUseCase {
  private readonly logger = new Logger(InitQrLoginUseCase.name);

  async execute(): Promise<{ qrToken: string; expiresIn: number }> {
    this.logger.log('QR login init - placeholder');
    return {
      qrToken: 'qr-placeholder-token',
      expiresIn: 300,
    };
  }
}
