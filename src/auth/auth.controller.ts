import {
  Controller,
  Post,
  Body,
  Get,
  Query,
  UseGuards,
  Req,
  BadRequestException,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { JwtGuard } from './jwt.guard';

@Controller('auth')
export class AuthController {
  constructor(private auth: AuthService) {}

  // 📝 REGISTER (RENTER by default, email verification required)
  @Post('register')
  register(
    @Body('email') email: string,
    @Body('password') password: string,
  ) {
    if (!email || !password) {
      throw new BadRequestException('Email and password are required');
    }

    return this.auth.register(email, password);
  }

  // 🔗 VERIFY EMAIL
  @Get('verify')
  verify(@Query('token') token: string) {
    if (!token) {
      throw new BadRequestException('Verification token missing');
    }

    return this.auth.verifyEmail(token);
  }

  // 🔑 LOGIN (blocked if email not verified)
  @Post('login')
  login(
    @Body('email') email: string,
    @Body('password') password: string,
  ) {
    if (!email || !password) {
      throw new BadRequestException('Email and password are required');
    }

    return this.auth.login(email, password);
  }

  // 👤 CURRENT USER
  @UseGuards(JwtGuard)
  @Get('me')
  me(@Req() req: any) {
    return req.user;
  }
}
