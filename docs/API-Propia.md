# 📘 API Propia — `/api/own/*`

API REST interna del proyecto A-TENCIÓN, construida con Express + `mysql2` + JWT. Cubre autenticación, catálogo de experiencias, carrito y panel de administración.

**Base URL:** `http://localhost:3001`

**Formato de respuesta:** Todas las respuestas son JSON. Las exitosas incluyen `success: true` y las de error incluyen `success: false` (o `error`) con un mensaje descriptivo.

---

## 🔐 Autenticación

Las rutas protegidas requieren el header:

```
Authorization: Bearer <token_jwt>
```

El token se obtiene del endpoint `POST /api/own/auth/login` o `POST /api/own/auth/register` y contiene el payload:

```json
{ "userId": "cuid123", "id": "cuid123", "email": "user@mail.com", "role": "tutor", "iat": 1714000000, "exp": 1714604800 }
```

Duración por defecto: 7 días (configurable con `JWT_EXPIRES_IN`).

---

## 📚 Índice

1. [Auth](#-auth)
2. [Experiencias (público + admin)](#-experiencias)
3. [Carrito (protegido)](#-carrito)
4. [Admin (admin-only)](#-admin)

---

## 🔑 Auth

### `POST /api/own/auth/register`

Crea un usuario. Asigna automáticamente rol `admin` si el email está en la lista hardcoded de `utils/jwt.js`, de lo contrario `tutor`.

**Body**
```json
{
  "nombre": "Juan Pérez",
  "email": "juan@example.com",
  "password": "minimo6",
  "telefono": "5551234567"
}
```

**Response 201**
```json
{
  "success": true,
  "message": "Usuario registrado",
  "data": {
    "user": { "id": "cuid", "email": "juan@example.com", "nombre": "Juan Pérez" },
    "token": "eyJhbGc..."
  }
}
```

**Errores**
- `400` — campos faltantes o contraseña corta
- `400` — email ya registrado

**curl**
```bash
curl -X POST http://localhost:3001/api/own/auth/register \
  -H "Content-Type: application/json" \
  -d '{"nombre":"Juan","email":"juan@test.com","password":"123456","telefono":"5550000"}'
```

---

### `POST /api/own/auth/login`

Autentica por email y contraseña.

**Body**
```json
{ "email": "juan@example.com", "password": "minimo6" }
```

**Response 200**
```json
{
  "success": true,
  "data": {
    "user": { "id": "cuid", "email": "juan@example.com", "nombre": "Juan Pérez" },
    "token": "eyJhbGc..."
  }
}
```

**Errores**
- `401` — credenciales inválidas

---

## 🎨 Experiencias

### `GET /api/own/experiencias`

Lista el catálogo (público).

**Query params**
| Campo | Tipo | Descripción |
|-------|------|-------------|
| `limit` | número | Máximo 100, opcional |
| `sortBy` | `rating` \| `createdAt` | Orden descendente, default `rating` |

**Response 200**
```json
{
  "success": true,
  "data": {
    "experiencias": [
      {
        "id": "cuid",
        "nombre": "Taller de Arena Cinética",
        "categoria": "Táctil",
        "descripcion": "...",
        "precio": 45,
        "duracionMinutos": 60,
        "rangoEdad": "3-8 años",
        "beneficios": ["Coordinación", "Relajación"],
        "incluye": ["Materiales", "Terapeuta"],
        "rating": 4.8,
        "reviews": 24
      }
    ]
  }
}
```

---

### `GET /api/own/experiencias/:id`

Detalle con fechas disponibles futuras (próximas 28).

**Response 200**
```json
{
  "success": true,
  "data": {
    "experiencia": {
      "id": "cuid",
      "nombre": "...",
      "fechasDisponibles": [
        { "id": "cuid", "fecha": "2026-05-10T00:00:00Z", "horaInicio": "16:00", "horaFin": "17:00", "cuposDisponibles": 6 }
      ]
    }
  }
}
```

**Errores**
- `404` — experiencia no encontrada

---

### `POST /api/own/experiencias` 🔒 admin

Crea una experiencia nueva.

**Body** — todos los campos opcionales excepto `nombre` y `precio`.
```json
{
  "nombre": "Nueva experiencia",
  "categoria": "Visual",
  "descripcion": "...",
  "precio": 50,
  "duracionMinutos": 45,
  "beneficios": ["a", "b"],
  "incluye": ["x", "y"]
}
```

**Response 201** — objeto `experiencia` creado.

---

### `PUT /api/own/experiencias/:id` 🔒 admin

Reemplaza todos los campos de una experiencia existente.

---

### `PATCH /api/own/experiencias/:id` 🔒 admin

Actualiza parcialmente. Solo requiere los campos a modificar.

---

### `DELETE /api/own/experiencias/:id` 🔒 admin

Elimina una experiencia. Falla con `500` si tiene reservas asociadas (FK restrict).

---

## 🛒 Carrito

Todas las rutas requieren JWT.

### `GET /api/own/cart`

Obtiene los items pendientes del usuario actual.

**Response 200**
```json
{
  "success": true,
  "data": {
    "items": [
      {
        "id": "cart_123",
        "experienciaId": "cuid",
        "fechaDisponibleId": "cuid",
        "nombre": "Taller...",
        "fecha": "2026-05-10",
        "horaInicio": "16:00",
        "horaFin": "17:00",
        "precio": 45,
        "cantidad": 1,
        "ninoId": null
      }
    ]
  }
}
```

---

### `POST /api/own/cart`

Agrega un item al carrito.

**Body**
```json
{
  "experienciaId": "cuid",
  "fechaDisponibleId": "cuid",
  "cantidad": 1,
  "ninoId": null
}
```

**Response 200** — carrito actualizado.

---

### `DELETE /api/own/cart/:id`

Elimina un item.

---

### `DELETE /api/own/cart`

Vacía el carrito completo.

---

## 👨‍💼 Admin

Todas las rutas requieren JWT **+ rol admin**.

### `GET /api/own/admin/stats`

Estadísticas agregadas para el dashboard.

**Response 200**
```json
{
  "totalUsuarios": 18,
  "totalNinos": 3,
  "totalReservas": 5,
  "totalExperiencias": 7,
  "reservasConfirmadas": 5,
  "reservasPendientes": 0,
  "reservasCanceladas": 0,
  "ingresosTotales": 97,
  "nuevasReservas": 4,
  "nuevosUsuarios": 3
}
```

---

### `GET /api/own/admin/usuarios`

Lista todos los usuarios con conteo de niños y reservas.

```json
[
  {
    "id": "cuid",
    "email": "juan@test.com",
    "nombre": "Juan",
    "telefono": "5550000",
    "role": "tutor",
    "createdAt": "2026-04-20T10:00:00Z",
    "_count": { "ninos": 1, "reservas": 2 }
  }
]
```

---

### `GET /api/own/admin/experiencias`

Lista experiencias con sus fechas disponibles futuras y conteo de reservas.

```json
[
  {
    "id": "cuid",
    "nombre": "Taller...",
    "precio": 45,
    "fechasDisponibles": [...],
    "_count": { "detallesReserva": 3 }
  }
]
```

---

### `POST /api/own/admin/experiencias`

Crea una experiencia. Rechaza nombre duplicado (`409`).

---

### `PATCH /api/own/admin/experiencias`

Actualiza una experiencia (id en body).

**Body**
```json
{ "id": "cuid", "nombre": "Nuevo nombre", "precio": 60 }
```

---

### `DELETE /api/own/admin/experiencias?id=<cuid>`

Elimina por query string.

---

### `POST /api/own/admin/fechas`

Crea un horario disponible. Rechaza día/hora duplicado para la misma experiencia (`409`).

**Body**
```json
{
  "experienciaId": "cuid",
  "fecha": "2026-06-01",
  "horaInicio": "16:00",
  "horaFin": "17:00",
  "cuposTotales": 6
}
```

---

### `DELETE /api/own/admin/fechas?id=<cuid>`

Elimina un horario.

---

### `GET /api/own/admin/reservas`

Lista todas las reservas con tutor, detalles, experiencia y fecha.

```json
[
  {
    "id": "cuid",
    "total": 45,
    "estado": "Confirmada",
    "createdAt": "2026-04-24T11:00:00Z",
    "tutor": { "nombre": "Juan", "email": "juan@test.com" },
    "detalles": [
      {
        "experiencia": { "nombre": "Taller..." },
        "fechaDisponible": { "fecha": "...", "horaInicio": "...", "horaFin": "..." },
        "nino": null,
        "cantidad": 1,
        "precioUnitario": 45
      }
    ]
  }
]
```

---

### `PATCH /api/own/admin/reservas`

Cambia el estado de una reserva.

**Body**
```json
{ "id": "cuid", "estado": "Confirmada" }
```

**Estados válidos:** `Pendiente`, `Confirmada`, `Cancelada`.

---

## ⚠️ Códigos HTTP comunes

| Código | Significado |
|--------|-------------|
| `200` | OK |
| `201` | Creado |
| `400` | Validación fallida / falta campo |
| `401` | Sin JWT o inválido |
| `403` | Rol insuficiente (no admin) |
| `404` | Recurso no encontrado |
| `409` | Conflicto (duplicado) |
| `500` | Error interno / SQL |

En errores `500` el backend incluye el campo `details` con el mensaje original para facilitar debugging.
