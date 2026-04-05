import { useState, useEffect } from 'react';
import { useMembers } from '../hooks/useMembers';
import { StatusBadge } from '../components/StatusBadge';
import { Link } from 'react-router-dom';
import type { IMember } from '../types';
import QRCodeLib from 'react-qr-code';
const QRCode = (QRCodeLib as any).default || QRCodeLib;

export function MemberList() {
  const { members, loading, searchMembers, deleteMember } = useMembers();
  const [searchQuery, setSearchQuery] = useState('');
  const [filtered, setFiltered] = useState<IMember[]>([]);

  useEffect(() => {
    if (searchQuery.trim()) {
      searchMembers(searchQuery).then(setFiltered);
    } else {
      setFiltered(members);
    }
  }, [searchQuery, members, searchMembers]);

  const handleDelete = async (id: string, name: string) => {
    if (window.confirm(`Delete "${name}"? This cannot be undone.`)) {
      await deleteMember(id);
    }
  };

  if (loading) {
    return <p className="text-sm text-text-muted">Loading members...</p>;
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-bold text-text-primary">Members</h2>
        <Link
          to="/members/add"
          className="px-3 py-2 text-sm bg-brand text-white rounded-lg hover:bg-brand-hover font-medium transition-colors"
        >
          + Add Member
        </Link>
      </div>

      <div className="mb-4">
        <input
          type="text"
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          placeholder="Search by name or phone..."
          className="w-full max-w-md px-3.5 py-2.5 bg-surface border border-border-subtle rounded-lg text-sm text-text-primary placeholder-text-muted/50 focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent/30 transition-colors"
        />
      </div>

      {filtered.length === 0 ? (
        <p className="text-sm text-text-muted">No members found.</p>
      ) : (
        <div className="bg-surface border border-border-subtle rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border-subtle">
                <th className="text-left px-4 py-2.5 text-xs font-medium text-text-muted">Name</th>
                <th className="text-left px-4 py-2.5 text-xs font-medium text-text-muted">Phone</th>
                <th className="text-left px-4 py-2.5 text-xs font-medium text-text-muted">QR</th>
                <th className="text-left px-4 py-2.5 text-xs font-medium text-text-muted">Status</th>
                <th className="text-left px-4 py-2.5 text-xs font-medium text-text-muted">Joined</th>
                <th className="text-right px-4 py-2.5 text-xs font-medium text-text-muted">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(member => (
                <tr key={member.id} className="border-b border-border-subtle/50 hover:bg-surface-hover transition-colors">
                  <td className="px-4 py-2.5 font-medium text-text-primary">{member.fullName}</td>
                  <td className="px-4 py-2.5 text-text-secondary">{member.phone}</td>
                  <td className="px-4 py-2.5">
                    {member.qrCode ? (
                      <div className="w-12 h-12 bg-white p-1 rounded">
                        <QRCode value={member.qrCode} size={48} style={{ width: '100%', height: '100%' }} />
                      </div>
                    ) : (
                      <span className="text-text-muted text-xs">N/A</span>
                    )}
                  </td>
                  <td className="px-4 py-2.5"><StatusBadge status={member.status} /></td>
                  <td className="px-4 py-2.5 text-text-muted">
                    {new Date(member.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-2.5 text-right">
                    <button
                      onClick={() => handleDelete(member.id, member.fullName)}
                      className="text-xs text-danger hover:text-danger-hover transition-colors"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <p className="text-xs text-text-muted mt-2">{filtered.length} members</p>
    </div>
  );
}
