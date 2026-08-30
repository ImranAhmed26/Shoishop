import { Injectable, Logger } from '@nestjs/common';

// No transactional email provider is wired up yet (SendGrid/Resend/SES).
// Until one is configured, reset links are logged so the flow is testable end-to-end.
@Injectable()
export class MailerService {
  private readonly logger = new Logger(MailerService.name);

  async sendPasswordResetEmail(to: string, resetLink: string): Promise<void> {
    this.logger.log(`Password reset link for ${to}: ${resetLink}`);
  }
}
