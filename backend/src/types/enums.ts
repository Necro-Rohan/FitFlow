export enum MemberStatus {
  ACTIVE = 'ACTIVE',
  EXPIRED = 'EXPIRED',
  PAUSED = 'PAUSED',
}

export enum MembershipType {
  SUBSCRIPTION = 'SUBSCRIPTION',
  CLASS_PACK = 'CLASS_PACK',
  PT = 'PT',
}

export enum PaymentMethod {
  UPI = 'UPI',
  CASH = 'CASH',
  CARD = 'CARD',
}

export enum SyncStatus {
  PENDING = 'PENDING',
  SYNCED = 'SYNCED',
}

export enum LeadStatus {
  NEW = 'NEW',
  FOLLOW_UP = 'FOLLOW_UP',
  CONVERTED = 'CONVERTED',
  CLOSED = 'CLOSED',
}

export enum SyncAction {
  CREATE = 'CREATE',
  UPDATE = 'UPDATE',
  DELETE = 'DELETE',
}

export enum SyncEntity {
  MEMBER = 'member',
  MEMBERSHIP = 'membership',
  PAYMENT = 'payment',
  ATTENDANCE = 'attendance',
  LEAD = 'lead',
}
