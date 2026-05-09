// Vercel Serverless Function — POST /api/waitlist
// Sends a localized welcome email via Resend when someone joins the waitlist.
// Env vars required: RESEND_API_KEY
// Optional: set FROM_EMAIL env var to override sender address.

const FROM_EMAIL = process.env.FROM_EMAIL || 'InvoiceControl <onboarding@resend.dev>';
const REPLY_TO = 'freddyfarro@gmail.com';

function generateDiscountCode(email) {
  let h = 0x811c9dc5;
  for (const c of email.toLowerCase()) {
    h ^= c.charCodeAt(0);
    h = (Math.imul(h, 0x01000193) >>> 0);
  }
  return 'IC' + h.toString(36).toUpperCase().slice(0, 4).padEnd(4, '0') + '50';
}

const LANGS = {
  es: {
    subject: (n) => `¡Ya eres Miembro Fundador, ${n}! Tu 50% descuento está reservado 🎉`,
    badge: '🚀 Miembro Fundador · Plazas limitadas',
    heroTitle: '¡Bienvenido/a a la revolución de las facturas!',
    hookTitle: '¿Cuántas horas pierdes cada trimestre?',
    hookText: 'Sabemos que estás perdiendo <strong>más de 12 horas cada trimestre</strong> organizando facturas a mano: buscando en Gmail, renombrando archivos, creando Excel… mientras tu trabajo real espera. Ese tiempo termina hoy.',
    offerTitle: '🎁 Tu oferta de Miembro Fundador:',
    o1: '<strong>50% de descuento vitalicio</strong> en tu plan PRO — garantizado',
    o2: '<strong>100 créditos IA extra</strong> de regalo el día del lanzamiento',
    o3: 'Acceso prioritario antes que nadie',
    codeLabel: 'TU CÓDIGO EXCLUSIVO',
    codeNote: 'Guárdalo bien. Se aplicará automáticamente al registrarte el día del lanzamiento.',
    promiseTitle: '⚡ Cómo funciona InvoiceControl',
    step1: '<strong>Conectas</strong> tu Gmail, Outlook o IMAP en 30 segundos',
    step2: '<strong>La IA lee y extrae</strong> automáticamente cada factura de tus correos',
    step3: '<strong>Todo se organiza</strong> en carpetas inteligentes y en tu Excel maestro',
    step4: '<strong>Exportas</strong> un informe listo para tu gestor — sin tocar un solo archivo',
    ctaTitle: '💬 Una pregunta para ti',
    ctaText: '¿Cuál es tu mayor dolor de cabeza hoy con tus facturas? Responde a este email directamente — leo cada mensaje personalmente y me ayuda mucho para construir InvoiceControl exactamente como lo necesitas.',
    ctaBtn: 'Responder ahora',
    secTitle: 'Tus datos, seguros siempre',
    gdpr: 'Cumplimiento RGPD',
    oauth: 'OAuth 2.0',
    enc: 'Cifrado AES-256',
    eu: 'Servidores en la UE',
    footerText: 'InvoiceControl · freddyfarro@gmail.com · España',
    unsubNote: 'Recibiste este email por apuntarte en la lista de espera de InvoiceControl.',
    unsubscribe: 'Darte de baja',
  },
  en: {
    subject: (n) => `You're a Founding Member, ${n}! Your lifetime 50% discount is locked in 🎉`,
    badge: '🚀 Founding Member · Limited spots',
    heroTitle: 'Welcome to the invoice revolution!',
    hookTitle: 'How many hours do you lose every quarter?',
    hookText: 'We know you\'re wasting <strong>12+ hours every quarter</strong> on manual invoice work: searching Gmail, renaming files, building spreadsheets… while your real work waits. That ends today.',
    offerTitle: '🎁 Your Founding Member benefits:',
    o1: '<strong>Lifetime 50% discount</strong> on your PRO plan — guaranteed',
    o2: '<strong>100 extra AI credits</strong> on launch day, on us',
    o3: 'Priority early access before everyone else',
    codeLabel: 'YOUR EXCLUSIVE CODE',
    codeNote: 'Keep it safe. It will be applied automatically when you sign up on launch day.',
    promiseTitle: '⚡ How InvoiceControl works',
    step1: '<strong>Connect</strong> your Gmail, Outlook or IMAP in 30 seconds',
    step2: '<strong>AI reads and extracts</strong> every invoice from your emails automatically',
    step3: '<strong>Everything is organized</strong> into smart folders and your master Excel file',
    step4: '<strong>Export</strong> a report ready for your accountant — without touching a single file',
    ctaTitle: '💬 A quick question for you',
    ctaText: 'What\'s your biggest invoice headache today? Reply to this email directly — I read every message personally and it helps me build InvoiceControl into exactly what you need.',
    ctaBtn: 'Reply now',
    secTitle: 'Your data, always secure',
    gdpr: 'GDPR compliant',
    oauth: 'OAuth 2.0',
    enc: 'AES-256 encryption',
    eu: 'EU servers',
    footerText: 'InvoiceControl · freddyfarro@gmail.com · Spain',
    unsubNote: 'You received this email because you joined the InvoiceControl waitlist.',
    unsubscribe: 'Unsubscribe',
  },
  pt: {
    subject: (n) => `Já és Membro Fundador, ${n}! O teu desconto vitalício de 50% está garantido 🎉`,
    badge: '🚀 Membro Fundador · Vagas limitadas',
    heroTitle: 'Bem-vindo/a à revolução das faturas!',
    hookTitle: 'Quantas horas perdes por trimestre?',
    hookText: 'Sabemos que está a perder <strong>mais de 12 horas por trimestre</strong> a organizar faturas manualmente: pesquisando no Gmail, renomeando ficheiros, criando folhas Excel… enquanto o trabalho real espera. Isso acaba hoje.',
    offerTitle: '🎁 Os teus benefícios de Membro Fundador:',
    o1: '<strong>50% de desconto vitalício</strong> no plano PRO — garantido',
    o2: '<strong>100 créditos IA extra</strong> de oferta no dia do lançamento',
    o3: 'Acesso prioritário antes de todos',
    codeLabel: 'O TEU CÓDIGO EXCLUSIVO',
    codeNote: 'Guarda-o. Será aplicado automaticamente quando te registares no dia do lançamento.',
    promiseTitle: '⚡ Como funciona o InvoiceControl',
    step1: '<strong>Liga</strong> o teu Gmail, Outlook ou IMAP em 30 segundos',
    step2: '<strong>A IA lê e extrai</strong> automaticamente cada fatura dos teus emails',
    step3: '<strong>Tudo é organizado</strong> em pastas inteligentes e na tua folha Excel mestre',
    step4: '<strong>Exporta</strong> um relatório pronto para o teu contabilista — sem tocar num único ficheiro',
    ctaTitle: '💬 Uma pergunta para ti',
    ctaText: 'Qual é o teu maior problema com as faturas hoje? Responde diretamente a este email — leio cada mensagem pessoalmente e ajuda-me muito a construir o InvoiceControl exatamente como precisas.',
    ctaBtn: 'Responder agora',
    secTitle: 'Os teus dados, sempre seguros',
    gdpr: 'Conformidade RGPD',
    oauth: 'OAuth 2.0',
    enc: 'Cifrado AES-256',
    eu: 'Servidores na UE',
    footerText: 'InvoiceControl · freddyfarro@gmail.com · Espanha',
    unsubNote: 'Recebeste este email por te teres registado na lista de espera do InvoiceControl.',
    unsubscribe: 'Cancelar subscrição',
  },
  fr: {
    subject: (n) => `Vous êtes Membre Fondateur, ${n} ! Votre remise à vie de 50% est confirmée 🎉`,
    badge: '🚀 Membre Fondateur · Places limitées',
    heroTitle: 'Bienvenue dans la révolution des factures !',
    hookTitle: 'Combien d\'heures perdez-vous chaque trimestre ?',
    hookText: 'Nous savons que vous perdez <strong>plus de 12 heures par trimestre</strong> à organiser vos factures manuellement : chercher dans Gmail, renommer des fichiers, créer des tableaux Excel… pendant que votre vrai travail attend. Cela s\'arrête aujourd\'hui.',
    offerTitle: '🎁 Vos avantages Membre Fondateur :',
    o1: '<strong>50% de réduction à vie</strong> sur votre plan PRO — garanti',
    o2: '<strong>100 crédits IA supplémentaires</strong> offerts le jour du lancement',
    o3: 'Accès prioritaire avant tout le monde',
    codeLabel: 'VOTRE CODE EXCLUSIF',
    codeNote: 'Conservez-le. Il sera appliqué automatiquement lors de votre inscription le jour du lancement.',
    promiseTitle: '⚡ Comment fonctionne InvoiceControl',
    step1: '<strong>Connectez</strong> votre Gmail, Outlook ou IMAP en 30 secondes',
    step2: '<strong>L\'IA lit et extrait</strong> automatiquement chaque facture de vos emails',
    step3: '<strong>Tout est organisé</strong> dans des dossiers intelligents et votre Excel maître',
    step4: '<strong>Exportez</strong> un rapport prêt pour votre comptable — sans toucher un seul fichier',
    ctaTitle: '💬 Une question pour vous',
    ctaText: 'Quel est votre plus grand problème avec les factures aujourd\'hui ? Répondez directement à cet email — je lis chaque message personnellement et cela m\'aide énormément à construire InvoiceControl exactement comme vous en avez besoin.',
    ctaBtn: 'Répondre maintenant',
    secTitle: 'Vos données, toujours sécurisées',
    gdpr: 'Conforme RGPD',
    oauth: 'OAuth 2.0',
    enc: 'Chiffrement AES-256',
    eu: 'Serveurs dans l\'UE',
    footerText: 'InvoiceControl · freddyfarro@gmail.com · Espagne',
    unsubNote: 'Vous avez reçu cet email car vous vous êtes inscrit à la liste d\'attente InvoiceControl.',
    unsubscribe: 'Se désabonner',
  },
};

