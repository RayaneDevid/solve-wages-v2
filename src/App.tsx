import { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/stores/auth.store';
import { fetchMe } from '@/api/auth.api';

import { Role } from '@/types';
import Layout from '@/components/layout/layout';
import ProtectedRoute from '@/routes/protected-route';
import ErrorBoundary from '@/components/ui/error-boundary';
import { Navigate } from 'react-router-dom';
import LoginPage from '@/pages/login-page';
import DevLoginPage from '@/pages/dev-login-page';
import AuthCallbackPage from '@/pages/auth-callback-page';
import DashboardPage from '@/pages/dashboard-page';
import PayrollEntryPage from '@/pages/payroll-entry-page';
import GlobalViewPage from '@/pages/global-view-page';
import HistoryPage from '@/pages/history-page';
import MembersPage from '@/pages/members-page';
import AdminPage from '@/pages/admin-page';
import PrimesPage from '@/pages/primes-page';
import NotFoundPage from '@/pages/not-found-page';
import Spinner from '@/components/ui/spinner';
import ToastContainer from '@/components/ui/toast';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,
      gcTime: 10 * 60 * 1000,
      refetchOnWindowFocus: false,
    },
  },
});

const isDevMode = import.meta.env.VITE_DEV_MODE === 'true';

const PAYROLL_ROLES: Role[] = [
  Role.DEVELOPPEUR,
  Role.COORDINATEUR,
  Role.GERANT_STAFF,
  Role.GERANT_RP,
  Role.GERANT_SERVEUR,
  Role.RESP_MODERATION,
  Role.RESP_ANIMATION,
  Role.RESP_MJ,
  Role.RESP_DOUANE,
  Role.RESP_BUILDER,
  Role.RESP_LORE,
  Role.RESP_EQUILIBRAGE_PVP,
  Role.RESP_CM,
  Role.GERANT_EQUILIBRAGE,
];

const PRIMES_ROLES: Role[] = [
  Role.DEVELOPPEUR,
  Role.COORDINATEUR,
  Role.GERANT_STAFF,
  Role.GERANT_RP,
  Role.GERANT_SERVEUR,
  Role.RESP_MODERATION,
  Role.RESP_ANIMATION,
  Role.RESP_MJ,
  Role.RESP_DOUANE,
  Role.RESP_BUILDER,
  Role.RESP_LORE,
  Role.RESP_EQUILIBRAGE_PVP,
  Role.RESP_CM,
  Role.REFERENT_STREAMER,
];

function AppRoutes() {
  const [loading, setLoading] = useState(true);
  const setUser = useAuthStore((s) => s.setUser);

  useEffect(() => {
    if (isDevMode && useAuthStore.getState().user) {
      setLoading(false);
      return;
    }

    async function restoreSession() {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          const appUser = await fetchMe();
          setUser(appUser);
        }
      } catch {
        // No valid session or user not in DB
      } finally {
        setLoading(false);
      }
    }

    restoreSession();
  }, [setUser]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-bg-primary">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <Routes>
      <Route path="/" element={<Navigate to="/login" replace />} />
      {isDevMode && <Route path="/dev-login" element={<DevLoginPage />} />}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/auth/callback" element={<AuthCallbackPage />} />

      {/* Dashboard + History + Members: any authenticated user */}
      <Route element={<ProtectedRoute />}>
        <Route element={<Layout />}>
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/history" element={<HistoryPage />} />
          <Route path="/members" element={<MembersPage />} />
        </Route>
      </Route>

      {/* Payroll: resp, gerant_staff, coordinateur */}
      <Route element={<ProtectedRoute allowedRoles={PAYROLL_ROLES} />}>
        <Route element={<Layout />}>
          <Route path="/payroll" element={<PayrollEntryPage />} />
        </Route>
      </Route>

      {/* Primes: gerant roles + coord/dev */}
      <Route element={<ProtectedRoute allowedRoles={PRIMES_ROLES} />}>
        <Route element={<Layout />}>
          <Route path="/primes" element={<PrimesPage />} />
        </Route>
      </Route>

      {/* Global view + Admin: coordinateur only */}
      <Route element={<ProtectedRoute allowedRoles={[Role.DEVELOPPEUR, Role.COORDINATEUR]} />}>
        <Route element={<Layout />}>
          <Route path="/global" element={<GlobalViewPage />} />
          <Route path="/admin" element={<AdminPage />} />
        </Route>
      </Route>

      {/* 404 */}
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <AppRoutes />
        </BrowserRouter>
        <ToastContainer />
      </QueryClientProvider>
    </ErrorBoundary>
  );
}
