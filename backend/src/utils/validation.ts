import { z } from 'zod';

// Auth
export const loginSchema = z.object({
  email: z.string().email('Enter a valid email address.'),
  password: z.string().min(6, 'Password must be at least 6 characters.'),
});

export const registerSchema = z.object({
  email: z.string().email('Enter a valid email address.'),
  password: z.string().min(6, 'Password must be at least 6 characters.'),
  username: z.string().min(2, 'Username must be at least 2 characters.').max(100),
});

// Member
export const createMemberSchema = z.object({
  id: z.string().uuid('A valid UUID is required.'),
  fullName: z.string().min(1, 'Name is required.').max(200),
  phone: z.string().min(10, 'Phone number must be at least 10 digits.').max(15),
  qrCode: z.string().min(1, 'QR code is required.'),
  status: z.enum(['ACTIVE', 'EXPIRED', 'PAUSED']).optional().default('ACTIVE'),
  assignedTrainerId: z.string().uuid().optional().nullable(),
});

export const updateMemberSchema = z.object({
  fullName: z.string().min(1).max(200).optional(),
  phone: z.string().min(10).max(15).optional(),
  status: z.enum(['ACTIVE', 'EXPIRED', 'PAUSED']).optional(),
  assignedTrainerId: z.string().uuid().optional().nullable(),
});

// Membership
export const createMembershipSchema = z.object({
  id: z.string().uuid(),
  memberId: z.string().uuid(),
  planName: z.string().min(1, 'Plan name is required.').max(100),
  startDate: z.string().refine((d) => !isNaN(Date.parse(d)), 'Enter a valid date.'),
  endDate: z.string().refine((d) => !isNaN(Date.parse(d)), 'Enter a valid date.'),
  type: z.enum(['SUBSCRIPTION', 'CLASS_PACK', 'PT']),
  remainingClasses: z.number().int().min(0).optional().nullable(),
});

export const updateMembershipSchema = z.object({
  planName: z.string().min(1).max(100).optional(),
  endDate: z.string().refine((d) => !isNaN(Date.parse(d)), 'Enter a valid date.').optional(),
  remainingClasses: z.number().int().min(0).optional().nullable(),
});

// Payment
export const createPaymentSchema = z.object({
  id: z.string().uuid(),
  memberId: z.string().uuid(),
  amount: z.number().positive('Amount must be positive.'),
  method: z.enum(['UPI', 'CASH', 'CARD']),
  invoiceNumber: z.string().max(50).optional().nullable(),
  transactionDate: z.string().refine((d) => !isNaN(Date.parse(d)), 'Enter a valid date.').optional(),
});

// Attendance
export const createAttendanceSchema = z.object({
  id: z.string().uuid(),
  memberId: z.string().uuid(),
  checkIn: z.string().refine((d) => !isNaN(Date.parse(d)), 'Enter a valid timestamp.'),
});

// Lead
export const createLeadSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1, 'Name is required.').max(200),
  phone: z.string().min(10).max(15),
  status: z.enum(['NEW', 'FOLLOW_UP', 'CONVERTED', 'CLOSED']).optional().default('NEW'),
  notes: z.string().optional().nullable(),
});

export const updateLeadSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  phone: z.string().min(10).max(15).optional(),
  status: z.enum(['NEW', 'FOLLOW_UP', 'CONVERTED', 'CLOSED']).optional(),
  notes: z.string().optional().nullable(),
});

// Sync batch - the whole payload gets validated at once
export const syncItemSchema = z.object({
  entity: z.enum(['member', 'membership', 'payment', 'attendance', 'lead']),
  entityId: z.string().uuid(),
  action: z.enum(['CREATE', 'UPDATE', 'DELETE']),
  payload: z.record(z.unknown()),
  clientTimestamp: z.string().refine((d) => !isNaN(Date.parse(d)), 'Valid ISO timestamp required.'),
});

export const syncBatchSchema = z.object({
  items: z.array(syncItemSchema).min(1, 'At least one item is required.'),
});
