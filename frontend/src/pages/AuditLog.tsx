import { useState, useEffect } from 'react';
import { SectionCard } from '../components/SectionCard';

export function AuditLog() {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchLogs = async () => {
    try {
      const token = localStorage.getItem('fitflow_token');
      const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:4000'}/api/audit`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to fetch logs');
      setLogs(data.data || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  return (
    <div>
      <h2 className="text-lg font-bold text-text-primary mb-4">Audit Logs</h2>

      <SectionCard title="Recent Activity">
        {loading ? (
          <p className="text-sm text-text-muted">Loading logs...</p>
        ) : error ? (
          <p className="text-sm text-danger">{error}</p>
        ) : logs.length === 0 ? (
          <p className="text-sm text-text-muted">No activity recorded yet.</p>
        ) : (
          <div className="bg-surface border border-border-subtle text-sm rounded-lg overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border-subtle">
                  <th className="text-left px-4 py-2.5 text-xs font-medium text-text-muted">Time</th>
                  <th className="text-left px-4 py-2.5 text-xs font-medium text-text-muted">Action</th>
                  <th className="text-left px-4 py-2.5 text-xs font-medium text-text-muted">Entity</th>
                  <th className="text-left px-4 py-2.5 text-xs font-medium text-text-muted">Details</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log: any) => (
                  <tr key={log.id} className="border-b border-border-subtle/50 last:border-0 hover:bg-surface-hover transition-colors">
                    <td className="px-4 py-2.5 whitespace-nowrap text-text-muted">
                      {new Date(log.createdAt).toLocaleString()}
                    </td>
                    <td className="px-4 py-2.5">
                      <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                        log.action === 'CREATE' ? 'bg-green-500/15 text-green-400' :
                        log.action === 'UPDATE' ? 'bg-blue-500/15 text-blue-400' :
                        log.action === 'DELETE' ? 'bg-red-500/15 text-red-400' :
                        'bg-slate-500/15 text-slate-400'
                      }`}>
                        {log.action}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 text-text-secondary">
                      {log.metadata?.entity || log.entity || 'System'}
                      <span className="text-xs text-text-muted">
                        {log.metadata?.entityId ? ` (${String(log.metadata.entityId).slice(0, 8)})` : log.entityId ? ` (${String(log.entityId).slice(0, 8)})` : ''}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 text-text-muted max-w-xs truncate" title={JSON.stringify(log.metadata || {})}>
                      {JSON.stringify(log.metadata || {})}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </SectionCard>
    </div>
  );
}
