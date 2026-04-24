/**
 * ============================================
 * API PROPIA — `/api/own`
 * ============================================
 *
 * Sub-router que agrupa todos los endpoints internos de la aplicación:
 *   - `/auth`         Login + registro (público para crear cuenta/sesión).
 *   - `/cart`         Carrito del usuario autenticado.
 *   - `/experiencias` Catálogo (lectura pública, escritura admin).
 *   - `/admin`        Panel administrativo (admin-only).
 */
import { Router } from "express";
import authRoutes from "./auth.js";
import cartRoutes from "./cart.js";
import experienciasRoutes from "./experiencias.js";
import adminRoutes from "./admin.js";

const router = Router();

/**
 * API PROPIA - Rutas internas de la aplicación
 * Prefijo: /api/own/*
 * 
 * Incluye:
 * - Autenticación (login, register)
 * - Carrito de compras
 * - Gestión de usuarios
 * - Gestión de niños
 * - Gestión de reservas
 */

router.use("/auth", authRoutes);
router.use("/cart", cartRoutes);
router.use("/experiencias", experienciasRoutes);
router.use("/admin", adminRoutes);

// Health check para /api/own
router.get("/", (_req, res) => {
  res.json({
    success: true,
    message: "API Propia - Sensorial",
    endpoints: {
      auth: "/api/own/auth",
      cart: "/api/own/cart",
      login: "POST /api/own/auth/login",
      register: "POST /api/own/auth/register",
      addToCart: "POST /api/own/cart",
      getCart: "GET /api/own/cart",
      removeFromCart: "DELETE /api/own/cart/:id"
    }
  });
});

export default router;
