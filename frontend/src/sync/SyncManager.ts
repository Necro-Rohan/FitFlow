import { db } from '../db/dexie';
import type { ISyncQueueItem } from '../types';
import { io, Socket } from 'socket.io-client';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:4000';
const MAX_RETRY = 5;
const BATCH_SIZE = 20;

type SyncListener = (state: {
  isSyncing: boolean;
  isHydrating: boolean;
  isInitialHydration: boolean;
  pendingCount: number;
  lastSyncTime: Date | null;
  lastError: string | null;
}) => void;

export class SyncManager {
  private isSyncing = false;
  private isHydrating = false;
  private isInitialHydration = false;
  private lastSyncTime: Date | null = null;
  private lastError: string | null = null;
  private listeners: SyncListener[] = [];
  private intervalId: ReturnType<typeof setInterval> | null = null;
  private socket: Socket | null = null;

  constructor() {
    window.addEventListener('online', () => this.onOnline());
    window.addEventListener('offline', () => this.notifyListeners());
  }

  start(): void {
    // poll every 30 seconds
    this.intervalId = setInterval(() => {
      if (navigator.onLine && !this.isSyncing && !this.isHydrating) {
        this.sync();
      }
    }, 30000);

    if (navigator.onLine) {
      this.sync().then(() => this.hydrateDexie());
    } else {
      db.members.count().then(c => {
        if (c === 0) {
          this.isInitialHydration = true;
          this.notifyListeners();
        }
      });
    }

    if (!this.socket) {
      this.socket = io(API_BASE, { transports: ['websocket'] });
      const handleServerUpdate = () => {
        if (!this.isSyncing && !this.isHydrating) {
          this.hydrateDexie();
        }
      };
      this.socket.on('sync_member_update', handleServerUpdate);
      this.socket.on('sync_membership_update', handleServerUpdate);
      this.socket.on('sync_payment_update', handleServerUpdate);
      this.socket.on('sync_attendance_update', handleServerUpdate);
      this.socket.on('sync_lead_update', handleServerUpdate);
    }
  }