function buildEmail(lang, { name, code }) {
  const t = LANGS[lang] || LANGS.es;
  const steps = [
    { icon: '📧', text: t.step1 },
    { icon: '🤖', text: t.step2 },
    { icon: '📁', text: t.step3 },
    { icon: '📊', text: t.step4 },
  ];
  const stepsHTML = steps.map((s) => `
    <tr>
      <td style="padding:10px 0;vertical-align:top;">
        <table cellpadding="0" cellspacing="0" border="0"><tr>
          <td style="vertical-align:top;padding-right:14px;">
            <table cellpadding="0" cellspacing="0" border="0" style="width:40px;height:40px;background:#eef2ff;border-radius:10px;text-align:center;">
              <tr><td style="text-align:center;vertical-align:middle;font-size:20px;padding:0;">${s.icon}</td></tr>
            </table>
          </td>
          <td style="vertical-align:middle;">
            <p style="margin:0;font-size:14px;color:#334155;line-height:1.65;">${s.text}</p>
          </td>
        </tr></table>
      </td>
    </tr>`).join('');

  return `<!DOCTYPE html>
<html lang="${lang}">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta http-equiv="X-UA-Compatible" content="IE=edge">
<title>${t.heroTitle}</title>
</head>
<body style="margin:0;padding:0;background-color:#f1f5f9;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;-webkit-font-smoothing:antialiased;">

<table width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="#f1f5f9">
<tr><td align="center" style="padding:40px 16px 48px;">

  <table width="600" cellpadding="0" cellspacing="0" border="0" style="max-width:600px;width:100%;border-radius:20px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">

    <!-- ══════════ HEADER ══════════ -->
    <tr>
      <td bgcolor="#4f46e5" style="padding:28px 40px 24px;text-align:center;background:linear-gradient(135deg,#4338ca 0%,#6366f1 100%);">
        <table cellpadding="0" cellspacing="0" border="0" align="center">
          <tr>
            <td style="background:rgba(255,255,255,0.15);border-radius:10px;width:38px;height:38px;text-align:center;vertical-align:middle;font-size:20px;">⚡</td>
            <td style="padding-left:10px;">
              <span style="color:#ffffff;font-size:22px;font-weight:800;letter-spacing:-0.5px;">InvoiceControl</span>
            </td>
          </tr>
        </table>
        <p style="color:rgba(255,255,255,0.65);font-size:12px;margin:10px 0 0;letter-spacing:0.5px;text-transform:uppercase;">AI Invoice Manager · GDPR Compliant · EU Servers</p>
      </td>
    </tr>

    <!-- ══════════ HERO ══════════ -->
    <tr>
      <td bgcolor="#ffffff" style="padding:40px 40px 24px;text-align:center;">
        <p style="margin:0 0 16px;">
          <span style="display:inline-block;background:#fef3c7;color:#92400e;font-size:11px;font-weight:700;padding:6px 18px;border-radius:50px;letter-spacing:0.8px;text-transform:uppercase;">${t.badge}</span>
        </p>
        <h1 style="font-size:26px;font-weight:800;color:#1e1b4b;margin:0 0 10px;letter-spacing:-0.5px;line-height:1.2;">${t.heroTitle}</h1>
        <p style="font-size:16px;color:#64748b;margin:0;">👋 ${name}</p>
      </td>
    </tr>

    <!-- ══════════ HOOK ══════════ -->
    <tr>
      <td bgcolor="#ffffff" style="padding:0 40px 24px;">
        <h2 style="font-size:17px;font-weight:700;color:#1e293b;margin:0 0 10px;">${t.hookTitle}</h2>
        <p style="font-size:15px;color:#475569;line-height:1.75;margin:0;">${t.hookText}</p>
      </td>
    </tr>

    <!-- ══════════ OFFER BOX ══════════ -->
    <tr>
      <td bgcolor="#ffffff" style="padding:0 40px 28px;">
        <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#eef2ff;border-radius:16px;border:1px solid #c7d2fe;">
          <tr>
            <td style="padding:28px 28px 20px;">
              <p style="font-size:14px;font-weight:700;color:#312e81;margin:0 0 16px;">${t.offerTitle}</p>
              <table cellpadding="0" cellspacing="0" border="0" width="100%">
                <tr><td style="padding:5px 0;font-size:14px;color:#3730a3;line-height:1.6;">✅&nbsp;&nbsp;${t.o1}</td></tr>
                <tr><td style="padding:5px 0;font-size:14px;color:#3730a3;line-height:1.6;">✅&nbsp;&nbsp;${t.o2}</td></tr>
                <tr><td style="padding:5px 0;font-size:14px;color:#3730a3;line-height:1.6;">✅&nbsp;&nbsp;${t.o3}</td></tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="padding:0 28px 28px;">
              <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background:linear-gradient(135deg,#3730a3,#4f46e5);border-radius:12px;">
                <tr>
                  <td style="padding:22px 24px;text-align:center;">
                    <p style="color:rgba(255,255,255,0.65);font-size:10px;text-transform:uppercase;letter-spacing:2px;margin:0 0 10px;font-weight:700;">${t.codeLabel}</p>
                    <p style="color:#ffffff;font-size:28px;font-weight:800;letter-spacing:5px;margin:0 0 10px;font-family:'Courier New',Courier,monospace;">${code}</p>
                    <p style="color:rgba(255,255,255,0.6);font-size:11px;margin:0;line-height:1.5;">${t.codeNote}</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </td>
    </tr>

    <!-- ══════════ HOW IT WORKS ══════════ -->
    <tr>
      <td bgcolor="#ffffff" style="padding:0 40px 28px;">
        <h2 style="font-size:17px;font-weight:700;color:#1e293b;margin:0 0 16px;">${t.promiseTitle}</h2>
        <table width="100%" cellpadding="0" cellspacing="0" border="0">
          ${stepsHTML}
        </table>
      </td>
    </tr>

    <!-- ══════════ CTA ══════════ -->
    <tr>
      <td bgcolor="#ffffff" style="padding:0 40px 36px;">
        <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#fffbeb;border-radius:16px;border:1px solid #fde68a;">
          <tr>
            <td style="padding:28px 28px 26px;">
              <h3 style="font-size:16px;font-weight:700;color:#92400e;margin:0 0 12px;">${t.ctaTitle}</h3>
              <p style="font-size:14px;color:#78350f;line-height:1.75;margin:0 0 22px;">${t.ctaText}</p>
              <table cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td style="background:#f59e0b;border-radius:10px;">
                    <a href="mailto:${REPLY_TO}" style="display:inline-block;padding:13px 26px;font-size:14px;font-weight:700;color:#ffffff;text-decoration:none;letter-spacing:0.2px;">${t.ctaBtn} →</a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </td>
    </tr>

    <!-- ══════════ SECURITY BADGES ══════════ -->
    <tr>
      <td bgcolor="#f8fafc" style="padding:22px 40px;border-top:1px solid #e2e8f0;">
        <p style="font-size:11px;font-weight:700;color:#64748b;margin:0 0 14px;text-transform:uppercase;letter-spacing:0.8px;">${t.secTitle}</p>
        <table width="100%" cellpadding="0" cellspacing="0" border="0">
          <tr>
            <td style="padding:0 6px 0 0;width:25%;text-align:center;">
              <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#ffffff;border:1px solid #e2e8f0;border-radius:10px;">
                <tr><td style="padding:12px 8px;text-align:center;">
                  <p style="font-size:20px;margin:0 0 4px;">🔒</p>
                  <p style="font-size:10px;font-weight:600;color:#475569;margin:0;line-height:1.3;">${t.gdpr}</p>
                </td></tr>
              </table>
            </td>
            <td style="padding:0 6px;width:25%;text-align:center;">
              <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#ffffff;border:1px solid #e2e8f0;border-radius:10px;">
                <tr><td style="padding:12px 8px;text-align:center;">
                  <p style="font-size:20px;margin:0 0 4px;">🛡️</p>
                  <p style="font-size:10px;font-weight:600;color:#475569;margin:0;line-height:1.3;">${t.oauth}</p>
                </td></tr>
              </table>
            </td>
            <td style="padding:0 6px;width:25%;text-align:center;">
              <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#ffffff;border:1px solid #e2e8f0;border-radius:10px;">
                <tr><td style="padding:12px 8px;text-align:center;">
                  <p style="font-size:20px;margin:0 0 4px;">🔐</p>
                  <p style="font-size:10px;font-weight:600;color:#475569;margin:0;line-height:1.3;">${t.enc}</p>
                </td></tr>
              </table>
            </td>
            <td style="padding:0 0 0 6px;width:25%;text-align:center;">
              <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#ffffff;border:1px solid #e2e8f0;border-radius:10px;">
                <tr><td style="padding:12px 8px;text-align:center;">
                  <p style="font-size:20px;margin:0 0 4px;">🇪🇺</p>
                  <p style="font-size:10px;font-weight:600;color:#475569;margin:0;line-height:1.3;">${t.eu}</p>
                </td></tr>
              </table>
            </td>
          </tr>
        </table>
      </td>
    </tr>

    <!-- ══════════ FOOTER ══════════ -->
    <tr>
      <td bgcolor="#f1f5f9" style="padding:22px 40px 28px;text-align:center;">
        <p style="font-size:12px;color:#94a3b8;margin:0 0 6px;">${t.footerText}</p>
        <p style="font-size:11px;color:#cbd5e1;margin:0;line-height:1.6;">
          ${t.unsubNote}&nbsp;·&nbsp;
          <a href="mailto:${REPLY_TO}?subject=Unsubscribe" style="color:#94a3b8;text-decoration:underline;">${t.unsubscribe}</a>
        </p>
      </td>
    </tr>

  </table>
</td></tr>
</table>

</body>
</html>`;
}

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });

  const body = req.body || {};
  const email = (body.email || '').trim().toLowerCase();
  const lang = body.lang || 'es';

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res.status(400).json({ error: 'Invalid email' });
  }

  const namePart = email.split('@')[0].replace(/[._+\-]/g, ' ').split(' ')[0];
  const name = namePart.charAt(0).toUpperCase() + namePart.slice(1).toLowerCase();
  const validLang = ['es', 'en', 'pt', 'fr'].includes(lang) ? lang : 'es';
  const code = generateDiscountCode(email);
  const t = LANGS[validLang];

  if (!process.env.RESEND_API_KEY) {
    console.warn('[waitlist] RESEND_API_KEY not set — skipping email send');
    return res.status(200).json({ ok: true, code, note: 'email_skipped' });
  }

  const html = buildEmail(validLang, { name, code });
  const subject = t.subject(name);

  try {
    const resp = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: FROM_EMAIL,
        to: [email],
        reply_to: REPLY_TO,
        subject,
        html,
      }),
    });

    if (!resp.ok) {
      const err = await resp.text();
      console.error('[waitlist] Resend error:', err);
      return res.status(200).json({ ok: true, code, note: 'email_failed' });
    }
  } catch (err) {
    console.error('[waitlist] Network error:', err.message);
    return res.status(200).json({ ok: true, code, note: 'email_error' });
  }

  // Guardar en Google Sheets (fire-and-forget)
  fetch('https://script.google.com/macros/s/AKfycbwP8_V6iIX3AJhOmzhYcI-jMsofmyjQay2KqdeGK--M2ufRZRV9E-kqApY1dGKLZDObnw/exec', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      fecha: new Date().toISOString(),
      email,
      nombre: name,
      tipo: body.tipo || '',
      facturas: body.facturas || '',
      plan: body.plan || '',
      pais: body.pais || '',
      ciudad: body.ciudad || '',
      codigo: code,
    }),
  }).catch(() => {});

  return res.status(200).json({ ok: true, code });
};
