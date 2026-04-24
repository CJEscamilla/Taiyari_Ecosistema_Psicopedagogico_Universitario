'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import Image from 'next/image';
import { Clock, Users, Star } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

const formatPrice = (value: number) =>
  new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN',
    maximumFractionDigits: 0,
  }).format(Number(value ?? 0));

interface ExperienceCardProps {
  experience: {
    id: string;
    nombre: string;
    descripcion: string;
    precio: number;
    duracionMinutos: number;
    imagenUrl: string | null;
    categoria: string;
    rating: number;
    reviews: number;
    tamanoGrupo: string | null;
    color: string | null;
  };
  index?: number;
}

export function ExperienceCard({ experience, index = 0 }: ExperienceCardProps) {
  const exp = experience ?? {};
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: index * 0.1 }}
      viewport={{ once: true }}
    >
      <Card className="group overflow-hidden card-hover h-full flex flex-col">
        <div className="relative aspect-[16/10] overflow-hidden bg-muted">
          <Image
            src={exp?.imagenUrl ?? '/images/image.png'}
            alt={exp?.nombre ?? 'Experiencia'}
            fill
            className="object-cover transition-transform duration-500 group-hover:scale-105"
          />
          <div className="absolute top-3 left-3">
            <Badge variant="secondary" className="shadow-md">
              {exp?.categoria ?? 'General'}
            </Badge>
          </div>
          <div
            className="absolute bottom-0 left-0 right-0 h-1"
            style={{ backgroundColor: exp?.color ?? '#e8d5c4' }}
          />
        </div>

        <CardContent className="flex-1 flex flex-col p-5">
          <h3 className="text-lg font-semibold mb-2 line-clamp-1">
            {exp?.nombre ?? 'Sin nombre'}
          </h3>
          <p className="text-muted-foreground text-sm mb-4 line-clamp-2 flex-1">
            {exp?.descripcion ?? ''}
          </p>

          <div className="flex items-center gap-4 text-sm text-muted-foreground mb-4">
            <div className="flex items-center gap-1">
              <Clock className="w-4 h-4" />
              {exp?.duracionMinutos ?? 0} min
            </div>
            <div className="flex items-center gap-1">
              <Users className="w-4 h-4" />
              {exp?.tamanoGrupo ?? 'Individual'}
            </div>
            <div className="flex items-center gap-1">
              <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
              {exp?.rating?.toFixed?.(1) ?? '0.0'}
            </div>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-lg font-bold text-primary">
              {formatPrice(exp?.precio ?? 0)}
            </span>
            <Link href={`/tienda/${exp?.id ?? ''}`}>
              <Button size="sm">Ver Detalles</Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
