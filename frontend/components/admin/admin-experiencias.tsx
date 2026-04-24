'use client';

import { useEffect, useState } from 'react';
import { Plus, Pencil, Trash2, Package, RefreshCw } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { adminFetch } from '@/lib/api';

interface Experiencia {
  id: string;
  nombre: string;
  descripcion: string;
  precio: number;
  duracionMinutos: number;
  categoria: string;
  imagenUrl: string | null;
  rangoEdad: string | null;
  tamanoGrupo: string | null;
  color: string | null;
  _count: { detallesReserva: number };
  fechasDisponibles: { id: string; fecha: string; horaInicio: string; horaFin: string; cuposTotales: number; cuposDisponibles: number }[];
}

const emptyForm = { nombre: '', descripcion: '', precio: '', duracionMinutos: '', categoria: '', imagenUrl: '', rangoEdad: '', tamanoGrupo: '', color: '#e8d5c4' };

export function AdminExperiencias() {
  const [experiencias, setExperiencias] = useState<Experiencia[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  const fetchData = () => {
    setLoading(true);
    adminFetch('/api/own/admin/experiencias').then(r => r.json()).then(setExperiencias).catch(console.error).finally(() => setLoading(false));
  };

  useEffect(() => { fetchData(); }, []);

  const openNew = () => { setEditing(null); setForm(emptyForm); setDialogOpen(true); };

  const openEdit = (exp: Experiencia) => {
    setEditing(exp.id);
    setForm({
      nombre: exp.nombre, descripcion: exp.descripcion, precio: String(exp.precio),
      duracionMinutos: String(exp.duracionMinutos), categoria: exp.categoria,
      imagenUrl: exp.imagenUrl || '', rangoEdad: exp.rangoEdad || '',
      tamanoGrupo: exp.tamanoGrupo || '', color: exp.color || '#e8d5c4'
    });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!form.nombre || !form.descripcion || !form.precio || !form.duracionMinutos || !form.categoria) {
      toast({ title: 'Completa los campos obligatorios', variant: 'destructive' }); return;
    }
    setSaving(true);
    try {
      const method = editing ? 'PATCH' : 'POST';
      const body = editing ? { id: editing, ...form } : form;
      const res = await adminFetch('/api/own/admin/experiencias', { method, body: JSON.stringify(body) });
      if (res.ok) {
        toast({ title: editing ? 'Experiencia actualizada' : 'Experiencia creada', variant: 'success' });
        setDialogOpen(false);
        fetchData();
      } else {
        const err = await res.json();
        toast({ title: err.error || 'Error', variant: 'destructive' });
      }
    } catch { toast({ title: 'Error de conexión', variant: 'destructive' }); }
    setSaving(false);
  };

  const handleDelete = async (id: string, nombre: string) => {
    if (!confirm(`¿Eliminar "${nombre}"? Esta acción no se puede deshacer.`)) return;
    try {
      const res = await adminFetch(`/api/own/admin/experiencias?id=${id}`, { method: 'DELETE' });
      if (res.ok) { toast({ title: 'Experiencia eliminada', variant: 'success' }); fetchData(); }
      else toast({ title: 'Error al eliminar', variant: 'destructive' });
    } catch { toast({ title: 'Error', variant: 'destructive' }); }
  };

  const fmtMoney = (n: number) => new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(n);

  if (loading) return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" /></div>;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-display font-bold">Experiencias</h1>
          <p className="text-sm text-muted-foreground">{experiencias.length} experiencias registradas</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={fetchData}><RefreshCw className="w-4 h-4 mr-2" />Actualizar</Button>
          <Button size="sm" onClick={openNew}><Plus className="w-4 h-4 mr-2" />Nueva</Button>
        </div>
      </div>

      <div className="grid gap-4">
        {experiencias.map(exp => (
          <Card key={exp.id}>
            <CardContent className="p-4">
              <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                <div className="w-3 h-12 rounded-full shrink-0" style={{ backgroundColor: exp.color || '#e8d5c4' }} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold truncate">{exp.nombre}</h3>
                    <Badge variant="outline" className="text-xs shrink-0">{exp.categoria}</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground line-clamp-1">{exp.descripcion}</p>
                  <div className="flex flex-wrap gap-3 mt-2 text-xs text-muted-foreground">
                    <span>{fmtMoney(exp.precio)}</span>
                    <span>{exp.duracionMinutos} min</span>
                    {exp.rangoEdad && <span>{exp.rangoEdad}</span>}
                    <span>{exp._count.detallesReserva} reservas</span>
                    <span>{exp.fechasDisponibles.length} horarios</span>
                  </div>
                </div>
                <div className="flex gap-2 shrink-0">
                  <Button size="sm" variant="outline" onClick={() => openEdit(exp)}><Pencil className="w-3.5 h-3.5" /></Button>
                  <Button size="sm" variant="outline" className="text-red-600 border-red-200 hover:bg-red-50" onClick={() => handleDelete(exp.id, exp.nombre)}><Trash2 className="w-3.5 h-3.5" /></Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
        {experiencias.length === 0 && (
          <div className="text-center py-12 text-muted-foreground"><Package className="w-10 h-10 mx-auto mb-2 opacity-30" />No hay experiencias registradas.</div>
        )}
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{editing ? 'Editar Experiencia' : 'Nueva Experiencia'}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div><Label>Nombre *</Label><Input value={form.nombre} onChange={e => setForm({...form, nombre: e.target.value})} /></div>
            <div><Label>Descripción *</Label><Textarea value={form.descripcion} onChange={e => setForm({...form, descripcion: e.target.value})} rows={3} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Precio (MXN) *</Label><Input type="number" value={form.precio} onChange={e => setForm({...form, precio: e.target.value})} /></div>
              <div><Label>Duración (min) *</Label><Input type="number" value={form.duracionMinutos} onChange={e => setForm({...form, duracionMinutos: e.target.value})} /></div>
            </div>
            <div><Label>Categoría *</Label><Input value={form.categoria} onChange={e => setForm({...form, categoria: e.target.value})} placeholder="Ej: Sensorial, Vestibular, Arte" /></div>
            <div><Label>URL de Imagen</Label><Input value={form.imagenUrl} onChange={e => setForm({...form, imagenUrl: e.target.value})} placeholder="https://upload.wikimedia.org/wikipedia/commons/thumb/6/63/20200711_Sensory_Processing_Disorder_%28SPD%29_-_categories_and_subtypes.svg/1280px-20200711_Sensory_Processing_Disorder_%28SPD%29_-_categories_and_subtypes.svg.png" /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Rango de Edad</Label><Input value={form.rangoEdad} onChange={e => setForm({...form, rangoEdad: e.target.value})} placeholder="3-8 años" /></div>
              <div><Label>Tamaño de Grupo</Label><Input value={form.tamanoGrupo} onChange={e => setForm({...form, tamanoGrupo: e.target.value})} placeholder="4-6 niños" /></div>
            </div>
            <div><Label>Color de la tarjeta</Label><Input type="color" value={form.color} onChange={e => setForm({...form, color: e.target.value})} className="h-10 w-20" /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
            <Button onClick={handleSave} disabled={saving}>{saving ? 'Guardando...' : editing ? 'Guardar Cambios' : 'Crear Experiencia'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
