'use client';

import { Loader2 } from 'lucide-react';
import { Header } from '@/components/layout/header';
import { AdminDashboard } from '@/components/admin/admin-dashboard';
import { useRequireAuth } from '@/lib/api';

export default function AdminPage() {
  const { loading, isAuthenticated, isAdmin } = useRequireAuth({ adminOnly: true });

  if (loading || !isAuthenticated || !isAdmin) {
    return (
      <>
        <Header />
        <main className="pt-20 min-h-screen flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </main>
      </>
    );
  }

  return (
    <>
      <Header />
      <main className="pt-20 min-h-screen bg-muted/30">
        <AdminDashboard />
      </main>
    </>
  );
}
