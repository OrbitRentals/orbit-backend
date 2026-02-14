import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Query,
  Param,
  BadRequestException,
  NotFoundException,
  UseGuards,
  Req,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { JwtGuard } from '../auth/jwt.guard';
import { Request } from 'express';
import { BookingStatus, VerificationStatus } from '@prisma/client';

@Controller()
export class BookingsController {
  constructor(private prisma: PrismaService) {}

  // =========================================
  // 🔎 CHECK VEHICLE AVAILABILITY (PUBLIC)
  // =========================================
  @Get('availability')
  async checkAvailability(
    @Query('vehicleId') vehicleId: string,
    @Query('start') start: string,
    @Query('end') end: string,
  ) {
    if (!vehicleId || !start || !end) {
      throw new BadRequestException('Missing required parameters');
    }

    const startDate = new Date(start);
    const endDate = new Date(end);

    if (startDate >= endDate) {
      throw new BadRequestException('End date must be after start date');
    }

    const vehicle = await this.prisma.vehicle.findUnique({
      where: { id: vehicleId },
    });

    if (!vehicle || !vehicle.active) {
      throw new NotFoundException('Vehicle not available');
    }

    const conflict = await this.prisma.booking.findFirst({
      where: {
        vehicleId,
        status: { in: [BookingStatus.PENDING, BookingStatus.CONFIRMED] },
        startDate: { lt: endDate },
        endDate: { gt: startDate },
      },
    });

    return { available: !conflict };
  }

  // =========================================
  // 👤 GET MY BOOKINGS
  // =========================================
  @UseGuards(JwtGuard)
  @Get('bookings/my')
  async getMyBookings(@Req() req: any) {
    return this.prisma.booking.findMany({
      where: { userId: req.user.sub },
      include: { vehicle: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  // =========================================
  // 🛠 GET HOST BOOKINGS
  // =========================================
  @UseGuards(JwtGuard)
  @Get('bookings/host')
  async getHostBookings(@Req() req: any) {
    if (!['HOST', 'ADMIN', 'FOUNDER'].includes(req.user.role)) {
      throw new ForbiddenException('Not allowed');
    }

    return this.prisma.booking.findMany({
      where: {
        vehicle: {
          hostId: req.user.sub,
        },
      },
      include: {
        vehicle: true,
        user: { select: { id: true, email: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  // =========================================
  // 🚗 CREATE BOOKING
  // =========================================
  @UseGuards(JwtGuard)
  @Post('bookings')
  async createBooking(
    @Body('vehicleId') vehicleId: string,
    @Body('start') start: string,
    @Body('end') end: string,
    @Req() req: Request,
  ) {
    const user: any = req.user;

    if (!vehicleId || !start || !end) {
      throw new BadRequestException('Missing required fields');
    }

    if (user.role !== 'RENTER') {
      throw new ForbiddenException('Only renters can book vehicles');
    }

    const fullUser = await this.prisma.user.findUnique({
      where: { id: user.sub },
    });

    if (!fullUser) throw new NotFoundException('User not found');

    // 🔒 SECURITY BLOCKS
    if (fullUser.isSuspended) {
      throw new ForbiddenException('Account suspended');
    }

    if (
      fullUser.suspendedUntil &&
      fullUser.suspendedUntil > new Date()
    ) {
      throw new ForbiddenException('Account temporarily suspended');
    }

    if (!fullUser.emailVerified) {
      throw new ForbiddenException('Email not verified');
    }

    if (!fullUser.phoneVerified) {
      throw new ForbiddenException('Phone not verified');
    }

    if (fullUser.verificationStatus !== VerificationStatus.APPROVED) {
      throw new ForbiddenException('Identity not approved');
    }

    const startDate = new Date(start);
    const endDate = new Date(end);

    if (startDate >= endDate) {
      throw new BadRequestException('End date must be after start date');
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (startDate < today) {
      throw new BadRequestException('Start date cannot be in the past');
    }

    const vehicle = await this.prisma.vehicle.findUnique({
      where: { id: vehicleId },
    });

    if (!vehicle || !vehicle.active) {
      throw new NotFoundException('Vehicle not available');
    }

    if (vehicle.hostId === user.sub) {
      throw new ForbiddenException('Cannot book your own vehicle');
    }

    const conflict = await this.prisma.booking.findFirst({
      where: {
        vehicleId,
        status: { in: [BookingStatus.PENDING, BookingStatus.CONFIRMED] },
        startDate: { lt: endDate },
        endDate: { gt: startDate },
      },
    });

    if (conflict) {
      throw new BadRequestException(
        'Vehicle is not available for selected dates',
      );
    }

    return this.prisma.booking.create({
      data: {
        vehicleId,
        userId: user.sub,
        startDate,
        endDate,
        status: BookingStatus.PENDING,
      },
    });
  }

  // =========================================
  // ✅ APPROVE BOOKING
  // =========================================
  @UseGuards(JwtGuard)
  @Patch('bookings/:id/approve')
  async approveBooking(@Param('id') id: string, @Req() req: any) {
    const booking = await this.prisma.booking.findUnique({
      where: { id },
      include: { vehicle: true },
    });

    if (!booking) throw new NotFoundException('Booking not found');

    if (booking.vehicle.hostId !== req.user.sub) {
      throw new ForbiddenException('Not your vehicle');
    }

    if (booking.status !== BookingStatus.PENDING) {
      throw new BadRequestException('Cannot approve booking');
    }

    return this.prisma.booking.update({
      where: { id },
      data: { status: BookingStatus.CONFIRMED },
    });
  }

  // =========================================
  // ❌ REJECT BOOKING
  // =========================================
  @UseGuards(JwtGuard)
  @Patch('bookings/:id/reject')
  async rejectBooking(@Param('id') id: string, @Req() req: any) {
    const booking = await this.prisma.booking.findUnique({
      where: { id },
      include: { vehicle: true },
    });

    if (!booking) throw new NotFoundException('Booking not found');

    if (booking.vehicle.hostId !== req.user.sub) {
      throw new ForbiddenException('Not your vehicle');
    }

    if (booking.status !== BookingStatus.PENDING) {
      throw new BadRequestException('Cannot reject booking');
    }

    return this.prisma.booking.update({
      where: { id },
      data: { status: BookingStatus.CANCELLED },
    });
  }

  // =========================================
  // 🚫 CANCEL BOOKING
  // =========================================
  @UseGuards(JwtGuard)
  @Patch('bookings/:id/cancel')
  async cancelBooking(@Param('id') id: string, @Req() req: any) {
    const booking = await this.prisma.booking.findUnique({
      where: { id },
    });

    if (!booking) throw new NotFoundException('Booking not found');

    if (booking.userId !== req.user.sub) {
      throw new ForbiddenException('Not your booking');
    }

    if (booking.status !== BookingStatus.PENDING) {
      throw new BadRequestException('Cannot cancel booking');
    }

    return this.prisma.booking.update({
      where: { id },
      data: { status: BookingStatus.CANCELLED },
    });
  }
}
