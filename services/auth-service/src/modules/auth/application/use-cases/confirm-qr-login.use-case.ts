import { Injectable, Logger } from '@nestjs/common';

/**
 * Placeholder for QR login confirmation.
 * Will be used to confirm authentication via QR code scan.
 */
@Injectable()
export class ConfirmQrLoginUseCase {
  private readonly logger = new Logger(ConfirmQrLoginUseCase.name);

  async execute(_qrToken: string, _userId: string): Promise<{ confirmed: boolean }> {
    this.logger.log('QR login confirm - placeholder');
    return { confirmed: false };
  }
}
