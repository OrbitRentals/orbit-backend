import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  UseGuards,
  Req,
  ForbiddenException,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { JwtGuard } from '../auth/jwt.guard';
import { BookingStatus } from '@prisma/client';

@Controller('messages')
@UseGuards(JwtGuard)
export class MessagesController {
  constructor(private prisma: PrismaService) {}

  ////////////////////////////////////////////////////////////
  // SEND MESSAGE (BOOKING LOCKED)
  ////////////////////////////////////////////////////////////

  @Post(':bookingId')
  async sendMessage(
    @Param('bookingId') bookingId: string,
    @Body('content') content: string,
    @Req() req: any,
  ) {
    if (!content || content.trim().length === 0) {
      throw new BadRequestException('Message cannot be empty');
    }

    const booking = await this.prisma.booking.findUnique({
      where: { id: bookingId },
      include: { vehicle: true },
    });

    if (!booking) {
      throw new NotFoundException('Booking not found');
    }

    // 🚫 Must be CONFIRMED
    if (booking.status !== BookingStatus.CONFIRMED) {
      throw new ForbiddenException(
        'Messaging allowed only after booking is confirmed',
      );
    }

    const userId = req.user.sub;

    // 🚫 Must be renter or host
    if (
      booking.userId !== userId &&
      booking.vehicle.hostId !== userId
    ) {
      throw new ForbiddenException('Not allowed');
    }

    return this.prisma.message.create({
      data: {
        bookingId,
        senderId: userId,
        content,
      },
    });
  }

  ////////////////////////////////////////////////////////////
  // GET MESSAGES FOR BOOKING
  ////////////////////////////////////////////////////////////

  @Get(':bookingId')
  async getMessages(
    @Param('bookingId') bookingId: string,
    @Req() req: any,
  ) {
    const booking = await this.prisma.booking.findUnique({
      where: { id: bookingId },
      include: { vehicle: true },
    });

    if (!booking) {
      throw new NotFoundException('Booking not found');
    }

    const userId = req.user.sub;

    if (
      booking.userId !== userId &&
      booking.vehicle.hostId !== userId
    ) {
      throw new ForbiddenException('Not allowed');
    }

    return this.prisma.message.findMany({
      where: { bookingId },
      orderBy: { createdAt: 'asc' },
    });
  }
}