  stop(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  subscribe(listener: SyncListener): () => void {
    this.listeners.push(listener);
    this.notifyListeners();
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  private onOnline(): void {
    console.log('Network restored, starting sync...');
    this.sync();
  }

  async sync(): Promise<void> {
    if (this.isSyncing || !navigator.onLine) return;

    const token = localStorage.getItem('fitflow_token');
    if (!token) return;

    this.isSyncing = true;
    this.lastError = null;
    this.notifyListeners();

    try {
      const now = new Date();

      // skip locked items (undo window might still be active)
      const pendingItems = await db.syncQueue
        .where('status')
        .anyOf(['PENDING', 'FAILED'])
        .filter(item => item.retryCount < MAX_RETRY && (!item.lockedUntil || item.lockedUntil <= now))
        .limit(BATCH_SIZE)
        .toArray();

      if (pendingItems.length === 0) {
        this.isSyncing = false;
        this.notifyListeners();
        return;
      }

      const ids = pendingItems.map(item => item.id!);
      await db.syncQueue
        .where('id')
        .anyOf(ids)
        .modify({ status: 'IN_PROGRESS' });

      const batchPayload = {
        items: pendingItems.map(item => ({
          entity: item.entity,
          entityId: item.entityId,
          action: item.action,
          payload: item.payload,
          clientTimestamp: item.createdAt.toISOString(),
        })),
      };

      const response = await fetch(`${API_BASE}/api/sync/batch`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(batchPayload),
      });

      if (!response.ok) {
        throw new Error(`Sync failed with status ${response.status}`);
      }

      const result = await response.json();
      await this.processResults(pendingItems, result.data.results);

      this.lastSyncTime = new Date();
      console.log(`Sync complete: ${result.data.processed} synced, ${result.data.failed} failed`);

    } catch (error: any) {
      console.error('Sync error:', error.message);
      this.lastError = error.message;

      // mark as FAILED so we retry later
      await db.syncQueue
        .where('status')
        .equals('IN_PROGRESS')
        .modify((item: ISyncQueueItem) => {
          item.status = 'FAILED';
          item.retryCount = (item.retryCount || 0) + 1;
          item.errorMessage = error.message;
        });
    } finally {
      this.isSyncing = false;
      this.notifyListeners();
    }
  }

  private async processResults(
    items: ISyncQueueItem[],
    results: Array<{ entityId: string; success: boolean; error?: string }>
  ): Promise<void> {
    for (const result of results) {
      const queueItem = items.find(i => i.entityId === result.entityId);
      if (!queueItem?.id) continue;

      if (result.success) {
        await db.syncQueue.update(queueItem.id, { status: 'SYNCED' });
      } else {
        console.error(`Sync item failed [${queueItem.entity}/${queueItem.action}] ${result.entityId}:`, result.error);
        await db.syncQueue.update(queueItem.id, {
          status: 'FAILED',
          retryCount: (queueItem.retryCount || 0) + 1,
          errorMessage: result.error || 'Unknown error',
        });
      }
    }

    // clean up synced items
    await db.syncQueue.where('status').equals('SYNCED').delete();
  }

  async hydrateDexie(): Promise<void> {
    if (!navigator.onLine) return;

    const token = localStorage.getItem('fitflow_token');
    if (!token) return;

    // dont hydrate while theres stuff in the queue, itd get overwritten
    const pendingCount = await db.syncQueue
      .where('status')
      .anyOf(['PENDING', 'FAILED', 'IN_PROGRESS'])
      .count();

    if (pendingCount > 0) {
      // expected when local changes haven't synced yet — not an error
      console.log('Hydration deferred: %d items still in sync queue', pendingCount);
      return;
    }

    const memberCount = await db.members.count();
    this.isInitialHydration = memberCount === 0;
    this.isHydrating = true;
    this.notifyListeners();

    try {
      console.log('Fetching snapshot for hydration...');
      const response = await fetch(`${API_BASE}/api/sync/snapshot`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!response.ok) throw new Error('Failed to fetch snapshot');

      const result = await response.json();
      const { members, memberships, todayAttendance, leads, payments } = result.data;

      await db.transaction('rw', [db.members, db.memberships, db.attendance, db.leads, db.payments], async () => {
        await db.members.clear();
        await db.memberships.clear();
        await db.attendance.clear();
        await db.leads.clear();
        await db.payments.clear();

        if (members?.length > 0) await db.members.bulkAdd(members);
        if (memberships?.length > 0) await db.memberships.bulkAdd(memberships);
        if (todayAttendance?.length > 0) await db.attendance.bulkAdd(todayAttendance);
        if (leads?.length > 0) await db.leads.bulkAdd(leads);
        if (payments?.length > 0) await db.payments.bulkAdd(payments);
      });

      console.log('Hydration complete');
    } catch (error) {
      console.error('Hydration failed:', error);
    } finally {
      this.isHydrating = false;
      this.isInitialHydration = false;
      this.notifyListeners();
    }
  }

  private async notifyListeners(): Promise<void> {
    const pendingCount = await db.syncQueue
      .where('status')
      .anyOf(['PENDING', 'FAILED', 'IN_PROGRESS'])
      .count();

    const state = {
      isSyncing: this.isSyncing,
      isHydrating: this.isHydrating,
      isInitialHydration: this.isInitialHydration,
      pendingCount,
      lastSyncTime: this.lastSyncTime,
      lastError: this.lastError,
    };

    this.listeners.forEach(fn => fn(state));
  }

  async triggerSync(): Promise<void> {
    await db.syncQueue
      .where('status')
      .equals('FAILED')
      .modify({ retryCount: 0, status: 'PENDING' });

    await this.sync();

    const remaining = await db.syncQueue
      .where('status')
      .anyOf(['PENDING', 'FAILED', 'IN_PROGRESS'])
      .count();

    if (remaining === 0) {
      await this.hydrateDexie();
    }
  }
}

export const syncManager = new SyncManager();
