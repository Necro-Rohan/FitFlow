export interface IMember {
  id: string;
  fullName: string;
  phone: string;
  qrCode: string;
  status: 'ACTIVE' | 'EXPIRED' | 'PAUSED';
  managedById?: string;
  assignedTrainerId?: string;
  createdAt: Date;
  syncUpdatedAt: Date;
}

export interface IMembership {
  id: string;
  memberId: string;
  planName: string;
  startDate: Date;
  endDate: Date;
  type: 'SUBSCRIPTION' | 'CLASS_PACK' | 'PT';
  remainingClasses?: number;
  updatedAt: Date;
}

export interface IPayment {
  id: string;
  memberId: string;
  amount: number;
  method: 'UPI' | 'CASH' | 'CARD';
  syncStatus: 'PENDING' | 'SYNCED';
  invoiceNumber?: string;
  transactionDate: Date;
  isReversed?: boolean;
  reversedAt?: Date;
  reversedById?: string;
  reversalReason?: string;
}

export interface IAttendance {
  id: string;
  memberId: string;
  checkIn: Date;
  syncStatus: 'PENDING' | 'SYNCED';
  isReversed?: boolean;
  reversedAt?: Date;
  reversedById?: string;
  reversalReason?: string;
}

export interface ILead {
  id: string;
  name: string;
  phone: string;
  status: 'NEW' | 'FOLLOW_UP' | 'CONVERTED' | 'CLOSED';
  notes?: string;
  createdAt: Date;
}

export interface ISyncQueueItem {
  id?: number;
  entity: 'member' | 'membership' | 'payment' | 'attendance' | 'lead';
  entityId: string;
  action: 'CREATE' | 'UPDATE' | 'DELETE';
  payload: Record<string, unknown>;
  status: 'PENDING' | 'IN_PROGRESS' | 'SYNCED' | 'FAILED';
  retryCount: number;
  errorMessage?: string;
  createdAt: Date;
  lockedUntil?: Date; // undo window - SyncManager skips locked items
}

export interface IAuthUser {
  id: string;
  email: string;
  username: string;
  token: string;
}

export interface ISyncState {
  isOnline: boolean;
  pendingCount: number;
  lastSyncTime: Date | null;
  isSyncing: boolean;
  lastError: string | null;
}
