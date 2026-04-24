/**
 * ============================================
 * Catálogo de experiencias — `/api/own/experiencias`
 * ============================================
 *
 * API REST completa sobre la tabla `experiencia`. Las rutas de lectura son
 * **públicas** (las usa la tienda sin login) y las de escritura requieren
 * JWT + rol admin.
 *
 * Endpoints:
 *   GET    /        Listar todas las experiencias (ordenado por rating o fecha).
 *   GET    /:id     Detalle con fechas disponibles futuras.
 *   POST   /        Crear una experiencia (admin).
 *   PUT    /:id     Reemplazar completamente (admin).
 *   PATCH  /:id     Actualización parcial (admin).
 *   DELETE /:id     Eliminar (admin).
 *
 * Los campos `beneficios` e `incluye` son arrays en la API pero se persisten
 * como JSON string en MySQL. Los helpers `parseJsonField` y `serializeValue`
 * hacen la conversión transparente.
 */
import { Router } from 'express';
import { query } from '../config/database.js';
import { authMiddleware, adminMiddleware } from '../middlewares/auth.js';

const router = Router();

/**
 * Lista blanca de columnas que se pueden editar vía API.
 * Evita que un cliente malicioso intente modificar `id`, `createdAt`, etc.
 */
const ALLOWED_FIELDS = [
  'nombre', 'categoria', 'descripcion', 'descripcionLarga',
  'precio', 'duracionMinutos', 'rangoEdad', 'tamanoGrupo',
  'beneficios', 'incluye', 'color', 'imagenUrl', 'rating', 'reviews'
];

/**
 * Serializa el valor de un campo antes de insertarlo en MySQL.
 * Los arrays (`beneficios`, `incluye`) se guardan como JSON string.
 *
 * @param {string} key   Nombre de la columna.
 * @param {*} value      Valor enviado por el cliente.
 * @returns {*}          Valor listo para el driver mysql2.
 */
const serializeValue = (key, value) => {
  if (value === undefined) return null;
  if (key === 'beneficios' || key === 'incluye') {
    return JSON.stringify(Array.isArray(value) ? value : []);
  }
  return value;
};

/**
 * Helper: convierte un campo de la DB a array.
 * Tolera 3 formas comunes: JSON string, array real, objeto plano.
 *
 * @param {*} value
 * @returns {Array}
 */
const parseJsonField = (value) => {
  if (!value) return [];
  if (Array.isArray(value)) return value;
  if (typeof value === 'object') return value;
  try {
    return JSON.parse(value);
  } catch {
    return [];
  }
};

/**
 * Mapea una fila cruda de MySQL a la forma pública esperada por el frontend.
 * Aplica fallbacks (`?? null`, `?? 0`) para tolerar columnas NULL sin romper
 * el tipado del cliente.
 *
 * @param {Object} row - Fila directa de `SELECT * FROM experiencia`.
 * @returns {Object}   - DTO listo para responder en JSON.
 */
const mapExperiencia = (row) => ({
  id: row.id,
  nombre: row.nombre,
  categoria: row.categoria,
  descripcion: row.descripcion,
  descripcionLarga: row.descripcionLarga ?? null,
  precio: Number(row.precio ?? 0),
  duracionMinutos: row.duracionMinutos ?? row.duracion ?? 0,
  rangoEdad: row.rangoEdad ?? null,
  tamanoGrupo: row.tamanoGrupo ?? null,
  beneficios: parseJsonField(row.beneficios),
  incluye: parseJsonField(row.incluye),
  color: row.color ?? null,
  imagenUrl: row.imagenUrl ?? null,
  rating: Number(row.rating ?? 0),
  reviews: Number(row.reviews ?? 0),
  createdAt: row.createdAt,
  updatedAt: row.updatedAt,
});

/**
 * GET /api/own/experiencias
 * Lista todas las experiencias desde MySQL.
 * Query params:
 *   - limit (opcional): número máximo de resultados
 *   - sortBy (opcional): 'rating' | 'createdAt' (default: 'rating')
 */
router.get('/', async (req, res) => {
  try {
    const limit = Math.max(0, Math.min(parseInt(req.query.limit, 10) || 0, 100));
    const sortBy = req.query.sortBy === 'createdAt' ? 'createdAt' : 'rating';

    const sql = `SELECT * FROM experiencia ORDER BY ${sortBy} DESC${limit ? ` LIMIT ${limit}` : ''}`;
    const rows = await query(sql);

    const experiencias = (rows ?? []).map(mapExperiencia);

    res.json({
      success: true,
      data: { experiencias }
    });
  } catch (error) {
    console.error('Error obteniendo experiencias:', error);
    res.status(500).json({
      success: false,
      error: 'Error al obtener experiencias',
      details: error?.message
    });
  }
});

