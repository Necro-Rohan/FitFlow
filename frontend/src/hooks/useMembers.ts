import { useState, useEffect, useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { db, addToSyncQueue } from '../db/dexie';
import type { IMember } from '../types';

export function useMembers() {
  const [members, setMembers] = useState<IMember[]>([]);
  const [loading, setLoading] = useState(true);

  const loadMembers = useCallback(async () => {
    setLoading(true);
    const all = await db.members.toArray();
    // not indexed so we just sort in-memory, its fine for now
    all.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    setMembers(all);
    setLoading(false);
  }, []);

  useEffect(() => {
    loadMembers();
  }, [loadMembers]);

  const addMember = useCallback(async (data: {
    fullName: string;
    phone: string;
    planName?: string;
    planDurationMonths?: number;
  }): Promise<IMember> => {
    const now = new Date();
    const member: IMember = {
      id: uuidv4(),
      fullName: data.fullName,
      phone: data.phone,
      qrCode: `QR-${uuidv4().slice(0, 8).toUpperCase()}`,
      status: 'ACTIVE',
      createdAt: now,
      syncUpdatedAt: now,
    };

    await db.members.add(member);

    await addToSyncQueue('member', member.id, 'CREATE', {
      id: member.id,
      fullName: member.fullName,
      phone: member.phone,
      qrCode: member.qrCode,
      status: member.status,
    });

    if (data.planName && data.planDurationMonths) {
      const endDate = new Date(now);
      endDate.setMonth(endDate.getMonth() + data.planDurationMonths);

      const membership = {
        id: uuidv4(),
        memberId: member.id,
        planName: data.planName,
        startDate: now,
        endDate: endDate,
        type: 'SUBSCRIPTION' as const,
        updatedAt: now,
      };

      await db.memberships.add(membership);
      await addToSyncQueue('membership', membership.id, 'CREATE', {
        id: membership.id,
        memberId: membership.memberId,
        planName: membership.planName,
        startDate: membership.startDate.toISOString(),
        endDate: membership.endDate.toISOString(),
        type: membership.type,
      });
    }

    setMembers(prev => [member, ...prev]);
    return member;
  }, []);

  const updateMember = useCallback(async (
    id: string,
    updates: Partial<Pick<IMember, 'fullName' | 'phone' | 'status'>>
  ): Promise<void> => {
    const syncUpdatedAt = new Date();
    await db.members.update(id, { ...updates, syncUpdatedAt });
    await addToSyncQueue('member', id, 'UPDATE', { ...updates });
    setMembers(prev =>
      prev.map(m => m.id === id ? { ...m, ...updates, syncUpdatedAt } : m)
    );
  }, []);

  const deleteMember = useCallback(async (id: string): Promise<void> => {
    await db.members.delete(id);
    await addToSyncQueue('member', id, 'DELETE', { id });
    setMembers(prev => prev.filter(m => m.id !== id));
  }, []);

  const searchMembers = useCallback(async (query: string): Promise<IMember[]> => {
    if (!query.trim()) {
      return db.members.toArray();
    }

    const lower = query.toLowerCase();
    // no full-text search in dexie, so manual filter it is
    return db.members
      .filter(m =>
        m.fullName.toLowerCase().includes(lower) ||
        m.phone.includes(query) ||
        m.qrCode.toLowerCase().includes(lower)
      )
      .toArray();
  }, []);

  return { members, loading, addMember, updateMember, deleteMember, searchMembers, reload: loadMembers };
}
