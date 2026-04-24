/**
 * ============================================
 * Carrito de compras — `/api/own/cart`
 * ============================================
 *
 * Implementación simple **en memoria** con un `Map<userId, item[]>`. Útil
 * para el alcance académico del proyecto porque:
 *   - No requiere crear una tabla adicional.
 *   - Refleja la naturaleza "efímera" de un carrito antes de pagar.
 *
 * Limitaciones (a tener en cuenta si se despliega):
 *   - Se pierde al reiniciar el backend.
 *   - No funciona con múltiples réplicas del proceso (cluster) porque cada
 *     instancia tiene su propio Map. En ese caso migrar a Redis o una tabla
 *     `carrito` en MySQL.
 *
 * Todas las rutas exigen JWT vía `authMiddleware`.
 */
import { Router } from "express";
import { authMiddleware } from "../middlewares/auth.js";

const router = Router();

/** Mapa de carrito por usuario. Clave = `userId` del JWT. */
const carritos = new Map();

/**
 * GET /api/own/cart
 * Devuelve los items del carrito del usuario autenticado (array vacío si
 * aún no ha agregado nada).
 */
router.get("/", authMiddleware, (req, res) => {
  const userId = req.user.id;
  const items = carritos.get(userId) || [];
  
  res.json({
    success: true,
    data: { items }
  });
});

/**
 * POST /api/own/cart
 * Agrega un item al carrito. Campos obligatorios: `experienciaId`,
 * `fechaDisponibleId`, `nombre`, `precio`. El backend genera un `id` único
 * y un `addedAt` (ISO) para facilitar el listado ordenado.
 */
router.post("/", authMiddleware, (req, res) => {
  const userId = req.user.id;
  const { 
    experienciaId, 
    fechaDisponibleId, 
    nombre, 
    precio, 
    fecha, 
    horaInicio, 
    horaFin,
    cantidad = 1 
  } = req.body;

  // Validaciones
  if (!experienciaId || !fechaDisponibleId || !nombre || !precio) {
    return res.status(400).json({
      success: false,
      error: "Faltan datos requeridos"
    });
  }

  if (precio <= 0) {
    return res.status(400).json({
      success: false,
      error: "El precio debe ser mayor a 0"
    });
  }

  // Inicializar carrito si no existe
  if (!carritos.has(userId)) {
    carritos.set(userId, []);
  }

  const userCart = carritos.get(userId);
  
  // Crear nuevo item
  const newItem = {
    id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    experienciaId,
    fechaDisponibleId,
    nombre,
    precio: parseFloat(precio),
    cantidad: parseInt(cantidad),
    fecha,
    horaInicio,
    horaFin,
    addedAt: new Date().toISOString()
  };

  userCart.push(newItem);

  res.json({
    success: true,
    message: "Item agregado al carrito",
    data: { item: newItem }
  });
});

/**
 * DELETE /api/own/cart/:id
 * Elimina un item específico. Responde 404 si el carrito no existe o si el
 * id no se encuentra dentro del carrito del usuario.
 */
router.delete("/:id", authMiddleware, (req, res) => {
  const userId = req.user.id;
  const itemId = req.params.id;

  if (!carritos.has(userId)) {
    return res.status(404).json({
      success: false,
      error: "Carrito no encontrado"
    });
  }

  const userCart = carritos.get(userId);
  const filteredCart = userCart.filter(item => item.id !== itemId);
  
  if (filteredCart.length === userCart.length) {
    return res.status(404).json({
      success: false,
      error: "Item no encontrado en el carrito"
    });
  }

  carritos.set(userId, filteredCart);

  res.json({
    success: true,
    message: "Item eliminado del carrito"
  });
});

/**
 * DELETE /api/own/cart
 * Vacía completamente el carrito del usuario. Se usa tras un pago exitoso
 * para dejar el carrito limpio en la próxima visita del usuario.
 */
router.delete("/", authMiddleware, (req, res) => {
  const userId = req.user.id;
  carritos.delete(userId);
  
  res.json({
    success: true,
    message: "Carrito vaciado"
  });
});

export default router;
