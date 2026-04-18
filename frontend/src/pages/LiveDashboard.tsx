import { useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { useAttendance } from '../hooks/useAttendance';
import { usePayments } from '../hooks/usePayments';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:4000';

export function LiveDashboard() {
  const { todayCount: initialCheckIns } = useAttendance();
  const { todayTotal: initialRevenue } = usePayments();

  const [liveCheckIns, setLiveCheckIns] = useState(0);
  const [liveRevenue, setLiveRevenue] = useState(0);
  const [lastEvent, setLastEvent] = useState<string | null>(null);

  useEffect(() => {
    setLiveCheckIns(initialCheckIns);
  }, [initialCheckIns]);

  useEffect(() => {
    setLiveRevenue(initialRevenue);
  }, [initialRevenue]);

  useEffect(() => {
    const socket = io(API_BASE, {
      transports: ['websocket'],
    });

    socket.on('connect', () => {
      console.log('Live dashboard connected');
    });

    socket.on('check_in_update', () => {
      setLiveCheckIns(prev => prev + 1);
      setLastEvent('New check-in received');
      flashEvent();
    });

    socket.on('sync_payment_update', () => {
      setLastEvent('Payment synced');
      flashEvent();
    });

    return () => { socket.disconnect(); };
  }, []);

  const flashEvent = () => {
    setTimeout(() => setLastEvent(null), 3000);
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-5">
        <h2 className="text-lg font-bold text-text-primary">Live Dashboard</h2>
        <div className="flex items-center gap-1.5">
          <span className="inline-block w-2 h-2 rounded-full bg-brand"></span>
          <span className="text-xs font-medium text-brand">Live</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-surface border border-border-subtle p-5 rounded-lg">
          <p className="text-text-muted text-xs mb-1">Today's Check-ins</p>
          <p className="text-4xl font-bold text-text-primary tabular-nums">{liveCheckIns}</p>
        </div>

        <div className="bg-surface border border-border-subtle p-5 rounded-lg">
          <p className="text-text-muted text-xs mb-1">Today's Revenue</p>
          <p className="text-4xl font-bold text-text-primary tabular-nums">₹{liveRevenue.toLocaleString()}</p>
        </div>
      </div>

      {lastEvent && (
        <div className="mt-4 p-3 bg-accent/10 border border-accent/20 text-accent rounded-lg text-sm">
          {lastEvent}
        </div>
      )}
    </div>
  );
}
