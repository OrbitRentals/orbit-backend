import { Module } from '@nestjs/common';
import { BookingsController } from './bookings.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { AuthModule } from '../auth/auth.module';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [
    PrismaModule,
    AuthModule,           // ✅ required for JwtGuard
    NotificationsModule,  // 🔔 required for NotificationsService injection
  ],
  controllers: [BookingsController],
})
export class BookingsModule {}
