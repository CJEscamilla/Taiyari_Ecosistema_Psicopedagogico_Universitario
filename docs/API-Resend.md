# 📧 Integración Resend — `/api/integrations/email/*`

Servicio transaccional de correo electrónico. Envía emails HTML desde el backend usando la API REST oficial de Resend.

**Base URL:** `http://localhost:3001`

**Documentación oficial de Resend:** https://resend.com/docs

---

## 🔁 Cuándo se dispara

- **Automático:** al confirmarse un pago en `/api/integrations/payments/confirm`, se envía el correo "Reserva Confirmada" al `customer_email` de la sesión de Stripe (o a `RESEND_OVERRIDE_TO` si está configurado).
- **Manual:** mediante los endpoints documentados abajo para pruebas puntuales.

---

## 📚 Endpoints

### `POST /api/integrations/email/send-confirmation`

Envía un correo de confirmación con el formato corporativo.

**Headers**
```
Content-Type: application/json
Authorization: Bearer <jwt>
```

**Body** (validado con Zod)
```json
{
  "to": "destinatario@mail.com",
  "reservaId": "abc123",
  "experiencias": [
    {
      "nombre": "Taller de Arena Cinética",
      "fecha": "2026-05-10",
      "horaInicio": "16:00",
      "horaFin": "17:00",
      "precio": 45
    }
  ],
  "totalAmount": 45
}
```

**Response 200 (Resend configurado)**
```json
{
  "success": true,
  "message": "Email de confirmación enviado",
  "data": {
    "emailId": "8f2c...",
    "to": "destinatario@mail.com",
    "sentAt": "2026-04-24T11:59:00.000Z"
  }
}
```

**Response 200 (Resend NO configurado)**
```json
{
  "success": true,
  "message": "Email de confirmación (simulado - Resend no configurado)",
  "data": {
    "emailId": "simulated",
    "to": "destinatario@mail.com",
    "note": "Resend API key no configurada - email no enviado realmente"
  }
}
```

**Errores**
| Código | Causa |
|--------|-------|
| `400` | Body inválido |
| `401` | JWT faltante |
| `500` | Fallo en la API de Resend |

**curl**
```bash
curl -X POST http://localhost:3001/api/integrations/email/send-confirmation \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $JWT" \
  -d '{
    "to": "tu-email-registrado-en-resend@gmail.com",
    "reservaId": "TEST-001",
    "experiencias": [{"nombre":"Taller","fecha":"2026-05-10","horaInicio":"16:00","horaFin":"17:00","precio":45}],
    "totalAmount": 45
  }'
```

---

### `POST /api/integrations/email/send-test`

Endpoint simple para verificar la configuración de Resend. No requiere body estructurado.

**Headers**
```
Authorization: Bearer <jwt>
```

**Body (opcional)**
```json
{ "to": "destino@mail.com" }
```

Si se omite `to`, usa el email del usuario autenticado.

**Response 200**
```json
{
  "success": true,
  "message": "Email de prueba enviado",
  "data": { "emailId": "8f2c..." }
}
```

**Errores**
| Código | Causa |
|--------|-------|
| `503` | `RESEND_API_KEY` no configurada |
| `500` | Fallo en la API de Resend |

---

## 🎨 Diseño del correo de confirmación

El correo enviado automáticamente tras un pago incluye:

- **Header** con gradiente corporativo `#b97b4a → #a16637` y checkmark circular
- **Saludo** personalizado
- **Tarjeta de folio** con formato `ORD-XXXXXX` y fecha de emisión
- **Tabla de experiencias** con fecha, horario (`HH:MM – HH:MM`), cantidad y subtotal
- **Fila de total** destacada
- **Callout** con instrucciones (llegar 10 min antes, política de cancelación)
- **Footer** con contacto y branding

El HTML usa `<table>` anidadas (requisito de compatibilidad con clientes de correo como Outlook, Gmail, Apple Mail).

Captura del email renderizado:

> Los estilos están inline porque los clientes de correo ignoran `<style>` externos.

---

## 🔐 Configuración

En `backend/.env`:

```env
# Obligatorio
RESEND_API_KEY=re_xxxxxxxxxxxxxxxxxxxxxxx

# Opcional
RESEND_FROM_EMAIL=onboarding@resend.dev
RESEND_FROM_NAME=A-TENCIÓN

# Dev/testing — redirige todos los correos a esta dirección
# Útil si el plan free solo envía a tu email registrado en Resend
RESEND_OVERRIDE_TO=tu-email@gmail.com
```

### Cómo obtener la API key

1. Crear cuenta en https://resend.com/signup
2. Verificar email
3. Ir a https://resend.com/api-keys → **Create API Key**
4. Nombre: `a-tencion-dev`, permiso: `Sending access`
5. Copiar el valor (solo se muestra una vez, empieza con `re_`)

---

## ⚠️ Limitaciones del plan Free

El plan gratuito de Resend (3,000 emails/mes, 100/día) tiene una **restricción importante** cuando se usa el dominio por defecto `onboarding@resend.dev`:

> **Solo puedes enviar emails a la dirección con la que te registraste en Resend.**

Si intentas enviar a otro destinatario, la API responde con error tipo:

```json
{
  "statusCode": 403,
  "message": "You can only send testing emails to your own email address"
}
```

### Soluciones

1. **Desarrollo:** usar `RESEND_OVERRIDE_TO=tu-email-registrado@gmail.com` en `.env`. Todos los correos se desvían ahí.
2. **Producción:** verificar un dominio propio en https://resend.com/domains (requiere acceso DNS). Una vez verificado, se puede enviar a cualquier dirección.

---

## 🛠️ Archivos relevantes

| Archivo | Función |
|---------|---------|
| `backend/src/config/resend.js` | Init lazy con Proxy + `isResendConfigured()` |
| `backend/src/routes/resend.js` | Endpoints `send-confirmation` y `send-test` |
| `backend/src/routes/stripe.js` | Envío automático desde `/confirm` |

---

## 📊 Monitoreo

En https://resend.com/emails puedes ver:

- Lista de todos los correos enviados con su estado (`delivered`, `bounced`, `complaint`, `opened`, `clicked`)
- Logs detallados de cada petición
- Métricas de entrega

---

## 🧪 Prueba rápida

1. Configurar `RESEND_API_KEY` en `.env`
2. Reiniciar backend (`npm run dev`)
3. Desde Postman o curl:
   ```bash
   curl -X POST http://localhost:3001/api/integrations/email/send-test \
     -H "Authorization: Bearer $JWT"
   ```
4. Revisar el inbox del email con el que te registraste en Resend (bandeja + spam)
5. Verificar en https://resend.com/emails que aparezca el envío
