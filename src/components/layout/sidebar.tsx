import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  ClipboardList,
  Users,
  Globe,
  History,
  Shield,
  LogOut,
  ChevronLeft,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/stores/auth.store';
import { useSidebarStore } from '@/stores/sidebar.store';
import { isCoordinateur, isGerantStaff, isPoleResponsible } from '@/lib/utils';
import { Role } from '@/types';
import { t } from '@/i18n';

interface NavItem {
  to: string;
  label: string;
  icon: React.ReactNode;
  visible: boolean;
}

export default function Sidebar() {
  const user = useAuthStore((s) => s.user);
  const { isOpen, toggle } = useSidebarStore();
  const tr = t();

  if (!user) return null;

  const role = user.role;
  const canAccessPayroll =
    isCoordinateur(role) || isGerantStaff(role) || isPoleResponsible(role) || role === Role.GERANT_EQUILIBRAGE;

  const navItems: NavItem[] = [
    {
      to: '/dashboard',
      label: tr.nav.dashboard,
      icon: <LayoutDashboard className="h-[18px] w-[18px]" />,
      visible: true,
    },
    {
      to: '/payroll',
      label: tr.nav.payroll,
      icon: <ClipboardList className="h-[18px] w-[18px]" />,
      visible: canAccessPayroll,
    },
    {
      to: '/members',
      label: tr.nav.members,
      icon: <Users className="h-[18px] w-[18px]" />,
      visible: true,
    },
    {
      to: '/global',
      label: tr.nav.globalView,
      icon: <Globe className="h-[18px] w-[18px]" />,
      visible: isCoordinateur(role),
    },
    {
      to: '/history',
      label: tr.nav.history,
      icon: <History className="h-[18px] w-[18px]" />,
      visible: canAccessPayroll,
    },
    {
      to: '/admin',
      label: tr.nav.admin,
      icon: <Shield className="h-[18px] w-[18px]" />,
      visible: isCoordinateur(role),
    },
  ];

  return (
    <aside
      className={cn(
        'glass relative z-10 flex h-screen flex-col transition-all duration-300',
        isOpen ? 'w-60' : 'w-16',
      )}
    >
      {/* Logo */}
      <div className="flex h-16 items-center gap-3 px-5">
        <img
          src="/logo.png"
          alt="Solve Paies"
          className="h-8 w-8 shrink-0 drop-shadow-[0_0_12px_rgba(245,146,10,0.4)]"
        />
        {isOpen && (
          <span className="text-base font-semibold text-text-primary tracking-tight">
            Solve Paies
          </span>
        )}
      </div>

      {/* Separator */}
      <div className="mx-4 border-t border-border-secondary" />

      {/* Navigation */}
      <nav className="flex-1 space-y-1 px-3 py-4">
        {navItems
          .filter((item) => item.visible)
          .map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                cn(
                  'group relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200',
                  isActive
                    ? 'bg-accent/10 text-accent'
                    : 'text-text-secondary hover:bg-white/[0.03] hover:text-text-primary',
                  !isOpen && 'justify-center px-0',
                )
              }
            >
              {({ isActive }) => (
                <>
                  {isActive && (
                    <div className="absolute left-0 top-1/2 h-5 w-[3px] -translate-y-1/2 rounded-r-full bg-accent shadow-[0_0_8px_rgba(245,146,10,0.5)]" />
                  )}
                  {item.icon}
                  {isOpen && <span>{item.label}</span>}
                </>
              )}
            </NavLink>
          ))}
      </nav>

      {/* Separator */}
      <div className="mx-4 border-t border-border-secondary" />

      {/* Bottom section */}
      <div className="space-y-0.5 px-3 py-4">
        <button
          onClick={toggle}
          className={cn(
            'flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-text-secondary transition-colors duration-200 hover:bg-white/[0.03] hover:text-text-primary',
            !isOpen && 'justify-center px-0',
          )}
        >
          <ChevronLeft
            className={cn('h-[18px] w-[18px] transition-transform duration-200', !isOpen && 'rotate-180')}
          />
          {isOpen && <span>{tr.nav.collapse}</span>}
        </button>

        <button
          onClick={() => {
            useAuthStore.getState().logout()
              .then(() => { window.location.href = '/login'; })
              .catch(() => { window.location.href = '/login'; });
          }}
          className={cn(
            'flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-text-secondary transition-colors duration-200 hover:bg-danger/10 hover:text-danger',
            !isOpen && 'justify-center px-0',
          )}
        >
          <LogOut className="h-[18px] w-[18px]" />
          {isOpen && <span>{tr.auth.logout}</span>}
        </button>
      </div>
    </aside>
  );
}
