'use client';

import { useEffect, useState } from 'react';
import { Plus, Trash2, Calendar, RefreshCw } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { adminFetch } from '@/lib/api';

interface Experiencia {
  id: string;
  nombre: string;
  fechasDisponibles: { id: string; fecha: string; horaInicio: string; horaFin: string; cuposTotales: number; cuposDisponibles: number }[];
}

export function AdminFechas() {
  const [experiencias, setExperiencias] = useState<Experiencia[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState({ experienciaId: '', fecha: '', horaInicio: '', horaFin: '', cuposTotales: '10' });
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  const fetchData = () => {
    setLoading(true);
    adminFetch('/api/own/admin/experiencias').then(r => r.json()).then(setExperiencias).catch(console.error).finally(() => setLoading(false));
  };

  useEffect(() => { fetchData(); }, []);

  const handleAdd = async () => {
    if (!form.experienciaId || !form.fecha || !form.horaInicio || !form.horaFin || !form.cuposTotales) {
      toast({ title: 'Completa todos los campos', variant: 'destructive' }); return;
    }
    setSaving(true);
    try {
      const res = await adminFetch('/api/own/admin/fechas', { method: 'POST', body: JSON.stringify(form) });
      if (res.ok) {
        toast({ title: 'Horario agregado', variant: 'success' });
        setDialogOpen(false);
        setForm({ experienciaId: '', fecha: '', horaInicio: '', horaFin: '', cuposTotales: '10' });
        fetchData();
      } else {
        const err = await res.json();
        toast({ title: err.error || 'Error', variant: 'destructive' });
      }
    } catch { toast({ title: 'Error', variant: 'destructive' }); }
    setSaving(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('¿Eliminar este horario?')) return;
    try {
      const res = await adminFetch(`/api/own/admin/fechas?id=${id}`, { method: 'DELETE' });
      if (res.ok) { toast({ title: 'Horario eliminado', variant: 'success' }); fetchData(); }
      else toast({ title: 'Error al eliminar', variant: 'destructive' });
    } catch { toast({ title: 'Error', variant: 'destructive' }); }
  };

  const fmtDate = (d: string) => new Date(d).toLocaleDateString('es-MX', { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' });

  if (loading) return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" /></div>;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-display font-bold">Horarios Disponibles</h1>
          <p className="text-sm text-muted-foreground">Gestiona las fechas y horarios de cada experiencia</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={fetchData}><RefreshCw className="w-4 h-4 mr-2" />Actualizar</Button>
          <Button size="sm" onClick={() => setDialogOpen(true)}><Plus className="w-4 h-4 mr-2" />Agregar Horario</Button>
        </div>
      </div>

      <div className="space-y-6">
        {experiencias.map(exp => (
          <Card key={exp.id}>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">{exp.nombre}</CardTitle>
            </CardHeader>
            <CardContent>
              {exp.fechasDisponibles.length === 0 ? (
                <p className="text-sm text-muted-foreground py-2">Sin horarios programados</p>
              ) : (
                <div className="space-y-2">
                  {exp.fechasDisponibles.map(f => (
                    <div key={f.id} className="flex items-center justify-between bg-muted/30 rounded-lg p-3">
                      <div className="flex items-center gap-3">
                        <Calendar className="w-4 h-4 text-muted-foreground" />
                        <span className="text-sm font-medium">{fmtDate(f.fecha)}</span>
                        <span className="text-sm text-muted-foreground">{f.horaInicio} - {f.horaFin}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <Badge variant={f.cuposDisponibles > 0 ? 'success' : 'destructive'} className="text-xs">
                          {f.cuposDisponibles}/{f.cuposTotales} cupos
                        </Badge>
                        <Button size="sm" variant="ghost" className="text-red-500 h-7 w-7 p-0" onClick={() => handleDelete(f.id)}>
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Agregar Horario</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Experiencia *</Label>
              <Select value={form.experienciaId} onValueChange={v => setForm({...form, experienciaId: v})}>
                <SelectTrigger><SelectValue placeholder="Selecciona experiencia" /></SelectTrigger>
                <SelectContent>
                  {experiencias.map(exp => <SelectItem key={exp.id} value={exp.id}>{exp.nombre}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div><Label>Fecha *</Label><Input type="date" value={form.fecha} onChange={e => setForm({...form, fecha: e.target.value})} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Hora Inicio *</Label><Input type="time" value={form.horaInicio} onChange={e => setForm({...form, horaInicio: e.target.value})} /></div>
              <div><Label>Hora Fin *</Label><Input type="time" value={form.horaFin} onChange={e => setForm({...form, horaFin: e.target.value})} /></div>
            </div>
            <div><Label>Cupos Totales *</Label><Input type="number" value={form.cuposTotales} onChange={e => setForm({...form, cuposTotales: e.target.value})} min="1" /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
            <Button onClick={handleAdd} disabled={saving}>{saving ? 'Guardando...' : 'Agregar Horario'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
