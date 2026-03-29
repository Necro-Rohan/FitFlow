interface StatusBadgeProps {
  status: string;
}

const colorMap: Record<string, string> = {
  ACTIVE: 'bg-green-500/15 text-green-400',
  EXPIRED: 'bg-red-500/15 text-red-400',
  PAUSED: 'bg-yellow-500/15 text-yellow-400',
  PENDING: 'bg-orange-500/15 text-orange-400',
  SYNCED: 'bg-blue-500/15 text-blue-400',
  FAILED: 'bg-red-500/15 text-red-400',
  NEW: 'bg-blue-500/15 text-blue-400',
  FOLLOW_UP: 'bg-yellow-500/15 text-yellow-400',
  CONVERTED: 'bg-green-500/15 text-green-400',
  CLOSED: 'bg-slate-500/15 text-slate-400',
};

export function StatusBadge({ status }: StatusBadgeProps) {
  const colors = colorMap[status] || 'bg-slate-500/15 text-slate-400';

  return (
    <span className={`inline-block px-2 py-0.5 text-xs font-medium rounded ${colors}`}>
      {status}
    </span>
  );
}
