import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
  ForbiddenException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class JwtGuard implements CanActivate {
  constructor(
    private jwt: JwtService,
    private prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest();
    const auth = req.headers.authorization;

    if (!auth) {
      throw new UnauthorizedException('Missing token');
    }

    try {
      const decoded = this.jwt.verify(
        auth.replace('Bearer ', ''),
      );

      const user = await this.prisma.user.findUnique({
        where: { id: decoded.sub },
      });

      if (!user) {
        throw new UnauthorizedException('User not found');
      }

      // 🚫 Permanent suspension
      if (user.isSuspended) {
        throw new ForbiddenException(
          'Account is suspended',
        );
      }

      // 🚫 Temporary suspension
      if (
        user.suspendedUntil &&
        user.suspendedUntil > new Date()
      ) {
        throw new ForbiddenException(
          'Account is temporarily suspended',
        );
      }

      // Attach safe user object to request
      req.user = {
        id: user.id,
        sub: user.id,
        role: user.role,
        email: user.email,
      };

      return true;
    } catch (err) {
      if (
        err instanceof UnauthorizedException ||
        err instanceof ForbiddenException
      ) {
        throw err;
      }

      throw new UnauthorizedException('Invalid token');
    }
  }
}
