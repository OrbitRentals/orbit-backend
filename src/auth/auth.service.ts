import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcryptjs';
import { randomUUID } from 'crypto';
import { Resend } from 'resend';
import twilio from 'twilio';

@Injectable()
export class AuthService {
  private resend: Resend | null = null;
  private twilioClient: ReturnType<typeof twilio> | null = null;

  constructor(
    private prisma: PrismaService,
    private jwt: JwtService,
  ) {
    ////////////////////////////////////////////////////////////
    // EMAIL (RESEND)
    ////////////////////////////////////////////////////////////

    if (process.env.RESEND_API_KEY) {
      this.resend = new Resend(process.env.RESEND_API_KEY);
      console.log('✅ Resend initialized');
    } else {
      console.log('❌ RESEND_API_KEY missing');
    }

    ////////////////////////////////////////////////////////////
    // SMS (TWILIO)
    ////////////////////////////////////////////////////////////

    if (
      process.env.TWILIO_ACCOUNT_SID &&
      process.env.TWILIO_AUTH_TOKEN
    ) {
      this.twilioClient = twilio(
        process.env.TWILIO_ACCOUNT_SID,
        process.env.TWILIO_AUTH_TOKEN,
      );
      console.log('✅ Twilio initialized');
    } else {
      console.log('❌ Twilio credentials missing');
    }
  }

  ////////////////////////////////////////////////////////////
  // REGISTER
  ////////////////////////////////////////////////////////////

  async register(email: string, password: string) {
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
    }

    return {
      message:
        'Registration successful. Please verify your email.',
    };
  }

  ////////////////////////////////////////////////////////////
  // LOGIN
  ////////////////////////////////////////////////////////////

  async login(email: string, password: string) {
    const normalizedEmail = email.toLowerCase().trim();

    const user = await this.prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (!user)
      throw new UnauthorizedException('Invalid credentials');

    if (!user.emailVerified) {
      throw new UnauthorizedException(
        'Please verify your email before logging in',
      );
    }

    const valid = await bcrypt.compare(
      password,
      user.passwordHash,
    );

    if (!valid)
      throw new UnauthorizedException('Invalid credentials');

    return this.signToken(user.id, user.email, user.role);
  }

  ////////////////////////////////////////////////////////////
  // EMAIL VERIFY
  ////////////////////////////////////////////////////////////

  async verifyEmail(token: string) {
    const user = await this.prisma.user.findUnique({
      where: { verificationToken: token },
    });

    if (!user) {
      throw new BadRequestException('Invalid token');
    }

    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        emailVerified: true,
        verificationToken: null,
      },
    });

    return { message: 'Email verified successfully' };
  }

  ////////////////////////////////////////////////////////////
  // SEND PHONE OTP
  ////////////////////////////////////////////////////////////

  async sendPhoneOtp(userId: string, phone: string) {
    if (!this.twilioClient) {
      throw new BadRequestException(
        'SMS service not configured',
      );
    }

    const formattedPhone = phone.trim();

    const code = Math.floor(
      100000 + Math.random() * 900000,
    ).toString();

    const expires = new Date();
    expires.setMinutes(expires.getMinutes() + 10);

    await this.prisma.user.update({
      where: { id: userId },
      data: {
        phone: formattedPhone,
        phoneOtpCode: code,
        phoneOtpExpiresAt: expires,
        phoneVerified: false,
      },
    });

    await this.twilioClient.messages.create({
      body: `Your Orbit Rentals verification code is: ${code}`,
      from: process.env.TWILIO_PHONE_NUMBER,
      to: formattedPhone,
    });

    return { message: 'OTP sent successfully' };
  }

  ////////////////////////////////////////////////////////////
  // VERIFY PHONE OTP
  ////////////////////////////////////////////////////////////

  async verifyPhoneOtp(userId: string, code: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user)
      throw new BadRequestException('User not found');

    if (!user.phoneOtpCode || !user.phoneOtpExpiresAt) {
      throw new BadRequestException('No OTP requested');
    }

    if (user.phoneOtpExpiresAt < new Date()) {
      throw new ForbiddenException('OTP expired');
    }

    if (user.phoneOtpCode !== code) {
      throw new ForbiddenException('Invalid OTP');
    }

    await this.prisma.user.update({
      where: { id: userId },
      data: {
        phoneVerified: true,
        phoneOtpCode: null,
        phoneOtpExpiresAt: null,
      },
    });

    return { message: 'Phone verified successfully' };
  }

  ////////////////////////////////////////////////////////////
  // JWT
  ////////////////////////////////////////////////////////////

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
