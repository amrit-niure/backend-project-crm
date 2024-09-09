import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { SignupDto } from './dto/signup.dto';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { nanoid } from 'nanoid';
import { EmailService } from 'src/email/email.service';
import { JwtPayload, Tokens } from './types';
import { Currentuser } from './types/current-user.types';
import * as argon from 'argon2';
import { User } from '@prisma/client';
import { generateVerificationCode } from 'src/lib/utils/generateVerificationCode';

const EXPIRY_TIME = 20 * 1000;

@Injectable()
export class AuthService {
  constructor(
    private prismaService: PrismaService,
    private jwtService: JwtService,
    private configService: ConfigService,
    private mailerService: EmailService,
  ) {}

  async signup(signupData: SignupDto) {
    const { email, password, name } = signupData;

    // Check if email is already in use
    const emailInUse = await this.prismaService.user.findUnique({
      where: {
        email: email,
      },
    });

    if (emailInUse) {
      throw new BadRequestException('Email is already in use');
    }

    // Hash the password
    const hashedPassword = await argon.hash(password);

    const verificationCode = generateVerificationCode();
    const expiryDate = new Date();
    expiryDate.setHours(expiryDate.getHours() + 1);

    // Create a new user record in the database
    await this.prismaService.user.create({
      data: {
        name: name,
        email: email,
        password: hashedPassword,
        isEmailVerified: false,
        verificationCode: {
          create: {
            code: verificationCode,
            expiryDate: expiryDate,
          },
        },
      },
      select: {
        email: true,
        name: true,
      },
    });
    await this.mailerService.sendVerificationEmail(
      name,
      email,
      verificationCode,
    );
    return {
      message:
        'Sign up successful! Please use the verification code on sent on your email to verify your account.',
    };
  }

  async verifyEmail(verificationCode: number) {
    const verification = await this.prismaService.verificationCode.findFirst({
      where: {
        code: verificationCode,
        expiryDate: { gt: new Date() },
      },
    });

    if (!verification)
      throw new BadRequestException(
        'Verification code is invalid or has expired.',
      );

    const user = await this.prismaService.user.update({
      where: {
        id: verification.userId,
      },
      data: {
        isEmailVerified: true,
      },
    });

    await this.prismaService.verificationCode.delete({
      where: {
        id: verification.id,
      },
    });

    return {
      Name: user.name,
      Email: user.email,
      message: 'Email has been verified succesfully. You can now Log in.',
    };
  }

  async login(user: User) {
    //validation of this user is done by the local.strategy > validate > validateUser
    const tokens = await this.generateuserTokens(user.id);
    return {
      tokens,
      user,
    };
  }

  //passport js
  async validateUser(email: string, password: string) {
    const user = await this.prismaService.user.findUnique({
      where: {
        email: email,
      },
    });

    if (!user) {
      // Give a generic response to avoid revealing if the email exists or not
      throw new UnauthorizedException('Wrong Credentials');
    }

    if (!user.isEmailVerified) {
      throw new UnauthorizedException(
        'Please verify your email before logging in.',
      );
    }

    const passwordMatch = await argon.verify(user.password, password);
    if (!passwordMatch) {
      throw new UnauthorizedException('Wrong Credentials');
    }
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password: pwd, isEmailVerified, ...rest } = user;

