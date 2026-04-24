'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import Image from 'next/image';
import { useInView } from 'react-intersection-observer';
import { ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function CTASection() {
  const [ref, inView] = useInView({ triggerOnce: true, threshold: 0.1 });

  return (
    <section className="py-16 md:py-24">
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6">
        <motion.div
          ref={ref}
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary/95 via-primary to-amber-700 p-8 md:p-12 lg:p-16"
        >
          <div className="absolute inset-0 opacity-10">
            <div className="absolute inset-0" style={{
              backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)',
              backgroundSize: '32px 32px'
            }} />
          </div>

          <div className="relative z-10 max-w-2xl mx-auto text-center">
            <p className="text-white/70 text-sm mb-4 uppercase tracking-wider">Reserva tu sesión</p>
            <h2 className="text-2xl md:text-3xl lg:text-4xl font-display font-bold text-white mb-4">
              Descubre nuestros entornos interactivos y encuentra la experiencia perfecta para tu hijo.
            </h2>
            <p className="text-white/70 mb-8 text-base">
              Espacios de exploración independiente donde la tecnología se adapta al niño.
            </p>
            <Link href="/tienda">
              <Button
                size="lg"
                className="gap-2 rounded-full bg-white text-primary hover:bg-white/90 shadow-lg px-8 font-semibold"
              >
                Ir a la Tienda de Experiencias
                <ArrowRight className="w-5 h-5" />
              </Button>
            </Link>
          </div>

          <div className="absolute bottom-0 left-4 w-20 h-24 opacity-30">
            <Image src="/images/imgLeaf.png" alt="" fill className="object-contain" />
          </div>
        </motion.div>
      </div>
    </section>
  );
}
