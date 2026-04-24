/**
 * ============================================
 * A-TENCIÓN · Bootstrap del backend
 * ============================================
 *
 * Carga las variables de entorno desde `.env` y levanta la app Express en
 * el puerto definido por `PORT` (por defecto 3001). Este archivo NO contiene
 * lógica de negocio: solo enciende el servidor y reporta los endpoints
 * principales en consola para facilitar la depuración.
 *
 * Jerarquía de arranque:
 *   1. `dotenv/config` — pobla `process.env` antes que cualquier otro módulo
 *      lea variables (MySQL pool, Stripe, Resend usan init perezoso).
 *   2. `./app.js`      — construye la instancia Express con middlewares y
 *      montaje de rutas.
 *   3. `app.listen`    — abre el socket en el puerto configurado.
 */
import "dotenv/config";
import { app } from "./app.js";

const PORT = process.env.PORT || 3001;

app.listen(PORT, () => {
  console.log(`✅ Backend activo en http://localhost:${PORT}`);
  console.log(`📋 Endpoints principales:`);
  console.log(`   • Health              GET  /api/health`);
  console.log(`   • API propia          /api/own/*`);
  console.log(`       - Auth            /api/own/auth/{login,register}`);
  console.log(`       - Experiencias    /api/own/experiencias`);
  console.log(`       - Carrito         /api/own/cart`);
  console.log(`       - Admin           /api/own/admin/*`);
  console.log(`   • APIs externas       /api/integrations/*`);
  console.log(`       - Stripe          /api/integrations/payments/*`);
  console.log(`       - Resend          /api/integrations/email/*`);
});
