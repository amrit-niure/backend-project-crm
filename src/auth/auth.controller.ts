import { Controller, Get, Post, Body, Patch, Param, Delete, Put, UseGuards, Req, Query } from '@nestjs/common';
import { AuthService } from './auth.service';
import { SignupDto } from './dto/signup.dto';
import { LoginDto } from './dto/login.dto';
import { RefreshTokenDto } from './dto/refreshTokens.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { AuthGuard } from 'src/guards/auth.guard';
import { ForgetPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) { }

  @Post('signup')
  async signup(@Body() signupData: SignupDto) {
    return this.authService.signup(signupData)
  }
  @Get('verify-email')
  async verifyEmail(@Query('token') token: string) {
    return this.authService.verifyEmail(token)
  }

  @Post('login')
  async login(@Body() credentials: LoginDto) {
    return this.authService.login(credentials)
  }

  @Post('refresh')
  async refreshTokens(@Body() refreshTokenDto: RefreshTokenDto) {
    return this.authService.refreshTokens(refreshTokenDto.refreshToken, refreshTokenDto.userId)
  }

  @UseGuards(AuthGuard)
  @Put('change-password')
  async changePassword(@Body() changePassWordDto: ChangePasswordDto, @Req() req) {
    return this.authService.changePassword(
      req.userId,
      changePassWordDto.oldPassword,
      changePassWordDto.newPassword
    );
  }

  @Post('forgot-password')
  async forgetPassword(@Body() forgetPasswordDto: ForgetPasswordDto) {
    return this.authService.forgetPassword(forgetPasswordDto.email);
  }

  @Put('reset-password')
  async resetPassword(
    @Body() resetPasswordDto: ResetPasswordDto,
  ) {
    return this.authService.resetPassword(
      resetPasswordDto.newPassword,
      resetPasswordDto.resetToken
    )
  }

}
