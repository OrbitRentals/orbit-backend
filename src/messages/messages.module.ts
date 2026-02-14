import { Module } from '@nestjs/common';
import { MessagesController } from './messages.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    PrismaModule,   // ✅ DB access
    AuthModule,     // ✅ JwtGuard dependency
  ],
  controllers: [MessagesController],
})
export class MessagesModule {}
