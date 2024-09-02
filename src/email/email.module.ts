import { Module } from '@nestjs/common';
import { MailerModule } from '@nestjs-modules/mailer';
import { EjsAdapter } from '@nestjs-modules/mailer/dist/adapters/ejs.adapter';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { EmailService } from './email.service';

@Module({
  imports: [
    MailerModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => ({
        transport: {
          host: 'smtp.office365.com',
          port: 587,
          secure: false,
          auth: {
            user: configService.get<string>('email_id'),
            pass: configService.get<string>('email_secret'),
          },
          tls: {
            ciphers: 'SSLv3',
          },
        },
        defaults: {
          from: configService.get<string>('email_id'),
        },
        template: {
          dir: process.cwd() + '/src/templates',
          adapter: new EjsAdapter(),
          options: {
            strict: true,
          },
        },
      }),
    }),
  ],
  providers: [EmailService],
  exports: [EmailService],
})
export class EmailModule {}
