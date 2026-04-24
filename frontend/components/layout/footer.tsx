import Link from 'next/link';
import Image from 'next/image';

export function Footer() {
  return (
    <footer className="bg-foreground text-background">
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">
          {/* Brand */}
          <div>
            <div className="flex items-center gap-2.5 mb-4">
              <div className="relative w-10 h-10 flex-shrink-0">
                <Image
                  src="/images/logo-atencion.png"
                  alt="A-TENCIÓN logo"
                  fill
                  className="object-contain"
                />
              </div>
              <span className="font-display text-xl font-bold tracking-wide">
                A-TENCIÓN
              </span>
            </div>
            <p className="text-background/60 text-sm leading-relaxed mb-6">
              Tecnología Interactiva Inclusiva. Entornos inteligentes diseñados para la estimulación sensorial autónoma de los más pequeños.
            </p>
            <div className="flex items-center gap-2 mt-2">
              <span className="px-2.5 py-1 border border-background/20 rounded text-xs text-background/40 italic">Redes sociales — próximamente</span>
            </div>
          </div>

          {/* Sesiones */}
          <div>
            <h3 className="font-semibold text-base mb-4">Sesiones</h3>
            <ul className="space-y-3">
              <li><Link href="/tienda" className="text-sm text-background/60 hover:text-background transition-colors">Arena Cinética</Link></li>
              <li><Link href="/tienda" className="text-sm text-background/60 hover:text-background transition-colors">Luces y Sonido</Link></li>
              <li><Link href="/tienda" className="text-sm text-background/60 hover:text-background transition-colors">Psicomotricidad</Link></li>
              <li><Link href="/tienda" className="text-sm text-background/60 hover:text-background transition-colors">Arte Sensorial</Link></li>
              <li><Link href="/tienda" className="text-sm text-background/60 hover:text-background transition-colors">Todas las sesiones</Link></li>
            </ul>
          </div>

          {/* Empresa */}
          <div>
            <h3 className="font-semibold text-base mb-4">Empresa</h3>
            <ul className="space-y-3">
              <li><Link href="/#enfoque" className="text-sm text-background/60 hover:text-background transition-colors">Nuestro Enfoque</Link></li>
              <li><Link href="/#beneficios" className="text-sm text-background/60 hover:text-background transition-colors">Beneficios</Link></li>
            </ul>
          </div>

          {/* Contacto */}
          <div>
            <h3 className="font-semibold text-base mb-4">Contacto</h3>
            <ul className="space-y-3">
              <li className="text-sm text-background/60">contactoxicode2026@gmail.com</li>
              <li className="text-sm text-background/60">Xicotepec de Juárez, Puebla</li>
            </ul>
            <h4 className="font-semibold text-sm mt-6 mb-3">Métodos de pago</h4>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-1 border border-background/20 rounded text-xs text-background/40 italic">Próximamente</span>
            </div>
          </div>
        </div>
      </div>

      <div className="border-t border-background/10">
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6 py-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-sm text-background/40">A-TENCIÓN © 2026. Todos los derechos reservados.</p>
          <div className="flex items-center gap-6">
            <span className="text-sm text-background/40 hover:text-background/60 cursor-pointer transition-colors">Privacidad</span>
            <span className="text-sm text-background/40 hover:text-background/60 cursor-pointer transition-colors">Términos</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
