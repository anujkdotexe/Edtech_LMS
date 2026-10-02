import { IEmailService, SendEmailOptions } from './email.interface';

export class ConsoleEmailService implements IEmailService {
  async sendEmail(options: SendEmailOptions): Promise<boolean> {
    console.log(`\n\n=== [INFO] EMAIL SERVICE (CONSOLE) ===`);
    console.log(`To: ${options.to}`);
    console.log(`Subject: ${options.subject}`);
    if (options.text) {
      console.log(`Content:\n${options.text}`);
    }
    if (options.html) {
      console.log(`HTML Preview:\n${options.html}`);
    }
    console.log(`======================================\n`);
    return true;
  }
}
