import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcryptjs';
import { randomUUID } from 'crypto';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwt: JwtService,
  ) {}

  // 📝 REGISTER (email verification required)
  async register(email: string, password: string) {
    const normalizedEmail = email.toLowerCase();

    const existing = await this.prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (existing) {
      throw new BadRequestException('Email already registered');
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const verificationToken = randomUUID();

    await this.prisma.user.create({
      data: {
        email: normalizedEmail,
        passwordHash,
        role: 'RENTER',
        emailVerified: false,
        verificationToken,
      },
    });

    // 🔗 EMAIL SENDING COMES NEXT (Step 4)
    console.log(
      `VERIFY LINK: https://orbitrentals.net/verify?token=${verificationToken}`,
    );

    return {
      message:
        'Registration successful. Please check your email to verify your account.',
    };
  }

  // 🔑 LOGIN (blocked until email verified)
  async login(email: string, password: string) {
    const normalizedEmail = email.toLowerCase();

    const user = await this.prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    if (!user.emailVerified) {
      throw new UnauthorizedException(
        'Please verify your email before logging in',
      );
    }

    const valid = await bcrypt.compare(password, user.passwordHash);

    if (!valid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    return this.signToken(user.id, user.email, user.role);
  }

  // ✅ VERIFY EMAIL
  async verifyEmail(token: string) {
    const user = await this.prisma.user.findUnique({
      where: { verificationToken: token },
    });

    if (!user) {
      throw new BadRequestException(
        'Invalid or expired verification token',
      );
    }

    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        emailVerified: true,
        verificationToken: null,
      },
    });

    return {
      message: 'Email verified successfully. You can now log in.',
    };
  }

  private async signToken(
    userId: string,
    email: string,
    role: string,
  ) {
    const payload = { sub: userId, email, role };

    return {
      access_token: await this.jwt.signAsync(payload),
    };
  }
}
