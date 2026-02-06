import { Module } from '@nestjs/common';
import { VehiclesController } from './vehicles.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [VehiclesController],
})
export class VehiclesModule {}
