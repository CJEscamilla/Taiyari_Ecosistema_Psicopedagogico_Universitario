'use client';

import { motion } from 'framer-motion';
import { useInView } from 'react-intersection-observer';
import { Star, Quote } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

const testimonials = [
  {
    name: 'María González',
    child: 'Madre de Sofía (5 años)',
    text: 'El entorno de arena cinética ha sido transformador para Sofía. Ahora puede regular mejor sus emociones explorando texturas de forma autónoma.',
    rating: 5
  },
  {
    name: 'Carlos Rodríguez',
    child: 'Padre de Mateo (7 años)',
    text: 'El circuito interactivo le ha ayudado muchísimo con su coordinación. El ambiente se adapta a su ritmo y eso le da mucha confianza.',
    rating: 5
  },
  {
    name: 'Ana Martínez',
    child: 'Madre de Lucas (4 años)',
    text: 'El rincón de luces inteligente es el favorito de Lucas. La tecnología adaptativa ha mejorado su atención y ahora duerme mucho mejor.',
    rating: 5
  }
];

export function TestimonialsSection() {
  const [ref, inView] = useInView({ triggerOnce: true, threshold: 0.1 });

  return (
    <section className="py-20 md:py-24">
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6">
        <motion.div
          ref={ref}
          initial={{ opacity: 0, y: 30 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl md:text-4xl font-display font-bold mb-4">
            Lo que Dicen las <span className="text-primary">Familias</span>
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Historias reales de familias que han experimentado el cambio positivo en sus pequeños.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-6">
          {testimonials.map((testimonial, index) => (
            <motion.div
              key={testimonial.name}
              initial={{ opacity: 0, y: 30 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.5, delay: index * 0.15 }}
            >
              <Card className="h-full card-hover border-none shadow-md">
                <CardContent className="p-6">
                  <Quote className="w-10 h-10 text-primary/20 mb-4" />
                  <p className="text-muted-foreground mb-6 italic">&ldquo;{testimonial.text}&rdquo;</p>
                  <div className="flex items-center gap-1 mb-3">
                    {[...Array(testimonial.rating)].map((_, i) => (
                      <Star key={i} className="w-4 h-4 fill-amber-400 text-amber-400" />
                    ))}
                  </div>
                  <div>
                    <p className="font-semibold">{testimonial.name}</p>
                    <p className="text-sm text-muted-foreground">{testimonial.child}</p>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
