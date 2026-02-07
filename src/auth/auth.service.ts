import { Injectable, UnauthorizedException, BadRequestException } from '@nestjs/common';
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

  // 📝 REGISTER (RENTER + EMAIL VERIFICATION REQUIRED)
  async register(email: string, password: string) {
    const existing = await this.prisma.user.findUnique({
      where: { email },
    });

    if (existing) {
      throw new BadRequestException('Email already registered');
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const verificationToken = randomUUID();

    const user = await this.prisma.user.create({
      data: {
        email,
        passwordHash,
        role: 'RENTER',           // ✅ ALWAYS RENTER
        emailVerified: false,     // ❌ NOT VERIFIED YET
        verificationToken,
      },
    });

    // TODO: send email here (next step)
    console.log(
      `VERIFY EMAIL: https://orbitrentals.net/verify-email?token=${verificationToken}`
    );

    return {
      success: true,
      message: 'Registration successful. Please verify your email.',
    };
  }

  // 🔐 LOGIN (BLOCKS UNVERIFIED USERS)
  async login(email: string, password: string) {
    const user = await this.prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    if (!user.emailVerified) {
      throw new UnauthorizedException('Please verify your email first');
    }

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    return this.signToken(user.id, user.email, user.role);
  }

  // 📩 EMAIL VERIFY
  async verifyEmail(token: string) {
    const user = await this.prisma.user.findFirst({
      where: { verificationToken: token },
    });

    if (!user) {
      throw new BadRequestException('Invalid or expired token');
    }

    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        emailVerified: true,
        verificationToken: null,
      },
    });

    return { success: true };
  }

  private async signToken(userId: string, email: string, role: string) {
    return {
      access_token: await this.jwt.signAsync({
        sub: userId,
        email,
        role,
      }),
    };
  }
}
