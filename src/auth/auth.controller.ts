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
import { Request } from 'express';

@Controller('auth')
export class AuthController {
  constructor(private auth: AuthService) {}

  ////////////////////////////////////////////////////////////
  // 📝 REGISTER
  ////////////////////////////////////////////////////////////

  @Post('register')
  register(
    @Body('email') email: string,
    @Body('password') password: string,
  ) {
    if (!email || !password) {
      throw new BadRequestException(
        'Email and password are required',
      );
    }

    return this.auth.register(email, password);
  }

  ////////////////////////////////////////////////////////////
  // 🔗 VERIFY EMAIL
  ////////////////////////////////////////////////////////////

  @Get('verify')
  verify(@Query('token') token: string) {
    if (!token) {
      throw new BadRequestException(
        'Verification token missing',
      );
    }

    return this.auth.verifyEmail(token);
  }

  ////////////////////////////////////////////////////////////
  // 🔑 LOGIN
  ////////////////////////////////////////////////////////////

  @Post('login')
  login(
    @Body('email') email: string,
    @Body('password') password: string,
  ) {
    if (!email || !password) {
      throw new BadRequestException(
        'Email and password are required',
      );
    }

    return this.auth.login(email, password);
  }

  ////////////////////////////////////////////////////////////
  // 📱 SEND PHONE OTP (JWT REQUIRED)
  ////////////////////////////////////////////////////////////

  @UseGuards(JwtGuard)
  @Post('send-otp')
  sendOtp(
    @Req() req: Request & { user: any },
    @Body('phone') phone: string,
  ) {
    if (!phone || phone.trim().length < 8) {
      throw new BadRequestException(
        'Valid phone number required',
      );
    }

    return this.auth.sendPhoneOtp(
      req.user.sub,
      phone,
    );
  }

  ////////////////////////////////////////////////////////////
  // ✅ VERIFY PHONE OTP (JWT REQUIRED)
  ////////////////////////////////////////////////////////////

  @UseGuards(JwtGuard)
  @Post('verify-otp')
  verifyOtp(
    @Req() req: Request & { user: any },
    @Body('code') code: string,
  ) {
    if (!code || code.length !== 6) {
      throw new BadRequestException(
        'Valid 6-digit OTP code required',
      );
    }

    return this.auth.verifyPhoneOtp(
      req.user.sub,
      code,
    );
  }

  ////////////////////////////////////////////////////////////
  // 👤 CURRENT USER
  ////////////////////////////////////////////////////////////

  @UseGuards(JwtGuard)
  @Get('me')
  me(@Req() req: Request & { user: any }) {
    return req.user;
  }
}
