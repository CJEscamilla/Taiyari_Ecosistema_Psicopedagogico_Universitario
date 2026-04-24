'use client';

import { useEffect, useState, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { CheckCircle2, Loader2, XCircle, ArrowRight, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { buildApiUrl, getToken } from '@/lib/api';

function CheckoutSuccessContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const sessionId = searchParams.get('session_id');

  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [data, setData] = useState<{ reservaId?: string; total?: number; itemsCount?: number } | null>(null);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (!sessionId) {
      setStatus('error');
      setErrorMsg('No se recibió el ID de sesión de pago.');
      return;
    }

    const token = getToken();
    if (!token) {
      router.replace('/auth/login');
      return;
    }

    const confirm = async () => {
      try {
        const res = await fetch(buildApiUrl('/api/integrations/payments/confirm'), {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ sessionId }),
        });
        const json = await res.json();
        if (!res.ok || !json.success) {
          throw new Error(json?.error ?? 'No se pudo confirmar el pago');
        }
        setData(json.data);
        setStatus('success');

        // Vaciar carrito en el backend
        fetch(buildApiUrl('/api/own/cart'), {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${token}` },
        }).catch(() => {});
      } catch (err: any) {
        setStatus('error');
        setErrorMsg(err?.message ?? 'Error al confirmar el pago.');
      }
    };

    confirm();
  }, [sessionId, router]);

  const fmt = (n: number) =>
    new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(n);

  return (
    <div className="min-h-[calc(100vh-5rem)] flex items-center justify-center p-4 bg-gradient-to-br from-background via-secondary/30 to-background">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-lg"
      >
        <Card className="shadow-xl">
          <CardContent className="p-8 text-center">
            {status === 'loading' && (
              <div className="flex flex-col items-center gap-4 py-8">
                <Loader2 className="w-12 h-12 text-primary animate-spin" />
                <h2 className="text-xl font-semibold">Confirmando tu pago...</h2>
                <p className="text-sm text-muted-foreground">
                  Estamos registrando tu reserva, por favor espera.
                </p>
              </div>
            )}

            {status === 'success' && data && (
              <div className="flex flex-col items-center gap-4">
                <div className="p-4 rounded-full bg-green-100 dark:bg-green-950/40">
                  <CheckCircle2 className="w-12 h-12 text-green-600" />
                </div>
                <h1 className="font-display text-2xl font-bold">¡Pago confirmado!</h1>
                <p className="text-muted-foreground max-w-sm">
                  Tu reserva ha sido registrada exitosamente. Recibirás un correo con los detalles.
                </p>

                <div className="w-full bg-muted/40 rounded-lg p-4 mt-2 space-y-2 text-left">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Folio</span>
                    <span className="font-mono font-medium">
                      ORD-{data.reservaId?.slice(-6).toUpperCase()}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Sesiones</span>
                    <span className="font-medium">{data.itemsCount}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Total pagado</span>
                    <span className="font-semibold text-primary">{fmt(data.total ?? 0)}</span>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-3 w-full mt-4">
                  <Button asChild variant="outline" className="flex-1">
                    <Link href="/tienda">
                      <Calendar className="w-4 h-4 mr-2" />
                      Seguir explorando
                    </Link>
                  </Button>
                  <Button asChild className="flex-1">
                    <Link href="/">
                      Ir al inicio
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Link>
                  </Button>
                </div>
              </div>
            )}

            {status === 'error' && (
              <div className="flex flex-col items-center gap-4">
                <div className="p-4 rounded-full bg-red-100 dark:bg-red-950/40">
                  <XCircle className="w-12 h-12 text-red-600" />
                </div>
                <h1 className="font-display text-2xl font-bold">No pudimos confirmar tu pago</h1>
                <p className="text-muted-foreground max-w-sm">{errorMsg}</p>
                <p className="text-xs text-muted-foreground">
                  Si el cargo ya se hizo en tu banco, contacta a soporte con este ID:
                  <br />
                  <span className="font-mono">{sessionId}</span>
                </p>
                <Button asChild variant="outline" className="mt-2">
                  <Link href="/carrito">Volver al carrito</Link>
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}

export default function CheckoutSuccessPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      }
    >
      <CheckoutSuccessContent />
    </Suspense>
  );
}
