'use client';

import { useEffect, useState } from 'react';
import { notFound, useParams } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';
import { ExperienceDetail } from '@/components/tienda/experience-detail';
import { getExperienciaById, type Experiencia } from '@/lib/api';

export default function ExperienciaPage() {
  const params = useParams<{ id: string }>();
  const id = params?.id ?? '';
  const [experiencia, setExperiencia] = useState<Experiencia | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFoundState, setNotFoundState] = useState(false);

  useEffect(() => {
    if (!id) return;
    getExperienciaById(id)
      .then((data) => {
        if (!data) setNotFoundState(true);
        else setExperiencia(data);
      })
      .catch(() => setNotFoundState(true))
      .finally(() => setLoading(false));
  }, [id]);

  if (notFoundState) {
    notFound();
  }

  return (
    <>
      <Header />
      <main className="pt-20 min-h-screen">
        {loading || !experiencia ? (
          <div className="flex items-center justify-center py-24">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : (
          <ExperienceDetail experiencia={experiencia as any} />
        )}
      </main>
      <Footer />
    </>
  );
}
