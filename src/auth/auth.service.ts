import { BadRequestException, ConflictException, Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { SignupDto } from './dto/signup.dto';
import * as bcrypt from 'bcrypt';
import { LoginDto } from './dto/login.dto';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { nanoid } from 'nanoid';
import { EmailService } from 'src/email/email.service';
import { AuthJwtPayload } from 'src/types/auth-jwtPayload';
import { ValidationError } from 'class-validator';

@Injectable()
export class AuthService {
  constructor(
    private prismaService: PrismaService,
    private jwtService: JwtService,
    private configService: ConfigService,
    private mailerService: EmailService,
  ) { }

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
    const hashedPassword = await bcrypt.hash(password, 10);

    const verificationToken = nanoid(64);
    const expiryDate = new Date();
    expiryDate.setHours(expiryDate.getHours() + 24)

    // Create a new user record in the database
    await this.prismaService.user.create({
      data: {
        name: name,
        email: email,
        password: hashedPassword,
        isEmailVerified: false,
        verificationToken: {
          create: {
            token: verificationToken,
            expiryDate: expiryDate
          }
        }
      },
      select: {
        email: true,
        name: true,
      },
    });
    await this.mailerService.sendVerificationEmail(name, email, verificationToken)
    return { message: "Sign up successful! Please check your email to verify your account." };
  }

  async verifyEmail(tokentoVerify: string) {
    const verificationToken = await this.prismaService.verificationToken.findFirst({
      where: {
        token: tokentoVerify,  // Directly match the token
        expiryDate: { gt: new Date() },  // Check if the expiry date is in the future
      },
    });


    if (!verificationToken) throw new BadRequestException('Verification link is invalid or has expired.');

    const user = await this.prismaService.user.update({
      where: {
        id: verificationToken.userId,
      },
      data: {
        isEmailVerified: true
      },
    });

    await this.prismaService.verificationToken.delete({
      where: {
        id: verificationToken.id
      }
    });

    return { Name: user.name, Email: user.email, message: 'Email has been verified succesfully. You can now Log in.' };

  }


  async login(userId: string) {
    //validation of this user is done by the local.strategy > validate > validateUser
    const tokens = await this.generateuserTokens(userId)
    return {
      ...tokens,
      userId: userId,
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
      // dont tell user that user with this email is not found, rather give more generic response. 
      throw new UnauthorizedException('Wrong Credentials');
    }

    if (!user.isEmailVerified) {
      throw new UnauthorizedException('Please verify your email before logging in.');
    }

    const passwordMatch = await bcrypt.compare(password, user.password)
    if (!passwordMatch) {
      throw new UnauthorizedException('Wrong Credentials');
    }
    return {
      userId: user.id,
    };
  }


  async changePassword(userId: string, oldPassword: string, newPassword: string) {

    const user = await this.prismaService.user.findUnique({
      where: {
        id: userId,
      },
    });

    if (!user) throw new NotFoundException("User not found!");

    const passwordMatch = await bcrypt.compare(oldPassword, user.password);
    if (!passwordMatch) {
      throw new UnauthorizedException('Wrong Credentials');
    }

    if (await bcrypt.compare(newPassword, user.password)) {
      throw new ConflictException('New password should not be the same as the old password');
    }

    const newHashedPassword = await bcrypt.hash(newPassword, 10);

    await this.prismaService.user.update({
      where: {
        id: userId,
      },
      data: {
        password: newHashedPassword,
      },
    });
  }


  async forgetPassword(email: string) {

    const user = await this.prismaService.user.findUnique({
      where: {
        email: email,
      },
    });

    if (user) {
      const expiryDate = new Date();
      expiryDate.setHours(expiryDate.getHours() + 1)

      const resetToken = nanoid(64);
      await this.prismaService.resetToken.create({
        data: {
          token: resetToken,
          userId: user.id,
          expiryDate,
        }
      })
      this.mailerService.sendResetPasswordEmail(email, resetToken)
    }

    return { "message": 'If this user exists, they will receive an reset password link in their email.' }
  }


  async resetPassword(newPassword: string, resetToken: string) {

    const token = await this.prismaService.resetToken.findFirst({
      where: {
        AND: [
          { token: resetToken },
          { expiryDate: { gt: new Date() } }
        ]
      }
    });

    if (!token) {
      throw new UnauthorizedException("Reset Link is invalid or has expired");
    }

    const user = await this.prismaService.user.findUnique({
      where: {
        id: token.userId,
      },
    });

    if (!user) throw new NotFoundException("User not found!");


    const hashedPassword = await bcrypt.hash(newPassword, 10);

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

    return { message: "Password has been reset successfully." };
  }

  async refreshTokens(refreshToken: string, userId: string) {
    const token = await this.prismaService.refreshToken.findFirst({
      where: {
        AND: [
          { refreshToken: refreshToken },
          { userId: userId },
          { expiryDate: { gt: new Date() } }
        ]
      }
    });

    if (!token) {
      throw new UnauthorizedException("Refresh token is invalid or has expired");
    }

    await this.prismaService.refreshToken.delete({
      where: {
        id: token.id,
      },
    });

    // Generate new user tokens
    return this.generateuserTokens(token.userId);

  }


  async generateuserTokens(userId: string) {
    const payload: AuthJwtPayload = {
      sub: userId
    }
    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync({ payload }, { // it uses the global secret for jwt form config folder and rt secret for refresh token
        expiresIn: '1h',
      }),
      this.jwtService.signAsync({ payload }, {
        secret: this.configService.get<string>('rt.secret'),
        expiresIn: '7d',
      }),
    ]);
    await this.storeRefreshToken(refreshToken, userId)
    return {
      access_token: accessToken,
      refresh_token: refreshToken,
    };
  }

  async storeRefreshToken(refreshToken: string, userId: string) {
    // Calculate the expiry date based on the '7d' duration
    const expiryDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days from now

    // Use the upsert method to create the refreshtoken if it is not already created.
    await this.prismaService.refreshToken.upsert({
      where: { userId }, // Unique identifier for the token record
      update: {
        refreshToken,
        expiryDate,
      },
      create: {
        refreshToken,
        expiryDate,
        userId,
      },
    });
  }
}
