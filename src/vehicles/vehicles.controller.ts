import {
  Controller,
  Get,
  Post,
  Body,
  UseGuards,
  Req,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { JwtAuthGuard } from '../auth/jwt.guard';

@Controller('vehicles')
export class VehiclesController {
  constructor(private prisma: PrismaService) {}

  // 🌍 Public list
  @Get()
  async list() {
    return this.prisma.vehicle.findMany({
      where: { active: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  // 🔐 Admin / Host add
  @UseGuards(JwtAuthGuard)
  @Post()
  async create(@Req() req, @Body() body) {
    if (req.user.role !== 'HOST' && req.user.role !== 'ADMIN') {
      throw new Error('Unauthorized');
    }

    return this.prisma.vehicle.create({
      data: {
        hostId: req.user.sub,
        make: body.make,
        model: body.model,
        year: Number(body.year),
        dailyPrice: Number(body.dailyPrice),
      },
    });
  }
}
