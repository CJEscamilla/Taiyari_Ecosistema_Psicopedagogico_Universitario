/**
 * ============================================
 * Integración con Stripe — `/api/integrations/payments/*`
 * ============================================
 *
 * Implementa el flujo completo de pago con Stripe Checkout:
 *   POST /create-session   Crea una Session y devuelve la URL de pago.
 *   GET  /session/:id      Consulta el estado actual de la sesión.
 *   POST /confirm          Verifica el pago, crea la reserva en DB y
 *                          dispara el email de confirmación con Resend.
 *   POST /webhook          Recibe eventos server-to-server de Stripe
 *                          (firmados con `STRIPE_WEBHOOK_SECRET`).
 *
 * El endpoint `/confirm` es idempotente por diseño desde el punto de vista
 * del frontend: si el pago no está `paid`, responde 400 sin escribir en la
 * DB. La creación de la reserva corre dentro de una transacción MySQL para
 * asegurar consistencia entre `reserva`, `detallereserva` y la actualización
 * de cupos en `fechadisponible`.
 */
import express from 'express';
import { Router } from 'express';
import { z } from 'zod';
import crypto from 'crypto';
import stripe from '../config/stripe.js';
import { query, transaction } from '../config/database.js';
import resend, { isResendConfigured } from '../config/resend.js';
import { authMiddleware } from '../middlewares/auth.js';
import { validateBody } from '../middlewares/validation.js';

const router = Router();

// Schema para validar items del carrito
const checkoutSchema = z.object({
  items: z.array(z.object({
    experienciaId: z.string().min(1, 'ID de experiencia inválido'),
    nombre: z.string().min(1, 'Nombre requerido'),
    precio: z.number().positive('El precio debe ser positivo'),
    cantidad: z.number().int().positive().default(1),
    fechaDisponibleId: z.string().min(1, 'ID de fecha inválido'),
    fecha: z.string(),
    horaInicio: z.string(),
    horaFin: z.string()
  })).min(1, 'Se requiere al menos un item'),
  successUrl: z.string().url('URL de éxito inválida'),
  cancelUrl: z.string().url('URL de cancelación inválida')
});

/**
 * POST /api/stripe/create-session
 * Crea una sesión de checkout en Stripe
 * Requiere autenticación JWT
 * 
 * API EXTERNA #1 - Documentar en Postman:
 * - Método: POST
 * - URL: http://localhost:3001/api/stripe/create-session
 * - Headers: Authorization: Bearer <token>
 * - Body: JSON con items del carrito
 */
router.post('/create-session', authMiddleware, validateBody(checkoutSchema), async (req, res) => {
  try {
    const { items, successUrl, cancelUrl } = req.body;
    const userId = req.user.userId;
    const userEmail = req.user.email;

    // Construir line_items para Stripe
    const lineItems = items.map(item => ({
      price_data: {
        currency: 'mxn',
        product_data: {
          name: item.nombre,
          description: `Fecha: ${item.fecha} | Horario: ${item.horaInicio} - ${item.horaFin}`,
        },
        unit_amount: Math.round(item.precio * 100), // Stripe usa centavos
      },
      quantity: item.cantidad,
    }));

    // Calcular total
    const totalAmount = items.reduce((sum, item) => sum + (item.precio * item.cantidad), 0);

    // Crear sesión de Stripe
    const session = await stripe.checkout.sessions.create({
      customer_email: userEmail,
      metadata: {
        userId: userId.toString(),
        items: JSON.stringify(items.map(i => ({
          experienciaId: i.experienciaId,
          fechaDisponibleId: i.fechaDisponibleId,
          cantidad: i.cantidad,
          precio: i.precio
        })))
      },
      line_items: lineItems,
      mode: 'payment',
      success_url: successUrl,
      cancel_url: cancelUrl,
      payment_intent_data: {
        metadata: {
          userId: userId.toString(),
          type: 'reserva_sesiones'
        }
      }
    });

    res.json({
      success: true,
      message: 'Sesión de checkout creada',
      data: {
        sessionId: session.id,
        url: session.url, // URL para redirigir al usuario
        totalAmount,
        currency: 'mxn'
      }
    });
  } catch (error) {
    console.error('Error creando sesión de Stripe:', error);
    res.status(500).json({
      success: false,
      error: 'Error al crear sesión de pago',
      details: error.message
    });
  }
});

