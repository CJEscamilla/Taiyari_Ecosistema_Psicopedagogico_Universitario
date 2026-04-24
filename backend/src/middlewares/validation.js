/**
 * ============================================
 * Middlewares de validación con Zod
 * ============================================
 *
 * Factories que generan middlewares de Express a partir de un schema Zod.
 * Si el body/query no cumple el schema, responden 400 con una lista legible
 * de errores (`{ field, message }`). Si cumple, ceden el control con `next()`.
 *
 * Ventaja frente a validar dentro del handler: el handler recibe el body
 * ya verificado y puede confiar en los tipos sin volver a chequear.
 */
import { z } from 'zod';

/**
 * Valida `req.body` contra el schema dado.
 *
 * @param {z.ZodSchema} schema - Schema Zod que describe el body esperado.
 * @returns {import('express').RequestHandler}
 *
 * @example
 *   const loginSchema = z.object({ email: z.string().email(), password: z.string().min(6) });
 *   router.post('/login', validateBody(loginSchema), handler);
 */
export const validateBody = (schema) => {
  return (req, res, next) => {
    try {
      schema.parse(req.body);
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          success: false,
          error: 'Datos inválidos',
          details: error.errors.map(e => ({
            field: e.path.join('.'),
            message: e.message
          }))
        });
      }
      next(error);
    }
  };
};

/**
 * Valida `req.query` contra el schema dado.
 *
 * @param {z.ZodSchema} schema
 * @returns {import('express').RequestHandler}
 */
export const validateQuery = (schema) => {
  return (req, res, next) => {
    try {
      schema.parse(req.query);
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          success: false,
          error: 'Parámetros de consulta inválidos',
          details: error.errors.map(e => ({
            field: e.path.join('.'),
            message: e.message
          }))
        });
      }
      next(error);
    }
  };
};

// ============================================
// Schemas reutilizables
// ============================================
// Útiles para componer validaciones más complejas sin repetir reglas básicas.

/** Cadena con formato email válido. */
export const emailSchema = z.string().email('Email inválido');

/** Contraseña de al menos 6 caracteres (requerimiento de registro). */
export const passwordSchema = z.string().min(6, 'La contraseña debe tener al menos 6 caracteres');

/** UUID estricto. ⚠️ Si tu DB usa cuid/ULID/cadenas opacas, usa `z.string().min(1)`. */
export const uuidSchema = z.string().uuid('ID inválido');

/** Número estrictamente mayor que cero. */
export const positiveNumberSchema = z.number().positive('Debe ser un número positivo');
