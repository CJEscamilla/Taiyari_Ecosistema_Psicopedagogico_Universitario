'use client';

import { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';
import { TiendaContent } from '@/components/tienda/tienda-content';
import { getExperiencias, type Experiencia } from '@/lib/api';

export default function TiendaPage() {
  const [experiencias, setExperiencias] = useState<Experiencia[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getExperiencias({ sortBy: 'rating' })
      .then((data) => setExperiencias(data ?? []))
      .catch((err) => setError(err?.message ?? 'Error al cargar experiencias'))
      .finally(() => setLoading(false));
  }, []);

  const categorias = Array.from(
    new Set((experiencias ?? []).map((e) => e?.categoria).filter(Boolean))
  ) as string[];

  return (
    <>
      <Header />
      <main className="pt-20 min-h-screen">
        {loading ? (
          <div className="flex items-center justify-center py-24">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : error ? (
          <div className="text-center py-24 text-destructive">{error}</div>
        ) : (
          <TiendaContent experiencias={experiencias} categorias={categorias} />
        )}
      </main>
      <Footer />
    </>
  );
}
