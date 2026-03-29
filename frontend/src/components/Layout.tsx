import { NavLink, Outlet } from 'react-router-dom';
import { SyncStatusBar } from './SyncStatusBar';
import { useAuth } from '../hooks/useAuth';
import {LayoutDashboard, Users, UserPlus, TrendingUp, CheckCircle, CreditCard, History, Activity} from "lucide-react";

const navItems = [
  { to: '/', label: 'Dashboard', icon: <LayoutDashboard size={16} /> },
  { to: '/members', label: 'Members', icon: <Users size={16} /> },
  { to: '/members/add', label: 'Add Member', icon: <UserPlus size={16} /> },
  { to: '/leads', label: 'Leads', icon: <TrendingUp size={16} /> },
  { to: '/checkin', label: 'Check In', icon: <CheckCircle size={16} /> },
  { to: '/payments', label: 'Payments', icon: <CreditCard size={16} /> },
  { to: '/audit', label: 'Audit Log', icon: <History size={16} /> },
  { to: '/live', label: 'Live View', icon: <Activity size={16} /> },
];

export function Layout() {
  const { user, logout } = useAuth();

  return (
    <div className="min-h-screen bg-base flex">
      <aside className="w-52 bg-surface border-r border-border-subtle flex flex-col">
        <div className="px-4 py-4 border-b border-border-subtle">
          <h1 className="text-sm font-bold text-text-primary tracking-tight">FitFlow</h1>
        </div>

        <nav className="flex-1 py-2 px-2 space-y-0.5">
          {navItems.map(item => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              className={({ isActive }) =>
                `flex items-center gap-2.5 px-3 py-2 text-sm rounded-md transition-colors ${
                  isActive
                    ? 'bg-brand/10 text-brand font-medium'
                    : 'text-text-secondary hover:bg-surface-hover hover:text-text-primary'
                }`
              }
            >
              {item.icon}
              {item.label}
            </NavLink>
          ))}
        </nav>

        {user && (
          <div className="px-4 py-3 border-t border-border-subtle">
            <p className="text-xs text-text-muted truncate">{user.username}</p>
            <button
              onClick={logout}
              className="mt-1.5 text-xs text-danger hover:text-danger-hover transition-colors"
            >
              Logout
            </button>
          </div>
        )}
      </aside>

      <main className="flex-1 p-6 pb-14 overflow-y-auto bg-base">
        <Outlet />
      </main>

      <SyncStatusBar />
    </div>
  );
}
