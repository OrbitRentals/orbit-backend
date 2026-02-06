import { Body, Controller, Post } from '@nestjs/common';
import { AuthService } from './auth.service';

@Controller('auth')
export class AuthController {
  constructor(private auth: AuthService) {}

  @Post('register')
  register(
    @Body('email') email: string,
    @Body('password') password: string
  ) {
    return this.auth.register(email, password);
  }

  @Post('login')
  login(
    @Body('email') email: string,
    @Body('password') password: string
  ) {
    return this.auth.login(email, password);
  }
}
