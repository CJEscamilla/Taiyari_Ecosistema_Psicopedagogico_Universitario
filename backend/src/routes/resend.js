/**
 * ============================================
 * Integración con Resend — `/api/integrations/email/*`
 * ============================================
 *
 * Endpoints de envío de correos transaccionales. En la práctica el disparo
 * "en caliente" tras un pago exitoso ya lo hace `stripe.js` en `/confirm`;
 * estos endpoints son útiles para:
 *   - Probar manualmente la configuración (`/send-test`).
 *   - Reenviar una confirmación de reserva (`/send-confirmation`) desde
 *     Postman o un futuro botón en el admin.
 *
 * Si `RESEND_API_KEY` no está configurada, `send-confirmation` responde 200
 * con `emailId: 'simulated'` (modo degradado) para no romper el flujo del
 * cliente. `send-test` sí devuelve 503 porque es un check explícito.
 */
import { Router } from 'express';
import { z } from 'zod';
import resend from '../config/resend.js';
import { authMiddleware } from '../middlewares/auth.js';
import { validateBody } from '../middlewares/validation.js';

const router = Router();

// Schema para validar envío de email de confirmación
const confirmationEmailSchema = z.object({
  to: z.string().email('Email destinatario inválido'),
  reservaId: z.string().min(1, 'ID de reserva requerido'),
  experiencias: z.array(z.object({
    nombre: z.string(),
    fecha: z.string(),
    horaInicio: z.string(),
    horaFin: z.string(),
    precio: z.number().positive()
  })).min(1),
  totalAmount: z.number().positive('El monto total debe ser positivo')
});

/**
 * POST /api/email/send-confirmation
 * Envía email de confirmación de reserva usando Resend
 * Requiere autenticación JWT
 * 
 * API EXTERNA #2 - Documentar en Postman:
 * - Método: POST
 * - URL: http://localhost:3001/api/email/send-confirmation
 * - Headers: Authorization: Bearer <token>
 * - Body: JSON con datos de la reserva
 */
router.post('/send-confirmation', authMiddleware, validateBody(confirmationEmailSchema), async (req, res) => {
  try {
    // Verificar si Resend está configurado
    if (!resend) {
      console.warn('Resend no está configurado - email no enviado (modo desarrollo)');
      return res.json({
        success: true,
        message: 'Email de confirmación (simulado - Resend no configurado)',
        data: {
          emailId: 'simulated',
          to: req.body.to,
          sentAt: new Date().toISOString(),
          note: 'Resend API key no configurada - email no enviado realmente'
        }
      });
    }

    const { to, reservaId, experiencias, totalAmount } = req.body;
    const fromEmail = process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev';
    const fromName = process.env.RESEND_FROM_NAME || 'Sensorial Experience';

    // Construir lista de experiencias HTML
    const experienciasHtml = experiencias.map(exp => `
      <tr>
        <td style="padding: 12px; border-bottom: 1px solid #eee;">
          <strong>${exp.nombre}</strong><br>
          <small>${exp.fecha} | ${exp.horaInicio} - ${exp.horaFin}</small>
        </td>
        <td style="padding: 12px; border-bottom: 1px solid #eee; text-align: right;">
          $${exp.precio.toFixed(2)} MXN
        </td>
      </tr>
    `).join('');

    // Enviar email usando Resend API
    const { data, error } = await resend.emails.send({
      from: `${fromName} <${fromEmail}>`,
      to: [to],
      subject: '¡Tu reserva ha sido confirmada! - Sensorial Experience',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <title>Reserva Confirmada</title>
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
          <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
            <h1 style="color: #8B5CF6;">¡Reserva Confirmada!</h1>
            
            <p>Hola,</p>
            
            <p>Tu pago ha sido procesado exitosamente. Aquí están los detalles de tu reserva:</p>
            
            <div style="background: #f9f9f9; padding: 15px; border-radius: 8px; margin: 20px 0;">
              <p><strong>Número de confirmación:</strong> ${reservaId}</p>
              <p><strong>Fecha de reserva:</strong> ${new Date().toLocaleDateString('es-MX')}</p>
            </div>
            
            <h3>Experiencias reservadas:</h3>
            <table style="width: 100%; border-collapse: collapse;">
              ${experienciasHtml}
              <tr style="background: #f9f9f9; font-weight: bold;">
                <td style="padding: 12px;">Total</td>
                <td style="padding: 12px; text-align: right;">$${totalAmount.toFixed(2)} MXN</td>
              </tr>
            </table>
            
            <p style="margin-top: 30px; padding: 15px; background: #F3F0FF; border-radius: 8px;">
              <strong>Importante:</strong> Por favor llega 10 minutos antes de tu sesión. 
              Si necesitas cancelar, hazlo con al menos 24 horas de anticipación.
            </p>
            
            <p style="margin-top: 30px;">
              ¡Gracias por elegir Sensorial Experience!<br>
              <em>Equipo Sensorial</em>
            </p>
          </div>
        </body>
        </html>
      `
    });

    if (error) {
      console.error('Error enviando email:', error);
      return res.status(500).json({
        success: false,
        error: 'Error al enviar email de confirmación',
        details: error.message
      });
    }

    res.json({
      success: true,
      message: 'Email de confirmación enviado',
      data: {
        emailId: data.id,
        to,
        sentAt: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Error en send-confirmation:', error);
    res.status(500).json({
      success: false,
      error: 'Error al procesar solicitud de email'
    });
  }
});

/**
 * POST /api/email/send-test
 * Endpoint de prueba para verificar la configuración de Resend
 * Envía un email de prueba simple
 */
router.post('/send-test', authMiddleware, async (req, res) => {
  try {
    // Verificar si Resend está configurado
    if (!resend) {
      return res.status(503).json({
        success: false,
        error: 'Resend no está configurado. Agrega RESEND_API_KEY al archivo .env'
      });
    }

    const { to } = req.body;
    const fromEmail = process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev';

    const { data, error } = await resend.emails.send({
      from: `Sensorial Experience <${fromEmail}>`,
      to: [to || req.user.email],
      subject: 'Prueba de configuración - Sensorial API',
      html: '<p>Este es un email de prueba desde la API de Sensorial Experience.</p><p>Si recibes este mensaje, la configuración de Resend está funcionando correctamente.</p>'
    });

    if (error) {
      return res.status(500).json({
        success: false,
        error: 'Error enviando email de prueba',
        details: error
      });
    }

    res.json({
      success: true,
      message: 'Email de prueba enviado',
      data: { emailId: data.id }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

export default router;
