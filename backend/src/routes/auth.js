/**
 * ============================================
 * Rutas de autenticación — `/api/own/auth`
 * ============================================
 *
 * Endpoints públicos para crear cuenta y obtener un JWT:
 *   POST /register  Alta de nuevo tutor (o admin si el email está en la lista).
 *   POST /login     Autenticación por email + contraseña.
 *
 * La emisión del token se delega al helper `generateToken`. No hay refresh
 * tokens: cuando el JWT expira (default 7 días), el cliente debe loguearse
 * de nuevo.
 */
import { Router } from 'express';
import crypto from 'crypto';
import { z } from 'zod';
import { query } from '../config/database.js';
import { hashPassword, comparePassword } from '../utils/bcrypt.js';
import { generateToken, isAdminEmail } from '../utils/jwt.js';
import { validateBody } from '../middlewares/validation.js';

const router = Router();

// --------------------------------------------
// Schemas de validación (Zod)
// --------------------------------------------
const registerSchema = z.object({
  nombre: z.string().min(2, 'El nombre debe tener al menos 2 caracteres'),
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres'),
  telefono: z.string().optional()
});

const loginSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(1, 'La contraseña es requerida')
});

/**
 * POST /api/own/auth/register
 *
 * Crea un usuario en la tabla `user`. Valida duplicados por email, hashea
 * la contraseña con bcrypt (12 rondas) y asigna rol `admin` si el correo
 * está en la lista blanca de `utils/jwt.js`, o `tutor` en caso contrario.
 *
 * Responde con el usuario público (sin password) y un JWT listo para usar.
 */
router.post('/register', validateBody(registerSchema), async (req, res) => {
  try {
    const { nombre, email, password, telefono } = req.body;

    // Verificar si el email ya existe
    const existingUsers = await query('SELECT id FROM user WHERE email = ?', [email]);
    if (existingUsers.length > 0) {
      return res.status(400).json({
        success: false,
        error: 'El email ya está registrado'
      });
    }

    // Hashear la contraseña
    const hashedPassword = await hashPassword(password);
    const id = crypto.randomUUID();
    const role = isAdminEmail(email) ? 'admin' : 'tutor';

    // Insertar el usuario (tabla: user, columnas camelCase estilo Prisma)
    await query(
      `INSERT INTO user (id, nombre, email, password, telefono, role, createdAt, updatedAt)
       VALUES (?, ?, ?, ?, ?, ?, NOW(), NOW())`,
      [id, nombre, email, hashedPassword, telefono || null, role]
    );

    const user = { id, email, nombre };
    const token = generateToken(user);

    res.status(201).json({
      success: true,
      message: 'Usuario registrado exitosamente',
      data: { user: { id, nombre, email }, token }
    });
  } catch (error) {
    console.error('Error en registro:', error);
    res.status(500).json({
      success: false,
      error: 'Error al registrar usuario',
      details: error?.message
    });
  }
});

/**
 * POST /api/own/auth/login
 *
 * Autentica un usuario existente. Busca el email en la DB, compara la
 * contraseña contra el hash bcrypt y, si coincide, genera un JWT.
 *
 * Por seguridad devuelve el mismo mensaje "Credenciales inválidas" tanto
 * si el email no existe como si la contraseña es incorrecta — evita filtrar
 * qué correos están registrados.
 */
router.post('/login', validateBody(loginSchema), async (req, res) => {
  try {
    const { email, password } = req.body;

    // Buscar el usuario
    const users = await query(
      'SELECT id, nombre, email, password FROM user WHERE email = ?',
      [email]
    );

    if (users.length === 0) {
      return res.status(401).json({
        success: false,
        error: 'Credenciales inválidas'
      });
    }

    const user = users[0];

    // Verificar contraseña
    const isValidPassword = await comparePassword(password, user.password);
    if (!isValidPassword) {
      return res.status(401).json({
        success: false,
        error: 'Credenciales inválidas'
      });
    }

    // Generar token JWT (automáticamente detecta si es admin)
    const token = generateToken(user);

    res.json({
      success: true,
      message: 'Inicio de sesión exitoso',
      data: {
        user: {
          id: user.id,
          nombre: user.nombre,
          email: user.email
        },
        token
      }
    });
  } catch (error) {
    console.error('Error en login:', error);
    res.status(500).json({
      success: false,
      error: 'Error al iniciar sesión',
      details: error?.message
    });
  }
});

export default router;
