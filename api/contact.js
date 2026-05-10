// Vercel Serverless Function — POST /api/contact
// Forwards contact form submissions to info@getinvoicecontrol.com via Resend.
// Env vars required: RESEND_API_KEY

const FROM_EMAIL = process.env.FROM_EMAIL || 'InvoiceControl <onboarding@resend.dev>';

const SUBJECTS = {
  pregunta: 'Pregunta general',
  soporte:  'Soporte técnico',
  empresa:  'Plan para empresas',
  prensa:   'Prensa / medios',
  otro:     'Otro',
};

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });

  const { name, email, subject, message } = req.body || {};

  if (!name || !email || !message) {
    return res.status(400).json({ error: 'name, email and message are required' });
  }

  const subjectLabel = SUBJECTS[subject] || 'Consulta';

  // Enviar email a info@getinvoicecontrol.com
  try {
    await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: FROM_EMAIL,
        to: ['info@getinvoicecontrol.com'],
        reply_to: email,
        subject: `📩 Contacto [${subjectLabel}] — ${name}`,
        html: `
          <div style="font-family:Inter,sans-serif;max-width:600px;margin:0 auto;padding:32px;background:#f9fafb;border-radius:12px;">
            <h2 style="color:#1e1b4b;margin-bottom:8px;">Nuevo mensaje de contacto</h2>
            <p style="color:#6b7280;font-size:14px;margin-bottom:24px;">Recibido desde el formulario de contacto de InvoiceControl.</p>

            <table style="width:100%;border-collapse:collapse;background:#fff;border-radius:8px;overflow:hidden;border:1px solid #e5e7eb;">
              <tr>
                <td style="padding:12px 16px;font-size:13px;color:#6b7280;background:#f3f4f6;width:120px;font-weight:600;">Nombre</td>
                <td style="padding:12px 16px;font-size:14px;color:#111827;">${name}</td>
              </tr>
              <tr>
                <td style="padding:12px 16px;font-size:13px;color:#6b7280;background:#f3f4f6;font-weight:600;">Email</td>
                <td style="padding:12px 16px;font-size:14px;color:#111827;"><a href="mailto:${email}" style="color:#4f46e5;">${email}</a></td>
              </tr>
              <tr>
                <td style="padding:12px 16px;font-size:13px;color:#6b7280;background:#f3f4f6;font-weight:600;">Asunto</td>
                <td style="padding:12px 16px;font-size:14px;color:#111827;">${subjectLabel}</td>
              </tr>
              <tr>
                <td style="padding:12px 16px;font-size:13px;color:#6b7280;background:#f3f4f6;font-weight:600;vertical-align:top;">Mensaje</td>
                <td style="padding:12px 16px;font-size:14px;color:#111827;white-space:pre-wrap;">${message.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</td>
              </tr>
            </table>

            <p style="margin-top:24px;font-size:12px;color:#9ca3af;">
              Para responder, simplemente contesta a este email — el reply-to está configurado al email del remitente.
            </p>
          </div>
        `,
      }),
    });
  } catch (err) {
    console.error('Error sending contact email:', err);
    return res.status(500).json({ error: 'Failed to send email' });
  }

  return res.status(200).json({ ok: true });
};
