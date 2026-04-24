/**
 * ============================================
 * Configuración del cliente Stripe
 * ============================================
 *
 * Exporta por defecto un Proxy que actúa como el cliente Stripe pero crea
 * la instancia real solo cuando se accede por primera vez (lazy init).
 * Esto evita errores de "key undefined" cuando el módulo se importa antes
 * de que `dotenv` pueble `process.env`.
 *
 * Uso:
 *   import stripe from './config/stripe.js';
 *   await stripe.checkout.sessions.create({ ... });
 *
 * Variable de entorno requerida: `STRIPE_SECRET_KEY` (formato `sk_test_...` o `sk_live_...`).
 */
import Stripe from 'stripe';

// Singleton; se crea al primer acceso del Proxy.
let stripeInstance = null;

const getStripe = () => {
  if (!stripeInstance) {
    const key = process.env.STRIPE_SECRET_KEY;
    if (!key) {
      throw new Error('STRIPE_SECRET_KEY no está configurada en el archivo .env');
    }
    stripeInstance = new Stripe(key, { apiVersion: '2024-12-18.acacia' });
  }
  return stripeInstance;
};

// Proxy para que `stripe.checkout.sessions.create(...)` siga funcionando
const stripe = new Proxy({}, {
  get(_target, prop) {
    return getStripe()[prop];
  },
});

export default stripe;
