import {
  Controller,
  Get,
  Post,
  Body,
  Put,
  UseGuards,
  Req,
  Query,
  Request,
  HttpStatus,
  HttpCode,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { SignupDto } from './dto/signup.dto';
import { RefreshTokenDto } from './dto/refreshTokens.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { JwtGuard } from 'src/guards/jwt.guard';
import { ForgetPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { ApiBody, ApiTags } from '@nestjs/swagger';
import { LocalAuthGuard } from 'src/guards/local-auth.guard';
import { LoginDto } from './dto/login.dto';
@ApiTags('Authentication')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) { }

  @Post('signup')
  @ApiBody({ type: SignupDto })
  async signup(@Body() signupData: SignupDto) {
    return this.authService.signup(signupData);
  }
  @Get('verify-email')
  async verifyEmail(@Query('token') token: string) {
    return this.authService.verifyEmail(token);
  }

  @HttpCode(HttpStatus.OK)
  @UseGuards(LocalAuthGuard)
  @Post('login')
  async login(@Request() req) {
    return await this.authService.login(req.user.userId)
  }


  @UseGuards(JwtGuard)
  @Post('refresh')
  async refreshTokens(@Body() refreshTokenDto: RefreshTokenDto) {
    return this.authService.refreshTokens(
      refreshTokenDto.refreshToken,
      refreshTokenDto.userId,
    );
  }

  @UseGuards(JwtGuard)
  @Put('change-password')
  async changePassword(
    @Body() changePassWordDto: ChangePasswordDto,
    @Req() req,
  ) {
    return this.authService.changePassword(
      req.userId,
      changePassWordDto.oldPassword,
      changePassWordDto.newPassword,
    );
  }

  @Post('forgot-password')
  async forgetPassword(@Body() forgetPasswordDto: ForgetPasswordDto) {
    return this.authService.forgetPassword(forgetPasswordDto.email);
  }

  @Put('reset-password')
  async resetPassword(@Body() resetPasswordDto: ResetPasswordDto) {
    return this.authService.resetPassword(
      resetPasswordDto.newPassword,
      resetPasswordDto.resetToken,
    );
  }
}
