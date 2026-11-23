import { Body, Controller, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { IsEmail, IsString, MinLength } from 'class-validator';
import { AuthService } from './auth.service';
class LoginDto { @IsEmail() email: string; @IsString() password: string; }
class RegisterDto extends LoginDto { @IsString() @MinLength(2) name: string; @MinLength(6) password: string; }
@ApiTags('Авторизация')
@Controller('auth')
export class AuthController {
  constructor(private service: AuthService) {}
  @Post('login') login(@Body() dto: LoginDto) { return this.service.login(dto.email, dto.password); }
  @Post('register') register(@Body() dto: RegisterDto) { return this.service.register(dto); }
}
