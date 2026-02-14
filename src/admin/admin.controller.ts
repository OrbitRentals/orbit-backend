import {
  Controller,
  Get,
  Param,
  Patch,
  Delete,
  Body,
  UseGuards,
  Req,
} from '@nestjs/common';
import { Request } from 'express';
import { AdminService } from './admin.service';
import { JwtGuard } from '../auth/jwt.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { Role } from '@prisma/client';

@Controller('admin')
@UseGuards(JwtGuard, RolesGuard)
@Roles('FOUNDER', 'ADMIN', 'MODERATOR')
export class AdminController {
  constructor(private adminService: AdminService) {}

  ////////////////////////////////////////////////////////////
  // USERS
  ////////////////////////////////////////////////////////////

  @Get('users')
  getAllUsers() {
    return this.adminService.getAllUsers();
  }

  @Get('users/:id')
  getUser(@Param('id') id: string) {
    return this.adminService.getUserById(id);
  }

  ////////////////////////////////////////////////////////////
  // ROLE MANAGEMENT (FOUNDER ONLY)
  ////////////////////////////////////////////////////////////

  @Patch('users/:id/role')
  @Roles('FOUNDER')
  changeRole(
    @Param('id') targetId: string,
    @Body('role') role: Role,
    @Req() req: Request & { user: any },
  ) {
    return this.adminService.changeRole(
      req.user.id,
      targetId,
      role,
    );
  }

  ////////////////////////////////////////////////////////////
  // APPROVAL
  ////////////////////////////////////////////////////////////

  @Patch('users/:id/approve')
  @Roles('FOUNDER', 'ADMIN')
  approve(@Param('id') id: string) {
    return this.adminService.approveUser(id);
  }

  @Patch('users/:id/reject')
  @Roles('FOUNDER', 'ADMIN')
  reject(@Param('id') id: string) {
    return this.adminService.rejectUser(id);
  }

  ////////////////////////////////////////////////////////////
  // SUSPEND / UNSUSPEND
  ////////////////////////////////////////////////////////////

  @Patch('users/:id/suspend')
  @Roles('FOUNDER', 'ADMIN', 'MODERATOR')
  suspend(@Param('id') id: string) {
    return this.adminService.suspendUser(id);
  }

  @Patch('users/:id/unsuspend')
  @Roles('FOUNDER', 'ADMIN')
  unsuspend(@Param('id') id: string) {
    return this.adminService.unsuspendUser(id);
  }

  ////////////////////////////////////////////////////////////
  // DELETE (FOUNDER ONLY)
  ////////////////////////////////////////////////////////////

  @Delete('users/:id')
  @Roles('FOUNDER')
  delete(
    @Param('id') targetId: string,
    @Req() req: Request & { user: any },
  ) {
    return this.adminService.deleteUser(
      req.user.id,
      targetId,
    );
  }

  ////////////////////////////////////////////////////////////
  // LICENSE VIEW
  ////////////////////////////////////////////////////////////

  @Get('users/:id/license')
  @Roles('FOUNDER', 'ADMIN')
  viewLicense(@Param('id') id: string) {
    return this.adminService.getUserLicense(id);
  }
}
