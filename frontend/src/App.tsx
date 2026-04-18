import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useEffect } from 'react';
import { syncManager } from './sync/SyncManager';
import { useAuth, AuthProvider } from './hooks/useAuth';
import { Layout } from './components/Layout';
import { Login } from './pages/Login';
import { Dashboard } from './pages/Dashboard';
import { MemberList } from './pages/MemberList';
import { AddMember } from './pages/AddMember';
import { Leads } from './pages/Leads';
import { AuditLog } from './pages/AuditLog';
import { CheckIn } from './pages/CheckIn';
import { Payments } from './pages/Payments';
import { LiveDashboard } from './pages/LiveDashboard';
import { UndoProvider } from './contexts/UndoContext';
import { useSync } from './hooks/useSync';

function AppRoutes() {
  const { isLoggedIn } = useAuth();
  const { isInitialHydration, isHydrating } = useSync();

  useEffect(() => {
    if (isLoggedIn) {
      syncManager.start();
    }
    return () => { syncManager.stop(); };
  }, [isLoggedIn]);

  if (!isLoggedIn) {
    return <Login />;
  }

  // show loading spinner only on first ever sync (empty db)
  if (isInitialHydration && isHydrating) {
    return (
      <div className="min-h-screen bg-base flex flex-col items-center justify-center">
        <div className="w-8 h-8 border-2 border-border-subtle border-t-text-muted rounded-full animate-spin"></div>
        <p className="mt-3 text-sm text-text-muted">Loading data...</p>
      </div>
    );
  }

  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<Dashboard />} />
        <Route path="/members" element={<MemberList />} />
        <Route path="/members/add" element={<AddMember />} />
        <Route path="/leads" element={<Leads />} />
        <Route path="/audit" element={<AuditLog />} />
        <Route path="/checkin" element={<CheckIn />} />
        <Route path="/payments" element={<Payments />} />
        <Route path="/live" element={<LiveDashboard />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <UndoProvider>
        <BrowserRouter>
          <AppRoutes />
        </BrowserRouter>
      </UndoProvider>
    </AuthProvider>
  );
}
