import {
  Controller,
  Post,
  Body,
  Get,
  UseGuards,
  Req,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { JwtGuard } from './jwt.guard';

@Controller('auth')
export class AuthController {
  constructor(private auth: AuthService) {}

  @Post('register')
  register(
    @Body('email') email: string,
    @Body('password') password: string,
  ) {
    return this.auth.register(email, password);
  }

  @Post('login')
  login(
    @Body('email') email: string,
    @Body('password') password: string,
  ) {
    return this.auth.login(email, password);
  }

  @UseGuards(JwtGuard)
  @Get('me')
  me(@Req() req: any) {
    return req.user;
  }
}
