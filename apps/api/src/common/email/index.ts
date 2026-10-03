import { IEmailService } from './email.interface';
import { ConsoleEmailService } from './console.email';
import { SmtpEmailService } from './smtp.email';

export * from './email.interface';
export * from './console.email';
export * from './smtp.email';

function createEmailService(): IEmailService {
  const driver = (process.env.EMAIL_DRIVER || '').toLowerCase();
  if (driver === 'smtp' || process.env.SMTP_HOST) {
    return new SmtpEmailService();
  }
  return new ConsoleEmailService();
}

export const emailService = createEmailService();

