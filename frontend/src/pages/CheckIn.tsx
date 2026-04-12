import { useState, useEffect } from 'react';
import { MemberSearchBar } from '../components/MemberSearchBar';
import { useAttendance } from '../hooks/useAttendance';
import { SectionCard } from '../components/SectionCard';
import type { IMember } from '../types';
import { db } from '../db/dexie';
import { useUndoStack } from '../contexts/UndoContext';
import { hashPIN, getOwnerPinHash, setOwnerPinHash } from '../utils/crypto';
import { Html5QrcodeScanner } from 'html5-qrcode';

export function CheckIn() {
  const { todayCheckIns, todayCount, recordCheckIn, undoCheckIn, reverseCheckIn, loading } = useAttendance();
  const { addUndoTrigger } = useUndoStack();
  const [expiredWarning, setExpiredWarning] = useState<{ member: IMember, planName?: string, endDate?: Date } | null>(null);
  const [memberNames, setMemberNames] = useState<Record<string, string>>({});
  const [scanning, setScanning] = useState(false);

  useEffect(() => {
    const loadNames = async () => {
      const names: Record<string, string> = {};
      for (const c of todayCheckIns) {
        if (!names[c.memberId]) {
          const m = await db.members.get(c.memberId);
          names[c.memberId] = m?.fullName || 'Unknown';
        }
      }
      setMemberNames(names);
    };
    loadNames();
  }, [todayCheckIns]);

  useEffect(() => {
    if (!scanning) return;

    const scanner = new Html5QrcodeScanner(
      "reader",
      { fps: 10, qrbox: { width: 250, height: 250 } },
      false
    );

    scanner.render((decodedText) => {
      scanner.clear();
      setScanning(false);
      handleQrScan(decodedText);
    }, () => {
    });

    return () => {
      scanner.clear().catch(() => {});
    };
  }, [scanning]);

  const handleQrScan = async (qrData: string) => {
    const memberItems = await db.members.toArray();
    const found = memberItems.find(m => m.qrCode === qrData || m.id === qrData);
    if (found) {
      handleCheckInAttempt(found);
    } else {
      alert("Member not found with this QR code.");
    }
  };

  const handleCheckInAttempt = async (member: IMember) => {
    setExpiredWarning(null);

    const membership = await db.memberships.where('memberId').equals(member.id).first();
    const now = new Date();
    
    if (!membership || new Date(membership.endDate) < now) {
      setExpiredWarning({ 
        member, 
        planName: membership?.planName, 
        endDate: membership?.endDate ? new Date(membership.endDate) : undefined 
      });
      return;
    }

    await performCheckIn(member);
  };

  const performCheckIn = async (member: IMember) => {
    setExpiredWarning(null);
    const record = await recordCheckIn(member.id);
    
    const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    addUndoTrigger({
      id: record.id,
      message: `${member.fullName} checked in at ${timeStr}`,
      onUndo: () => undoCheckIn(record.id)
    });
  };

  const handleReverse = async (attendanceId: string) => {
    let pinHash = getOwnerPinHash();
    if (!pinHash) {
       pinHash = await hashPIN("admin123");
       setOwnerPinHash(pinHash);
    }

    const pin = window.prompt("Enter PIN to reverse this check-in:");
    if (!pin) return;

    const inputHash = await hashPIN(pin);

    if (inputHash === pinHash) {
      reverseCheckIn(attendanceId);
    } else {
      window.alert("Wrong PIN.");
    }
  };

  return (
    <div>
      <h2 className="text-lg font-bold text-text-primary mb-4">Check In</h2>

      <div className="max-w-lg">
        <SectionCard title="Search or Scan">
          <button 
            onClick={() => setScanning(!scanning)}
            className="px-4 py-2.5 bg-accent text-white rounded-lg hover:bg-accent-hover w-full font-medium transition-colors mb-4"
          >
            {scanning ? "Cancel Scan" : "Scan QR Code"}
          </button>
          
          {scanning ? (
            <div id="reader" className="w-full mb-4 rounded-lg overflow-hidden"></div>
          ) : (
            <MemberSearchBar
              onSelect={handleCheckInAttempt}
              placeholder="Search by name or phone..."
            />
          )}

          {expiredWarning && (
            <div className="mt-4 p-3 bg-danger/10 border border-danger/20 rounded-lg text-sm text-red-300">
              <p className="font-medium mb-1 text-red-400">Membership expired or missing</p>
              <p className="mb-2 text-red-300/80">
                {expiredWarning.member.fullName} doesn't have an active plan.
                {expiredWarning.endDate && ` ${expiredWarning.planName} expired on ${expiredWarning.endDate.toLocaleDateString()}.`}
              </p>
              <button 
                onClick={() => performCheckIn(expiredWarning.member)}
                className="px-3 py-1.5 bg-danger/20 hover:bg-danger/30 border border-danger/30 rounded-lg text-red-300 text-sm font-medium transition-colors"
              >
                Override & Check In
              </button>
            </div>
          )}
        </SectionCard>
      </div>

      <div className="max-w-lg mt-5">
        <SectionCard title={`Today's check-ins (${todayCount})`}>
          {loading ? (
            <p className="text-sm text-text-muted">Loading...</p>
          ) : todayCheckIns.length === 0 ? (
            <p className="text-sm text-text-muted">No check-ins yet today.</p>
          ) : (
            <div>
              {todayCheckIns.map(c => (
                <div key={c.id} className="flex justify-between items-center text-sm py-2 border-b border-border-subtle/50 last:border-0 group">
                  <div>
                    <span className="text-text-primary font-medium">
                      {memberNames[c.memberId] || c.memberId.slice(0, 8)}
                    </span>
                    <span className="text-text-muted ml-2 text-xs">
                      {new Date(c.checkIn).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <button 
                    onClick={() => handleReverse(c.id)}
                    className="text-xs text-danger hover:text-danger-hover opacity-0 group-hover:opacity-100 transition-opacity px-2 py-1"
                    title="Reverse this check-in"
                  >
                    Reverse
                  </button>
                </div>
              ))}
            </div>
          )}
        </SectionCard>
      </div>
    </div>
  );
}
