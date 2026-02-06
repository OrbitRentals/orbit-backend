import { Module } from '@nestjs/common';
import { AuthModule } from './auth/auth.module';
import { VehiclesModule } from './vehicles/vehicles.module';
import { PrismaModule } from './prisma/prisma.module';

@Module({
  imports: [
    AuthModule,
    VehiclesModule,
    PrismaModule,
  ],
})
export class AppModule {}
