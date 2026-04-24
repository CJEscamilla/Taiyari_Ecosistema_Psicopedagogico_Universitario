'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';
import {
  ClipboardList, Trash2, ArrowLeft, ArrowRight, Clock,
  Calendar, UserCircle, Loader2, CalendarCheck
} from 'lucide-react';
import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { formatDate } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { getToken } from '@/lib/api';

interface CartItem {
  id: string;
  cantidad: number;
  precio: number;
  nombre: string;
  fecha: string;
  horaInicio: string;
  horaFin: string;
  ninoId: string | null;
}

export default function PendientesPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [items, setItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [removing, setRemoving] = useState<string | null>(null);

  useEffect(() => {
    const token = getToken();
    if (!token) {
      router.push('/auth/login');
      return;
    }

    fetchPendientes();
  }, [router]);

  const fetchPendientes = async () => {
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
    } catch (error) {
      console.error('Error fetching pendientes:', error);
    } finally {
      setLoading(false);
    }
  };

  const removeItem = async (itemId: string) => {
    const token = getToken();
    if (!token) return;

    setRemoving(itemId);
    try {
      // Llamar al backend Express (API Propia)
      const res = await fetch(`http://localhost:3001/api/own/cart/${itemId}`, { 
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (res.ok) {
        setItems(prev => (prev ?? []).filter(i => i?.id !== itemId));
        toast({
          title: 'Sesi\u00f3n removida',
          description: 'La sesi\u00f3n ha sido removida de tu carrito',
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'No se pudo remover la sesi\u00f3n',
        variant: 'destructive'
      });
    } finally {
      setRemoving(null);
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
        <div className="max-w-[900px] mx-auto px-4 sm:px-6 py-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="flex items-center gap-3 mb-2">
              <ClipboardList className="w-8 h-8 text-primary" />
              <h1 className="text-3xl font-display font-bold">Mis Pendientes</h1>
            </div>
            <p className="text-muted-foreground mb-8">Sesiones que has reservado y est\u00e1n por confirmar</p>

            {(items?.length ?? 0) === 0 ? (
              <Card className="text-center py-16">
                <CardContent>
                  <CalendarCheck className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                  <h2 className="text-xl font-semibold mb-2">No tienes sesiones pendientes</h2>
                  <p className="text-muted-foreground mb-6">
                    Explora nuestras experiencias sensoriales y reserva la sesi\u00f3n ideal para tu peque\u00f1o.
                  </p>
                  <Link href="/tienda">
                    <Button className="gap-2">
                      <ArrowLeft className="w-4 h-4" />
                      Explorar Experiencias
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            ) : (
              <>
                <div className="space-y-4 mb-8">
                  {(items ?? []).map((item, index) => (
                    <motion.div
                      key={item?.id ?? index}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                    >
                      <Card className="overflow-hidden">
                        <CardContent className="p-0">
                          <div className="flex flex-col sm:flex-row">
                            <div className="relative w-full sm:w-44 h-28 sm:h-auto bg-muted shrink-0">
                              <Image
                                src='/images/image.png'
                                alt={item?.nombre ?? 'Experiencia'}
                                fill
                                className="object-cover"
                              />
                            </div>
                            <div className="flex-1 p-4">
                              <div className="flex justify-between items-start">
                                <div>
                                  <h3 className="font-semibold mb-2">
                                    {item?.nombre ?? 'Experiencia'}
                                  </h3>
                                  <div className="flex flex-wrap gap-3 text-sm text-muted-foreground mb-2">
                                    <span className="flex items-center gap-1">
                                      <Calendar className="w-4 h-4" />
                                      {formatDate(item?.fecha ?? '')}
                                    </span>
                                    <span className="flex items-center gap-1">
                                      <Clock className="w-4 h-4" />
                                      {item?.horaInicio ?? ''} - {item?.horaFin ?? ''}
                                    </span>
                                  </div>
                                  <div className="text-sm font-medium text-primary">
                                    ${item?.precio ?? 0} MXN
                                  </div>
                                </div>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => removeItem(item?.id ?? '')}
                                  disabled={removing === item?.id}
                                  className="text-muted-foreground hover:text-destructive shrink-0"
                                >
                                  {removing === item?.id ? (
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                  ) : (
                                    <Trash2 className="w-4 h-4" />
                                  )}
                                </Button>
                              </div>
                              <div className="mt-3">
                                <Badge variant="secondary" className="text-xs">Pendiente de pago</Badge>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  ))}
                </div>

                <div className="flex flex-col sm:flex-row gap-4">
                  <Link href="/checkout" className="flex-1">
                    <Button className="w-full gap-2" size="lg">
                      Confirmar Reservaciones
                      <ArrowRight className="w-4 h-4" />
                    </Button>
                  </Link>
                  <Link href="/tienda">
                    <Button variant="outline" className="w-full sm:w-auto">
                      Seguir Explorando
                    </Button>
                  </Link>
                </div>
              </>
            )}
          </motion.div>
        </div>
      </main>
      <Footer />
    </>
  );
}
