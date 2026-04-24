'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { getExperiencias, type Experiencia } from '@/lib/api';
import { ExperienceCard } from '@/components/experiences/experience-card';

export function FeaturedExperiences() {
  const [experiences, setExperiences] = useState<Experiencia[]>([]);

  useEffect(() => {
    getExperiencias({ limit: 3, sortBy: 'rating' })
      .then((data) => setExperiences(data ?? []))
      .catch((error) => {
        console.error('No se pudieron cargar experiencias destacadas:', error);
      });
  }, []);

  return (
    <section id="enfoque" className="py-20 md:py-24">
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-12">
          <div>
            <h2 className="text-3xl md:text-4xl font-display font-bold mb-4">
              Experiencias <span className="text-primary">Destacadas</span>
            </h2>
            <p className="text-muted-foreground max-w-xl">
              Descubre nuestras sesiones más populares, diseñadas para diferentes
              necesidades sensoriales.
            </p>
          </div>
          <Link href="/tienda" className="mt-4 md:mt-0">
            <Button variant="outline" className="gap-2 rounded-full">
              Ver Todo el Catálogo
              <ArrowRight className="w-4 h-4" />
            </Button>
          </Link>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {(experiences ?? []).map((exp, index) => (
            <ExperienceCard key={exp?.id ?? index} experience={exp} index={index} />
          ))}
        </div>
      </div>
    </section>
  );
}
