/**
 * ============================================
 * Panel administrativo — `/api/own/admin/*`
 * ============================================
 *
 * Todas las rutas de este archivo están protegidas con `authMiddleware +
 * adminMiddleware` aplicados globalmente con `router.use()`. Cualquier
 * petición sin JWT válido o sin rol admin recibe 401/403 antes de llegar
 * al handler.
 *
 * Endpoints expuestos (ver docs/API-Propia.md para detalle):
 *   GET    /stats                 Métricas agregadas para dashboard.
 *   GET    /usuarios              Listado con conteos de niños y reservas.
 *   GET    /experiencias          Catálogo con fechas + conteo de reservas.
 *   POST   /experiencias          Crear experiencia (rechaza duplicado).
 *   PATCH  /experiencias          Actualización parcial (id en body).
 *   DELETE /experiencias?id=...   Eliminar.
 *   POST   /fechas                Crear horario (rechaza día/hora duplicado).
 *   DELETE /fechas?id=...         Eliminar horario.
 *   GET    /reservas              Listar reservas con tutor y detalles.
 *   PATCH  /reservas              Cambiar estado de una reserva.
 */
import { Router } from 'express';
import crypto from 'crypto';
import { query } from '../config/database.js';
import { authMiddleware, adminMiddleware } from '../middlewares/auth.js';

const router = Router();

// Gate global: todas las rutas posteriores requieren JWT + rol admin.
router.use(authMiddleware, adminMiddleware);

/**
 * Helper robusto para parsear un campo que puede venir como JSON string,
 * array real o undefined. Mismo contrato que `parseJsonField` en `experiencias.js`.
 */
const parseJson = (v) => {
  if (!v) return [];
  if (Array.isArray(v)) return v;
  if (typeof v === 'object') return v;
  try { return JSON.parse(v); } catch { return []; }
};

// ============================================
// GET /stats — Resumen general
// ============================================
router.get('/stats', async (_req, res) => {
  try {
    const [
      [usuariosRow],
      [ninosRow],
      [reservasRow],
      [experienciasRow],
      [confirmadasRow],
      [pendientesRow],
      [canceladasRow],
      [ingresosRow],
      [reservasRecientesRow],
      [nuevosUsuariosRow],
    ] = await Promise.all([
      query('SELECT COUNT(*) AS total FROM user'),
      query('SELECT COUNT(*) AS total FROM nino'),
      query('SELECT COUNT(*) AS total FROM reserva'),
      query('SELECT COUNT(*) AS total FROM experiencia'),
      query("SELECT COUNT(*) AS total FROM reserva WHERE estado = 'Confirmada'"),
      query("SELECT COUNT(*) AS total FROM reserva WHERE estado = 'Pendiente'"),
      query("SELECT COUNT(*) AS total FROM reserva WHERE estado = 'Cancelada'"),
      query("SELECT COALESCE(SUM(total), 0) AS total FROM reserva WHERE estado = 'Confirmada'"),
      query('SELECT COUNT(*) AS total FROM reserva WHERE createdAt >= DATE_SUB(NOW(), INTERVAL 7 DAY)'),
      query('SELECT COUNT(*) AS total FROM user WHERE createdAt >= DATE_SUB(NOW(), INTERVAL 7 DAY)'),
    ]);

    res.json({
      totalUsuarios: Number(usuariosRow?.total ?? 0),
      totalNinos: Number(ninosRow?.total ?? 0),
      totalReservas: Number(reservasRow?.total ?? 0),
      totalExperiencias: Number(experienciasRow?.total ?? 0),
      reservasConfirmadas: Number(confirmadasRow?.total ?? 0),
      reservasPendientes: Number(pendientesRow?.total ?? 0),
      reservasCanceladas: Number(canceladasRow?.total ?? 0),
      ingresosTotales: Number(ingresosRow?.total ?? 0),
      reservasRecientes: Number(reservasRecientesRow?.total ?? 0),
      nuevosUsuarios: Number(nuevosUsuariosRow?.total ?? 0),
    });
  } catch (error) {
    console.error('Error en admin/stats:', error);
    res.status(500).json({ error: 'Error al cargar estadísticas', details: error?.message });
  }
});

// ============================================
// USUARIOS
// ============================================
router.get('/usuarios', async (_req, res) => {
  try {
    const rows = await query(`
      SELECT
        u.id, u.email, u.nombre, u.telefono, u.role, u.createdAt,
        (SELECT COUNT(*) FROM nino n WHERE n.tutorId = u.id) AS ninosCount,
        (SELECT COUNT(*) FROM reserva r WHERE r.tutorId = u.id) AS reservasCount
      FROM user u
      ORDER BY u.createdAt DESC
    `);

    const usuarios = rows.map((u) => ({
      id: u.id,
      email: u.email,
      nombre: u.nombre,
      telefono: u.telefono,
      role: u.role,
      createdAt: u.createdAt,
      _count: {
        ninos: Number(u.ninosCount ?? 0),
        reservas: Number(u.reservasCount ?? 0),
      },
    }));

    res.json(usuarios);
  } catch (error) {
    console.error('Error en admin/usuarios:', error);
    res.status(500).json({ error: 'Error al cargar usuarios', details: error?.message });
  }
});

