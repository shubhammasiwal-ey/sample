import { Injectable } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';

@Injectable()
export class AdminService {
  constructor(private readonly prisma: PrismaService) {}

  async getUsers() {
    return this.prisma.users.findMany({
      where: { deleted_at: null },
      include: { role: true },
      orderBy: { id: 'desc' },
    });
  }

  async getRoles() {
    return this.prisma.roles.findMany({
      include: {
        _count: {
          select: { users: true },
        },
      },
      orderBy: { name: 'asc' },
    });
  }

  async getPermissions() {
    // Permissions are stored as 'resources' in your schema
    return this.prisma.resources.findMany({
      orderBy: { name: 'asc' },
    });
  }
}
