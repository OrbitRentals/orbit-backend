import {
  Controller,
  Get,
  Query,
  BadRequestException,
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
      throw new BadRequestException('Missing parameters');
    }

    const startDate = new Date(start);
    const endDate = new Date(end);

    if (startDate >= endDate) {
      throw new BadRequestException('Invalid date range');
    }

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

    return { available: !conflict };
  }
}
