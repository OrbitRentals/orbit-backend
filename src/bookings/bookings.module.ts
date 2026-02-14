import { Module } from '@nestjs/common';
import { BookingsController } from './bookings.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { AuthModule } from '../auth/auth.module'; // ✅ IMPORTANT

@Module({
  imports: [
    PrismaModule,
    AuthModule, // ✅ gives JwtGuard access to JwtService
  ],
  controllers: [BookingsController],
})
export class BookingsModule {}
