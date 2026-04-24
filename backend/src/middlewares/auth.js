/**
 * ============================================
 * Middlewares de autenticación
 * ============================================
 *
 * Expone dos middlewares encadenables:
 *   - `authMiddleware`  — exige un JWT válido en el header `Authorization`.
 *   - `adminMiddleware` — exige adicionalmente que el rol sea `admin`.
 *
 * Tras `authMiddleware`, el resto de handlers pueden leer `req.user` con
 * la forma `{ userId, id, email, nombre, role, iat, exp }`.
 */
import { verifyToken } from '../utils/jwt.js';

/**
 * Verifica la presencia y validez del JWT en `Authorization: Bearer <token>`.
 * Si es válido, anexa `req.user` y cede el control al siguiente middleware.
 *
 * Respuestas de error posibles:
 *   - 401 "Token no proporcionado"  — header ausente o sin prefijo `Bearer`.
 *   - 401 "Token inválido o expirado" — firma incorrecta o `exp` vencido.
 *   - 401 "Error de autenticación"  — excepción inesperada.
 *
 * @param {import('express').Request}  req
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} next
 */
export const authMiddleware = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ 
        success: false, 
        error: 'Token no proporcionado' 
      });
    }

    const token = authHeader.substring(7);
    const decoded = verifyToken(token);

    if (!decoded) {
      return res.status(401).json({ 
        success: false, 
        error: 'Token inválido o expirado' 
      });
    }

    // Normalizamos: históricamente el payload guarda `userId` pero la
    // mayoría de rutas trabaja con `id`. Exponemos ambos en `req.user`.
    req.user = { ...decoded, id: decoded.id ?? decoded.userId };
    next();
  } catch (error) {
    return res.status(401).json({ 
      success: false, 
      error: 'Error de autenticación' 
    });
  }
};

/**
 * Exige que `req.user.role === 'admin'`.
 * DEBE registrarse en la cadena después de `authMiddleware`, ya que depende
 * de que `req.user` esté poblado.
 *
 * Respuesta de error:
 *   - 403 "Acceso denegado" — usuario autenticado pero sin rol admin.
 *
 * @example
 *   router.post('/admin/resource', authMiddleware, adminMiddleware, handler);
 */
export const adminMiddleware = (req, res, next) => {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({ 
      success: false, 
      error: 'Acceso denegado. Se requiere rol de administrador' 
    });
  }
  next();
};
