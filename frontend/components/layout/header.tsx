'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X, ClipboardList, User, Sun, Moon, LogOut, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useTheme } from 'next-themes';
import { cn } from '@/lib/utils';
import { isAuthenticated, isAdmin, logout, getToken } from '@/lib/api';

export function Header() {
  const pathname = usePathname();
  const router = useRouter();
  const { theme, setTheme } = useTheme();
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [cartCount, setCartCount] = useState(0);
  const [mounted, setMounted] = useState(false);
  const [authenticated, setAuthenticated] = useState(false);
  const [userIsAdmin, setUserIsAdmin] = useState(false);

  useEffect(() => {
    setMounted(true);
    setAuthenticated(isAuthenticated());
    setUserIsAdmin(isAdmin());
  }, [pathname]);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 10);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    if (authenticated) {
      // Obtener conteo del carrito desde localStorage o backend
      const token = getToken();
      fetch('http://localhost:3001/api/own/cart', {
        headers: { 'Authorization': `Bearer ${token}` }
      })
        .then(res => res.json())
        .then(data => setCartCount(data?.data?.items?.length ?? 0))
        .catch(() => {});
    }
  }, [authenticated, pathname]);

  const navLinks = [
    { href: '/', label: 'Inicio' },
    { href: '/#enfoque', label: 'Nuestro Enfoque' },
  ];

  return (
    <header
      className={cn(
        'fixed top-0 left-0 right-0 z-50 transition-all duration-300',
        isScrolled
          ? 'bg-background/95 backdrop-blur-md shadow-sm border-b border-border/50'
          : 'bg-background/80 backdrop-blur-sm'
      )}
    >
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-16 md:h-20">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2">
            <div className="relative w-10 h-10 md:w-11 md:h-11 flex-shrink-0">
              <Image
                src="/images/logo-atencion.png"
                alt="A-TENCIÓN logo"
                fill
                className="object-contain"
                priority
              />
            </div>
            <span className="font-display text-lg md:text-xl font-bold tracking-wide text-foreground">
              A-TENCIÓN
            </span>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-1">
            {navLinks.map(link => (
              <Link key={link.href} href={link.href}>
                <Button
                  variant="ghost"
                  className={cn(
                    'font-medium text-muted-foreground hover:text-foreground',
                    pathname === link.href && 'text-foreground'
                  )}
                >
                  {link.label}
                </Button>
              </Link>
            ))}
          </nav>

          {/* Desktop Actions */}
          <div className="hidden md:flex items-center gap-2">
            {mounted && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                aria-label="Toggle theme"
              >
                {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
              </Button>
            )}

            {authenticated ? (
              <>
                {userIsAdmin && (
                  <Link href="/admin/reservas">
                    <Button variant="ghost" size="icon" title="Panel Admin">
                      <Shield className="w-5 h-5 text-primary" />
                    </Button>
                  </Link>
                )}
                <Link href="/perfil">
                  <Button variant="ghost" size="icon">
                    <User className="w-5 h-5" />
                  </Button>
                </Link>
                <Link href="/carrito">
                  <Button variant="ghost" size="icon" className="relative" title="Mis Pendientes">
                    <ClipboardList className="w-5 h-5" />
                    {cartCount > 0 && (
                      <span className="absolute -top-1 -right-1 w-5 h-5 bg-primary text-primary-foreground text-xs rounded-full flex items-center justify-center">
                        {cartCount}
                      </span>
                    )}
                  </Button>
                </Link>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => { logout(); router.push('/'); }}
                  aria-label="Cerrar sesión"
                >
                  <LogOut className="w-5 h-5" />
                </Button>
              </>
            ) : (
              <>
                <Link href="/auth/login">
                  <Button variant="ghost" className="font-medium">Ingresar</Button>
                </Link>
                <Link href="/tienda">
                  <Button className="bg-primary hover:bg-primary/90 text-primary-foreground rounded-full px-6 font-medium">
                    Ver Catálogo
                  </Button>
                </Link>
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </Button>
        </div>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden bg-background border-t"
          >
            <nav className="flex flex-col p-4 gap-2">
              {navLinks.map(link => (
                <Link key={link.href} href={link.href} onClick={() => setMobileMenuOpen(false)}>
                  <Button variant={pathname === link.href ? 'secondary' : 'ghost'} className="w-full justify-start">
                    {link.label}
                  </Button>
                </Link>
              ))}
              <Link href="/tienda" onClick={() => setMobileMenuOpen(false)}>
                <Button variant="ghost" className="w-full justify-start">Ver Catálogo</Button>
              </Link>
              {authenticated ? (
                <>
                  {userIsAdmin && (
                    <Link href="/admin/reservas" onClick={() => setMobileMenuOpen(false)}>
                      <Button variant="ghost" className="w-full justify-start gap-2">
                        <Shield className="w-5 h-5 text-primary" />
                        Panel Admin
                      </Button>
                    </Link>
                  )}
                  <Link href="/perfil" onClick={() => setMobileMenuOpen(false)}>
                    <Button variant="ghost" className="w-full justify-start gap-2">
                      <User className="w-5 h-5" /> Mis Niños
                    </Button>
                  </Link>
                  <Link href="/carrito" onClick={() => setMobileMenuOpen(false)}>
                    <Button variant="ghost" className="w-full justify-start gap-2">
                      <ClipboardList className="w-5 h-5" /> Mis Pendientes
                      {cartCount > 0 && <span className="ml-auto bg-primary text-primary-foreground text-xs px-2 py-0.5 rounded-full">{cartCount}</span>}
                    </Button>
                  </Link>
                  <Button variant="ghost" className="w-full justify-start gap-2" onClick={() => { logout(); router.push('/'); setMobileMenuOpen(false); }}>
                    <LogOut className="w-5 h-5" /> Cerrar Sesión
                  </Button>
                </>
              ) : (
                <>
                  <Link href="/auth/login" onClick={() => setMobileMenuOpen(false)}>
                    <Button variant="ghost" className="w-full">Ingresar</Button>
                  </Link>
                  <Link href="/auth/registro" onClick={() => setMobileMenuOpen(false)}>
                    <Button className="w-full">Registrarse</Button>
                  </Link>
                </>
              )}
              {mounted && (
                <Button variant="outline" className="w-full justify-start gap-2" onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}>
                  {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
                  {theme === 'dark' ? 'Modo Claro' : 'Modo Oscuro'}
                </Button>
              )}
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
