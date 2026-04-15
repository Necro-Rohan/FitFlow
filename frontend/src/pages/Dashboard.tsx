import { useAttendance } from '../hooks/useAttendance';
import { usePayments } from '../hooks/usePayments';
import { useSync } from '../hooks/useSync';
import { useOnlineStatus } from '../hooks/useOnlineStatus';
import { SectionCard } from '../components/SectionCard';
import { useEffect, useState } from 'react';
import { db } from '../db/dexie';

export function Dashboard() {
  const { todayCount } = useAttendance();
  const { todayTotal } = usePayments();
  const { pendingCount, lastSyncTime, isSyncing } = useSync();
  const isOnline = useOnlineStatus();
  const [totalMembers, setTotalMembers] = useState(0);

  useEffect(() => {
    db.members.count().then(setTotalMembers);
  }, []);

  return (
    <div>
      <h2 className="text-lg font-bold text-text-primary mb-4">Dashboard</h2>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-5">
        <StatBox label="Check-ins today" value={todayCount} />
        <StatBox label="Revenue today" value={`₹${todayTotal.toLocaleString()}`} />
        <StatBox label="Total members" value={totalMembers} />
        <StatBox
          label="Sync"
          value={isSyncing ? 'Syncing...' : pendingCount > 0 ? `${pendingCount} pending` : 'Up to date'}
        />
      </div>

      <SectionCard title="System">
        <div className="text-sm text-text-secondary space-y-2">
          <div className="flex justify-between">
            <span className="text-text-muted">Connection</span>
            <span className={isOnline ? 'text-brand' : 'text-danger'}>
              {isOnline ? 'Online' : 'Offline'}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-text-muted">Pending items</span>
            <span>{pendingCount}</span>
          </div>
          {lastSyncTime && (
            <div className="flex justify-between">
              <span className="text-text-muted">Last sync</span>
              <span>{lastSyncTime.toLocaleTimeString()}</span>
            </div>
          )}
        </div>
      </SectionCard>
    </div>
  );
}

function StatBox({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="bg-surface border border-border-subtle rounded-lg p-4">
      <p className="text-xs text-text-muted">{label}</p>
      <p className="text-xl font-bold text-text-primary mt-1 tabular-nums">{value}</p>
    </div>
  );
}
