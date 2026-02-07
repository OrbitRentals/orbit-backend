import { Module } from '@nestjs/common';
import { VehiclesController } from './vehicles.controller';
import { VehicleImagesController } from './vehicle-images.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { JwtModule } from '@nestjs/jwt';
import { JwtGuard } from '../auth/jwt.guard';

@Module({
  imports: [
    PrismaModule,
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'dev-secret',
    }),
  ],
  controllers: [
    VehiclesController,
    VehicleImagesController, // ✅ image routes
  ],
  providers: [JwtGuard], // ✅ needed for guards to work
})
export class VehiclesModule {}
