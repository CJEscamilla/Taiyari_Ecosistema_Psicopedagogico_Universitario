'use client';

import { motion } from 'framer-motion';
import { useInView } from 'react-intersection-observer';
import { Eye, Hand, Move, Heart, Brain, Users } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

const benefits = [
  {
    icon: Eye,
    title: 'Estimulación Visual',
    description: 'Proyecciones inteligentes y luces adaptativas que responden al niño para una estimulación visual autónoma.',
    color: 'bg-blue-50 dark:bg-blue-900/20',
    iconColor: 'text-blue-600 dark:text-blue-400'
  },
  {
    icon: Hand,
    title: 'Regulación Táctil',
    description: 'Texturas interactivas que se adaptan al tacto, fomentando la exploración independiente.',
    color: 'bg-amber-50 dark:bg-amber-900/20',
    iconColor: 'text-amber-600 dark:text-amber-400'
  },
  {
    icon: Move,
    title: 'Conciencia Corporal',
    description: 'Circuitos dinámicos con sensores de movimiento para desarrollar equilibrio y coordinación.',
    color: 'bg-green-50 dark:bg-green-900/20',
    iconColor: 'text-green-600 dark:text-green-400'
  },
  {
    icon: Heart,
    title: 'Regulación Emocional',
    description: 'Entornos de arte interactivo que permiten la expresión libre y la regulación emocional autónoma.',
    color: 'bg-rose-50 dark:bg-rose-900/20',
    iconColor: 'text-rose-600 dark:text-rose-400'
  },
  {
    icon: Brain,
    title: 'Desarrollo Cognitivo',
    description: 'Herramientas dinámicas que estimulan la atención, memoria y resolución de problemas.',
    color: 'bg-purple-50 dark:bg-purple-900/20',
    iconColor: 'text-purple-600 dark:text-purple-400'
  },
  {
    icon: Users,
    title: 'Interacción Social',
    description: 'Espacios de exploración compartida que fomentan habilidades sociales de forma natural.',
    color: 'bg-teal-50 dark:bg-teal-900/20',
    iconColor: 'text-teal-600 dark:text-teal-400'
  }
];

export function BenefitsSection() {
  const [ref, inView] = useInView({ triggerOnce: true, threshold: 0.1 });

  return (
    <section id="beneficios" className="py-20 md:py-24 bg-secondary/20">
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6">
        <motion.div
          ref={ref}
          initial={{ opacity: 0, y: 30 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl md:text-4xl font-display font-bold mb-4">
            Beneficios del Entorno <span className="text-primary">Interactivo</span>
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Cada espacio está diseñado para que el niño explore de forma autónoma,
            con herramientas dinámicas que se adaptan a sus necesidades.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {benefits.map((benefit, index) => (
            <motion.div
              key={benefit.title}
              initial={{ opacity: 0, y: 30 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.5, delay: index * 0.1 }}
            >
              <Card className="h-full card-hover border-none shadow-md">
                <CardContent className="p-6">
                  <div className={`w-14 h-14 rounded-xl ${benefit.color} flex items-center justify-center mb-4`}>
                    <benefit.icon className={`w-7 h-7 ${benefit.iconColor}`} />
                  </div>
                  <h3 className="text-lg font-semibold mb-2">{benefit.title}</h3>
                  <p className="text-muted-foreground text-sm">{benefit.description}</p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
