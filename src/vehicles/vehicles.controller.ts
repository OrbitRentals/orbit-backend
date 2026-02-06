import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Body,
  UseGuards,
  Req,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { JwtAuthGuard } from '../auth/jwt.guard';

@Controller('vehicles')
export class VehiclesController {
  constructor(private prisma: PrismaService) {}

  // 🌍 Public list (active only)
  @Get()
  async list() {
    return this.prisma.vehicle.findMany({
      where: { active: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  // 🔐 Add vehicle
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
        imageUrl: body.imageUrl || null,
      },
    });
  }

  // 🔐 Toggle active / inactive
  @UseGuards(JwtAuthGuard)
  @Patch(':id/toggle')
  async toggle(@Param('id') id: string, @Req() req) {
    if (req.user.role !== 'HOST' && req.user.role !== 'ADMIN') {
      throw new Error('Unauthorized');
    }

    const vehicle = await this.prisma.vehicle.findUnique({ where: { id } });

    return this.prisma.vehicle.update({
      where: { id },
      data: { active: !vehicle.active },
    });
  }
}
