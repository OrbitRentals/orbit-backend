import { Module } from '@nestjs/common';
import { AuthModule } from './auth/auth.module';
import { VehiclesModule } from './vehicles/vehicles.module';
import { PrismaModule } from './prisma/prisma.module';
import { BookingsModule } from './bookings/bookings.module';
import { AdminModule } from './admin/admin.module';

@Module({
  imports: [
    AuthModule,
    VehiclesModule,
    PrismaModule,
    BookingsModule,
    AdminModule, // ✅ REGISTERED
  ],
})
export class AppModule {}
