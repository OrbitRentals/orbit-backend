import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Body,
  UseGuards,
  Req,
  UnauthorizedException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { JwtGuard } from '../auth/jwt.guard';
import { Request } from 'express';

@Controller('vehicles')
export class VehiclesController {
  constructor(private prisma: PrismaService) {}

  // 🌍 Public list (active vehicles only)
@Get()
async list() {
  return this.prisma.vehicle.findMany({
    where: { active: true },
    orderBy: { createdAt: 'desc' },
    include: {
      images: {
        orderBy: { order: 'asc' },
      },
    },
  });
}

  // 🔐 Add vehicle (HOST / ADMIN only — NO images here)
  @UseGuards(JwtGuard)
  @Post()
  async create(
    @Req() req: Request,
    @Body()
    body: {
      make: string;
      model: string;
      year: number;
      dailyPrice: number;
    },
  ) {
    const user = (req as any).user;

    if (user.role !== 'HOST' && user.role !== 'ADMIN') {
      throw new UnauthorizedException();
    }

    return this.prisma.vehicle.create({
      data: {
        hostId: user.sub,
        make: body.make,
        model: body.model,
        year: Number(body.year),
        dailyPrice: Number(body.dailyPrice),
        active: true,
      },
    });
  }

  // 🔐 Toggle active / inactive (HOST / ADMIN only)
  @UseGuards(JwtGuard)
  @Patch(':id/toggle')
  async toggle(
    @Param('id') id: string,
    @Req() req: Request,
  ) {
    const user = (req as any).user;

    if (user.role !== 'HOST' && user.role !== 'ADMIN') {
      throw new UnauthorizedException();
    }

    const vehicle = await this.prisma.vehicle.findUnique({
      where: { id },
    });

    if (!vehicle) {
      throw new NotFoundException('Vehicle not found');
    }

    return this.prisma.vehicle.update({
      where: { id },
      data: { active: !vehicle.active },
    });
  }
}
