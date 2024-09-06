import { Module } from '@nestjs/common';
import { UserService } from './user.service';
import { UserController } from './user.controller';
import { PrismaService } from 'src/prisma/prisma.service';
import { ConfigService } from '@nestjs/config';
import { AuthService } from 'src/auth/auth.service';
import { EmailService } from 'src/email/email.service';

@Module({
  controllers: [UserController],
  providers: [
    AuthService,
    EmailService,
    UserService,
    PrismaService,
    ConfigService,
  ],
})
export class UserModule {}
