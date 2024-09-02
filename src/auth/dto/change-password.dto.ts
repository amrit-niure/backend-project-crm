import { ApiProperty } from "@nestjs/swagger";
import { IsString, Matches, MinLength } from "class-validator";

export class ChangePasswordDto {
    @ApiProperty()
    @IsString()
    oldPassword: string;

    @ApiProperty()
    @IsString()
    @MinLength(6)
    @Matches(/^(?=.*[0-9])/, { message: 'Password must contain at least one number.' })
    @IsString()
    newPassword: string;
}