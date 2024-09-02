import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { PrismaService } from 'src/prisma/prisma.service';
import { ConfigService } from '@nestjs/config';
import { EmailService } from 'src/email/email.service';

@Module({
  controllers: [AuthController],
  providers: [AuthService, PrismaService, ConfigService,EmailService],
})
export class AuthModule { }
