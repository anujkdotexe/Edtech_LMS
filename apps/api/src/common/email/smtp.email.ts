import nodemailer, { Transporter } from 'nodemailer';
import { IEmailService, SendEmailOptions } from './email.interface';

export class SmtpEmailService implements IEmailService {
  private transporter: Transporter | null = null;
  private fromAddress: string;


  constructor() {
    const host = process.env.SMTP_HOST;
    const port = parseInt(process.env.SMTP_PORT || '587', 10);
    const user = process.env.SMTP_USER;
    const pass = process.env.SMTP_PASS;
    const secure = process.env.SMTP_SECURE === 'true' || port === 465;
    this.fromAddress = process.env.SMTP_FROM || 'Antigravity LMS <noreply@lms.local>';

    if (host && user && pass) {
      this.transporter = nodemailer.createTransport({
        host,
        port,
        secure,
        auth: { user, pass },
      });
    }
  }

  async sendEmail(options: SendEmailOptions): Promise<boolean> {
    if (!this.transporter) {
      console.warn('[WARN] SMTP credentials not fully configured. Falling back to console trace.');
      console.log(`[INFO] EMAIL (SMTP Fallback) -> To: ${options.to} | Subject: ${options.subject}`);
      return false;
    }

    try {
      await this.transporter.sendMail({
        from: this.fromAddress,
        to: options.to,
        subject: options.subject,
        text: options.text,
        html: options.html,
      });
      console.log(`[OK] Email delivered via SMTP to ${options.to}`);
      return true;
    } catch (err: any) {
      console.error(`[ERROR] Failed to send email via SMTP: ${err?.message || err}`);
      return false;
    }
  }
}
