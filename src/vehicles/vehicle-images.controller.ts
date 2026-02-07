import {
  Controller,
  Post,
  Delete,
  Patch,
  Param,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  Req,
  UnauthorizedException,
  NotFoundException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { PrismaService } from '../prisma/prisma.service';
import { JwtGuard } from '../auth/jwt.guard';
import { cloudinaryStorage } from '../uploads/cloudinary-storage';
import { Request } from 'express';

@Controller('vehicles/:vehicleId/images')
export class VehicleImagesController {
  constructor(private prisma: PrismaService) {}

  // 📸 Upload image (Cloudinary)
  @UseGuards(JwtGuard)
  @Post()
  @UseInterceptors(
    FileInterceptor('file', {
      storage: cloudinaryStorage,
    }),
  )
  async addImage(
    @Param('vehicleId') vehicleId: string,
    @UploadedFile() file: any,
    @Req() req: Request,
  ) {
    const user = (req as any).user;

    if (!user || !['HOST', 'ADMIN'].includes(user.role)) {
      throw new UnauthorizedException();
    }

    const vehicle = await this.prisma.vehicle.findUnique({
      where: { id: vehicleId },
    });

    if (!vehicle) {
      throw new NotFoundException('Vehicle not found');
    }

    const count = await this.prisma.vehicleImage.count({
      where: { vehicleId },
    });

    return this.prisma.vehicleImage.create({
      data: {
        vehicleId,
        url: file.path, // Cloudinary URL
        order: count,
        isMain: count === 0,
      },
    });
  }

  // ⭐ Set main image
  @UseGuards(JwtGuard)
  @Patch(':imageId/main')
  async setMain(
    @Param('vehicleId') vehicleId: string,
    @Param('imageId') imageId: string,
    @Req() req: Request,
  ) {
    const user = (req as any).user;

    if (!user || !['HOST', 'ADMIN'].includes(user.role)) {
      throw new UnauthorizedException();
    }

    await this.prisma.vehicleImage.updateMany({
      where: { vehicleId },
      data: { isMain: false },
    });

    return this.prisma.vehicleImage.update({
      where: { id: imageId },
      data: { isMain: true },
    });
  }

  // 🗑 Delete image
  @UseGuards(JwtGuard)
  @Delete(':imageId')
  async deleteImage(
    @Param('imageId') imageId: string,
    @Req() req: Request,
  ) {
    const user = (req as any).user;

    if (!user || !['HOST', 'ADMIN'].includes(user.role)) {
      throw new UnauthorizedException();
    }

    return this.prisma.vehicleImage.delete({
      where: { id: imageId },
    });
  }
}
