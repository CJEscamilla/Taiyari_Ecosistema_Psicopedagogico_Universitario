'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  CalendarCheck, Check, Loader2, ShoppingBag, ArrowLeft,
  Calendar, Clock, UserCircle, CheckCircle2
} from 'lucide-react';
import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { formatDate } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { buildApiUrl, getToken } from '@/lib/api';

interface CartItem {
  id: string;
  cantidad: number;
  precio: number;
  nombre: string;
  fecha: string;
  horaInicio: string;
  horaFin: string;
  experienciaId: string;
  fechaDisponibleId: string;
  ninoId: string | null;
}

export default function CheckoutPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [items, setItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    const token = getToken();
    if (!token) {
      router.push('/auth/login');
      return;
    }

    fetchCarrito();
  }, [router]);

  const fetchCarrito = async () => {
    const token = getToken();
    if (!token) return;

    try {
      // Llamar al backend Express (API Propia)
      const res = await fetch('http://localhost:3001/api/own/cart', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await res.json();
      setItems(data?.data?.items ?? []);
      if ((data?.data?.items?.length ?? 0) === 0) {
        router.push('/carrito');
      }
    } catch (error) {
      console.error('Error fetching carrito:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleStripeCheckout = async () => {
    setProcessing(true);
    const token = getToken();
    
    if (!token) {
      toast({
        title: 'Error',
        description: 'Sesión expirada. Por favor inicia sesión nuevamente.',
        variant: 'destructive'
      });
      router.push('/auth/login');
      return;
    }

    try {
      // Preparar items para Stripe
      const stripeItems = items.map(item => ({
        experienciaId: item.experienciaId,
        nombre: item.nombre,
        precio: item.precio,
        cantidad: item.cantidad,
        fechaDisponibleId: item.fechaDisponibleId,
        fecha: item.fecha,
        horaInicio: item.horaInicio,
        horaFin: item.horaFin
      }));

      // Llamar al backend Express para crear sesión de Stripe (API de Terceros)
      // URL: POST /api/integrations/payments/create-session
      const res = await fetch(buildApiUrl('/api/integrations/payments/create-session'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          items: stripeItems,
          successUrl: `${window.location.origin}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
          cancelUrl: `${window.location.origin}/carrito`
        })
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data?.error ?? 'Error al crear sesión de pago');
      }

      // Redirigir a Stripe Checkout
      if (data.data?.url) {
        window.location.href = data.data.url;
      } else {
        throw new Error('URL de Stripe no recibida');
      }
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error?.message ?? 'No se pudo iniciar el pago',
        variant: 'destructive'
      });
      setProcessing(false);
    }
  };

  if (loading) {
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
        <div className="max-w-[700px] mx-auto px-4 sm:px-6 py-12">
          <Link href="/carrito" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-8">
            <ArrowLeft className="w-4 h-4" />
            Volver a Mis Pendientes
          </Link>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="flex items-center gap-3 mb-2">
              <CalendarCheck className="w-8 h-8 text-primary" />
              <h1 className="text-3xl font-display font-bold">Confirmar Reservaciones</h1>
            </div>
            <p className="text-muted-foreground mb-8">Revisa y confirma las sesiones que deseas reservar</p>

            <Card className="mb-6">
              <CardHeader>
                <CardTitle className="text-lg">Sesiones a Confirmar</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {(items ?? []).map((item, i) => (
                  <div key={i} className="flex items-start justify-between py-3 border-b last:border-0">
                    <div>
                      <p className="font-medium">{item?.nombre ?? 'Experiencia'}</p>
                      <p className="text-sm text-muted-foreground">
                        {formatDate(item?.fecha ?? '')} \u2022 {item?.horaInicio ?? ''} - {item?.horaFin ?? ''}
                      </p>
                    </div>
                    <Badge variant="secondary" className="text-xs shrink-0">Pendiente</Badge>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card className="mb-6">
              <CardContent className="p-5">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                    <Check className="w-4 h-4 text-green-600" />
                  </div>
                  <div>
                    <p className="font-medium text-sm">Pago seguro con Stripe</p>
                    <p className="text-xs text-muted-foreground">Serás redirigido a Stripe para completar el pago</p>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground">
                  <Check className="w-4 h-4 inline mr-2 text-green-600" />
                  Los cupos ser\u00e1n reservados inmediatamente al confirmar el pago
                </p>
              </CardContent>
            </Card>

            <Button
              className="w-full gap-2"
              size="lg"
              onClick={handleStripeCheckout}
              disabled={processing}
            >
              {processing ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Redirigiendo a Stripe...
                </>
              ) : (
                <>
                  <Check className="w-5 h-5" />
                  Pagar {items.length} {items.length === 1 ? 'Sesi\u00f3n' : 'Sesiones'} (${items.reduce((sum, item) => sum + (item.precio * item.cantidad), 0)} MXN)
                </>
              )}
            </Button>
          </motion.div>
        </div>
      </main>
      <Footer />
    </>
  );
}
