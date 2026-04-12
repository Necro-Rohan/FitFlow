import { useState, useEffect } from 'react';
import { syncManager } from '../sync/SyncManager';

interface SyncHookState {
  isSyncing: boolean;
  isHydrating: boolean;
  isInitialHydration: boolean;
  pendingCount: number;
  lastSyncTime: Date | null;
  lastError: string | null;
  triggerSync: () => Promise<void>;
}

export function useSync(): SyncHookState {
  const [state, setState] = useState({
    isSyncing: false,
    isHydrating: false,
    isInitialHydration: false,
    pendingCount: 0,
    lastSyncTime: null as Date | null,
    lastError: null as string | null,
  });

  useEffect(() => {
    const unsubscribe = syncManager.subscribe((syncState) => {
      setState(syncState);
    });
    return unsubscribe;
  }, []);

  return {
    ...state,
    triggerSync: () => syncManager.triggerSync(),
  };
}