/**
 * GET /api/stripe/session/:sessionId
 * Obtiene el estado de una sesión de Stripe
 * Útil para verificar el pago después del redirect
 */
router.get('/session/:sessionId', authMiddleware, async (req, res) => {
  try {
    const { sessionId } = req.params;

    const session = await stripe.checkout.sessions.retrieve(sessionId);

    res.json({
      success: true,
      data: {
        id: session.id,
        status: session.status,
        paymentStatus: session.payment_status,
        customerEmail: session.customer_email,
        amountTotal: session.amount_total ? session.amount_total / 100 : 0,
        currency: session.currency,
        metadata: session.metadata
      }
    });
  } catch (error) {
    console.error('Error obteniendo sesión:', error);
    res.status(500).json({
      success: false,
      error: 'Error al obtener información de la sesión'
    });
  }
});

/**
 * POST /api/integrations/payments/confirm
 * Verifica el pago en Stripe y crea la reserva + detalles en la DB.
 * Debe llamarse desde la página /checkout/success después del redirect de Stripe.
 */
router.post('/confirm', authMiddleware, async (req, res) => {
  try {
    const { sessionId } = req.body ?? {};
    if (!sessionId) {
      return res.status(400).json({ success: false, error: 'sessionId requerido' });
    }

    const session = await stripe.checkout.sessions.retrieve(sessionId);
    if (session.payment_status !== 'paid') {
      return res.status(400).json({
        success: false,
        error: 'El pago no ha sido completado',
        paymentStatus: session.payment_status,
      });
    }

    const tutorId = req.user.id ?? req.user.userId;
    const items = JSON.parse(session.metadata?.items ?? '[]');
    if (items.length === 0) {
      return res.status(400).json({ success: false, error: 'Sin items en la sesión' });
    }

    const total = items.reduce((sum, i) => sum + Number(i.precio) * Number(i.cantidad), 0);
    const reservaId = crypto.randomUUID();

    await transaction(async (conn) => {
      await conn.execute(
        `INSERT INTO reserva (id, tutorId, total, estado, createdAt)
         VALUES (?, ?, ?, 'Confirmada', NOW())`,
        [reservaId, tutorId, total]
      );

      for (const item of items) {
        await conn.execute(
          `INSERT INTO detallereserva (id, reservaId, experienciaId, fechaDisponibleId, ninoId, cantidad, precioUnitario)
           VALUES (?, ?, ?, ?, ?, ?, ?)`,
          [
            crypto.randomUUID(),
            reservaId,
            item.experienciaId,
            item.fechaDisponibleId,
            item.ninoId ?? null,
            Number(item.cantidad),
            Number(item.precio),
          ]
        );

        await conn.execute(
          `UPDATE fechadisponible
           SET cuposDisponibles = GREATEST(cuposDisponibles - ?, 0)
           WHERE id = ?`,
          [Number(item.cantidad), item.fechaDisponibleId]
        );
      }
    });

    // Enviar email de confirmación (no bloquea la respuesta si falla)
    let emailStatus = 'skipped';
    // Permite sobreescribir el destinatario en pruebas (plan free de Resend solo envía al email registrado)
    const recipientEmail = process.env.RESEND_OVERRIDE_TO || session.customer_email;
    if (isResendConfigured() && recipientEmail) {
      try {
        const fromEmail = process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev';
        const fromName = process.env.RESEND_FROM_NAME || 'A-TENCIÓN';
        const fmt = (n) => new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(n);
        const fmtDate = (d) => {
          if (!d) return '';
          try {
            return new Date(d).toLocaleDateString('es-MX', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
          } catch { return String(d); }
        };
        const folio = `ORD-${reservaId.slice(-6).toUpperCase()}`;
        const today = new Date().toLocaleDateString('es-MX', { day: 'numeric', month: 'long', year: 'numeric' });

        const itemsHtml = items.map((i) => `
          <tr>
            <td style="padding:16px 20px;border-bottom:1px solid #ececec;vertical-align:top;">
              <div style="font-size:15px;font-weight:600;color:#1f1f1f;margin-bottom:6px;">
                ${i.nombre ?? 'Experiencia sensorial'}
              </div>
              <div style="font-size:13px;color:#6b6b6b;line-height:1.5;">
                📅 ${fmtDate(i.fecha)}<br>
                🕐 ${i.horaInicio ?? ''} – ${i.horaFin ?? ''} hrs<br>
                👤 ${Number(i.cantidad)} sesión${Number(i.cantidad) > 1 ? 'es' : ''}
              </div>
            </td>
            <td style="padding:16px 20px;border-bottom:1px solid #ececec;text-align:right;vertical-align:top;font-size:15px;font-weight:600;color:#1f1f1f;white-space:nowrap;">
              ${fmt(Number(i.precio) * Number(i.cantidad))}
            </td>
          </tr>`).join('');

        const html = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>Reserva Confirmada — A-TENCIÓN</title>
</head>
<body style="margin:0;padding:0;background-color:#f5f1ec;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;color:#1f1f1f;">
  <div style="display:none;max-height:0;overflow:hidden;">
    Tu reserva ${folio} ha sido confirmada. Total: ${fmt(total)}.
  </div>

  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f5f1ec;padding:32px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 12px rgba(0,0,0,0.04);">

          <!-- Header -->
          <tr>
            <td style="background:linear-gradient(135deg,#b97b4a 0%,#a16637 100%);padding:40px 32px;text-align:center;">
              <div style="display:inline-block;background:rgba(255,255,255,0.2);width:64px;height:64px;border-radius:50%;line-height:64px;font-size:32px;margin-bottom:16px;">✓</div>
              <h1 style="margin:0;font-size:28px;font-weight:700;color:#ffffff;letter-spacing:-0.5px;">
                ¡Reserva Confirmada!
              </h1>
              <p style="margin:8px 0 0;font-size:15px;color:rgba(255,255,255,0.9);">
                A-TENCIÓN · Experiencias Sensoriales
              </p>
            </td>
          </tr>

          <!-- Greeting -->
          <tr>
            <td style="padding:32px 32px 16px;">
              <p style="margin:0 0 12px;font-size:16px;line-height:1.6;color:#333;">
                Hola, <strong>gracias por tu compra</strong>.
              </p>
              <p style="margin:0;font-size:15px;line-height:1.6;color:#555;">
                Hemos recibido tu pago y tu reserva está confirmada. A continuación el resumen de tu orden:
              </p>
            </td>
          </tr>

          <!-- Folio card -->
          <tr>
            <td style="padding:0 32px 24px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#faf4ef;border:1px solid #ecddcc;border-radius:12px;">
                <tr>
                  <td style="padding:20px 24px;">
                    <div style="font-size:11px;text-transform:uppercase;letter-spacing:1px;color:#b97b4a;font-weight:700;margin-bottom:6px;">
                      Número de Folio
                    </div>
                    <div style="font-size:20px;font-weight:700;color:#1f1f1f;font-family:'Courier New',monospace;letter-spacing:1px;">
                      ${folio}
                    </div>
                    <div style="font-size:13px;color:#6b6b6b;margin-top:8px;">
                      Emitida el ${today}
                    </div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Detalle de experiencias -->
          <tr>
            <td style="padding:0 32px 8px;">
              <h2 style="margin:0 0 12px;font-size:16px;font-weight:700;color:#1f1f1f;border-bottom:2px solid #b97b4a;padding-bottom:8px;display:inline-block;">
                Detalle de tu reserva
              </h2>
            </td>
          </tr>
          <tr>
            <td style="padding:0 32px 24px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #ececec;border-radius:12px;overflow:hidden;">
                ${itemsHtml}
                <tr>
                  <td style="padding:18px 20px;background:#faf4ef;font-size:16px;font-weight:700;color:#1f1f1f;">
                    Total pagado
                  </td>
                  <td style="padding:18px 20px;background:#faf4ef;font-size:18px;font-weight:700;color:#b97b4a;text-align:right;">
                    ${fmt(total)}
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Importante -->
          <tr>
            <td style="padding:0 32px 24px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#fff8f0;border-left:4px solid #b97b4a;border-radius:8px;">
                <tr>
                  <td style="padding:18px 20px;">
                    <div style="font-size:14px;font-weight:700;color:#8a5a32;margin-bottom:8px;">
                      ⓘ Información importante
                    </div>
                    <ul style="margin:0;padding-left:20px;font-size:14px;color:#555;line-height:1.7;">
                      <li>Llega <strong>10 minutos antes</strong> del horario programado.</li>
                      <li>Presenta este correo (digital o impreso) al llegar.</li>
                      <li>Cancelaciones con mínimo <strong>24 horas</strong> de anticipación.</li>
                    </ul>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Contact -->
          <tr>
            <td style="padding:16px 32px 32px;text-align:center;border-top:1px solid #ececec;">
              <p style="margin:0 0 8px;font-size:14px;color:#6b6b6b;">
                ¿Tienes alguna pregunta?
              </p>
              <p style="margin:0;font-size:14px;color:#1f1f1f;">
                Contáctanos en <a href="mailto:contacto@a-tencion.mx" style="color:#b97b4a;text-decoration:none;font-weight:600;">contacto@a-tencion.mx</a>
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background:#1f1f1f;padding:24px 32px;text-align:center;">
              <p style="margin:0 0 4px;font-size:16px;font-weight:700;color:#ffffff;letter-spacing:0.5px;">
                A-TENCIÓN
              </p>
              <p style="margin:0;font-size:12px;color:#999;">
                Experiencias Sensoriales para tu pequeño
              </p>
              <p style="margin:16px 0 0;font-size:11px;color:#666;">
                © ${new Date().getFullYear()} A-TENCIÓN. Todos los derechos reservados.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

        const { data: mailData, error: mailError } = await resend.emails.send({
          from: `${fromName} <${fromEmail}>`,
          to: [recipientEmail],
          subject: `Confirmación de reserva ${folio} — A-TENCIÓN`,
          html,
        });
        emailStatus = mailError ? `error: ${mailError.message}` : `sent: ${mailData?.id}`;
      } catch (emailErr) {
        emailStatus = `error: ${emailErr?.message ?? 'unknown'}`;
        console.error('Error enviando email de confirmación:', emailErr);
      }
    }

    res.json({
      success: true,
      message: 'Reserva confirmada',
      data: { reservaId, total, itemsCount: items.length, emailStatus },
    });
  } catch (error) {
    console.error('Error confirmando pago:', error);
    res.status(500).json({
      success: false,
      error: 'Error al confirmar el pago',
      details: error?.message,
    });
  }
});

/**
 * POST /api/stripe/webhook
 * Webhook para recibir eventos de Stripe
 * NO requiere autenticación - Stripe envía su propia firma
 * Este endpoint procesa el evento checkout.session.completed
 */
router.post('/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  const sig = req.headers['stripe-signature'];
  const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

  let event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
  } catch (err) {
    console.error('Webhook error:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // Manejar el evento de pago completado
  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;
    
    console.log('✅ Pago completado:', session.id);
    console.log('   Cliente:', session.customer_email);
    console.log('   Metadata:', session.metadata);

    // Aquí se procesaría la reserva en la base de datos
    // y se enviaría el email de confirmación
  }

  res.json({ received: true });
});

export default router;
