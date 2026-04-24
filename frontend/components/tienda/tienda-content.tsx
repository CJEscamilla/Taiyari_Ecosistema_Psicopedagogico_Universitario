'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Search, Filter, Sparkles } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ExperienceCard } from '@/components/experiences/experience-card';

interface Experiencia {
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
}

interface TiendaContentProps {
  experiencias: Experiencia[];
  categorias: string[];
}

export function TiendaContent({ experiencias, categorias }: TiendaContentProps) {
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const filtered = (experiencias ?? []).filter(exp => {
    const matchesSearch = (exp?.nombre ?? '').toLowerCase().includes(search.toLowerCase()) ||
                         (exp?.descripcion ?? '').toLowerCase().includes(search.toLowerCase());
    const matchesCategory = !selectedCategory || exp?.categoria === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="max-w-[1200px] mx-auto px-4 sm:px-6 py-12">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-12"
      >
        <div className="flex items-center justify-center gap-2 mb-4">
          <Sparkles className="w-6 h-6 text-primary" />
          <span className="text-primary text-sm font-medium tracking-wider uppercase">
            Catálogo
          </span>
        </div>
        <h1 className="text-3xl md:text-4xl font-display font-bold mb-4">
          Experiencias <span className="text-primary">Sensoriales</span>
        </h1>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          Explora nuestras experiencias interactivas diseñadas para apoyar el desarrollo sensorial de cada niño.
        </p>
      </motion.div>

      {/* Filters */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="flex flex-col md:flex-row gap-4 mb-8"
      >
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <Input
            placeholder="Buscar experiencias..."
            className="pl-10"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            variant={selectedCategory === null ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSelectedCategory(null)}
            className="gap-1"
          >
            <Filter className="w-4 h-4" />
            Todas
          </Button>
          {(categorias ?? []).map(cat => (
            <Button
              key={cat}
              variant={selectedCategory === cat ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedCategory(cat)}
            >
              {cat}
            </Button>
          ))}
        </div>
      </motion.div>

      {/* Results count */}
      <div className="flex items-center gap-2 mb-6">
        <Badge variant="secondary">{filtered?.length ?? 0} experiencias</Badge>
        {selectedCategory && (
          <Badge variant="outline" className="gap-1">
            {selectedCategory}
            <button
              onClick={() => setSelectedCategory(null)}
              className="ml-1 hover:text-destructive"
            >
              ×
            </button>
          </Badge>
        )}
      </div>

      {/* Grid */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {(filtered ?? []).map((exp, index) => (
          <ExperienceCard key={exp?.id ?? index} experience={exp} index={index} />
        ))}
      </div>

      {(filtered?.length ?? 0) === 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center py-16"
        >
          <p className="text-muted-foreground">No se encontraron experiencias con esos criterios.</p>
        </motion.div>
      )}
    </div>
  );
}
