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
import { ChangePasswordDto } from './dto/change-password.dto';
import { JwtGuard } from 'src/guards/jwt.guard';
import { ForgetPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { ApiBody, ApiTags } from '@nestjs/swagger';
import { LocalAuthGuard } from 'src/guards/local-auth.guard';
import { RefreshAuthGuard } from 'src/guards/refresh-auth.guard';
import { Public } from 'src/decorators/public.decorator';

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

  @Get('verify-email')
  async verifyEmail(@Query('token') token: string) {
    return this.authService.verifyEmail(token);
  }

  @Public()
  @HttpCode(HttpStatus.OK)
  @UseGuards(LocalAuthGuard)
  @Post('login')
  async login(@Request() req) {
    return await this.authService.login(req.user.userId);
  }

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

  @Post('forgot-password')
  async forgetPassword(@Body() forgetPasswordDto: ForgetPasswordDto) {
    return this.authService.forgetPassword(forgetPasswordDto.email);
  }

  @Put('reset-password')
  async resetPassword(
    @Query('token') token: string,
    @Body() resetPasswordDto: ResetPasswordDto,
  ) {
    return this.authService.resetPassword(resetPasswordDto.newPassword, token);
  }

  @UseGuards(JwtGuard)
  @Post('logout')
  async logOut(@Req() req) {
    return this.authService.logOut(req.user.sub);
  }
}
