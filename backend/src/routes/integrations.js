/**
 * ============================================
 * APIs DE TERCEROS — `/api/integrations`
 * ============================================
 *
 * Sub-router que expone integraciones con servicios externos:
 *   - `/payments/*` Stripe Checkout (crear sesión, confirmar pago, webhook).
 *   - `/email/*`    Resend (emails transaccionales HTML).
 *
 * Mantener los endpoints externos bajo un prefijo distinto permite aplicar
 * políticas especiales (rate-limits, monitoring) y documentar con claridad
 * qué partes del sistema dependen de servicios de terceros.
 */
import { Router } from "express";
import stripeRoutes from "./stripe.js";
import resendRoutes from "./resend.js";

const router = Router();

/**
 * APIs DE TERCEROS - Integraciones externas
 * Prefijo: /api/integrations/*
 * 
 * Incluye:
 * - Stripe: Pasarela de pagos (/api/integrations/payments/*)
 * - Resend: Envío de emails (/api/integrations/email/*)
 */

// Re-export Stripe routes bajo /payments
router.use("/payments", stripeRoutes);

// Re-export Resend routes bajo /email
router.use("/email", resendRoutes);

// Health check para /api/integrations
router.get("/", (_req, res) => {
  res.json({
    success: true,
    message: "APIs de Terceros - Integraciones",
    endpoints: {
      payments: {
        stripe: "/api/integrations/payments/create-session",
        verify: "/api/integrations/payments/session/:id"
      },
      email: {
        resend: "/api/integrations/email/send-confirmation"
      }
    }
  });
});

export default router;
