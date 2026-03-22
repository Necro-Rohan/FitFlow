import Dexie, { type Table } from 'dexie';
import type {
  IMember, IMembership, IPayment,
  IAttendance, ILead, ISyncQueueItem,
} from '../types';

export class FitFlowDB extends Dexie {
  members!: Table<IMember, string>;
  memberships!: Table<IMembership, string>;
  payments!: Table<IPayment, string>;
  attendance!: Table<IAttendance, string>;
  leads!: Table<ILead, string>;
  syncQueue!: Table<ISyncQueueItem, number>;

  constructor() {
    super('FitFlowDB');

    // Only declare indexed fields here. Dexie stores the rest automatically.
    this.version(1).stores({
      members: 'id, phone, qrCode, status, assignedTrainerId',
      memberships: 'id, memberId, endDate, type',
      payments: 'id, memberId, syncStatus, transactionDate',
      attendance: 'id, memberId, syncStatus, checkIn',
      leads: 'id, phone, status',
      syncQueue: '++id, entity, entityId, status, createdAt',
    });
  }
}

export const db = new FitFlowDB();

export async function addToSyncQueue(
  entity: ISyncQueueItem['entity'],
  entityId: string,
  action: ISyncQueueItem['action'],
  payload: Record<string, unknown>,
  lockedUntil?: Date
): Promise<number> {
  return await db.syncQueue.add({
    entity,
    entityId,
    action,
    payload,
    status: 'PENDING',
    retryCount: 0,
    createdAt: new Date(),
    lockedUntil,
  });
}
