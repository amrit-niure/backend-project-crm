import { Injectable } from '@nestjs/common';
import { MailerService } from '@nestjs-modules/mailer';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class EmailService {
  constructor(
    private readonly mailerService: MailerService,
    private readonly configService: ConfigService,
  ) {}

  async sendResetPasswordEmail(to: string, token: string): Promise<void> {
    try {
      const context = {
        name: 'Amrit Niure',
        resetLink: `${this.configService.get<string>('frontend_url')}/auth/reset-password?token=${token}`,
      };
      await this.mailerService.sendMail({
        to: to,
        subject: 'Reset Password Link',
        template: 'reset-password',
        context: context,
      });
      console.log(`Reset password email sent to ${to}`);
    } catch (error) {
      console.error('Error sending reset password email:', error);
      throw error;
    }
  }

  async sendVerificationEmail(name: string, email: string, code: number) {
    await this.mailerService.sendMail({
      to: email,
      subject: 'Verify Your Email',
      template: 'verify-email',
      context: {
        name,
        code,
      },
    });
  }
}
