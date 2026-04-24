/**
 * ============================================
 * Configuración de MySQL (pool + helpers)
 * ============================================
 *
 * Implementa un pool de conexiones con `mysql2/promise` y dos helpers de
 * alto nivel:
 *   - `query(sql, params)`     — ejecuta una query parametrizada y devuelve filas.
 *   - `transaction(callback)`  — ejecuta varias queries atómicamente.
 *
 * ⚠️ El pool se crea de forma **perezosa** (al primer uso) para asegurar que
 * `dotenv` ya haya poblado `process.env`. Si se creara al importar el módulo,
 * podría leer variables indefinidas al momento de arrancar.
 *
 * Variables de entorno requeridas:
 *   DB_HOST, DB_PORT, DB_USER, DB_PASSWORD, DB_NAME
 */
import mysql from 'mysql2/promise';

// Singleton del pool. Permanece null hasta que se llame por primera vez.
let pool = null;

/**
 * Crea (una sola vez) el pool de conexiones con la configuración del `.env`.
 * @returns {import('mysql2/promise').Pool}
 */
const getPool = () => {
  if (!pool) {
    const config = {
      host: process.env.DB_HOST || 'localhost',
      port: Number(process.env.DB_PORT) || 3306,
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'sensorial_db',
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0,
      enableKeepAlive: true,
      keepAliveInitialDelay: 0,
    };
    console.log(`🗄️  MySQL pool → ${config.user}@${config.host}:${config.port}/${config.database}`);
    pool = mysql.createPool(config);
  }
  return pool;
};

/**
 * Ejecuta una query parametrizada y devuelve las filas (SELECT) o el
 * objeto ResultSetHeader (INSERT/UPDATE/DELETE).
 *
 * @param {string} sql - SQL con placeholders `?`.
 * @param {Array} [params] - Valores para los placeholders en orden.
 * @returns {Promise<Array|Object>}
 *
 * @example
 *   const users = await query('SELECT * FROM user WHERE email = ?', [email]);
 */
export const query = async (sql, params) => {
  const [rows] = await getPool().execute(sql, params);
  return rows;
};

/**
 * Ejecuta un callback dentro de una transacción MySQL con BEGIN/COMMIT/ROLLBACK
 * automáticos. Si el callback lanza, se hace rollback y se re-lanza el error.
 *
 * El callback recibe la conexión dedicada — usa `conn.execute(sql, params)`
 * en lugar de `query()` para que todas las sentencias compartan la misma
 * transacción.
 *
 * @param {(conn: import('mysql2/promise').PoolConnection) => Promise<any>} callback
 * @returns {Promise<any>} Lo que retorne el callback.
 *
 * @example
 *   await transaction(async (conn) => {
 *     await conn.execute('INSERT INTO reserva ...');
 *     await conn.execute('UPDATE fechadisponible ...');
 *   });
 */
export const transaction = async (callback) => {
  const connection = await getPool().getConnection();
  try {
    await connection.beginTransaction();
    const result = await callback(connection);
    await connection.commit();
    return result;
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
};

export default { query, transaction };
