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

    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      throw new BadRequestException('Invalid date format');
    }

    if (startDate >= endDate) {
      throw new BadRequestException('End date must be after start date');
    }

    const vehicle = await this.prisma.vehicle.findUnique({
      where: { id: vehicleId },
    });

    if (!vehicle) {
      throw new NotFoundException('Vehicle not found');
    }

    const conflict = await this.prisma.booking.findFirst({
      where: {
        vehicleId,
        status: { in: ['PENDING', 'CONFIRMED'] },
        startDate: { lt: endDate },
        endDate: { gt: startDate },
      },
    });

    return { available: !conflict };
  }

  // =========================================
  // 👤 GET MY BOOKINGS (RENTER)
  // =========================================
  @UseGuards(JwtGuard)
  @Get('bookings/my')
  async getMyBookings(@Req() req: any) {
    const user = req.user;

    if (user.role !== 'RENTER') {
      throw new ForbiddenException('Only renters can view their bookings');
    }

    return this.prisma.booking.findMany({
      where: { userId: user.sub },
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
    const user = req.user;

    if (user.role !== 'HOST' && user.role !== 'ADMIN') {
      throw new ForbiddenException('Only hosts can view these bookings');
    }

    return this.prisma.booking.findMany({
      where: {
        vehicle: {
          hostId: user.sub,
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
  // 🚗 CREATE BOOKING (RENTER ONLY)
  // =========================================
  @UseGuards(JwtGuard)
  @Post('bookings')
  async createBooking(
    @Body('vehicleId') vehicleId: string,
    @Body('start') start: string,
    @Body('end') end: string,
    @Req() req: Request,
  ) {
    if (!vehicleId || !start || !end) {
      throw new BadRequestException('Missing required fields');
    }

    const user: any = req.user;

    if (!user || user.role !== 'RENTER') {
      throw new ForbiddenException('Only renters can create bookings');
    }

    const startDate = new Date(start);
    const endDate = new Date(end);

    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      throw new BadRequestException('Invalid date format');
    }

    if (startDate >= endDate) {
      throw new BadRequestException('End date must be after start date');
    }

    // 🚫 BLOCK PAST BOOKINGS
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (startDate < today) {
      throw new BadRequestException('Start date cannot be in the past');
    }

    const vehicle = await this.prisma.vehicle.findUnique({
      where: { id: vehicleId },
    });

    if (!vehicle) {
      throw new NotFoundException('Vehicle not found');
    }

    // 🚫 Prevent overlap
    const conflict = await this.prisma.booking.findFirst({
      where: {
        vehicleId,
        status: { in: ['PENDING', 'CONFIRMED'] },
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
        status: 'PENDING',
      },
    });
  }

  // =========================================
  // ✅ APPROVE BOOKING (HOST)
  // =========================================
  @UseGuards(JwtGuard)
  @Patch('bookings/:id/approve')
  async approveBooking(@Param('id') id: string, @Req() req: any) {
    const user = req.user;

    const booking = await this.prisma.booking.findUnique({
      where: { id },
      include: { vehicle: true },
    });

    if (!booking) throw new NotFoundException('Booking not found');

    if (booking.vehicle.hostId !== user.sub) {
      throw new ForbiddenException('Not your vehicle');
    }

    if (booking.status !== 'PENDING') {
      throw new BadRequestException('Booking cannot be approved');
    }

    return this.prisma.booking.update({
      where: { id },
      data: { status: 'CONFIRMED' },
    });
  }

  // =========================================
  // ❌ REJECT BOOKING (HOST)
  // =========================================
  @UseGuards(JwtGuard)
  @Patch('bookings/:id/reject')
  async rejectBooking(@Param('id') id: string, @Req() req: any) {
    const user = req.user;

    const booking = await this.prisma.booking.findUnique({
      where: { id },
      include: { vehicle: true },
    });

    if (!booking) throw new NotFoundException('Booking not found');

    if (booking.vehicle.hostId !== user.sub) {
      throw new ForbiddenException('Not your vehicle');
    }

    if (booking.status !== 'PENDING') {
      throw new BadRequestException('Booking cannot be rejected');
    }

    return this.prisma.booking.update({
      where: { id },
      data: { status: 'CANCELLED' },
    });
  }

  // =========================================
  // 🚫 CANCEL BOOKING (RENTER)
  // =========================================
  @UseGuards(JwtGuard)
  @Patch('bookings/:id/cancel')
  async cancelBooking(@Param('id') id: string, @Req() req: any) {
    const user = req.user;

    const booking = await this.prisma.booking.findUnique({
      where: { id },
    });

    if (!booking) throw new NotFoundException('Booking not found');

    if (booking.userId !== user.sub) {
      throw new ForbiddenException('Not your booking');
    }

    if (booking.status !== 'PENDING') {
      throw new BadRequestException('Booking cannot be cancelled');
    }

    return this.prisma.booking.update({
      where: { id },
      data: { status: 'CANCELLED' },
    });
  }
}
