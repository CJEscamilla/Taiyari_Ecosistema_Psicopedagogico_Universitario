'use client';

import { useEffect, useState } from 'react';
import { Search, Filter, Calendar, ChevronDown, ChevronUp, RefreshCw } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { adminFetch } from '@/lib/api';

interface ReservaDetail {
  id: string;
  experiencia: { nombre: string };
  fechaDisponible: { fecha: string; horaInicio: string; horaFin: string };
  nino: { nombre: string } | null;
  precioUnitario: number;
  cantidad: number;
}

interface Reserva {
  id: string;
  total: number;
  estado: string;
  createdAt: string;
  tutor: { nombre: string; email: string; telefono: string | null };
  detalles: ReservaDetail[];
}

const fmtFolio = (id: string) => `ORD-${id.slice(-6).toUpperCase()}`;
const fmtDate = (d: string) => new Date(d).toLocaleDateString('es-MX', { year: 'numeric', month: 'short', day: 'numeric' });
const fmtMoney = (n: number) => new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(n);

export function AdminReservas() {
  const [reservas, setReservas] = useState<Reserva[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterEstado, setFilterEstado] = useState('all');
  const [expandedRow, setExpandedRow] = useState<string | null>(null);
  const [updating, setUpdating] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchReservas = () => {
    setLoading(true);
    adminFetch('/api/own/admin/reservas').then(r => r.json()).then(setReservas).catch(console.error).finally(() => setLoading(false));
  };

  useEffect(() => { fetchReservas(); }, []);

  const updateEstado = async (id: string, estado: string) => {
    setUpdating(id);
    try {
      const res = await adminFetch('/api/own/admin/reservas', { method: 'PATCH', body: JSON.stringify({ id, estado }) });
      if (res.ok) {
        setReservas(prev => prev.map(r => r.id === id ? { ...r, estado } : r));
        toast({ title: 'Estado actualizado', description: `Reserva marcada como ${estado}`, variant: 'success' });
      }
    } catch { toast({ title: 'Error', variant: 'destructive' }); }
    setUpdating(null);
  };

  const filtered = reservas.filter(r => {
    const s = search.toLowerCase();
    const matchSearch = !s || r.tutor.nombre.toLowerCase().includes(s) || r.tutor.email.toLowerCase().includes(s) || fmtFolio(r.id).toLowerCase().includes(s) || r.detalles.some(d => d.nino?.nombre?.toLowerCase().includes(s));
    const matchEstado = filterEstado === 'all' || r.estado === filterEstado;
    return matchSearch && matchEstado;
  });

  const estadoBadge = (e: string) => {
    if (e === 'Confirmada') return <Badge variant="success">Confirmada</Badge>;
    if (e === 'Pendiente') return <Badge variant="secondary">Pendiente</Badge>;
    if (e === 'Cancelada') return <Badge variant="destructive">Cancelada</Badge>;
    return <Badge>{e}</Badge>;
  };

  if (loading) return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" /></div>;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-display font-bold">Reservas</h1>
          <p className="text-sm text-muted-foreground">{reservas.length} reservas en total</p>
        </div>
        <Button variant="outline" size="sm" onClick={fetchReservas}><RefreshCw className="w-4 h-4 mr-2" />Actualizar</Button>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Buscar por folio, tutor o niño..." className="pl-10" value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <Select value={filterEstado} onValueChange={setFilterEstado}>
          <SelectTrigger className="w-[180px]"><Filter className="w-4 h-4 mr-2" /><SelectValue placeholder="Estado" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="Confirmada">Confirmadas</SelectItem>
            <SelectItem value="Pendiente">Pendientes</SelectItem>
            <SelectItem value="Cancelada">Canceladas</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Card>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead><tr className="border-b bg-muted/50">
              <th className="text-left p-3 text-xs font-semibold text-muted-foreground uppercase">Folio</th>
              <th className="text-left p-3 text-xs font-semibold text-muted-foreground uppercase">Tutor</th>
              <th className="text-left p-3 text-xs font-semibold text-muted-foreground uppercase hidden md:table-cell">Fecha</th>
              <th className="text-left p-3 text-xs font-semibold text-muted-foreground uppercase">Total</th>
              <th className="text-left p-3 text-xs font-semibold text-muted-foreground uppercase">Estado</th>
              <th className="text-left p-3 text-xs font-semibold text-muted-foreground uppercase">Acciones</th>
              <th className="p-3"></th>
            </tr></thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={7} className="p-8 text-center text-muted-foreground"><Calendar className="w-10 h-10 mx-auto mb-2 opacity-30" />No se encontraron reservas.</td></tr>
              ) : filtered.map(r => (
                <>
                  <tr key={r.id} className="border-b hover:bg-muted/30 transition-colors">
                    <td className="p-3 font-mono text-sm font-medium">{fmtFolio(r.id)}</td>
                    <td className="p-3"><p className="font-medium text-sm">{r.tutor.nombre}</p><p className="text-xs text-muted-foreground">{r.tutor.email}</p></td>
                    <td className="p-3 text-sm hidden md:table-cell">{fmtDate(r.createdAt)}</td>
                    <td className="p-3 font-semibold text-sm">{fmtMoney(r.total)}</td>
                    <td className="p-3">{estadoBadge(r.estado)}</td>
                    <td className="p-3">
                      <div className="flex gap-1">
                        {r.estado !== 'Confirmada' && <Button size="sm" variant="outline" className="text-xs h-7" disabled={updating === r.id} onClick={() => updateEstado(r.id, 'Confirmada')}>Confirmar</Button>}
                        {r.estado !== 'Cancelada' && <Button size="sm" variant="outline" className="text-xs h-7 text-red-600 border-red-200 hover:bg-red-50" disabled={updating === r.id} onClick={() => updateEstado(r.id, 'Cancelada')}>Cancelar</Button>}
                      </div>
                    </td>
                    <td className="p-3 cursor-pointer" onClick={() => setExpandedRow(expandedRow === r.id ? null : r.id)}>
                      {expandedRow === r.id ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </td>
                  </tr>
                  {expandedRow === r.id && (
                    <tr key={`${r.id}-det`}><td colSpan={7} className="p-0">
                      <div className="bg-muted/20 p-4 border-b">
                        <p className="text-xs text-muted-foreground mb-2 uppercase tracking-wider font-semibold">Detalle de sesiones</p>
                        {r.tutor.telefono && <p className="text-xs text-muted-foreground mb-3">Tel: {r.tutor.telefono}</p>}
                        <div className="space-y-2">
                          {r.detalles.map(d => (
                            <div key={d.id} className="flex flex-wrap items-center gap-3 text-sm bg-background rounded-lg p-3">
                              <span className="font-medium">{d.experiencia.nombre}</span>
                              <span className="text-muted-foreground">•</span>
                              <span className="text-muted-foreground flex items-center gap-1"><Calendar className="w-3 h-3" />{fmtDate(d.fechaDisponible.fecha)} {d.fechaDisponible.horaInicio}-{d.fechaDisponible.horaFin}</span>
                              {d.nino && <><span className="text-muted-foreground">•</span><Badge variant="outline" className="text-xs">{d.nino.nombre}</Badge></>}
                              <span className="ml-auto font-medium">{fmtMoney(d.precioUnitario)} x{d.cantidad}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </td></tr>
                  )}
                </>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
