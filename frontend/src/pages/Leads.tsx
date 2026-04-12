import { useState, useEffect } from 'react';
import { db, addToSyncQueue } from '../db/dexie';
import type { ILead } from '../types';
import { SectionCard } from '../components/SectionCard';

export function Leads() {
  const [leads, setLeads] = useState<ILead[]>([]);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [status, setStatus] = useState<ILead['status']>('NEW');

  const loadLeads = async () => {
    const all = await db.leads.toArray();
    setLeads(all);
  };

  useEffect(() => {
    loadLeads();
  }, []);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !phone.trim()) return;

    const newLead = {
      id: crypto.randomUUID(),
      name,
      phone,
      status,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    await db.leads.add(newLead);
    await addToSyncQueue('lead', newLead.id, 'CREATE', { ...newLead });

    setName('');
    setPhone('');
    setStatus('NEW');
    loadLeads();
  };

  const handleWhatsApp = (phone: string, name: string) => {
    const text = encodeURIComponent(`Hi ${name}, following up on your inquiry!`);
    window.open(`https://wa.me/91${phone}?text=${text}`, '_blank');
  };

  const handleDelete = async (id: string) => {
    await db.leads.delete(id);
    await addToSyncQueue('lead', id, 'DELETE', { id });
    loadLeads();
  };

  const inputClass = "w-full px-3.5 py-2.5 bg-base border border-border-subtle rounded-lg text-sm text-text-primary placeholder-text-muted/50 focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent/30 transition-colors";

  return (
    <div>
      <h2 className="text-lg font-bold text-text-primary mb-4">Leads</h2>

      <div className="max-w-lg mb-5">
        <SectionCard title="Add New Lead">
          <form onSubmit={handleAdd} className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-text-muted mb-1.5">Name</label>
              <input type="text" value={name} onChange={e => setName(e.target.value)} className={inputClass} required />
            </div>
            <div>
              <label className="block text-sm font-medium text-text-muted mb-1.5">Phone</label>
              <input type="text" value={phone} onChange={e => setPhone(e.target.value)} className={inputClass} required />
            </div>
            <div>
              <label className="block text-sm font-medium text-text-muted mb-1.5">Status</label>
              <select value={status} onChange={e => setStatus(e.target.value as ILead['status'])} className={inputClass}>
                <option value="NEW">NEW</option>
                <option value="FOLLOW_UP">FOLLOW UP</option>
                <option value="CONVERTED">CONVERTED</option>
                <option value="CLOSED">CLOSED</option>
              </select>
            </div>
            <button type="submit" className="w-full px-4 py-2.5 bg-brand text-white rounded-lg font-medium hover:bg-brand-hover transition-colors">Add Lead</button>
          </form>
        </SectionCard>
      </div>

      <div className="bg-surface border border-border-subtle rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border-subtle">
              <th className="text-left px-4 py-2.5 text-xs font-medium text-text-muted">Name</th>
              <th className="text-left px-4 py-2.5 text-xs font-medium text-text-muted">Phone</th>
              <th className="text-left px-4 py-2.5 text-xs font-medium text-text-muted">Status</th>
              <th className="text-right px-4 py-2.5 text-xs font-medium text-text-muted">Actions</th>
            </tr>
          </thead>
          <tbody>
            {leads.map(lead => (
              <tr key={lead.id} className="border-b border-border-subtle/50 hover:bg-surface-hover transition-colors">
                <td className="px-4 py-2.5 font-medium text-text-primary">{lead.name}</td>
                <td className="px-4 py-2.5 text-text-secondary">{lead.phone}</td>
                <td className="px-4 py-2.5">
                  <span className={`px-2 py-0.5 text-xs font-medium rounded ${lead.status === 'NEW' ? 'bg-blue-500/15 text-blue-400' : lead.status === 'FOLLOW_UP' ? 'bg-yellow-500/15 text-yellow-400' : lead.status === 'CONVERTED' ? 'bg-green-500/15 text-green-400' : 'bg-slate-500/15 text-slate-400'}`}>
                    {lead.status}
                  </span>
                </td>
                <td className="px-4 py-2.5 text-right space-x-3">
                  <button onClick={() => handleWhatsApp(lead.phone, lead.name)} className="text-xs text-brand hover:text-brand-hover transition-colors">WhatsApp</button>
                  <button onClick={() => handleDelete(lead.id)} className="text-xs text-danger hover:text-danger-hover transition-colors">Delete</button>
                </td>
              </tr>
            ))}
            {leads.length === 0 && (
              <tr>
                <td colSpan={4} className="px-4 py-6 text-center text-text-muted">No leads found.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