/**
 * GET /api/own/experiencias/:id
 * Obtiene una experiencia por ID incluyendo sus fechas disponibles.
 */
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const rows = await query('SELECT * FROM experiencia WHERE id = ? LIMIT 1', [id]);
    if (!rows || rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Experiencia no encontrada'
      });
    }

    const experiencia = mapExperiencia(rows[0]);

    // Intentar cargar fechas disponibles (tabla fechadisponible)
    let fechasDisponibles = [];
    try {
      const fechasRows = await query(
        `SELECT * FROM fechadisponible
         WHERE experienciaId = ? AND fecha >= CURDATE()
         ORDER BY fecha ASC, horaInicio ASC
         LIMIT 28`,
        [id]
      );
      fechasDisponibles = (fechasRows ?? []).map(f => ({
        id: f.id,
        fecha: f.fecha,
        horaInicio: f.horaInicio,
        horaFin: f.horaFin,
        cuposDisponibles: Number(f.cuposDisponibles ?? 0),
      }));
    } catch (err) {
      console.warn('No se pudieron cargar fechas disponibles:', err?.message);
    }

    res.json({
      success: true,
      data: {
        experiencia: { ...experiencia, fechasDisponibles }
      }
    });
  } catch (error) {
    console.error('Error obteniendo experiencia por ID:', error);
    res.status(500).json({
      success: false,
      error: 'Error al obtener la experiencia',
      details: error?.message
    });
  }
});

/**
 * POST / — Crear experiencia (admin)
 */
router.post('/', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const body = req.body ?? {};
    if (!body.nombre || body.precio === undefined) {
      return res.status(400).json({ success: false, error: 'nombre y precio son requeridos' });
    }

    const id = body.id || `exp_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
    const fields = ['id', ...ALLOWED_FIELDS.filter(f => body[f] !== undefined)];
    const values = fields.map(f => (f === 'id' ? id : serializeValue(f, body[f])));
    const placeholders = fields.map(() => '?').join(', ');

    await query(
      `INSERT INTO experiencia (${fields.join(', ')}, createdAt, updatedAt) VALUES (${placeholders}, NOW(), NOW())`,
      values
    );

    const rows = await query('SELECT * FROM experiencia WHERE id = ? LIMIT 1', [id]);
    res.status(201).json({ success: true, data: { experiencia: mapExperiencia(rows[0]) } });
  } catch (error) {
    console.error('Error creando experiencia:', error);
    res.status(500).json({ success: false, error: 'Error al crear la experiencia', details: error?.message });
  }
});

/**
 * PUT /:id — Reemplazar (admin)
 */
router.put('/:id', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const body = req.body ?? {};

    const existing = await query('SELECT id FROM experiencia WHERE id = ? LIMIT 1', [id]);
    if (!existing || existing.length === 0) {
      return res.status(404).json({ success: false, error: 'Experiencia no encontrada' });
    }

    const setClauses = ALLOWED_FIELDS.map(f => `${f} = ?`);
    const values = ALLOWED_FIELDS.map(f => serializeValue(f, body[f] ?? null));
    values.push(id);

    await query(
      `UPDATE experiencia SET ${setClauses.join(', ')}, updatedAt = NOW() WHERE id = ?`,
      values
    );

    const rows = await query('SELECT * FROM experiencia WHERE id = ? LIMIT 1', [id]);
    res.json({ success: true, data: { experiencia: mapExperiencia(rows[0]) } });
  } catch (error) {
    console.error('Error actualizando experiencia (PUT):', error);
    res.status(500).json({ success: false, error: 'Error al actualizar la experiencia', details: error?.message });
  }
});

/**
 * PATCH /:id — Parcial (admin)
 */
router.patch('/:id', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const body = req.body ?? {};

    const keys = ALLOWED_FIELDS.filter(f => body[f] !== undefined);
    if (keys.length === 0) {
      return res.status(400).json({ success: false, error: 'No hay campos para actualizar' });
    }

    const existing = await query('SELECT id FROM experiencia WHERE id = ? LIMIT 1', [id]);
    if (!existing || existing.length === 0) {
      return res.status(404).json({ success: false, error: 'Experiencia no encontrada' });
    }

    const setClauses = keys.map(f => `${f} = ?`);
    const values = keys.map(f => serializeValue(f, body[f]));
    values.push(id);

    await query(
      `UPDATE experiencia SET ${setClauses.join(', ')}, updatedAt = NOW() WHERE id = ?`,
      values
    );

    const rows = await query('SELECT * FROM experiencia WHERE id = ? LIMIT 1', [id]);
    res.json({ success: true, data: { experiencia: mapExperiencia(rows[0]) } });
  } catch (error) {
    console.error('Error actualizando experiencia (PATCH):', error);
    res.status(500).json({ success: false, error: 'Error al actualizar la experiencia', details: error?.message });
  }
});

/**
 * DELETE /:id — Eliminar (admin)
 */
router.delete('/:id', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const existing = await query('SELECT id FROM experiencia WHERE id = ? LIMIT 1', [id]);
    if (!existing || existing.length === 0) {
      return res.status(404).json({ success: false, error: 'Experiencia no encontrada' });
    }

    await query('DELETE FROM experiencia WHERE id = ?', [id]);
    res.json({ success: true, message: 'Experiencia eliminada' });
  } catch (error) {
    console.error('Error eliminando experiencia:', error);
    res.status(500).json({ success: false, error: 'Error al eliminar la experiencia', details: error?.message });
  }
});

export default router;
