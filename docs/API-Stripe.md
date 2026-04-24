# 💳 Integración Stripe — `/api/integrations/payments/*`

Pasarela de pagos basada en **Stripe Checkout Sessions**. Genera sesiones de pago redirigidas, recibe eventos vía webhook y confirma reservas tras un pago exitoso.

**Base URL:** `http://localhost:3001`

**Documentación oficial de Stripe:** https://stripe.com/docs/api/checkout/sessions

---

## 🔁 Flujo general

```
┌─────────────┐                                                   ┌─────────────┐
│  Frontend   │ 1) POST /create-session                           │   Stripe    │
│  /checkout  │ ──────────────▶  Backend Express  ──────────────▶ │  Checkout   │
└─────────────┘                                                   └──────┬──────┘
       ▲                                                                 │
       │ 5) GET /checkout/success?session_id=...                         │
       │    POST /confirm → crea reserva + email                         │
       │                                                                 │
       └─────────────────── 4) Redirect tras pago ◀──────────────────────┘
                                                                         │
                             3) Pago completado ──▶ Webhook Stripe ──────┘
                                (opcional, /webhook)
```

---

## 📚 Índice

1. [`POST /create-session`](#post-apiintegrationspaymentscreate-session) — iniciar pago
2. [`GET /session/:id`](#get-apiintegrationspaymentssessionid) — consultar estado
3. [`POST /confirm`](#post-apiintegrationspaymentsconfirm) — confirmar + crear reserva + email
4. [`POST /webhook`](#post-apiintegrationspaymentswebhook) — eventos server-to-server

---

## `POST /api/integrations/payments/create-session`

Crea una sesión de Checkout en Stripe y devuelve la URL a la que el frontend debe redirigir al usuario.

**Headers**
```
Content-Type: application/json
Authorization: Bearer <jwt_del_tutor>
```

**Body**
```json
{
  "items": [
    {
      "experienciaId": "cuid",
      "nombre": "Taller de Arena Cinética",
      "precio": 45,
      "cantidad": 1,
      "fechaDisponibleId": "cuid",
      "fecha": "2026-05-10",
      "horaInicio": "16:00",
      "horaFin": "17:00"
    }
  ],
  "successUrl": "http://localhost:3000/checkout/success?session_id={CHECKOUT_SESSION_ID}",
  "cancelUrl":  "http://localhost:3000/carrito"
}
```

> El marcador `{CHECKOUT_SESSION_ID}` es literal — Stripe lo sustituye automáticamente.

**Validación (Zod)**
- `items`: array no vacío. Cada item con IDs no vacíos y `precio > 0`.
- `successUrl` y `cancelUrl`: URLs válidas.

**Response 200**
```json
{
  "success": true,
  "message": "Sesión de checkout creada",
  "data": {
    "sessionId": "cs_test_a1CAGK...",
    "url": "https://checkout.stripe.com/c/pay/cs_test_a1CAGK...",
    "totalAmount": 45,
    "currency": "mxn"
  }
}
```

**Errores**
| Código | Causa |
|--------|-------|
| `400` | Body inválido (Zod) |
| `401` | JWT faltante o inválido |
| `500` | Clave Stripe inválida o red |

**Metadata enviada a Stripe**
```json
{
  "userId": "cuid",
  "items": "[{...items serializados...}]"
}
```

Esta metadata se usa después en `/confirm` para crear la reserva sin necesidad de consultar el carrito.

**curl**
```bash
curl -X POST http://localhost:3001/api/integrations/payments/create-session \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $JWT" \
  -d @- <<'JSON'
{
  "items": [{
    "experienciaId": "cuid",
    "nombre": "Taller",
    "precio": 45,
    "cantidad": 1,
    "fechaDisponibleId": "cuid",
    "fecha": "2026-05-10",
    "horaInicio": "16:00",
    "horaFin": "17:00"
  }],
  "successUrl": "http://localhost:3000/checkout/success?session_id={CHECKOUT_SESSION_ID}",
  "cancelUrl": "http://localhost:3000/carrito"
}
JSON
```

---

## `GET /api/integrations/payments/session/:id`

Consulta el estado de una sesión existente.

**Headers**
```
Authorization: Bearer <jwt>
```

**Response 200**
```json
{
  "success": true,
  "data": {
    "id": "cs_test_...",
    "status": "complete",
    "paymentStatus": "paid",
    "customerEmail": "juan@test.com",
    "amountTotal": 45,
    "currency": "mxn",
    "metadata": { "userId": "cuid", "items": "[...]" }
  }
}
```

**Uso típico:** verificación manual desde Postman o herramientas de soporte.

---

## `POST /api/integrations/payments/confirm`

**Endpoint crítico.** Se invoca desde `/checkout/success` del frontend tras el redirect de Stripe. Verifica el pago, crea la reserva en la DB y dispara el correo de confirmación.

**Headers**
```
Content-Type: application/json
Authorization: Bearer <jwt>
```

**Body**
```json
{ "sessionId": "cs_test_..." }
```

**Operaciones que ejecuta en orden**

1. `stripe.checkout.sessions.retrieve(sessionId)` — obtiene la sesión.
2. Verifica `payment_status === 'paid'`. Si no, devuelve `400`.
3. Parsea `metadata.items` y calcula el total.
4. **Transacción MySQL** (atómica):
   - `INSERT INTO reserva` con estado `Confirmada`
   - Por cada item: `INSERT INTO detallereserva` + `UPDATE fechadisponible SET cuposDisponibles = cuposDisponibles - cantidad`
5. Envía correo con Resend al `customer_email` de Stripe (o `RESEND_OVERRIDE_TO` si está seteado).

**Response 200**
```json
{
  "success": true,
  "message": "Reserva confirmada",
  "data": {
    "reservaId": "uuid",
    "total": 45,
    "itemsCount": 1,
    "emailStatus": "sent: 8f2c..."
  }
}
```

El campo `emailStatus` puede ser:
- `"skipped"` — Resend no configurado
- `"sent: <id>"` — éxito
- `"error: <mensaje>"` — fallo aislado (no revierte la reserva)

**Errores**
| Código | Causa |
|--------|-------|
| `400` | `sessionId` faltante o pago no completado |
| `500` | Error de Stripe, MySQL o transacción |

---

## `POST /api/integrations/payments/webhook`

Endpoint público que recibe eventos server-to-server de Stripe.

**⚠️ Importante:** este endpoint **no** usa `express.json()`. En `app.js` está configurado con `express.raw({ type: 'application/json' })` porque Stripe firma el body crudo.

**Headers** (enviados por Stripe)
```
stripe-signature: t=...,v1=...
```

El backend verifica la firma con `STRIPE_WEBHOOK_SECRET`:

```js
stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
```

**Eventos procesados**
- `checkout.session.completed` — actualmente solo loguea. La creación de reserva se hace en `/confirm` (redundancia defensiva).

**Response 200**
```json
{ "received": true }
```

### Cómo probar en local con Stripe CLI

```bash
# 1) Instalar Stripe CLI
# https://stripe.com/docs/stripe-cli

# 2) Login
stripe login

# 3) Forward eventos al backend local
stripe listen --forward-to localhost:3001/api/integrations/payments/webhook

# 4) Copiar el whsec_... que imprime la CLI al .env
```

---

## 🧪 Tarjetas de prueba

Stripe acepta solo tarjetas de prueba en modo test (`sk_test_...`).

| Número | Resultado |
|--------|-----------|
| `4242 4242 4242 4242` | Pago aprobado |
| `4000 0025 0000 3155` | Requiere 3DS (autenticación) |
| `4000 0000 0000 9995` | Declinada por fondos insuficientes |
| `4000 0000 0000 0002` | Declinada genérica |

**Cualquier fecha futura** y **CVC de 3 dígitos** son válidos.

Más tarjetas: https://stripe.com/docs/testing#cards

---

## 🔐 Configuración de claves

En `backend/.env`:

```env
STRIPE_SECRET_KEY=sk_test_51AbCdEfGhIj...
STRIPE_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxxxxxxxxxxxxx
```

- **Secret key**: https://dashboard.stripe.com/test/apikeys → "Reveal test key"
- **Webhook secret**: de la Stripe CLI (`stripe listen`) o del dashboard de producción

⚠️ **Nunca comitees claves**. El `.env` está en `.gitignore`.

---

## 🛠️ Archivos relevantes

| Archivo | Función |
|---------|---------|
| `backend/src/config/stripe.js` | Init lazy del cliente con Proxy |
| `backend/src/routes/stripe.js` | Endpoints descritos arriba |
| `backend/src/app.js:12` | Registro del middleware `express.raw` para webhook |
| `frontend/app/checkout/page.tsx` | Llama a `/create-session` y redirige |
| `frontend/app/checkout/success/page.tsx` | Llama a `/confirm` tras el redirect |
