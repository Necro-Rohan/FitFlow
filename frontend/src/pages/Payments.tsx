import { useState, useEffect, type FormEvent } from 'react';
import { MemberSearchBar } from '../components/MemberSearchBar';
import { usePayments } from '../hooks/usePayments';
import { SectionCard } from '../components/SectionCard';
import { PrimaryButton } from '../components/PrimaryButton';
import type { IMember } from '../types';
import { db } from '../db/dexie';
import { useUndoStack } from '../contexts/UndoContext';
import { hashPIN, getOwnerPinHash, setOwnerPinHash } from '../utils/crypto';

export function Payments() {
  const { payments, loading, addPayment, undoPayment, reversePayment, todayTotal } = usePayments();
  const { addUndoTrigger } = useUndoStack();
  const [selectedMember, setSelectedMember] = useState<IMember | null>(null);
  const [amount, setAmount] = useState('');
  const [extensionMonths, setExtensionMonths] = useState(1);
  const [method, setMethod] = useState<'UPI' | 'CASH' | 'CARD'>('CASH');
  const [saving, setSaving] = useState(false);
  const [memberNames, setMemberNames] = useState<Record<string, string>>({});

  useEffect(() => {
    const loadNames = async () => {
      const names: Record<string, string> = {};
      for (const p of payments) {
        if (!names[p.memberId]) {
          const member = await db.members.get(p.memberId);
          names[p.memberId] = member?.fullName || 'Unknown';
        }
      }
      setMemberNames(names);
    };
    loadNames();
  }, [payments]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (!selectedMember || !amount) return;

    setSaving(true);

    const record = await addPayment({
      memberId: selectedMember.id,
      amount: parseFloat(amount),
      method,
      extensionMonths,
    });

    const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    addUndoTrigger({
      id: record.id,
      message: `₹${record.amount} ${record.method} payment at ${timeStr}`,
      onUndo: () => undoPayment(record.id)
    });

    // reset form
    setSelectedMember(null);
    setAmount('');
    setExtensionMonths(1);
    setMethod('CASH');
    setSaving(false);
  };

  const handleReverse = async (paymentId: string) => {
    let pinHash = getOwnerPinHash();
    if (!pinHash) {
       pinHash = await hashPIN("admin123");
       setOwnerPinHash(pinHash);
    }

    const pin = window.prompt("Enter PIN to reverse this payment:");
    if (!pin) return;

    const inputHash = await hashPIN(pin);

    if (inputHash === pinHash) {
      reversePayment(paymentId);
    } else {
      window.alert("Wrong PIN.");
    }
  };

  return (
    <div>
      <h2 className="text-lg font-bold text-text-primary mb-4">Payments</h2>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div>
          <SectionCard title="Record Payment">
            <form onSubmit={handleSubmit}>
              <div className="mb-3">
                <label className="block text-sm font-medium text-text-muted mb-1.5">Member</label>
                <MemberSearchBar onSelect={setSelectedMember} />
                {selectedMember && (
                  <p className="text-xs text-brand mt-1">Selected: {selectedMember.fullName}</p>
                )}
              </div>

              <div className="mb-3">
                <label className="block text-sm font-medium text-text-muted mb-1.5">Amount (₹)</label>
                <input
                  type="number"
                  value={amount}
                  onChange={e => setAmount(e.target.value)}
                  placeholder="1500"
                  min="1"
                  required
                  className="w-full px-3.5 py-2.5 bg-base border border-border-subtle rounded-lg text-sm text-text-primary placeholder-text-muted/50 focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent/30 transition-colors"
                />
              </div>

              <div className="mb-3">
                <label className="block text-sm font-medium text-text-muted mb-1.5">Extend Plan By</label>
                <select
                  value={extensionMonths}
                  onChange={(e) => setExtensionMonths(parseInt(e.target.value))}
                  className="w-full px-3.5 py-2.5 bg-base border border-border-subtle rounded-lg text-sm text-text-primary focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent/30 transition-colors"
                >
                  <option value={0}>No Extension</option>
                  <option value={1}>1 Month</option>
                  <option value={3}>3 Months</option>
                  <option value={12}>12 Months</option>
                </select>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-text-muted mb-1.5">Method</label>
                <div className="flex gap-2">
                  {(['CASH', 'UPI', 'CARD'] as const).map(m => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => setMethod(m)}
                      className={`px-4 py-2 text-sm rounded-lg font-medium border transition-colors ${
                        method === m
                          ? 'bg-brand text-white border-brand'
                          : 'bg-surface text-text-secondary border-border-subtle hover:bg-surface-hover'
                      }`}
                    >
                      {m}
                    </button>
                  ))}
                </div>
              </div>

              <PrimaryButton
                type="submit"
                loading={saving}
                disabled={!selectedMember || !amount}
              >
                Save Payment
              </PrimaryButton>
            </form>
          </SectionCard>

          <div className="bg-surface border border-border-subtle rounded-lg p-4 mt-4">
            <p className="text-xs text-text-muted">Today's collection</p>
            <p className="text-xl font-bold text-text-primary mt-1 tabular-nums">₹{todayTotal.toLocaleString()}</p>
          </div>
        </div>

        <div>
          <SectionCard title="Recent Payments">
            {loading ? (
              <p className="text-sm text-text-muted">Loading...</p>
            ) : payments.length === 0 ? (
              <p className="text-sm text-text-muted">No payments yet.</p>
            ) : (
              <div>
                {payments.slice(0, 20).map(p => (
                  <div key={p.id} className="flex items-center justify-between text-sm py-2.5 border-b border-border-subtle/50 last:border-0 group">
                    <div>
                      <span className="text-text-primary font-medium">
                        {memberNames[p.memberId] || p.memberId.slice(0, 8)}
                      </span>
                      <span className="text-text-muted ml-2 text-xs">{p.method}</span>
                      <span className="text-text-muted ml-2 text-xs">
                        {new Date(p.transactionDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="font-medium text-text-primary tabular-nums">₹{p.amount.toLocaleString()}</span>
                      <button 
                        onClick={() => handleReverse(p.id)}
                        className="text-xs text-danger hover:text-danger-hover opacity-0 group-hover:opacity-100 transition-opacity px-2 py-1"
                        title="Reverse this payment"
                      >
                        Reverse
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </SectionCard>
        </div>
      </div>
    </div>
  );
}
