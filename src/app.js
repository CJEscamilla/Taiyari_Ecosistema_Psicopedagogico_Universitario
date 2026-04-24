/**
 * ============================================
 * A-TENCIÓN · Express app
 * ============================================
 *
 * Configura la aplicación Express con todos los middlewares y monta el
 * router raíz bajo `/api`. Este archivo exporta la instancia sin iniciar
 * el listener (eso lo hace `server.js`), lo que facilita testear la app
 * con supertest si se desea.
 *
 * Orden de los middlewares (importante):
 *   1. `cors()`      — acepta peticiones cross-origin del frontend en :3000
 *   2. `morgan("dev")` — logging colorizado de cada request
 *   3. `express.raw` específico para el webhook de Stripe (debe ir ANTES
 *      de `express.json()` porque Stripe firma el body crudo)
 *   4. `express.json()` — parser JSON para el resto de rutas
 *   5. Rutas de health/home
 *   6. Montaje del router `/api` (el cual a su vez expone `/api/own/*`
 *      y `/api/integrations/*`)
 */
import cors from "cors";
import express from "express";
import morgan from "morgan";
import { router } from "./routes/index.js";

const app = express();

// Permite peticiones desde el frontend (Next.js, localhost:3000).
app.use(cors());

// Logger HTTP. En producción se puede cambiar a "combined" para más detalle.
app.use(morgan("dev"));

// ⚠️ El webhook de Stripe valida la firma sobre el body SIN parsear.
// Debe registrarse ANTES de express.json() para que el body llegue en crudo.
app.use(
  "/api/integrations/payments/webhook",
  express.raw({ type: "application/json" })
);

// Para todas las demás rutas se parsea JSON automáticamente.
app.use(express.json());

/** Ruta raíz amistosa, útil para verificar que el proceso está vivo. */
app.get("/", (_req, res) => {
  res.send("Backend activo. Usa /api o /api/health");
});

/** Health check ligero que no toca base de datos ni servicios externos. */
app.get("/api/health", (_req, res) => {
  res.json({ ok: true, message: "Backend activo" });
});

// Montaje del router principal con todas las rutas del negocio.
app.use("/api", router);

export { app };
