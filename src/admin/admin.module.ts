import { Module } from '@nestjs/common';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';
import { PrismaModule } from '../prisma/prisma.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    PrismaModule,
    AuthModule, // ✅ Gives access to JwtService for JwtGuard
  ],
  controllers: [AdminController],
  providers: [AdminService],
})
export class AdminModule {}
