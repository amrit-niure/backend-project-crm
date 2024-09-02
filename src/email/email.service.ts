import { Injectable } from '@nestjs/common';
import { MailerService } from '@nestjs-modules/mailer';

@Injectable()
export class EmailService {
  constructor(private readonly mailerService: MailerService) { }

  async sendResetPasswordEmail(to: string, token: string): Promise<void> {
    try {
      const context = {
        name: 'Amrit Niure',
        resetLink: `https://amritniure.com.np`, // Replace with frontend URL
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
      throw error; // Rethrow or handle the error as needed
    }
  }



  async sendVerificationEmail(name: string, email: string, token: string) {
    const verificationUrl = `http://your-app.com/verify-email?token=${token}`; // Replace with frontend URL

    await this.mailerService.sendMail({
      to: email,
      subject: 'Verify Your Email',
      template: 'verify-email',
      context: {
        name,
        verificationUrl,
      },
    });
  }

}


