import { Controller, Get, UseGuards } from '@nestjs/common';
import { JwtGuard } from '../auth/jwt.guard';
import { RolesGuard } from '../auth/roles.guard';

@Controller('vehicles')
export class VehiclesController {

  @UseGuards(JwtGuard, new RolesGuard('ADMIN'))
  @Get('admin')
  adminVehicles() {
    return [
      { id: 1, make: 'Honda', model: 'Civic', year: 2026, dailyPrice: 75 }
    ];
  }
}
