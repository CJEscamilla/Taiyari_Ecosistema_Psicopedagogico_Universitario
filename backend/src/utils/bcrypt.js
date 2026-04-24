/**
 * ============================================
 * Utilidades para manejo seguro de contraseñas
 * ============================================
 *
 * Envoltorio sobre la librería `bcrypt` para mantener consistencia en el
 * número de rondas de salt a lo largo del proyecto.
 *
 * 12 rondas es un buen balance entre seguridad y rendimiento en 2025-2026:
 * ~300 ms/hash en una CPU moderna. Subir a 14 si el hardware es potente.
 */
import bcrypt from 'bcrypt';

/** Factor de coste. Cada +1 duplica el tiempo de hashing. */
const SALT_ROUNDS = 12;

/**
 * Hashea una contraseña en texto plano con bcrypt.
 *
 * @param {string} password - Contraseña original del usuario.
 * @returns {Promise<string>} Hash listo para guardar en la DB.
 */
export const hashPassword = async (password) => {
  return bcrypt.hash(password, SALT_ROUNDS);
};

/**
 * Compara una contraseña en texto plano contra un hash bcrypt.
 * Tiempo-constante internamente: resistente a timing attacks.
 *
 * @param {string} password       - La que envió el usuario al hacer login.
 * @param {string} hashedPassword - El hash guardado en la DB.
 * @returns {Promise<boolean>}
 */
export const comparePassword = async (password, hashedPassword) => {
  return bcrypt.compare(password, hashedPassword);
};
