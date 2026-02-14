import {
  Controller,
  Get,
  Query,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Controller('availability')
export class BookingsController {
  constructor(private prisma: PrismaService) {}

  // 🔎 CHECK VEHICLE AVAILABILITY
  @Get()
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

    // ✅ Validate date format
    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      throw new BadRequestException('Invalid date format');
    }

    if (startDate >= endDate) {
      throw new BadRequestException(
        'End date must be after start date',
      );
    }

    // ✅ Ensure vehicle exists
    const vehicle = await this.prisma.vehicle.findUnique({
      where: { id: vehicleId },
    });

    if (!vehicle) {
      throw new NotFoundException('Vehicle not found');
    }

    // 🚫 Overlap logic
    const conflict = await this.prisma.booking.findFirst({
      where: {
        vehicleId,
        status: { in: ['PENDING', 'CONFIRMED'] },
        AND: [
          { startDate: { lt: endDate } },
          { endDate: { gt: startDate } },
        ],
      },
    });

    const available = !conflict;

    return {
      available,
      message: available
        ? 'Vehicle is available'
        : 'Vehicle not available for selected dates',
    };
  }
}
