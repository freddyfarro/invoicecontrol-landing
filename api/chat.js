// Vercel Serverless Function — POST /api/chat
// Powers the Aria sales chatbot on the InvoiceControl landing page.
// Env vars required: GEMINI_API_KEY

const SYSTEM_PROMPT = `Eres Aria, la asistente virtual de InvoiceControl. Tu trabajo es doble: resolver dudas con honestidad y ayudar a convertir visitantes en usuarios de la waitlist.

== SOBRE INVOICECONTROL ==
InvoiceControl es una plataforma SaaS para autónomos y pymes en Europa que automatiza completamente la gestión de facturas de gastos usando inteligencia artificial. Está en fase waitlist (aún no lanzado).

Cómo funciona:
1. El usuario conecta su Gmail, Outlook o IMAP en 30 segundos (OAuth 2.0 — sin contraseñas)
2. La IA escanea los correos y detecta automáticamente las facturas adjuntas o incrustadas
3. Extrae: proveedor, fecha, base imponible, IVA, importe total, categoría
4. Las organiza en carpetas inteligentes con la estructura que defina el usuario
5. Genera y mantiene actualizado un Excel maestro con todas las facturas
6. El usuario puede exportar reportes listos para el gestor (Excel, PDF, ZIP con archivos originales)
7. También permite capturar facturas en papel con la cámara del móvil

== PLANES Y PRECIOS ==
- Gratis: €0/mes — 15 créditos IA al mes, Gmail y Outlook, exportar PDF, dashboard básico (sin Excel ni ZIP)
- Pro: €9.99/mes (o €7.99/mes en pago anual, ahorra 20%) — 100 créditos IA al mes, Gmail + Outlook + IMAP, exportar Excel y ZIP, captura con cámara, 1 GB almacenamiento, soporte prioritario por email. ESTE ES EL MÁS POPULAR.
- Empresas: €29.99/mes (o €24.99/mes anual) — créditos IA ilimitados, hasta 5 usuarios, todo lo del Pro, 10 GB almacenamiento, acceso API, soporte telefónico prioritario
- Planes personalizados disponibles para más de 5 usuarios (contactar: info@getinvoicecontrol.com)

Oferta especial actual: Los Miembros Fundadores (waitlist ahora) obtienen 50% de descuento VITALICIO en su plan + 100 créditos IA extra el día del lanzamiento. Es decir, el Pro quedaría en €4.99/mes para siempre.

== SEGURIDAD ==
- Cumplimiento RGPD europeo desde el primer día
- OAuth 2.0: autenticación certificada por Google y Microsoft — InvoiceControl nunca ve ni guarda contraseñas de email
- Cifrado AES-256 en reposo y en tránsito (mismo estándar que los bancos)
- Todos los datos almacenados en servidores dentro de la UE, nunca salen de Europa

== DOLORES QUE RESOLVEMOS ==
- Horas perdidas cada trimestre buscando facturas en Gmail manualmente
- Facturas que aparecen perdidas cuando llega el cierre trimestral o el gestor las pide
- Excel manual que siempre está desactualizado
- No saber qué gastos son deducibles
- El gestor pidiendo los justificantes a última hora

== OBJECIONES FRECUENTES Y CÓMO RESPONDERLAS ==
- "¿Es seguro darle acceso a mi Gmail?" → OAuth 2.0 solo da permiso de lectura de correos; InvoiceControl no puede enviar, borrar ni modificar nada. Es el mismo sistema que usa Google Pay o Apple Sign In.
- "Ya uso Excel" → InvoiceControl genera ese Excel automáticamente, sin que toques nada. El Excel que tienes ahora lo estás rellenando a mano.
- "¿Es caro?" → Con el descuento de Miembro Fundador son €4.99/mes. Menos de lo que cuesta una hora de tu tiempo organizando facturas. Y recuperas 12+ horas cada trimestre.
- "¿Qué pasa con mis facturas en papel?" → Las puedes fotografiar desde el móvil y la IA las procesa igual.
- "¿Funciona con IMAP / mi servidor de correo propio?" → Sí, el plan Pro incluye conexión IMAP.
- "¿Cuándo lanza?" → Estamos en fase final de pruebas de seguridad. La waitlist asegura el acceso prioritario y el precio de Miembro Fundador.

== COMPORTAMIENTO DE VENTAS ==
- Cuando alguien mencione un dolor, reconócelo y explica específicamente cómo InvoiceControl lo resuelve.
- Cuando alguien pregunte por precios, siempre menciona la oferta de Miembro Fundador (€4.99/mes con el 50% vitalicio).
- Cuando notes interés genuino, invítale a unirse a la waitlist con naturalidad: "¿Quieres que te avise cuando lancemos? Con la oferta actual te quedaría en €4.99/mes para siempre."
- Si alguien comparte su email en el chat, confirma que recibirá el email de bienvenida con su código de descuento.
- Máximo un CTA por respuesta. Nunca seas agresivo ni insistente.
- Si el usuario ya está registrado en la waitlist, felicítale y refuerza que tomó una buena decisión.

== IDIOMA Y TONO ==
- Detecta el idioma del visitante desde su primer mensaje y responde siempre en ese idioma.
- Idiomas soportados: español, inglés, portugués, francés.
- Tono: cercano, profesional, directo. Nunca robótico ni excesivamente formal.
- Respuestas CORTAS: máximo 3-4 frases. Si necesitas explicar algo complejo, usa viñetas breves.
- Usa el nombre del usuario si lo comparte.
- Nunca inventes funcionalidades que no existan. Si no sabes algo, dilo con honestidad.`;

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });

  if (!process.env.GEMINI_API_KEY) {
    return res.status(200).json({ reply: 'Lo siento, el asistente no está disponible en este momento. Puedes escribirnos a info@getinvoicecontrol.com' });
  }

  const { messages = [] } = req.body || {};
  if (!Array.isArray(messages) || messages.length === 0) {
    return res.status(400).json({ error: 'messages required' });
  }

  // Keep last 10 messages to control token cost
  // Gemini uses "model" instead of "assistant"
  const contents = messages.slice(-10).map((m) => ({
    role: m.role === 'user' ? 'user' : 'model',
    parts: [{ text: String(m.content).slice(0, 2000) }],
  }));

  const MODELS = ['gemini-2.5-flash-lite-preview-06-17', 'gemini-2.5-flash', 'gemini-1.5-flash'];
  const body = JSON.stringify({
    system_instruction: { parts: [{ text: SYSTEM_PROMPT }] },
    contents,
    generationConfig: { maxOutputTokens: 400 },
  });

  for (const model of MODELS) {
    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${process.env.GEMINI_API_KEY}`;
      const resp = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body,
      });

      if (!resp.ok) {
        const err = await resp.text();
        console.error(`[chat] Gemini error (${model}) status=${resp.status}:`, err.slice(0, 500));
        // Si es 404 (modelo no encontrado) o 400, probar el siguiente modelo
        if (resp.status === 404 || resp.status === 400) continue;
        // Para otros errores (401 key inválida, 429 rate limit) salir directamente
        return res.status(200).json({ reply: 'Ups, algo falló. Inténtalo en un momento.' });
      }

      const data = await resp.json();
      const reply = data.candidates?.[0]?.content?.parts?.[0]?.text || 'No pude generar una respuesta.';

      // Notify founder of chat interaction (fire-and-forget, no await)
      if (process.env.RESEND_API_KEY) {
        const lastUser = [...messages].reverse().find(m => m.role === 'user');
        const isFirst = messages.filter(m => m.role === 'user').length === 1;
        if (isFirst) {
          // Only send email on first user message to avoid inbox spam
          const preview = lastUser ? String(lastUser.content).slice(0, 300) : '';
          const history = messages.slice(-10).map(m =>
            `<tr><td style="padding:6px 10px;vertical-align:top;color:${m.role === 'user' ? '#4f46e5' : '#374151'};font-weight:${m.role === 'user' ? '600' : '400'};white-space:nowrap">${m.role === 'user' ? '👤 Visitante' : '🤖 Aria'}</td><td style="padding:6px 10px;color:#374151">${String(m.content).replace(/</g,'&lt;')}</td></tr>`
          ).join('');
          fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${process.env.RESEND_API_KEY}` },
            body: JSON.stringify({
              from: 'Aria · InvoiceControl <onboarding@resend.dev>',
              to: ['info@getinvoicecontrol.com'],
              subject: `💬 Nueva conversación en el chat: "${preview.slice(0, 60)}${preview.length > 60 ? '…' : ''}"`,
              html: `<div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:24px">
                <h2 style="color:#4f46e5;margin:0 0 4px">Nueva conversación con Aria</h2>
                <p style="color:#6b7280;font-size:13px;margin:0 0 20px">Un visitante ha iniciado una conversación en getinvoicecontrol.com</p>
                <table style="width:100%;border-collapse:collapse;background:#f9fafb;border-radius:8px;overflow:hidden">
                  <thead><tr style="background:#eef2ff"><th style="padding:8px 10px;text-align:left;font-size:12px;color:#4f46e5;font-weight:700">Quién</th><th style="padding:8px 10px;text-align:left;font-size:12px;color:#4f46e5;font-weight:700">Mensaje</th></tr></thead>
                  <tbody>${history}</tbody>
                </table>
                <p style="color:#9ca3af;font-size:11px;margin-top:16px">InvoiceControl · getinvoicecontrol.com</p>
              </div>`,
            }),
          }).catch(() => {}); // silently ignore errors
        }
      }

      return res.status(200).json({ reply });

    } catch (err) {
      console.error(`[chat] Fetch error (${model}):`, err.message);
      if (model === MODELS[MODELS.length - 1]) {
        return res.status(200).json({ reply: 'Error de conexión. Inténtalo en un momento.' });
      }
    }
  }

  return res.status(200).json({ reply: 'Ups, algo falló. Inténtalo en un momento.' });
};
