'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, Package, ClipboardList, DollarSign, TrendingUp, UserPlus, CheckCircle, Clock, XCircle } from 'lucide-react';
import { adminFetch } from '@/lib/api';

interface Stats {
  totalUsuarios: number;
  totalNinos: number;
  totalReservas: number;
  totalExperiencias: number;
  reservasConfirmadas: number;
  reservasPendientes: number;
  reservasCanceladas: number;
  ingresosTotales: number;
  reservasRecientes: number;
  nuevosUsuarios: number;
}

export function AdminOverview() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    adminFetch('/api/own/admin/stats')
      .then(r => r.json())
      .then(setStats)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const fmt = (n: number) => new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(n);

  if (loading) return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" /></div>;
  if (!stats) return <p className="text-muted-foreground">Error al cargar estadísticas</p>;

  const mainCards = [
    { label: 'Ingresos Totales', value: fmt(stats.ingresosTotales), icon: DollarSign, color: 'text-green-600', bg: 'bg-green-50 dark:bg-green-950/30' },
    { label: 'Total Reservas', value: stats.totalReservas, icon: ClipboardList, color: 'text-primary', bg: 'bg-primary/5' },
    { label: 'Usuarios Registrados', value: stats.totalUsuarios, icon: Users, color: 'text-blue-600', bg: 'bg-blue-50 dark:bg-blue-950/30' },
    { label: 'Experiencias Activas', value: stats.totalExperiencias, icon: Package, color: 'text-amber-600', bg: 'bg-amber-50 dark:bg-amber-950/30' },
  ];

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-display font-bold">Resumen General</h1>
        <p className="text-sm text-muted-foreground">Vista general del negocio A-TENCIÓN</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-8">
        {mainCards.map(c => {
          const Icon = c.icon;
          return (
            <Card key={c.label}>
              <CardContent className="p-5">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-sm text-muted-foreground">{c.label}</p>
                  <div className={`p-2 rounded-lg ${c.bg}`}><Icon className={`w-4 h-4 ${c.color}`} /></div>
                </div>
                <p className="text-2xl font-bold">{c.value}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Reservation Status */}
        <Card>
          <CardHeader><CardTitle className="text-base">Estado de Reservas</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-green-600" /><span className="text-sm">Confirmadas</span></div>
                <div className="flex items-center gap-3">
                  <div className="w-32 h-2 bg-muted rounded-full overflow-hidden"><div className="h-full bg-green-500 rounded-full" style={{ width: `${stats.totalReservas ? (stats.reservasConfirmadas / stats.totalReservas) * 100 : 0}%` }} /></div>
                  <span className="text-sm font-semibold w-8 text-right">{stats.reservasConfirmadas}</span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2"><Clock className="w-4 h-4 text-amber-500" /><span className="text-sm">Pendientes</span></div>
                <div className="flex items-center gap-3">
                  <div className="w-32 h-2 bg-muted rounded-full overflow-hidden"><div className="h-full bg-amber-500 rounded-full" style={{ width: `${stats.totalReservas ? (stats.reservasPendientes / stats.totalReservas) * 100 : 0}%` }} /></div>
                  <span className="text-sm font-semibold w-8 text-right">{stats.reservasPendientes}</span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2"><XCircle className="w-4 h-4 text-red-500" /><span className="text-sm">Canceladas</span></div>
                <div className="flex items-center gap-3">
                  <div className="w-32 h-2 bg-muted rounded-full overflow-hidden"><div className="h-full bg-red-500 rounded-full" style={{ width: `${stats.totalReservas ? (stats.reservasCanceladas / stats.totalReservas) * 100 : 0}%` }} /></div>
                  <span className="text-sm font-semibold w-8 text-right">{stats.reservasCanceladas}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Activity Summary */}
        <Card>
          <CardHeader><CardTitle className="text-base">Actividad Reciente (7 días)</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center gap-4 p-3 bg-muted/50 rounded-lg">
                <div className="p-2 bg-primary/10 rounded-lg"><TrendingUp className="w-5 h-5 text-primary" /></div>
                <div><p className="font-semibold text-lg">{stats.reservasRecientes}</p><p className="text-xs text-muted-foreground">Nuevas reservas</p></div>
              </div>
              <div className="flex items-center gap-4 p-3 bg-muted/50 rounded-lg">
                <div className="p-2 bg-blue-500/10 rounded-lg"><UserPlus className="w-5 h-5 text-blue-600" /></div>
                <div><p className="font-semibold text-lg">{stats.nuevosUsuarios}</p><p className="text-xs text-muted-foreground">Nuevos usuarios</p></div>
              </div>
              <div className="flex items-center gap-4 p-3 bg-muted/50 rounded-lg">
                <div className="p-2 bg-amber-500/10 rounded-lg"><Users className="w-5 h-5 text-amber-600" /></div>
                <div><p className="font-semibold text-lg">{stats.totalNinos}</p><p className="text-xs text-muted-foreground">Niños registrados en total</p></div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