// ============================================
// EXPERIENCIAS (con fechas y conteo de reservas)
// ============================================
router.get('/experiencias', async (_req, res) => {
  try {
    const experiencias = await query(`
      SELECT e.*,
        (SELECT COUNT(*) FROM detallereserva d WHERE d.experienciaId = e.id) AS reservasCount
      FROM experiencia e
      ORDER BY e.createdAt DESC
    `);

    const ids = experiencias.map((e) => e.id);
    let fechasByExp = {};
    if (ids.length > 0) {
      const placeholders = ids.map(() => '?').join(',');
      const fechas = await query(
        `SELECT id, experienciaId, fecha, horaInicio, horaFin, cuposTotales, cuposDisponibles
         FROM fechadisponible
         WHERE experienciaId IN (${placeholders})
         ORDER BY fecha ASC, horaInicio ASC`,
        ids
      );
      fechasByExp = fechas.reduce((acc, f) => {
        (acc[f.experienciaId] ??= []).push(f);
        return acc;
      }, {});
    }

    const result = experiencias.map((e) => ({
      ...e,
      precio: Number(e.precio),
      beneficios: parseJson(e.beneficios),
      incluye: parseJson(e.incluye),
      _count: { detallesReserva: Number(e.reservasCount ?? 0) },
      fechasDisponibles: fechasByExp[e.id] ?? [],
    }));

    res.json(result);
  } catch (error) {
    console.error('Error en admin/experiencias GET:', error);
    res.status(500).json({ error: 'Error al cargar experiencias', details: error?.message });
  }
});

const EXP_FIELDS = [
  'nombre', 'categoria', 'descripcion', 'descripcionLarga',
  'precio', 'duracionMinutos', 'rangoEdad', 'tamanoGrupo',
  'beneficios', 'incluye', 'color', 'imagenUrl',
];

const serializeExpField = (key, value) => {
  if (value === undefined || value === '') return null;
  if (key === 'beneficios' || key === 'incluye') {
    return JSON.stringify(Array.isArray(value) ? value : []);
  }
  if (key === 'precio' || key === 'duracionMinutos') {
    return value === null ? null : Number(value);
  }
  return value;
};

router.post('/experiencias', async (req, res) => {
  try {
    const body = req.body ?? {};
    if (!body.nombre || body.precio === undefined) {
      return res.status(400).json({ error: 'nombre y precio son requeridos' });
    }
    const id = body.id || crypto.randomUUID();
    const fields = ['id', ...EXP_FIELDS.filter((f) => body[f] !== undefined)];
    const values = fields.map((f) => (f === 'id' ? id : serializeExpField(f, body[f])));
    const placeholders = fields.map(() => '?').join(', ');
    await query(
      `INSERT INTO experiencia (${fields.join(', ')}, rating, reviews, createdAt, updatedAt)
       VALUES (${placeholders}, 0, 0, NOW(), NOW())`,
      values
    );
    res.status(201).json({ success: true, id });
  } catch (error) {
    console.error('Error en admin/experiencias POST:', error);
    res.status(500).json({ error: 'Error al crear experiencia', details: error?.message });
  }
});

router.patch('/experiencias', async (req, res) => {
  try {
    const body = req.body ?? {};
    const { id } = body;
    if (!id) return res.status(400).json({ error: 'id requerido' });

    const keys = EXP_FIELDS.filter((f) => body[f] !== undefined);
    if (keys.length === 0) return res.status(400).json({ error: 'Nada que actualizar' });

    const setClauses = keys.map((f) => `${f} = ?`);
    const values = keys.map((f) => serializeExpField(f, body[f]));
    values.push(id);

    const result = await query(
      `UPDATE experiencia SET ${setClauses.join(', ')}, updatedAt = NOW() WHERE id = ?`,
      values
    );
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Experiencia no encontrada' });
    }
    res.json({ success: true });
  } catch (error) {
    console.error('Error en admin/experiencias PATCH:', error);
    res.status(500).json({ error: 'Error al actualizar experiencia', details: error?.message });
  }
});

router.delete('/experiencias', async (req, res) => {
  try {
    const id = req.query.id;
    if (!id) return res.status(400).json({ error: 'id requerido' });
    const result = await query('DELETE FROM experiencia WHERE id = ?', [id]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Experiencia no encontrada' });
    }
    res.json({ success: true });
  } catch (error) {
    console.error('Error en admin/experiencias DELETE:', error);
    res.status(500).json({ error: 'Error al eliminar experiencia', details: error?.message });
  }
});

