const { Resend } = require('resend');

const MAX = { name: 120, email: 254, company: 200, message: 8000 };

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

function applyCors(req, res) {
  const origin = req.headers.origin;
  const allowed = parseAllowedOrigins();
  const isPreviewOrDev = process.env.VERCEL_ENV !== 'production';

  if (isPreviewOrDev && origin) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Vary', 'Origin');
    return;
  }

  if (origin && allowed.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Vary', 'Origin');
    return;
  }

  if (!origin) {
    return;
  }

  res.setHeader('Access-Control-Allow-Origin', allowed[0] || 'null');
  res.setHeader('Vary', 'Origin');
}

async function readJsonBody(req) {
  const chunks = [];
  for await (const chunk of req) {
    chunks.push(chunk);
  }
  const raw = Buffer.concat(chunks).toString('utf8');
  if (!raw.trim()) return {};
  return JSON.parse(raw);
}

function validateEmail(email) {
  if (email.length > MAX.email) return false;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

module.exports = async (req, res) => {
  applyCors(req, res);
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Content-Type', 'application/json; charset=utf-8');

  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }

  if (process.env.VERCEL_ENV === 'production') {
    const origin = req.headers.origin;
    const allowed = parseAllowedOrigins();
    if (origin && !allowed.includes(origin)) {
      res.setHeader('Access-Control-Allow-Origin', origin);
      res.setHeader('Vary', 'Origin');
      return res.status(403).json({ ok: false, error: 'Forbidden' });
    }
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ ok: false, error: 'Method not allowed' });
  }

  let body;
  try {
    body = await readJsonBody(req);
  } catch {
    return res.status(400).json({ ok: false, error: 'Invalid JSON body' });
  }

  if (body.company_website && String(body.company_website).trim() !== '') {
    return res.status(200).json({ ok: true });
  }

  const name = String(body.name ?? '').trim();
  const email = String(body.email ?? '').trim();
  const company = String(body.company ?? '').trim();
  const message = String(body.message ?? '').trim();

  if (!name || name.length > MAX.name) {
    return res.status(400).json({
      ok: false,
      error: 'Please enter your name.'
    });
  }
  if (!validateEmail(email)) {
    return res.status(400).json({
      ok: false,
      error: 'Please enter a valid email address.'
    });
  }
  if (company.length > MAX.company) {
    return res.status(400).json({ ok: false, error: 'Company name is too long.' });
  }
  if (!message || message.length > MAX.message) {
    return res.status(400).json({
      ok: false,
      error: 'Please enter a message.'
    });
  }

  const apiKey = process.env.RESEND_API_KEY;
  const to = process.env.CONTACT_TO_EMAIL;
  const from = process.env.CONTACT_FROM_EMAIL;

  if (!apiKey || !to || !from) {
    console.error('Missing RESEND_API_KEY, CONTACT_TO_EMAIL, or CONTACT_FROM_EMAIL');
    return res.status(503).json({
      ok: false,
      error: 'Contact form is not configured. Please try again later.'
    });
  }

  const subject = `Website contact: ${name}`;
  const html = `
    <h2>New contact form submission</h2>
    <p><strong>Name:</strong> ${escapeHtml(name)}</p>
    <p><strong>Email:</strong> ${escapeHtml(email)}</p>
    <p><strong>Company:</strong> ${company ? escapeHtml(company) : '—'}</p>
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
      return res.status(502).json({
        ok: false,
        error: 'Could not send message. Please try again or email us directly.'
      });
    }

    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error(err);
    return res.status(502).json({
      ok: false,
      error: 'Could not send message. Please try again later.'
    });
  }
};
