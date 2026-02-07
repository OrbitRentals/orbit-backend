import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
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

  // 🌍 Public list
  @Get()
  async list() {
    return this.prisma.vehicle.findMany({
      where: { active: true },
      include: { images: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  // ➕ Create vehicle
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
      description: string;
    },
  ) {
    const user = (req as any).user;

    if (!['HOST', 'ADMIN'].includes(user.role)) {
      throw new UnauthorizedException();
    }

    return this.prisma.vehicle.create({
      data: {
        hostId: user.sub,
        make: body.make,
        model: body.model,
        year: Number(body.year),
        dailyPrice: Number(body.dailyPrice),
        description: body.description,
      },
    });
  }

  // ✏️ Edit vehicle
  @UseGuards(JwtGuard)
  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Req() req: Request,
    @Body() body: any,
  ) {
    const user = (req as any).user;

    if (!['HOST', 'ADMIN'].includes(user.role)) {
      throw new UnauthorizedException();
    }

    const vehicle = await this.prisma.vehicle.findUnique({ where: { id } });
    if (!vehicle) throw new NotFoundException('Vehicle not found');

    return this.prisma.vehicle.update({
      where: { id },
      data: {
        make: body.make,
        model: body.model,
        year: Number(body.year),
        dailyPrice: Number(body.dailyPrice),
        description: body.description,
      },
    });
  }

  // 🗑 Delete vehicle
  @UseGuards(JwtGuard)
  @Delete(':id')
  async remove(@Param('id') id: string, @Req() req: Request) {
    const user = (req as any).user;

    if (!['HOST', 'ADMIN'].includes(user.role)) {
      throw new UnauthorizedException();
    }

    await this.prisma.vehicle.delete({ where: { id } });
    return { success: true };
  }

  // 🔁 Toggle active
  @UseGuards(JwtGuard)
  @Patch(':id/toggle')
  async toggle(@Param('id') id: string, @Req() req: Request) {
    const user = (req as any).user;

    if (!['HOST', 'ADMIN'].includes(user.role)) {
      throw new UnauthorizedException();
    }

    const vehicle = await this.prisma.vehicle.findUnique({ where: { id } });
    if (!vehicle) throw new NotFoundException();

    return this.prisma.vehicle.update({
      where: { id },
      data: { active: !vehicle.active },
    });
  }
}
