import { PrismaClient, Prisma } from '@prisma/client';
import { SyncBatchDTO, SyncItemDTO, SyncBatchResponse, SyncResultItem } from '../types/dto';
import { SocketService } from '../socket/socket.service';

export class SyncService {
  constructor(
    private prisma: PrismaClient,
    private socketService: SocketService,
  ) {}

  async processBatch(batch: SyncBatchDTO, userId: string): Promise<SyncBatchResponse> {
    const results: SyncResultItem[] = [];
    let processed = 0;
    let failed = 0;

    // processing each item individually so one failure doesnt block the rest
    for (const item of batch.items) {
      try {
        await this.processItem(item, userId);
        results.push({
          entityId: item.entityId,
          entity: item.entity,
          success: true,
        });
        processed++;
      } catch (error: any) {
        results.push({
          entityId: item.entityId,
          entity: item.entity,
          success: false,
          error: error.message || 'Unknown sync error',
        });
        failed++;
      }
    }

    return { processed, failed, results };
  }

  private async processItem(item: SyncItemDTO, userId: string): Promise<void> {
    await this.prisma.$transaction(async (tx) => {
      switch (item.entity) {
        case 'member':
          await this.processMemberSync(tx, item);
          break;
        case 'membership':
          await this.processMembershipSync(tx, item);
          break;
        case 'payment':
          await this.processPaymentSync(tx, item);
          break;
        case 'attendance':
          await this.processAttendanceSync(tx, item);
          break;
        case 'lead':
          await this.processLeadSync(tx, item);
          break;
        default:
          throw new Error(`Unknown entity type: ${item.entity}`);
      }

      await tx.auditLog.create({
        data: {
          userId,
          action: `SYNC_${item.action}_${item.entity.toUpperCase()}`,
          metadata: {
            entityId: item.entityId,
            clientTimestamp: item.clientTimestamp,
          },
        },
      });
    });

    // notify connected clients after the transaction succeeds
    // if socket fails thats fine, data is already persisted
    this.emitSyncUpdate(item);
  }

  private async processMemberSync(tx: Prisma.TransactionClient, item: SyncItemDTO): Promise<void> {
    const { entityId, action, payload, clientTimestamp } = item;

    if (action === 'DELETE') {
      const existing = await tx.member.findUnique({ where: { id: entityId } });
      if (existing) {
        await tx.member.delete({ where: { id: entityId } });
      }
      return;
    }

    // last-write-wins: skip if server data is newer
    const existing = await tx.member.findUnique({
      where: { id: entityId },
      select: { syncUpdatedAt: true },
    });

    if (existing && new Date(clientTimestamp) <= existing.syncUpdatedAt) {
      return;
    }

    await tx.member.upsert({
      where: { id: entityId },
      create: {
        id: entityId,
        fullName: payload.fullName as string,
        phone: payload.phone as string,
        qrCode: payload.qrCode as string,
        status: (payload.status as any) || 'ACTIVE',
        managedById: (payload.managedById as string) || null,
        assignedTrainerId: (payload.assignedTrainerId as string) || null,
      },
      update: {
        ...(payload.fullName !== undefined && { fullName: payload.fullName as string }),
        ...(payload.phone !== undefined && { phone: payload.phone as string }),
        ...(payload.status !== undefined && { status: payload.status as any }),
        ...(payload.assignedTrainerId !== undefined && { assignedTrainerId: (payload.assignedTrainerId as string) || null }),
      },
    });
  }

  private async processMembershipSync(tx: Prisma.TransactionClient, item: SyncItemDTO): Promise<void> {
    const { entityId, action, payload } = item;

    if (action === 'DELETE') {
      const existing = await tx.membership.findUnique({ where: { id: entityId } });
      if (existing) {
        await tx.membership.delete({ where: { id: entityId } });
      }
      return;
    }

    await tx.membership.upsert({
      where: { id: entityId },
      create: {
        id: entityId,
        memberId: payload.memberId as string,
        planName: payload.planName as string,
        startDate: new Date(payload.startDate as string),
        endDate: new Date(payload.endDate as string),
        type: payload.type as any,
        remainingClasses: (payload.remainingClasses as number) ?? null,
      },
      update: {
        ...(payload.planName !== undefined && { planName: payload.planName as string }),
        ...(payload.endDate !== undefined && { endDate: new Date(payload.endDate as string) }),
        ...(payload.type !== undefined && { type: payload.type as any }),
        ...(payload.remainingClasses !== undefined && { remainingClasses: (payload.remainingClasses as number) ?? null }),
      },
    });
  }

