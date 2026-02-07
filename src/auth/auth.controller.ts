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

  // 🆕 REGISTER (RENTER by default, email NOT verified yet)
  @Post('register')
  async register(
    @Body('email') email: string,
    @Body('password') password: string,
  ) {
    if (!email || !password) {
      throw new BadRequestException('Email and password required');
    }

    return this.auth.register(email, password);
  }

  // 📨 VERIFY EMAIL
  @Get('verify-email')
  async verifyEmail(@Query('token') token: string) {
    if (!token) {
      throw new BadRequestException('Invalid verification token');
    }

    return this.auth.verifyEmail(token);
  }

  // 🔐 LOGIN (blocked if not verified)
  @Post('login')
  async login(
    @Body('email') email: string,
    @Body('password') password: string,
  ) {
    if (!email || !password) {
      throw new BadRequestException('Email and password required');
    }

    return this.auth.login(email, password);
  }

  // 👤 CURRENT USER
  @UseGuards(JwtGuard)
  @Get('me')
  me(@Req() req: any) {
    return req.user;
  }

  @Get('verify')
verify(@Req() req: any) {
  const token = req.query.token;
  return this.auth.verifyEmail(token);
  }

}
