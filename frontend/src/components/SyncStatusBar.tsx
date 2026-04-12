import { useOnlineStatus } from '../hooks/useOnlineStatus';
import { useSync } from '../hooks/useSync';
import { useState, useEffect } from 'react';

export function SyncStatusBar() {
  const isOnline = useOnlineStatus();
  const { isSyncing, isHydrating, pendingCount, lastSyncTime, lastError, triggerSync } = useSync();
  const [ticker, setTicker] = useState('0s ago');

  useEffect(() => {
    if (!lastSyncTime) return;
    const interval = setInterval(() => {
      const diff = Math.floor((new Date().getTime() - lastSyncTime.getTime()) / 1000);
      if (diff < 60) setTicker(`${diff}s ago`);
      else setTicker(`${Math.floor(diff / 60)}m ago`);
    }, 1000);
    return () => clearInterval(interval);
  }, [lastSyncTime]);

  const hasCriticalError = !!lastError && isOnline;

  return (
    <div className={`fixed bottom-0 left-0 right-0 border-t px-4 py-2 flex items-center justify-between text-xs z-50 ${!isOnline ? 'bg-amber-900/30 border-amber-600/30 text-amber-300' : hasCriticalError ? 'bg-red-900/30 border-red-600/30 text-red-300' : 'bg-surface border-border-subtle text-text-muted'}`}>
      <div className="flex items-center gap-3">
        {!isOnline && (
          <span>Offline — changes saved locally</span>
        )}
        {isOnline && hasCriticalError && (
           <span>Sync error: {lastError}</span>
        )}
        {isOnline && !hasCriticalError && (
           <span className="flex items-center gap-1.5">
             <span className="inline-block w-1.5 h-1.5 rounded-full bg-brand"></span>
             Online
           </span>
        )}

        {pendingCount > 0 && !hasCriticalError && (
          <span className="text-warning">{pendingCount} pending</span>
        )}

        {(isSyncing || isHydrating) && <span className="text-accent">{isHydrating ? 'Syncing data...' : 'Syncing...'}</span>}
      </div>

      <div className="flex items-center gap-3">
        {lastSyncTime && !(!isOnline || hasCriticalError) && (
          <span>Last sync {ticker}</span>
        )}

        {pendingCount > 0 && isOnline && !isSyncing && (
          <button
            onClick={triggerSync}
            className="px-2.5 py-1 bg-brand/10 hover:bg-brand/20 text-brand rounded text-xs font-medium transition-colors"
          >
            Sync Now
          </button>
        )}
      </div>
    </div>
  );
}
