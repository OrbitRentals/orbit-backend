import {
  Injectable,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Role, VerificationStatus } from '@prisma/client';

@Injectable()
export class AdminService {
  constructor(private prisma: PrismaService) {}

  ////////////////////////////////////////////////////////////
  // GET ALL USERS
  ////////////////////////////////////////////////////////////

  async getAllUsers() {
    return this.prisma.user.findMany({
      select: {
        id: true,
        email: true,
        role: true,
        verificationStatus: true,
        isSuspended: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  ////////////////////////////////////////////////////////////
  // GET SINGLE USER (FULL PROFILE + RELATIONS)
  ////////////////////////////////////////////////////////////

  async getUserById(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      include: {
        vehicles: true,
        bookings: {
          include: { vehicle: true },
        },
        reviewsReceived: true,
      },
    });

    if (!user) throw new NotFoundException('User not found');

    return user;
  }

  ////////////////////////////////////////////////////////////
  // LICENSE VIEW (ADMIN / FOUNDER)
  ////////////////////////////////////////////////////////////

  async getUserLicense(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        licenseFrontUrl: true,
        licenseBackUrl: true,
        selfieUrl: true,
        verificationStatus: true,
      },
    });

    if (!user) throw new NotFoundException('User not found');

    return user;
  }

  ////////////////////////////////////////////////////////////
  // APPROVE USER (IDENTITY)
  ////////////////////////////////////////////////////////////

  async approveUser(id: string) {
    return this.prisma.user.update({
      where: { id },
      data: {
        verificationStatus: VerificationStatus.APPROVED,
      },
    });
  }

  ////////////////////////////////////////////////////////////
  // REJECT USER (IDENTITY)
  ////////////////////////////////////////////////////////////

  async rejectUser(id: string) {
    return this.prisma.user.update({
      where: { id },
      data: {
        verificationStatus: VerificationStatus.REJECTED,
      },
    });
  }

  ////////////////////////////////////////////////////////////
  // SUSPEND USER
  ////////////////////////////////////////////////////////////

  async suspendUser(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
    });

    if (!user) throw new NotFoundException('User not found');

    if (user.role === Role.FOUNDER) {
      throw new ForbiddenException(
        'Founder cannot be suspended',
      );
    }

    return this.prisma.user.update({
      where: { id },
      data: { isSuspended: true },
    });
  }

  ////////////////////////////////////////////////////////////
  // UNSUSPEND USER
  ////////////////////////////////////////////////////////////

  async unsuspendUser(id: string) {
    return this.prisma.user.update({
      where: { id },
      data: { isSuspended: false },
    });
  }

  ////////////////////////////////////////////////////////////
  // CHANGE ROLE (FOUNDER PROTECTED)
  ////////////////////////////////////////////////////////////

  async changeRole(
    requesterId: string,
    targetId: string,
    newRole: Role,
  ) {
    const requester = await this.prisma.user.findUnique({
      where: { id: requesterId },
    });

    const target = await this.prisma.user.findUnique({
      where: { id: targetId },
    });

    if (!requester || !target)
      throw new NotFoundException('User not found');

    // Nobody can modify Founder
    if (target.role === Role.FOUNDER) {
      throw new ForbiddenException(
        'Founder role cannot be modified',
      );
    }

    // Only Founder can assign ADMIN
    if (
      newRole === Role.ADMIN &&
      requester.role !== Role.FOUNDER
    ) {
      throw new ForbiddenException(
        'Only Founder can assign Admin role',
      );
    }

    // Admin cannot change another Admin
    if (
      target.role === Role.ADMIN &&
      requester.role !== Role.FOUNDER
    ) {
      throw new ForbiddenException(
        'Only Founder can modify Admin accounts',
      );
    }

    return this.prisma.user.update({
      where: { id: targetId },
      data: { role: newRole },
    });
  }

  ////////////////////////////////////////////////////////////
  // DELETE USER (FOUNDER SAFE)
  ////////////////////////////////////////////////////////////

  async deleteUser(
    requesterId: string,
    targetId: string,
  ) {
    const requester = await this.prisma.user.findUnique({
      where: { id: requesterId },
    });

    const target = await this.prisma.user.findUnique({
      where: { id: targetId },
    });

    if (!requester || !target)
      throw new NotFoundException('User not found');

    if (target.role === Role.FOUNDER) {
      throw new ForbiddenException(
        'Founder cannot be deleted',
      );
    }

    if (requesterId === targetId) {
      throw new ForbiddenException(
        'You cannot delete yourself',
      );
    }

    return this.prisma.user.delete({
      where: { id: targetId },
    });
  }
}
