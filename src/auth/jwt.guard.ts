import { CanActivate, ExecutionContext } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

export class JwtGuard implements CanActivate {
  constructor(private jwt: JwtService) {}

  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest();
    const auth = req.headers.authorization;
    if (!auth) return false;

    const token = auth.replace('Bearer ', '');
    try {
      req.user = this.jwt.verify(token);
      return true;
    } catch {
      return false;
    }
  }
}