// ============================================
// FECHAS (HORARIOS)
// ============================================
router.post('/fechas', async (req, res) => {
  try {
    const { experienciaId, fecha, horaInicio, horaFin, cuposTotales } = req.body ?? {};
    if (!experienciaId || !fecha || !horaInicio || !horaFin || !cuposTotales) {
      return res.status(400).json({ error: 'Faltan campos requeridos' });
    }
    const existing = await query(
      `SELECT id FROM fechadisponible
       WHERE experienciaId = ? AND DATE(fecha) = DATE(?) AND horaInicio = ? AND horaFin = ?
       LIMIT 1`,
      [experienciaId, fecha, horaInicio, horaFin]
    );
    if (existing.length > 0) {
      return res.status(409).json({ error: 'Ya existe un horario idéntico para esta experiencia' });
    }
    const id = crypto.randomUUID();
    const cupos = Number(cuposTotales);
    await query(
      `INSERT INTO fechadisponible
        (id, experienciaId, fecha, horaInicio, horaFin, cuposTotales, cuposDisponibles, createdAt)
       VALUES (?, ?, ?, ?, ?, ?, ?, NOW())`,
      [id, experienciaId, fecha, horaInicio, horaFin, cupos, cupos]
    );
    res.status(201).json({ success: true, id });
  } catch (error) {
    console.error('Error en admin/fechas POST:', error);
    res.status(500).json({ error: 'Error al crear horario', details: error?.message });
  }
});

router.delete('/fechas', async (req, res) => {
  try {
    const id = req.query.id;
    if (!id) return res.status(400).json({ error: 'id requerido' });
    const result = await query('DELETE FROM fechadisponible WHERE id = ?', [id]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Horario no encontrado' });
    }
    res.json({ success: true });
  } catch (error) {
    console.error('Error en admin/fechas DELETE:', error);
    res.status(500).json({ error: 'Error al eliminar horario', details: error?.message });
  }
});

// ============================================
// RESERVAS
// ============================================
router.get('/reservas', async (_req, res) => {
  try {
    const reservas = await query(`
      SELECT r.id, r.total, r.estado, r.createdAt,
             u.id AS tutorId, u.nombre AS tutorNombre, u.email AS tutorEmail, u.telefono AS tutorTelefono
      FROM reserva r
      LEFT JOIN user u ON u.id = r.tutorId
      ORDER BY r.createdAt DESC
    `);

    const ids = reservas.map((r) => r.id);
    let detallesByReserva = {};
    if (ids.length > 0) {
      const placeholders = ids.map(() => '?').join(',');
      const detalles = await query(
        `SELECT d.id, d.reservaId, d.precioUnitario, d.cantidad,
                e.id AS experienciaId, e.nombre AS experienciaNombre,
                f.id AS fechaId, f.fecha, f.horaInicio, f.horaFin,
                n.id AS ninoId, n.nombre AS ninoNombre
         FROM detallereserva d
         LEFT JOIN experiencia e ON e.id = d.experienciaId
         LEFT JOIN fechadisponible f ON f.id = d.fechaDisponibleId
         LEFT JOIN nino n ON n.id = d.ninoId
         WHERE d.reservaId IN (${placeholders})`,
        ids
      );
      detallesByReserva = detalles.reduce((acc, d) => {
        (acc[d.reservaId] ??= []).push({
          id: d.id,
          precioUnitario: Number(d.precioUnitario ?? 0),
          cantidad: Number(d.cantidad ?? 1),
          experiencia: { nombre: d.experienciaNombre ?? 'Sin nombre' },
          fechaDisponible: {
            fecha: d.fecha,
            horaInicio: d.horaInicio ?? '',
            horaFin: d.horaFin ?? '',
          },
          nino: d.ninoId ? { nombre: d.ninoNombre } : null,
        });
        return acc;
      }, {});
    }

    const result = reservas.map((r) => ({
      id: r.id,
      total: Number(r.total ?? 0),
      estado: r.estado,
      createdAt: r.createdAt,
      tutor: {
        nombre: r.tutorNombre ?? 'Desconocido',
        email: r.tutorEmail ?? '',
        telefono: r.tutorTelefono ?? null,
      },
      detalles: detallesByReserva[r.id] ?? [],
    }));

    res.json(result);
  } catch (error) {
    console.error('Error en admin/reservas GET:', error);
    res.status(500).json({ error: 'Error al cargar reservas', details: error?.message });
  }
});

router.patch('/reservas', async (req, res) => {
  try {
    const { id, estado } = req.body ?? {};
    if (!id || !estado) return res.status(400).json({ error: 'id y estado requeridos' });
    const valid = ['Pendiente', 'Confirmada', 'Cancelada'];
    if (!valid.includes(estado)) {
      return res.status(400).json({ error: 'Estado inválido' });
    }
    const result = await query(
      'UPDATE reserva SET estado = ? WHERE id = ?',
      [estado, id]
    );
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Reserva no encontrada' });
    }
    res.json({ success: true });
  } catch (error) {
    console.error('Error en admin/reservas PATCH:', error);
    res.status(500).json({ error: 'Error al actualizar reserva', details: error?.message });
  }
});

export default router;