  private async processPaymentSync(tx: Prisma.TransactionClient, item: SyncItemDTO): Promise<void> {
    const { entityId, action, payload } = item;

    if (action === 'DELETE') {
      const existing = await tx.payment.findUnique({ where: { id: entityId } });
      if (existing) {
        await tx.payment.delete({ where: { id: entityId } });
      }
      return;
    }

    if (action === 'UPDATE') {
      await tx.payment.update({
        where: { id: entityId },
        data: {
          syncStatus: 'SYNCED',
          ...(payload.amount !== undefined && { amount: payload.amount as number }),
          ...(payload.method !== undefined && { method: payload.method as any }),
          ...(payload.isReversed !== undefined && { isReversed: payload.isReversed as boolean }),
          ...(payload.reversedAt !== undefined && { reversedAt: new Date(payload.reversedAt as string) }),
          ...(payload.reversedById !== undefined && { reversedById: payload.reversedById as string }),
          ...(payload.reversalReason !== undefined && { reversalReason: payload.reversalReason as string }),
        },
      });
      return;
    }

    await tx.payment.upsert({
      where: { id: entityId },
      create: {
        id: entityId,
        memberId: payload.memberId as string,
        staffId: (payload.staffId as string) || null,
        amount: payload.amount as number,
        method: payload.method as any,
        syncStatus: 'SYNCED',
        invoiceNumber: (payload.invoiceNumber as string) || null,
        transactionDate: payload.transactionDate
          ? new Date(payload.transactionDate as string)
          : new Date(),
        isReversed: (payload.isReversed as boolean) || false,
        reversedAt: payload.reversedAt ? new Date(payload.reversedAt as string) : null,
        reversedById: (payload.reversedById as string) || null,
        reversalReason: (payload.reversalReason as string) || null,
      },
      update: {
        syncStatus: 'SYNCED',
        ...(payload.isReversed !== undefined && { isReversed: payload.isReversed as boolean }),
        ...(payload.reversedAt !== undefined && { reversedAt: new Date(payload.reversedAt as string) }),
        ...(payload.reversedById !== undefined && { reversedById: payload.reversedById as string }),
        ...(payload.reversalReason !== undefined && { reversalReason: payload.reversalReason as string }),
      },
    });
  }

  private async processAttendanceSync(tx: Prisma.TransactionClient, item: SyncItemDTO): Promise<void> {
    const { entityId, action, payload } = item;

    if (action === 'DELETE') {
      const existing = await tx.attendance.findUnique({ where: { id: entityId } });
      if (existing) {
        await tx.attendance.delete({ where: { id: entityId } });
      }
      return;
    }

    // UPDATE actions only carry changed fields — use update, not upsert
    if (action === 'UPDATE') {
      await tx.attendance.update({
        where: { id: entityId },
        data: {
          syncStatus: 'SYNCED',
          ...(payload.isReversed !== undefined && { isReversed: payload.isReversed as boolean }),
          ...(payload.reversedAt !== undefined && { reversedAt: new Date(payload.reversedAt as string) }),
          ...(payload.reversedById !== undefined && { reversedById: payload.reversedById as string }),
          ...(payload.reversalReason !== undefined && { reversalReason: payload.reversalReason as string }),
        },
      });
      return;
    }

    await tx.attendance.upsert({
      where: { id: entityId },
      create: {
        id: entityId,
        memberId: payload.memberId as string,
        staffId: (payload.staffId as string) || null,
        checkIn: new Date(payload.checkIn as string),
        syncStatus: 'SYNCED',
        isReversed: (payload.isReversed as boolean) || false,
        reversedAt: payload.reversedAt ? new Date(payload.reversedAt as string) : null,
        reversedById: (payload.reversedById as string) || null,
        reversalReason: (payload.reversalReason as string) || null,
      },
      update: {
        syncStatus: 'SYNCED',
        ...(payload.isReversed !== undefined && { isReversed: payload.isReversed as boolean }),
        ...(payload.reversedAt !== undefined && { reversedAt: new Date(payload.reversedAt as string) }),
        ...(payload.reversedById !== undefined && { reversedById: payload.reversedById as string }),
        ...(payload.reversalReason !== undefined && { reversalReason: payload.reversalReason as string }),
      },
    });
  }

  private async processLeadSync(tx: Prisma.TransactionClient, item: SyncItemDTO): Promise<void> {
    const { entityId, action, payload } = item;

    if (action === 'DELETE') {
      const existing = await tx.lead.findUnique({ where: { id: entityId } });
      if (existing) {
        await tx.lead.delete({ where: { id: entityId } });
      }
      return;
    }

    await tx.lead.upsert({
      where: { id: entityId },
      create: {
        id: entityId,
        name: payload.name as string,
        phone: payload.phone as string,
        status: (payload.status as any) || 'NEW',
        notes: (payload.notes as string) || null,
      },
      update: {
        ...(payload.name !== undefined && { name: payload.name as string }),
        ...(payload.phone !== undefined && { phone: payload.phone as string }),
        ...(payload.status !== undefined && { status: payload.status as any }),
        ...(payload.notes !== undefined && { notes: (payload.notes as string) || null }),
      },
    });
  }

  private emitSyncUpdate(item: SyncItemDTO): void {
    try {
      const eventName = `sync_${item.entity}_update`;
      this.socketService.emitToAll(eventName, {
        entityId: item.entityId,
        action: item.action,
        entity: item.entity,
        timestamp: new Date().toISOString(),
      });

      if (item.entity === 'attendance' && item.action === 'CREATE') {
        this.socketService.emitToAll('check_in_update', {
          memberId: item.payload.memberId,
          checkIn: item.payload.checkIn,
        });
      }
    } catch (error) {
      // socket failures are non-critical, data is already saved
      console.error('Socket emit failed:', error);
    }
  }

  async getSnapshot(): Promise<any> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const members = await this.prisma.member.findMany({
      where: { status: 'ACTIVE' }
    });

    const memberships = await this.prisma.membership.findMany({
      where: {
        member: { status: 'ACTIVE' }
      }
    });

    const attendances = await this.prisma.attendance.findMany({
      where: {
        checkIn: { gte: today }
      }
    });

    const leads = await this.prisma.lead.findMany();

    const payments = await this.prisma.payment.findMany();

    return {
      members,
      memberships,
      todayAttendance: attendances,
      leads,
      payments
    };
  }
}
