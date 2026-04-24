/**
 * ============================================
 * Configuración del cliente Resend
 * ============================================
 *
 * Patrón idéntico a `config/stripe.js`: exporta un Proxy con init perezoso
 * y expone `isResendConfigured()` para que las rutas puedan degradar
 * elegantemente cuando no hay API key (modo "email simulado").
 *
 * Uso:
 *   import resend, { isResendConfigured } from './config/resend.js';
 *   if (isResendConfigured()) {
 *     await resend.emails.send({ from, to, subject, html });
 *   }
 *
 * Variable de entorno requerida: `RESEND_API_KEY` (formato `re_...`).
 */
import { Resend } from 'resend';

// Se resuelve a un cliente Resend o null si la key no está definida.
let resendInstance = null;
// Garantiza que la resolución anterior sólo se haga una vez.
let resolved = false;

const getResend = () => {
  if (!resolved) {
    resolved = true;
    resendInstance = process.env.RESEND_API_KEY
      ? new Resend(process.env.RESEND_API_KEY)
      : null;
  }
  return resendInstance;
};

// Proxy: expone null o métodos de la instancia real cuando se accede
const resend = new Proxy(function () {}, {
  get(_target, prop) {
    const r = getResend();
    if (!r) return undefined;
    return r[prop];
  },
  apply() {
    return getResend();
  },
});

export const isResendConfigured = () => !!getResend();
export default resend;
