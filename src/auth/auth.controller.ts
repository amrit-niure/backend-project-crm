import {
  Controller,
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
import { ChangePasswordDto } from './dto/change-password.dto';
import { ForgetPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { ApiBody, ApiTags } from '@nestjs/swagger';
import { LocalAuthGuard } from 'src/guards/local-auth.guard';
import { RefreshAuthGuard } from 'src/guards/refresh-auth.guard';
import { Public } from 'src/decorators/public.decorator';
import { VerifyEmailDto } from './dto/verify-email.dto';

@ApiTags('Authentication')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post('signup')
  @ApiBody({ type: SignupDto })
  async signup(@Body() signupData: SignupDto) {
    return this.authService.signup(signupData);
  }

  @Public()
  @Post('verify-email')
  async verifyEmail(@Body() verifyEmailData: VerifyEmailDto) {
    return this.authService.verifyEmail(verifyEmailData.verificationCode);
  }

  @Public()
  @HttpCode(HttpStatus.OK)
  @UseGuards(LocalAuthGuard)
  @Post('login')
  async login(@Request() req) {
    return await this.authService.login(req.user);
  }

  @Public()
  @UseGuards(RefreshAuthGuard)
  @Post('refresh')
  async refreshTokens(@Req() req) {
    const { userId, hashedRt } = req.user;
    return this.authService.refreshTokens(hashedRt, userId);
  }

  @Put('change-password')
  async changePassword(
    @Body() changePassWordDto: ChangePasswordDto,
    @Req() req,
  ) {
    return this.authService.changePassword(
      req.user.sub,
      changePassWordDto.oldPassword,
      changePassWordDto.newPassword,
    );
  }
  @Public()
  @Post('forgot-password')
  async forgetPassword(@Body() forgetPasswordDto: ForgetPasswordDto) {
    return this.authService.forgetPassword(forgetPasswordDto.email);
  }

  @Public()
  @Put('reset-password')
  async resetPassword(
    @Query('token') token: string,
    @Body() resetPasswordDto: ResetPasswordDto,
  ) {
    console.log(token, resetPasswordDto.newPassword);
    return this.authService.resetPassword(resetPasswordDto.newPassword, token);
  }

  @Post('logout')
  async logOut(@Req() req) {
    return this.authService.logOut(req.user.sub);
  }
}
