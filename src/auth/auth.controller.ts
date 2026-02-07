import { Controller, Post, Body, Get, Query, UseGuards, Req } from '@nestjs/common';
import { AuthService } from './auth.service';
import { JwtGuard } from './jwt.guard';

@Controller('auth')
export class AuthController {
  constructor(private auth: AuthService) {}

  // 📝 Register
  @Post('register')
  register(
    @Body('email') email: string,
    @Body('password') password: string,
  ) {
    return this.auth.register(email, password);
  }

  // 🔗 Verify email
  @Get('verify')
  verify(@Query('token') token: string) {
    return this.auth.verifyEmail(token);
  }

  // 🔑 Login
  @Post('login')
  login(
    @Body('email') email: string,
    @Body('password') password: string,
  ) {
    return this.auth.login(email, password);
  }

  // 👤 Me
  @UseGuards(JwtGuard)
  @Get('me')
  me(@Req() req: any) {
    return req.user;
  }
}