    return rest;
  }

  async changePassword(
    userId: string,
    oldPassword: string,
    newPassword: string,
  ) {
    const user = await this.prismaService.user.findUnique({
      where: {
        id: userId,
      },
    });

    if (!user) throw new NotFoundException('User not found!');

    const passwordMatch = await argon.verify(user.password, oldPassword);
    if (!passwordMatch) {
      throw new UnauthorizedException('Wrong Credentials');
    }

    if (await argon.verify(user.password, newPassword)) {
      throw new ConflictException(
        'New password should not be the same as the old password',
      );
    }

    const newHashedPassword = await argon.hash(newPassword);

    await this.prismaService.user.update({
      where: {
        id: userId,
      },
      data: {
        password: newHashedPassword,
      },
    });

    return { success: 'Password Updated Succesfully.' };
  }

  async forgetPassword(email: string) {
    const user = await this.prismaService.user.findUnique({
      where: {
        email: email,
      },
    });

    if (user) {
      const existingToken = await this.prismaService.resetToken.findFirst({
        where: {
          userId: user.id,
        },
      });

      if (existingToken) {
        if (existingToken.expiryDate > new Date()) {
          // Token is still valid; don't create a new one
          return { message: 'Reset token has already been sent!' };
        } else {
          // Token is expired; delete it
          await this.prismaService.resetToken.delete({
            where: {
              id: existingToken.id,
            },
          });
        }
      }

      const expiryDate = new Date();
      expiryDate.setHours(expiryDate.getHours() + 1);

      const resetToken = nanoid(64);
      await this.prismaService.resetToken.create({
        data: {
          token: resetToken,
          userId: user.id,
          expiryDate,
        },
      });

      // Send the reset email
      this.mailerService.sendResetPasswordEmail(email, resetToken);
    }
    return {
      message:
        'If this user exists, they will receive an reset password link in their email.',
    };
  }

  async resetPassword(newPassword: string, resetToken: string) {
    const token = await this.prismaService.resetToken.findFirst({
      where: {
        AND: [{ token: resetToken }, { expiryDate: { gt: new Date() } }],
      },
    });

    if (!token) {
      throw new UnauthorizedException('Reset Link is invalid or has expired');
    }

    const user = await this.prismaService.user.findUnique({
      where: {
        id: token.userId,
      },
    });

    if (!user) throw new NotFoundException('User not found!');

    const hashedPassword = await argon.hash(newPassword);

    await this.prismaService.user.update({
      where: {
        id: user.id,
      },
      data: {
        password: hashedPassword,
      },
    });

    await this.prismaService.resetToken.delete({
      where: {
        id: token.id,
      },
    });

    return { message: 'Password has been reset successfully.' };
  }

  async refreshTokens(hahsedRt: string, userId: string) {
    const token = await this.prismaService.refreshToken.findFirst({
      where: {
        AND: [
          { refreshToken: hahsedRt },
          { userId: userId },
          { expiryDate: { gt: new Date() } },
        ],
      },
    });

    if (!token) {
      throw new UnauthorizedException(
        'Refresh token is invalid or has expired',
      );
    }

    await this.prismaService.refreshToken.delete({
      where: {
        userId: userId,
        refreshToken: hahsedRt,
      },
    });
    const tokens: Tokens = await this.generateuserTokens(userId);
    return {
      ...tokens,
      userId,
    };
  }

  async validateJwtUser(userId: string) {
    const user = await this.prismaService.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
      },
    });

    if (!user) {
      throw new UnauthorizedException('User not found');
    }
    const currentUser: Currentuser = {
      sub: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
    };
    return currentUser;
  }

  async generateuserTokens(userId: string) {
    const payload: JwtPayload = {
      sub: userId,
    };
    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload, {
        expiresIn: '20s',
      }),
      this.jwtService.signAsync(payload, {
        secret: this.configService.get<string>('rt.secret'),
        expiresIn: '7d',
      }),
    ]);
    await this.storeRefreshToken(refreshToken, userId);
    return {
      access_token: accessToken,
      refresh_token: refreshToken,
      expiresIn: new Date().setTime(new Date().getTime() + EXPIRY_TIME),
    };
  }

  async storeRefreshToken(refreshToken: string, userId: string) {
    // Calculate the expiry date based on the '7d' duration
    const expiryDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days from now
    const hashedRt = await argon.hash(refreshToken);
    // Use the upsert method to create the refreshtoken if it is not already created.
    await this.prismaService.refreshToken.upsert({
      where: { userId }, // Unique identifier for the token record
      update: {
        refreshToken: hashedRt,
        expiryDate,
      },
      create: {
        refreshToken: hashedRt,
        expiryDate,
        userId,
      },
    });
  }

  async validateRefreshToken(userId: string, refreshToken: string) {
    const user = await this.prismaService.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        hashedRt: true,
      },
    });

    if (!user || !user.hashedRt) {
      throw new UnauthorizedException('Invalid Refresh Token');
    }

    const refreshTokenMatches = await argon.verify(
      user.hashedRt.refreshToken,
      refreshToken,
    );

    if (!refreshTokenMatches)
      throw new UnauthorizedException('Inavlid Refresh Token');

    return { userId, hashedRt: user.hashedRt.refreshToken };
  }

  async logOut(userId: string) {
    await this.prismaService.refreshToken.delete({
      where: {
        userId: userId,
      },
    });
    return { message: 'signed out' };
  }
}
