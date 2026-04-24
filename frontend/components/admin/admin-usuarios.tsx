'use client';

import { useEffect, useState } from 'react';
import { Search, Users, RefreshCw } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { adminFetch } from '@/lib/api';

interface Usuario {
  id: string;
  email: string;
  nombre: string;
  telefono: string | null;
  role: string;
  createdAt: string;
  _count: { ninos: number; reservas: number };
}

export function AdminUsuarios() {
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const fetchData = () => {
    setLoading(true);
    adminFetch('/api/own/admin/usuarios').then(r => r.json()).then(setUsuarios).catch(console.error).finally(() => setLoading(false));
  };

  useEffect(() => { fetchData(); }, []);

  const fmtDate = (d: string) => new Date(d).toLocaleDateString('es-MX', { year: 'numeric', month: 'short', day: 'numeric' });

  const filtered = usuarios.filter(u => {
    const s = search.toLowerCase();
    return !s || u.nombre.toLowerCase().includes(s) || u.email.toLowerCase().includes(s);
  });

  if (loading) return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" /></div>;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-display font-bold">Usuarios</h1>
          <p className="text-sm text-muted-foreground">{usuarios.length} usuarios registrados</p>
        </div>
        <Button variant="outline" size="sm" onClick={fetchData}><RefreshCw className="w-4 h-4 mr-2" />Actualizar</Button>
      </div>

      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input placeholder="Buscar por nombre o correo..." className="pl-10" value={search} onChange={e => setSearch(e.target.value)} />
      </div>

      <Card>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead><tr className="border-b bg-muted/50">
              <th className="text-left p-3 text-xs font-semibold text-muted-foreground uppercase">Usuario</th>
              <th className="text-left p-3 text-xs font-semibold text-muted-foreground uppercase hidden md:table-cell">Teléfono</th>
              <th className="text-left p-3 text-xs font-semibold text-muted-foreground uppercase">Rol</th>
              <th className="text-left p-3 text-xs font-semibold text-muted-foreground uppercase hidden sm:table-cell">Niños</th>
              <th className="text-left p-3 text-xs font-semibold text-muted-foreground uppercase hidden sm:table-cell">Reservas</th>
              <th className="text-left p-3 text-xs font-semibold text-muted-foreground uppercase hidden lg:table-cell">Registro</th>
            </tr></thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={6} className="p-8 text-center text-muted-foreground"><Users className="w-10 h-10 mx-auto mb-2 opacity-30" />No se encontraron usuarios.</td></tr>
              ) : filtered.map(u => (
                <tr key={u.id} className="border-b hover:bg-muted/30 transition-colors">
                  <td className="p-3"><p className="font-medium text-sm">{u.nombre}</p><p className="text-xs text-muted-foreground">{u.email}</p></td>
                  <td className="p-3 text-sm hidden md:table-cell">{u.telefono || '—'}</td>
                  <td className="p-3"><Badge variant={u.role === 'admin' ? 'default' : 'secondary'} className="text-xs">{u.role === 'admin' ? 'Admin' : 'Tutor'}</Badge></td>
                  <td className="p-3 text-sm hidden sm:table-cell">{u._count.ninos}</td>
                  <td className="p-3 text-sm hidden sm:table-cell">{u._count.reservas}</td>
                  <td className="p-3 text-sm text-muted-foreground hidden lg:table-cell">{fmtDate(u.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
