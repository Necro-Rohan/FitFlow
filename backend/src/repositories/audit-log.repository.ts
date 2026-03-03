import { PrismaClient, AuditLog, Prisma } from '@prisma/client';
import type { InputJsonValue } from '@prisma/client/runtime/library';

export class AuditLogRepository {
  constructor(private prisma: PrismaClient) {}

  async create(data: {
    userId: string;
    action: string;
    metadata?: Record<string, unknown>;
  }): Promise<AuditLog> {
    return this.prisma.auditLog.create({
      data: {
        userId: data.userId,
        action: data.action,
        metadata: (data.metadata || {}) as InputJsonValue,
      },
    });
  }

  async findByUserId(userId: string): Promise<AuditLog[]> {
    return this.prisma.auditLog.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });
  }

  async findRecent(limit: number = 50): Promise<AuditLog[]> {
    return this.prisma.auditLog.findMany({
      orderBy: { createdAt: 'desc' },
      take: limit,
      include: {
        user: { select: { id: true, username: true, role: true } },
      },
    });
  }
}
