import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, Length, Matches, MinLength } from 'class-validator';

export class RegisterDto {
  @ApiProperty() @IsString() @Length(1, 120) @Matches(/\S/, { message: 'name must not be blank' }) name!: string;
  @ApiProperty() @IsEmail() @Length(3, 320) email!: string;
  @ApiProperty({ minLength: 10 }) @IsString() @MinLength(10) @Matches(/^(?=.*[A-Za-z])(?=.*\d).+$/, { message: 'password must contain a letter and a number' }) password!: string;
}
export class LoginDto {
  @ApiProperty() @IsEmail() email!: string;
  @ApiProperty() @IsString() password!: string;
}
export class RefreshTokenDto {
  @ApiProperty() @IsString() @Length(40, 500) refreshToken!: string;
}
