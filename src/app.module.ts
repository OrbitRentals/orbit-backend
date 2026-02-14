import { Module } from '@nestjs/common';
import { AuthModule } from './auth/auth.module';
import { VehiclesModule } from './vehicles/vehicles.module';
import { PrismaModule } from './prisma/prisma.module';
import { BookingsModule } from './bookings/bookings.module';
import { AdminModule } from './admin/admin.module';
import { MessagesModule } from './messages/messages.module';
import { NotificationsModule } from './notifications/notifications.module';

@Module({
  imports: [
    AuthModule,
    MessagesModule,
    VehiclesModule,
    PrismaModule,
    BookingsModule,
    AdminModule, // ✅ REGISTERED
    NotificationsModule,
  ],
})
export class AppModule {}
