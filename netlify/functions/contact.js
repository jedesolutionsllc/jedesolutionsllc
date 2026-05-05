const { Resend } = require('resend');

const MAX = { name: 120, email: 254, message: 8000 };

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function parseAllowedOrigins() {
  const raw =
    process.env.ALLOWED_ORIGINS ||
    'https://www.jedesolutionsllc.com,https://jedesolutionsllc.com';
  return raw
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
}

function isProductionContext() {
  return process.env.CONTEXT === 'production';
}

function isFlexibleOriginContext() {
  const c = process.env.CONTEXT;
  return c === 'deploy-preview' || c === 'branch-deploy' || c === 'dev' || !c;
}

function corsHeaders(event) {
  const allowedList = parseAllowedOrigins();
  const origin = event.headers.origin || event.headers.Origin || '';

  if (isFlexibleOriginContext() && origin) {
    return {
      'Access-Control-Allow-Origin': origin,
      Vary: 'Origin',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type'
    };
  }

  if (origin && allowedList.includes(origin)) {
    return {
      'Access-Control-Allow-Origin': origin,
      Vary: 'Origin',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type'
    };
  }

  if (!origin) {
    return {
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type'
    };
  }

  return {
    'Access-Control-Allow-Origin': allowedList[0] || 'null',
    Vary: 'Origin',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type'
  };
}

function json(event, statusCode, bodyObj) {
  return {
    statusCode,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      ...corsHeaders(event)
    },
    body: JSON.stringify(bodyObj)
  };
}

function validateEmail(email) {
  if (email.length > MAX.email) return false;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 204,
      headers: corsHeaders(event),
      body: ''
    };
  }

  if (isProductionContext()) {
    const origin = event.headers.origin || event.headers.Origin;
    const allowed = parseAllowedOrigins();
    if (origin && !allowed.includes(origin)) {
      return json(event, 403, { ok: false, error: 'Forbidden' });
    }
  }

  if (event.httpMethod !== 'POST') {
    return json(event, 405, { ok: false, error: 'Method not allowed' });
  }

  let body;
  try {
    body = JSON.parse(event.body || '{}');
  } catch {
    return json(event, 400, { ok: false, error: 'Invalid JSON body' });
  }

  if (body.company_website && String(body.company_website).trim() !== '') {
    return json(event, 200, { ok: true });
  }

  const name = String(body.name ?? '').trim();
  const email = String(body.email ?? '').trim();
  const message = String(body.message ?? '').trim();

  if (!name || name.length > MAX.name) {
    return json(event, 400, {
      ok: false,
      error: 'Please enter your name.'
    });
  }
  if (!validateEmail(email)) {
    return json(event, 400, {
      ok: false,
      error: 'Please enter a valid email address.'
    });
  }
  if (!message || message.length > MAX.message) {
    return json(event, 400, {
      ok: false,
      error: 'Please enter a message.'
    });
  }

  const apiKey = process.env.RESEND_API_KEY;
  const to = process.env.CONTACT_TO_EMAIL;
  const from = process.env.CONTACT_FROM_EMAIL;

  if (!apiKey || !to || !from) {
    console.error('Missing RESEND_API_KEY, CONTACT_TO_EMAIL, or CONTACT_FROM_EMAIL');
    return json(event, 503, {
      ok: false,
      error: 'Contact form is not configured. Please try again later.'
    });
  }

  const subject = `Website contact: ${name}`;
  const html = `
    <h2>New contact form submission</h2>
    <p><strong>Name:</strong> ${escapeHtml(name)}</p>
    <p><strong>Email:</strong> ${escapeHtml(email)}</p>
    <hr />
    <p><strong>Message:</strong></p>
    <pre style="font-family: system-ui, sans-serif; white-space: pre-wrap;">${escapeHtml(message)}</pre>
  `;

  try {
    const resend = new Resend(apiKey);
    const { error } = await resend.emails.send({
      from,
      to,
      replyTo: email,
      subject,
      html
    });

    if (error) {
      console.error('Resend error:', error);
      return json(event, 502, {
        ok: false,
        error: 'Could not send message. Please try again or email us directly.'
      });
    }

    return json(event, 200, { ok: true });
  } catch (err) {
    console.error(err);
    return json(event, 502, {
      ok: false,
      error: 'Could not send message. Please try again later.'
    });
  }
};
