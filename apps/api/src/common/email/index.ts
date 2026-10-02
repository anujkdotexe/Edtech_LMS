import { IEmailService } from './email.interface';
import { ConsoleEmailService } from './console.email';

export * from './email.interface';
export * from './console.email';

function createEmailService(): IEmailService {
  return new ConsoleEmailService();
}

export const emailService = createEmailService();
