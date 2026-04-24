/**
 * ============================================
 * Utilidades para JWT (JSON Web Tokens)
 * ============================================
 *
 * Centraliza la generación y verificación de tokens. Usa `jsonwebtoken`
 * bajo el capó con las variables de entorno:
 *   - `JWT_SECRET`     (obligatorio en producción)
 *   - `JWT_EXPIRES_IN` (default '7d')
 *
 * También expone la lista blanca de emails admin y un helper `isAdminEmail`
 * para asignar rol automáticamente al registrarse o iniciar sesión.
 */
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET;
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

/**
 * Lista hardcoded de correos con rol administrador.
 * Cualquier usuario que se registre o loguee con uno de estos correos recibe
 * `role: 'admin'` en el JWT, sin importar lo que tenga la columna `user.role`.
 */
const ADMIN_EMAILS = [
  '240508@utxicotepec.edu.mx',
  '240687@utxicotepec.edu.mx',
  '240463@utxicotepec.edu.mx',
  '240071@utxicotepec.edu.mx'
];

/**
 * Indica si un correo pertenece a la lista de administradores hardcoded.
 *
 * @param {string} email - Correo a evaluar (no distingue mayúsculas).
 * @returns {boolean}
 */
export const isAdminEmail = (email) => {
  return ADMIN_EMAILS.includes(email.toLowerCase());
};

/**
 * Genera un JWT firmado con los datos principales del usuario.
 * El rol se calcula automáticamente a partir del email (`isAdminEmail`).
 *
 * Payload generado:
 *   { userId, email, nombre, role, iat, exp }
 *
 * @param {{ id: string, email: string, nombre: string }} user
 * @returns {string} JWT firmado y listo para enviar al cliente.
 */
export const generateToken = (user) => {
  const payload = {
    userId: user.id,
    email: user.email,
    nombre: user.nombre,
    role: isAdminEmail(user.email) ? 'admin' : 'user'
  };

  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
};

/**
 * Verifica firma y expiración de un JWT.
 * No lanza excepciones: devuelve `null` si el token es inválido o expirado,
 * simplificando el manejo en middlewares.
 *
 * @param {string} token
 * @returns {Object|null} Payload decodificado o `null`.
 */
export const verifyToken = (token) => {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    return null;
  }
};

export { ADMIN_EMAILS };
