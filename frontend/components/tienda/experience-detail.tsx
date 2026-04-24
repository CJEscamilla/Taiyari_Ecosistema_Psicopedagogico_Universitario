'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import Image from 'next/image';
import Link from 'next/link';
import {
  Clock, Users, Star, Calendar, Check, ArrowLeft,
  CalendarCheck, Loader2, UserCircle, Plus
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { formatDate } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { isAuthenticated, getToken } from '@/lib/api';

interface FechaDisponible {
  id: string;
  fecha: Date | string;
  horaInicio: string;
  horaFin: string;
  cuposDisponibles: number;
}

interface Experiencia {
  id: string;
  nombre: string;
  descripcion: string;
  descripcionLarga: string | null;
  precio: number;
  duracionMinutos: number;
  imagenUrl: string | null;
  categoria: string;
  rating: number;
  reviews: number;
  rangoEdad: string | null;
  tamanoGrupo: string | null;
  incluye: string[];
  beneficios: string[];
  color: string | null;
  fechasDisponibles: FechaDisponible[];
}

interface Nino {
  id: string;
  nombre: string;
  edad: number;
}

export function ExperienceDetail({ experiencia }: { experiencia: Experiencia }) {
  const router = useRouter();
  const { toast } = useToast();
  
  const [selectedFecha, setSelectedFecha] = useState<string>('');
  const [selectedNino, setSelectedNino] = useState<string>('');
  const [ninos, setNinos] = useState<Nino[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingNinos, setLoadingNinos] = useState(false);

  const exp = experiencia ?? {};
  const fechas = exp?.fechasDisponibles ?? [];

  useEffect(() => {
    // Cargar niños solo si está autenticado
    if (isAuthenticated()) {
      setLoadingNinos(true);
      // TODO: Implementar endpoint de niños en backend Express
      // const token = getToken();
      // fetch('http://localhost:3001/api/own/ninos', {
      //   headers: { 'Authorization': `Bearer ${token}` }
      // })
      //   .then(res => res.json())
      //   .then(data => setNinos(data?.data?.ninos ?? []))
      //   .catch(() => {})
      //   .finally(() => setLoadingNinos(false));
      setNinos([]); // Temporal hasta implementar endpoint
      setLoadingNinos(false);
    }
  }, []);

  const handleAddToCart = async () => {
    // Verificar autenticación con JWT
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/auth/login');
      return;
    }

    if (!selectedFecha) {
      toast({
        title: 'Selecciona una fecha',
        description: 'Por favor selecciona una fecha y hora disponible',
        variant: 'destructive'
      });
      return;
    }

    // Encontrar la fecha seleccionada para obtener datos
    const fechaSeleccionada = fechas.find(f => f.id === selectedFecha);
    if (!fechaSeleccionada) {
      toast({
        title: 'Error',
        description: 'Fecha no válida',
        variant: 'destructive'
      });
      return;
    }

    setLoading(true);
    try {
      // Llamar al backend Express (API Propia)
      const response = await fetch('http://localhost:3001/api/own/cart', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          experienciaId: exp?.id,
          fechaDisponibleId: selectedFecha,
          cantidad: 1,
          precio: exp?.precio,
          nombre: exp?.nombre,
          fecha: new Date(fechaSeleccionada.fecha).toISOString().split('T')[0],
          horaInicio: fechaSeleccionada.horaInicio,
          horaFin: fechaSeleccionada.horaFin
        })
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data?.error ?? 'Error al agregar al carrito');
      }

      toast({
        title: '¡Sesión agregada!',
        description: `${exp?.nombre} ha sido agregada a tu carrito. Ve al carrito para pagar.`,
        variant: 'success'
      });

      router.push('/carrito');
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error?.message ?? 'No se pudo agregar al carrito',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  // Group dates by day
  const datesByDay: Record<string, FechaDisponible[]> = {};
  (fechas ?? []).forEach(f => {
    const dateKey = new Date(f?.fecha ?? '').toISOString().split('T')[0];
    if (!datesByDay[dateKey]) datesByDay[dateKey] = [];
    datesByDay[dateKey].push(f);
  });

  return (
    <div className="max-w-[1200px] mx-auto px-4 sm:px-6 py-12">
      <Link href="/tienda" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-8">
        <ArrowLeft className="w-4 h-4" />
        Volver al catálogo
      </Link>

      <div className="grid lg:grid-cols-2 gap-12">
        {/* Image */}
        <motion.div
          initial={{ opacity: 0, x: -30 }}
          animate={{ opacity: 1, x: 0 }}
          className="relative"
        >
          <div className="relative aspect-[4/3] rounded-2xl overflow-hidden shadow-xl bg-muted">
            <Image
              src={exp?.imagenUrl ?? '/images/image.png'}
              alt={exp?.nombre ?? 'Experiencia'}
              fill
              className="object-cover"
            />
            <div
              className="absolute bottom-0 left-0 right-0 h-2"
              style={{ backgroundColor: exp?.color ?? '#e8d5c4' }}
            />
          </div>
        </motion.div>

        {/* Details */}
        <motion.div
          initial={{ opacity: 0, x: 30 }}
          animate={{ opacity: 1, x: 0 }}
        >
          <Badge className="mb-4">{exp?.categoria ?? 'General'}</Badge>
          <h1 className="text-3xl md:text-4xl font-display font-bold mb-4">
            {exp?.nombre ?? 'Experiencia'}
          </h1>

          <div className="flex items-center gap-4 mb-6">
            <div className="flex items-center gap-1">
              <Star className="w-5 h-5 fill-amber-400 text-amber-400" />
              <span className="font-semibold">{exp?.rating?.toFixed?.(1) ?? '0.0'}</span>
              <span className="text-muted-foreground">({exp?.reviews ?? 0} reseñas)</span>
            </div>
          </div>

          <p className="text-muted-foreground mb-6">
            {exp?.descripcionLarga ?? exp?.descripcion ?? ''}
          </p>

          {/* Quick Info */}
          <div className="grid grid-cols-3 gap-4 mb-8">
            <div className="text-center p-4 bg-secondary/50 rounded-xl">
              <Clock className="w-6 h-6 mx-auto mb-2 text-primary" />
              <p className="text-sm text-muted-foreground">Duración</p>
              <p className="font-semibold">{exp?.duracionMinutos ?? 0} min</p>
            </div>
            <div className="text-center p-4 bg-secondary/50 rounded-xl">
              <Users className="w-6 h-6 mx-auto mb-2 text-primary" />
              <p className="text-sm text-muted-foreground">Grupo</p>
              <p className="font-semibold">{exp?.tamanoGrupo ?? 'Individual'}</p>
            </div>
            <div className="text-center p-4 bg-secondary/50 rounded-xl">
              <Calendar className="w-6 h-6 mx-auto mb-2 text-primary" />
              <p className="text-sm text-muted-foreground">Edad</p>
              <p className="font-semibold">{exp?.rangoEdad ?? 'Todas'}</p>
            </div>
          </div>

          {/* Precio Info */}
          <div className="flex items-center gap-3 mb-8 p-4 bg-primary/5 rounded-xl border border-primary/10">
            <div className="flex-1">
              <p className="font-semibold text-lg">${exp?.precio ?? 0} MXN</p>
              <p className="text-xs text-muted-foreground">Por sesión - Pago seguro con Stripe</p>
            </div>
          </div>

          {/* Booking Card */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="text-lg">Reservar Sesión</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Date Selection */}
              <div>
                <label className="text-sm font-medium mb-2 block">Fecha y Hora</label>
                <Select value={selectedFecha} onValueChange={setSelectedFecha}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona fecha y hora" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(datesByDay ?? {}).map(([dateKey, slots]) => (
                      <div key={dateKey}>
                        <div className="px-2 py-1 text-xs font-medium text-muted-foreground bg-secondary/50">
                          {formatDate(dateKey)}
                        </div>
                        {(slots ?? []).map(slot => (
                          <SelectItem key={slot?.id ?? ''} value={slot?.id ?? ''}>
                            {slot?.horaInicio ?? ''} - {slot?.horaFin ?? ''} ({slot?.cuposDisponibles ?? 0} cupos)
                          </SelectItem>
                        ))}
                      </div>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Child Selection */}
              {isAuthenticated() && (
                <div>
                  <label className="text-sm font-medium mb-2 block">Perfil del Niño (opcional)</label>
                  <div className="flex gap-2">
                    <Select value={selectedNino} onValueChange={setSelectedNino}>
                      <SelectTrigger className="flex-1">
                        <SelectValue placeholder={loadingNinos ? 'Cargando...' : 'Selecciona un perfil'} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">Sin perfil asignado</SelectItem>
                        {(ninos ?? []).map(nino => (
                          <SelectItem key={nino?.id ?? ''} value={nino?.id ?? ''}>
                            <span className="flex items-center gap-2">
                              <UserCircle className="w-4 h-4" />
                              {nino?.nombre ?? ''} ({nino?.edad ?? 0} años)
                            </span>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Link href="/perfil">
                      <Button variant="outline" size="icon">
                        <Plus className="w-4 h-4" />
                      </Button>
                    </Link>
                  </div>
                </div>
              )}

              <Button
                className="w-full gap-2"
                size="lg"
                onClick={handleAddToCart}
                disabled={loading}
              >
                {loading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    <CalendarCheck className="w-5 h-5" />
                    Reservar Sesión
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Includes & Benefits */}
      <div className="grid md:grid-cols-2 gap-8 mt-12">
        <Card>
          <CardHeader>
            <CardTitle>Qué Incluye</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3">
              {(exp?.incluye ?? []).map((item, i) => (
                <li key={i} className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-primary mt-0.5 shrink-0" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Beneficios</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {(exp?.beneficios ?? []).map((beneficio, i) => (
                <Badge key={i} variant="secondary" className="py-1.5">
                  {beneficio}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
