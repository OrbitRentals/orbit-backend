import {
  Controller,
  Get,
  Post,
  Body,
  Query,
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

    return {
      available: !conflict,
    };
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

    if (!user) {
      throw new ForbiddenException('Unauthorized');
    }

    if (user.role !== 'RENTER') {
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

    // ✅ BLOCK PAST BOOKINGS
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (startDate < today) {
      throw new BadRequestException(
        'Start date cannot be in the past',
      );
    }

    const vehicle = await this.prisma.vehicle.findUnique({
      where: { id: vehicleId },
    });

    if (!vehicle) {
      throw new NotFoundException('Vehicle not found');
    }

    // 🚫 Prevent overlapping bookings
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

    const booking = await this.prisma.booking.create({
      data: {
        vehicleId,
        userId: user.sub,
        startDate,
        endDate,
        status: 'PENDING',
      },
    });

    return {
      message: 'Booking created successfully',
      booking,
    };
  }
}
