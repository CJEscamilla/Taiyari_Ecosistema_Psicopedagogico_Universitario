'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight, Star, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function HeroSection() {
  return (
    <section className="relative pt-24 pb-4 md:pt-28 md:pb-8 overflow-hidden bg-gradient-to-b from-background to-secondary/20">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div
          className="absolute top-32 right-[15%] w-5 h-5 rounded-full bg-amber-300/30"
          animate={{ y: [0, -15, 0], rotate: [0, 15, 0] }}
          transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
        />
        <motion.div
          className="absolute top-48 left-[8%] w-4 h-4 rounded-full bg-green-300/25"
          animate={{ y: [0, -20, 0] }}
          transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
        />
      </div>

      <div className="max-w-[1200px] mx-auto px-4 sm:px-6">
        <div className="grid lg:grid-cols-[1fr_0.8fr] gap-6 lg:gap-10 items-center">
          <motion.div
            initial={{ opacity: 0, x: -40 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.7 }}
            className="order-2 lg:order-1"
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 mb-6">
              <Sparkles className="w-4 h-4 text-primary" />
              <span className="text-primary text-sm font-medium">Tecnología Interactiva Inclusiva</span>
            </div>

            <h1 className="text-3xl md:text-4xl lg:text-[2.75rem] font-display font-bold mb-6 leading-tight text-foreground">
              A-TENCIÓN: Un espacio{' '}
              <br className="hidden md:block" />
              para <span className="text-primary">crecer</span> jugando
            </h1>

            <p className="text-base md:text-lg text-muted-foreground mb-8 max-w-xl leading-relaxed">
              Entornos interactivos inteligentes diseñados para la estimulación sensorial autónoma de cada niño. Espacios donde la tecnología y el juego se unen para el bienestar.
            </p>

            <div className="flex flex-wrap gap-4 mb-10">
              <Link href="/#enfoque">
                <Button size="lg" className="gap-2 rounded-full bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg px-6">
                  Conoce Nuestras Áreas
                  <ArrowRight className="w-5 h-5" />
                </Button>
              </Link>
              <Link href="/tienda">
                <Button size="lg" variant="outline" className="gap-2 rounded-full px-6 border-border hover:bg-secondary">
                  Ver Catálogo
                </Button>
              </Link>
            </div>

            <div className="border-t border-border/50 pt-6">
              <div className="flex items-center gap-4">
                <div className="flex -space-x-2">
                  {['MG', 'CR', 'AL', 'JP'].map((initials, i) => {
                    const colors = ['bg-amber-600 text-white', 'bg-green-600 text-white', 'bg-primary text-primary-foreground', 'bg-amber-500 text-white'];
                    return (
                      <div key={i} className={`w-9 h-9 rounded-full ${colors[i]} flex items-center justify-center text-xs font-semibold ring-2 ring-background`}>
                        {initials}
                      </div>
                    );
                  })}
                </div>
                <div>
                  <div className="flex items-center gap-1">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="w-4 h-4 fill-amber-400 text-amber-400" />
                    ))}
                    <span className="ml-1 text-sm font-semibold">4.9</span>
                  </div>
                  <p className="text-xs text-muted-foreground">+500 familias confían en nosotros</p>
                </div>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.7, delay: 0.15 }}
            className="relative order-1 lg:order-2 flex justify-center"
          >
            <div className="relative w-[280px] h-[280px] md:w-[340px] md:h-[340px] lg:w-[380px] lg:h-[380px]">
              <Image
                src="/images/imgKidsInBallon.png"
                alt="Niños disfrutando entornos interactivos en A-TENCIÓN"
                fill
                className="object-contain"
                priority
              />
            </div>
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="mt-8 md:mt-12"
        >
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8 text-center py-6">
            {[
              { value: '500+', label: 'Sesiones realizadas' },
              { value: '98%', label: 'Familias satisfechas' },
              { value: '6', label: 'Entornos interactivos' },
              { value: '4', label: 'Áreas de estimulación' },
            ].map((stat, i) => (
              <div key={i}>
                <p className="text-2xl md:text-3xl font-display font-bold text-primary">{stat.value}</p>
                <p className="text-sm text-muted-foreground mt-1">{stat.label}</p>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
}
