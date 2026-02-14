import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcryptjs';
import { randomUUID } from 'crypto';
import { Resend } from 'resend';

@Injectable()
export class AuthService {
  private resend: Resend | null = null;

  constructor(
    private prisma: PrismaService,
    private jwt: JwtService,
  ) {
    if (!process.env.RESEND_API_KEY) {
      console.error('❌ RESEND_API_KEY is missing in environment variables');
    } else {
      this.resend = new Resend(process.env.RESEND_API_KEY);
      console.log('✅ Resend initialized');
    }
  }

  async register(email: string, password: string) {
    if (!email || !password) {
      throw new BadRequestException('Email and password are required');
    }

    const normalizedEmail = email.toLowerCase().trim();

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

    const verifyUrl = `https://orbitrentals.net/verify?token=${verificationToken}`;

    // ✉️ SEND REAL EMAIL
    if (this.resend) {
      await this.resend.emails.send({
        from: 'Orbit Rentals <admin@orbitrentals.net>',
        to: normalizedEmail,
        subject: 'Verify your Orbit Rentals account',
        html: `
          <h2>Welcome to Orbit Rentals</h2>
          <p>Please verify your email:</p>
          <a href="${verifyUrl}">${verifyUrl}</a>
        `,
      });
    } else {
      console.log('⚠️ Email not sent. Missing Resend key.');
      console.log('VERIFY LINK:', verifyUrl);
    }

    return {
      message:
        'Registration successful. Please check your email to verify your account.',
    };
  }

  async login(email: string, password: string) {
    if (!email || !password) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const normalizedEmail = email.toLowerCase().trim();

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

  async verifyEmail(token: string) {
    if (!token) {
      throw new BadRequestException('Verification token is required');
    }

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
