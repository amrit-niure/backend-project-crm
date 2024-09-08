import { ApiProperty } from '@nestjs/swagger';
import { IsNumber } from 'class-validator';

export class VerifyEmailDto {
  @ApiProperty()
  @IsNumber()
  verificationCode: number;
}
