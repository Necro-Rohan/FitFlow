import { useState, useEffect, useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { db, addToSyncQueue } from '../db/dexie';
import type { IPayment } from '../types';

export function usePayments() {
  const [payments, setPayments] = useState<IPayment[]>([]);
  const [loading, setLoading] = useState(true);

  const loadPayments = useCallback(async () => {
    setLoading(true);
    const all = await db.payments.orderBy('transactionDate').reverse().toArray();
    setPayments(all.filter(p => !p.isReversed));
    setLoading(false);
  }, []);

  useEffect(() => {
    loadPayments();
  }, [loadPayments]);

  const addPayment = useCallback(async (data: {
    memberId: string;
    amount: number;
    method: 'UPI' | 'CASH' | 'CARD';
    extensionMonths?: number;
  }): Promise<IPayment> => {
    const now = new Date();
    const payment: IPayment = {
      id: uuidv4(),
      memberId: data.memberId,
      amount: data.amount,
      method: data.method,
      syncStatus: 'PENDING',
      transactionDate: now,
    };

    await db.payments.add(payment);

    const lockedUntil = new Date(now.getTime() + 5000);
    await addToSyncQueue('payment', payment.id, 'CREATE', {
      id: payment.id,
      memberId: payment.memberId,
      amount: payment.amount,
      method: payment.method,
      transactionDate: now.toISOString(),
    }, lockedUntil);

    // if theres a plan extension, bump the membership end date
    if (data.extensionMonths && data.extensionMonths > 0) {
      const membership = await db.memberships
        .where('memberId')
        .equals(data.memberId)
        .first();

      if (membership) {
        const nextEndDate = new Date(membership.endDate);
        if (nextEndDate < now) {
          nextEndDate.setTime(now.getTime());
        }
        nextEndDate.setMonth(nextEndDate.getMonth() + data.extensionMonths);

        await db.memberships.update(membership.id, { endDate: nextEndDate, updatedAt: now });

        await addToSyncQueue('membership', membership.id, 'UPDATE', {
          id: membership.id,
          endDate: nextEndDate.toISOString(),
        }, lockedUntil);
      }
    }

    setPayments(prev => [payment, ...prev]);
    return payment;
  }, []);

  const undoPayment = useCallback(async (paymentId: string) => {
    await db.payments.delete(paymentId);
    await db.syncQueue
      .where('entityId')
      .equals(paymentId)
      .and(item => item.action === 'CREATE')
      .delete();
    setPayments(prev => prev.filter(p => p.id !== paymentId));
  }, []);

  const reversePayment = useCallback(async (paymentId: string, reason?: string) => {
    const now = new Date();
    await db.payments.update(paymentId, {
      isReversed: true,
      reversedAt: now,
      reversalReason: reason,
    });
    await addToSyncQueue('payment', paymentId, 'UPDATE', {
      id: paymentId,
      isReversed: true,
      reversedAt: now.toISOString(),
      reversalReason: reason,
    });
    setPayments(prev => prev.filter(p => p.id !== paymentId));
  }, []);

  // TODO: could add pagination here if the list gets too long
  const getPaymentsByMember = useCallback(async (memberId: string): Promise<IPayment[]> => {
    return db.payments
      .where('memberId')
      .equals(memberId)
      .reverse()
      .toArray();
  }, []);

  const todayTotal = payments
    .filter(p => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      return new Date(p.transactionDate) >= today;
    })
    .reduce((sum, p) => sum + p.amount, 0);

  return { 
    payments, 
    loading, 
    addPayment, 
    undoPayment,
    reversePayment,
    getPaymentsByMember, 
    todayTotal, 
    reload: loadPayments 
  };
}
