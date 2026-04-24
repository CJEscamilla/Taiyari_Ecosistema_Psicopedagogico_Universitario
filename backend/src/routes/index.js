/**
 * ============================================
 * Router raíz — `/api`
 * ============================================
 *
 * Agrupa los dos grandes bloques de la API:
 *   - `/api/own/*`          → API propia del proyecto (interna)
 *   - `/api/integrations/*` → APIs de terceros (Stripe, Resend)
 *
 * Tener el split explícito facilita identificar qué endpoints son de negocio
 * propio y cuáles son integraciones externas, tanto para documentación como
 * para aplicar middlewares globales distintos si llegara a necesitarse.
 */
import { Router } from "express";
import ownRoutes from "./own.js";
import integrationsRoutes from "./integrations.js";

const router = Router();

router.get("/", (_req, res) => {
  res.json({
    success: true,
    message: "Sensorial API v1.0 - Académica",
    endpoints: {
      own: "/api/own",
      integrations: "/api/integrations"
    },
    documentation: {
      apiPropia: "Rutas internas bajo /api/own/*",
      apiTerceros: "Integraciones externas bajo /api/integrations/*"
    }
  });
});

// API Propia - Rutas internas
router.use("/own", ownRoutes);

// APIs de Terceros - Integraciones externas
router.use("/integrations", integrationsRoutes);

export { router };
