import { Body, Controller, Get, Post, Req, UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service';
import { JwtGuard } from './jwt.guard';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {
    console.log('✅ AuthController loaded');
  }

  // 🔴 TEMP DEBUG ROUTE (browser-friendly)
  @Get()
  ping() {
    return { auth: 'alive' };
  }

  @Post('register')
  register(
    @Body()
    body: { email: string; password: string; role?: string }
  ) {
    return this.authService.register(
      body.email,
      body.password,
      body.role as any
    );
  }

  @Post('login')
  login(@Body() body: { email: string; password: string }) {
    return this.authService.login(body.email, body.password);
  }

  @UseGuards(JwtGuard)
  @Get('me')
  me(@Req() req: any) {
    return req.user;
  }
}
