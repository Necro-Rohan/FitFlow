import { MemberStatus, MembershipType, PaymentMethod, SyncStatus, LeadStatus } from './enums';

export interface IUser {
  id: string;
  email: string;
  username: string;
  isActive: boolean;
  createdAt: Date;
}

export interface IUserWithToken extends IUser {
  token: string;
}

export interface IMember {
  id: string;
  fullName: string;
  phone: string;
  qrCode: string;
  status: MemberStatus;
  managedById?: string | null;
  assignedTrainerId?: string | null;
  createdAt: Date;
  syncUpdatedAt: Date;
}

export interface IMembership {
  id: string;
  memberId: string;
  planName: string;
  startDate: Date;
  endDate: Date;
  type: MembershipType;
  remainingClasses?: number | null;
  updatedAt: Date;
}

export interface IPayment {
  id: string;
  memberId: string;
  amount: number;
  method: PaymentMethod;
  syncStatus: SyncStatus;
  invoiceNumber?: string | null;
  transactionDate: Date;
}

export interface IAttendance {
  id: string;
  memberId: string;
  checkIn: Date;
  syncStatus: SyncStatus;
}

export interface ILead {
  id: string;
  name: string;
  phone: string;
  status: LeadStatus;
  notes?: string | null;
  createdAt: Date;
}

export interface IAuditLog {
  id: string;
  userId: string;
  action: string;
  metadata?: Record<string, unknown> | null;
  createdAt: Date;
}
