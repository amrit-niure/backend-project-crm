import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import config from './config/config';
import { EmailModule } from './email/email.module';

@Module({
  imports: [
    AuthModule,
    ConfigModule.forRoot({
      cache: true,
      isGlobal: true,
      load: [config]
    }),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get<string>('at.secret'),
      }),
      global: true,
      inject: [ConfigService],
    }),
    EmailModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule { }
