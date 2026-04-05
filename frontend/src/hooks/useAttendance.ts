import { useState, useEffect, useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { db, addToSyncQueue } from '../db/dexie';
import type { IAttendance } from '../types';

export function useAttendance() {
  const [todayCheckIns, setTodayCheckIns] = useState<IAttendance[]>([]);
  const [loading, setLoading] = useState(true);

  const loadToday = useCallback(async () => {
    setLoading(true);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const checkIns = await db.attendance
      .where('checkIn')
      .aboveOrEqual(today)
      .reverse()
      .toArray();

    setTodayCheckIns(checkIns.filter(c => !c.isReversed));
    setLoading(false);
  }, []);

  useEffect(() => {
    loadToday();
  }, [loadToday]);

  const recordCheckIn = useCallback(async (memberId: string): Promise<IAttendance> => {
    const now = new Date();
    const record: IAttendance = {
      id: uuidv4(),
      memberId,
      checkIn: now,
      syncStatus: 'PENDING',
    };

    await db.attendance.add(record);

    // lock for 5s so the undo window works before sync picks it up
    const lockedUntil = new Date(now.getTime() + 5000);
    await addToSyncQueue('attendance', record.id, 'CREATE', {
      id: record.id,
      memberId: record.memberId,
      checkIn: now.toISOString(),
    }, lockedUntil);

    setTodayCheckIns(prev => [record, ...prev]);
    return record;
  }, []);

  const undoCheckIn = useCallback(async (attendanceId: string) => {
    await db.attendance.delete(attendanceId);
    await db.syncQueue
      .where('entityId')
      .equals(attendanceId)
      .and(item => item.action === 'CREATE')
      .delete();
    
    setTodayCheckIns(prev => prev.filter(c => c.id !== attendanceId));
  }, []);

  const reverseCheckIn = useCallback(async (attendanceId: string, reason?: string) => {
    const now = new Date();
    await db.attendance.update(attendanceId, {
      isReversed: true,
      reversedAt: now,
      reversalReason: reason,
    });
    await addToSyncQueue('attendance', attendanceId, 'UPDATE', {
      id: attendanceId,
      isReversed: true,
      reversedAt: now.toISOString(),
      reversalReason: reason,
    });
    setTodayCheckIns(prev => prev.filter(c => c.id !== attendanceId));
  }, []);

  const todayCount = todayCheckIns.length;

  return { 
    todayCheckIns, 
    todayCount, 
    loading, 
    recordCheckIn, 
    undoCheckIn,
    reverseCheckIn,
    reload: loadToday 
  };
}
