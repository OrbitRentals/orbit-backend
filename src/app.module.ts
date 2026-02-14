import { BookingsModule } from './bookings/bookings.module';
import { Module } from '@nestjs/common';
import { AuthModule } from './auth/auth.module';
import { VehiclesModule } from './vehicles/vehicles.module';
import { PrismaModule } from './prisma/prisma.module';
import { BookingsController } from './bookings/bookings.controller';

@Module({
  imports: [
    AuthModule,
    VehiclesModule,
    PrismaModule,
    BookingsModule,
  ],
  controllers: [
    BookingsController, // ✅ AVAILABILITY ENDPOINT
  ],
})
export class AppModule {}
