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
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { PrismaService } from '../prisma/prisma.service';
import { JwtGuard } from '../auth/jwt.guard';
import { cloudinaryStorage } from '../uploads/cloudinary-storage';
import { Request } from 'express';

@Controller('vehicles/:vehicleId/images')
export class VehicleImagesController {
  constructor(private prisma: PrismaService) {}

  // 📸 UPLOAD IMAGE (Cloudinary)
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

    if (!file || !file.path) {
      throw new BadRequestException('Image upload failed');
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
        url: file.path, // ✅ Cloudinary secure URL
        order: count,
        isMain: count === 0, // first image becomes main
      },
    });
  }

  // ⭐ SET MAIN IMAGE
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

    const image = await this.prisma.vehicleImage.findUnique({
      where: { id: imageId },
    });

    if (!image || image.vehicleId !== vehicleId) {
      throw new NotFoundException('Image not found for this vehicle');
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

  // 🗑 DELETE IMAGE
  @UseGuards(JwtGuard)
  @Delete(':imageId')
  async deleteImage(
    @Param('vehicleId') vehicleId: string,
    @Param('imageId') imageId: string,
    @Req() req: Request,
  ) {
    const user = (req as any).user;

    if (!user || !['HOST', 'ADMIN'].includes(user.role)) {
      throw new UnauthorizedException();
    }

    const image = await this.prisma.vehicleImage.findUnique({
      where: { id: imageId },
    });

    if (!image || image.vehicleId !== vehicleId) {
      throw new NotFoundException('Image not found');
    }

    return this.prisma.vehicleImage.delete({
      where: { id: imageId },
    });
  }
}
