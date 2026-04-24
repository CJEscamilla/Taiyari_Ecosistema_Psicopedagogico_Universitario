'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  Users, Plus, Edit2, Trash2, UserCircle, Loader2, Save, X
} from 'lucide-react';
import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { getToken, useRequireAuth } from '@/lib/api';

interface Nino {
  id: string;
  nombre: string;
  edad: number;
  notasSensoriales: string | null;
}

export default function PerfilPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { loading: authLoading, isAuthenticated: authed } = useRequireAuth();
  const [ninos, setNinos] = useState<Nino[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingNino, setEditingNino] = useState<Nino | null>(null);
  const [formData, setFormData] = useState({
    nombre: '',
    edad: '',
    notasSensoriales: ''
  });

  useEffect(() => {
    if (authLoading) return;
    if (!authed) return; // useRequireAuth ya redirige
    fetchNinos();
  }, [authLoading, authed]);

  const fetchNinos = async () => {
    try {
      // TODO: Implementar endpoint de niños en backend Express
      // Por ahora, usar localStorage o dejar vacío
      const token = getToken();
      // const res = await fetch('http://localhost:3001/api/own/ninos', {
      //   headers: { 'Authorization': `Bearer ${token}` }
      // });
      // const data = await res.json();
      // setNinos(data?.data?.ninos ?? []);
      setNinos([]); // Temporal hasta implementar endpoint
    } catch (error) {
      console.error('Error fetching ninos:', error);
    } finally {
      setLoading(false);
    }
  };

  const openCreateDialog = () => {
    setEditingNino(null);
    setFormData({ nombre: '', edad: '', notasSensoriales: '' });
    setDialogOpen(true);
  };

  const openEditDialog = (nino: Nino) => {
    setEditingNino(nino);
    setFormData({
      nombre: nino?.nombre ?? '',
      edad: String(nino?.edad ?? ''),
      notasSensoriales: nino?.notasSensoriales ?? ''
    });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!formData.nombre || !formData.edad) {
      toast({
        title: 'Error',
        description: 'Nombre y edad son requeridos',
        variant: 'destructive'
      });
      return;
    }

    setSaving(true);
    try {
      const url = editingNino ? `/api/ninos/${editingNino.id}` : '/api/ninos';
      const method = editingNino ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data?.error ?? 'Error');
      }

      toast({
        title: editingNino ? 'Perfil actualizado' : 'Perfil creado',
        description: `El perfil de ${formData.nombre} ha sido ${editingNino ? 'actualizado' : 'creado'}.`,
        variant: 'success'
      });

      setDialogOpen(false);
      fetchNinos();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error?.message ?? 'No se pudo guardar',
        variant: 'destructive'
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (nino: Nino) => {
    if (!confirm(`¿Eliminar el perfil de ${nino?.nombre ?? 'este niño'}?`)) return;

    try {
      const res = await fetch(`/api/ninos/${nino?.id ?? ''}`, { method: 'DELETE' });
      if (res.ok) {
        setNinos(prev => (prev ?? []).filter(n => n?.id !== nino?.id));
        toast({
          title: 'Perfil eliminado',
          description: `El perfil de ${nino?.nombre ?? ''} ha sido eliminado.`,
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'No se pudo eliminar el perfil',
        variant: 'destructive'
      });
    }
  };

  if (authLoading || loading) {
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
      <main className="pt-20 min-h-screen">
        <div className="max-w-[900px] mx-auto px-4 sm:px-6 py-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-3">
                <Users className="w-8 h-8 text-primary" />
                <h1 className="text-3xl font-display font-bold">Perfiles de Niños</h1>
              </div>
              <Button onClick={openCreateDialog} className="gap-2">
                <Plus className="w-4 h-4" />
                Agregar Perfil
              </Button>
            </div>

            <p className="text-muted-foreground mb-8">
              Administra los perfiles de tus pequeños para personalizar las experiencias sensoriales según sus necesidades.
            </p>

            {(ninos?.length ?? 0) === 0 ? (
              <Card className="text-center py-16">
                <CardContent>
                  <UserCircle className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                  <h2 className="text-xl font-semibold mb-2">Sin perfiles aún</h2>
                  <p className="text-muted-foreground mb-6">
                    Crea un perfil para cada niño y personaliza su experiencia sensorial.
                  </p>
                  <Button onClick={openCreateDialog} className="gap-2">
                    <Plus className="w-4 h-4" />
                    Crear Primer Perfil
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid md:grid-cols-2 gap-6">
                {(ninos ?? []).map((nino, index) => (
                  <motion.div
                    key={nino?.id ?? index}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <Card className="card-hover">
                      <CardHeader>
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                              <UserCircle className="w-7 h-7 text-primary" />
                            </div>
                            <div>
                              <CardTitle>{nino?.nombre ?? 'Sin nombre'}</CardTitle>
                              <p className="text-sm text-muted-foreground">{nino?.edad ?? 0} años</p>
                            </div>
                          </div>
                          <div className="flex gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => openEditDialog(nino)}
                            >
                              <Edit2 className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDelete(nino)}
                              className="text-muted-foreground hover:text-destructive"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      </CardHeader>
                      {nino?.notasSensoriales && (
                        <CardContent>
                          <div className="bg-secondary/50 rounded-lg p-3">
                            <p className="text-sm font-medium mb-1">Notas Sensoriales</p>
                            <p className="text-sm text-muted-foreground">
                              {nino.notasSensoriales}
                            </p>
                          </div>
                        </CardContent>
                      )}
                    </Card>
                  </motion.div>
                ))}
              </div>
            )}
          </motion.div>
        </div>
      </main>
      <Footer />

      {/* Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingNino ? 'Editar Perfil' : 'Nuevo Perfil'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="nombre">Nombre del Niño</Label>
              <Input
                id="nombre"
                placeholder="Nombre"
                value={formData.nombre}
                onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edad">Edad</Label>
              <Input
                id="edad"
                type="number"
                min="0"
                max="18"
                placeholder="Edad en años"
                value={formData.edad}
                onChange={(e) => setFormData({ ...formData, edad: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="notas">Notas Sensoriales (opcional)</Label>
              <Textarea
                id="notas"
                placeholder="Describe preferencias, sensibilidades o necesidades especiales..."
                value={formData.notasSensoriales}
                onChange={(e) => setFormData({ ...formData, notasSensoriales: e.target.value })}
              />
              <p className="text-xs text-muted-foreground">
                Esta información ayudará a personalizar el entorno interactivo.
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              <X className="w-4 h-4 mr-2" />
              Cancelar
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Save className="w-4 h-4 mr-2" />
              )}
              Guardar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
