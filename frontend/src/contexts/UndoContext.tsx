import { createContext, useContext, useState, useEffect, type ReactNode, useCallback } from 'react';

export interface IUndoAction {
  id: string; // The entity or record ID
  message: string;
  onUndo: () => void;
  timestamp: number;
}

interface UndoContextType {
  addUndoTrigger: (action: Omit<IUndoAction, 'timestamp'>) => void;
  removeUndoTrigger: (id: string) => void;
}

const UndoContext = createContext<UndoContextType | null>(null);

export function useUndoStack() {
  const ctx = useContext(UndoContext);
  if (!ctx) throw new Error('useUndoStack must be used within UndoProvider');
  return ctx;
}

export function UndoProvider({ children }: { children: ReactNode }) {
  const [undoStack, setUndoStack] = useState<IUndoAction[]>([]);

  const addUndoTrigger = useCallback((action: Omit<IUndoAction, 'timestamp'>) => {
    setUndoStack(prev => [...prev, { ...action, timestamp: Date.now() }]);
  }, []);

  const removeUndoTrigger = useCallback((id: string) => {
    setUndoStack(prev => prev.filter(a => a.id !== id));
  }, []);

  return (
    <UndoContext.Provider value={{ addUndoTrigger, removeUndoTrigger }}>
      {children}
      <div className="fixed bottom-14 right-4 z-[60] flex flex-col gap-2 pointer-events-none">
        {undoStack.map(action => (
          <UndoToastItem 
            key={action.id} 
            action={action} 
            onExpire={() => removeUndoTrigger(action.id)} 
          />
        ))}
      </div>
    </UndoContext.Provider>
  );
}

function UndoToastItem({ action, onExpire }: { action: IUndoAction, onExpire: () => void }) {
  const durationMs = 5000;
  const [timeLeft, setTimeLeft] = useState(durationMs);

  useEffect(() => {
    if (timeLeft <= 0) {
      onExpire();
      return;
    }
    const timerId = setTimeout(() => {
      setTimeLeft(prev => prev - 100);
    }, 100);
    return () => clearTimeout(timerId);
  }, [timeLeft, onExpire]);

  return (
    <div className="bg-surface border border-border-subtle text-text-primary shadow-sm rounded-lg flex items-center justify-between gap-4 px-4 py-2.5 min-w-[280px] pointer-events-auto animate-fade-in-up">
      <span className="text-sm">{action.message}</span>
      <button
        onClick={() => {
          action.onUndo();
          onExpire();
        }}
        className="text-brand text-sm font-medium hover:text-brand-hover transition-colors shrink-0"
      >
        Undo ({Math.ceil(timeLeft / 1000)})
      </button>
    </div>
  );
}
