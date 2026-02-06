import { VehiclesModule } from './vehicles/vehicles.module';
import { Module } from '@nestjs/common';
import { AuthModule } from './auth/auth.module';
import { PrismaModule } from './prisma/prisma.module';

@Module({
imports: [
  AuthModule,
  PrismaModule,
  VehiclesModule,
],
export class AppModule {}
