// Auth
export interface LoginDTO {
  email: string;
  password: string;
}

export interface RegisterUserDTO {
  email: string;
  password: string;
  username: string;
}

// Member
export interface CreateMemberDTO {
  id: string;
  fullName: string;
  phone: string;
  qrCode: string;
  status?: string;
  assignedTrainerId?: string | null;
}

export interface UpdateMemberDTO {
  fullName?: string;
  phone?: string;
  status?: string;
  assignedTrainerId?: string | null | undefined;
}

// Membership
export interface CreateMembershipDTO {
  id: string;
  memberId: string;
  planName: string;
  startDate: string; // ISO string, parsed on backend
  endDate: string;
  type: string;
  remainingClasses?: number | null;
}

export interface UpdateMembershipDTO {
  planName?: string;
  endDate?: string;
  remainingClasses?: number | null;
}

// Payment
export interface CreatePaymentDTO {
  id: string;
  memberId: string;
  amount: number;
  method: string;
  invoiceNumber?: string | null;
  transactionDate?: string;
}

// Attendance
export interface CreateAttendanceDTO {
  id: string;
  memberId: string;
  checkIn: string;
}

// Lead
export interface CreateLeadDTO {
  id: string;
  name: string;
  phone: string;
  status?: string;
  notes?: string | null;
}

export interface UpdateLeadDTO {
  name?: string;
  phone?: string;
  status?: string;
  notes?: string | null;
}

// Sync - batch payload from the frontend SyncManager
export interface SyncItemDTO {
  entity: 'member' | 'membership' | 'payment' | 'attendance' | 'lead';
  entityId: string;
  action: 'CREATE' | 'UPDATE' | 'DELETE';
  payload: Record<string, unknown>;
  clientTimestamp: string;
}

export interface SyncBatchDTO {
  items: SyncItemDTO[];
}

export interface SyncResultItem {
  entityId: string;
  entity: string;
  success: boolean;
  error?: string;
}

export interface SyncBatchResponse {
  processed: number;
  failed: number;
  results: SyncResultItem[];
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}
