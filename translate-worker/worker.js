// Cloudflare Worker — Azure Translator proxy for the Shena app.
//
// Why this exists: an Azure Translator key must NOT ship in the browser bundle
// (it can't be origin-restricted and would be abusable). This tiny Worker holds
// the key server-side and is the only thing the app talks to. The app sends the
// Hebrew/Arabic/English text an admin saved; the Worker returns all three
// languages so the app can store them on the document (translate once on save).
//
// Environment variables (Cloudflare dashboard → your Worker → Settings → Variables):
//   AZURE_KEY        (Secret)    Azure Translator key (Key 1 from the Azure portal)
//   AZURE_REGION     (Variable)  Azure resource region, e.g. "westeurope"
//   AZURE_ENDPOINT   (Variable, optional) defaults to the global endpoint below
//   ALLOWED_ORIGINS  (Variable)  comma-separated origins allowed to call this,
//                                e.g. "http://localhost:5173,https://your-app.web.app"
//
// Request:  POST  { "texts": string[], "to"?: string[] }
// Response: { "results": Array<Record<lang, string>> }   // aligned to `texts`
//           e.g. { "results": [ { "he": "...", "en": "...", "ar": "..." } ] }

const DEFAULT_TARGETS = ['he', 'en', 'ar'];

function corsHeaders(origin, allowed) {
  // Echo the origin only if it's allow-listed; otherwise send no CORS allowance.
  const allow = allowed.length === 0 || allowed.includes(origin) ? origin : '';
  return {
    'Access-Control-Allow-Origin': allow || 'null',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Max-Age': '86400',
    Vary: 'Origin',
  };
}

function json(obj, status, headers) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { 'Content-Type': 'application/json', ...headers },
  });
}

export default {
  async fetch(request, env) {
    const origin = request.headers.get('Origin') || '';
    const allowed = (env.ALLOWED_ORIGINS || '')
      .split(',')
      .map((value) => value.trim())
      .filter(Boolean);
    const cors = corsHeaders(origin, allowed);

    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: cors });
    }
    if (request.method !== 'POST') {
      return json({ error: 'Method not allowed' }, 405, cors);
    }
    if (allowed.length > 0 && !allowed.includes(origin)) {
      return json({ error: 'Origin not allowed' }, 403, cors);
    }

    let body;
    try {
      body = await request.json();
    } catch {
      return json({ error: 'Invalid JSON body' }, 400, cors);
    }

    const texts = Array.isArray(body.texts) ? body.texts.map((t) => String(t ?? '')) : [];
    const targets = Array.isArray(body.to) && body.to.length ? body.to : DEFAULT_TARGETS;
    if (texts.length === 0) {
      return json({ results: [] }, 200, cors);
    }

    const endpoint = env.AZURE_ENDPOINT || 'https://api.cognitive.microsofttranslator.com';
    const params = new URLSearchParams({ 'api-version': '3.0' });
    targets.forEach((lang) => params.append('to', lang));

    let azureRes;
    try {
      azureRes = await fetch(`${endpoint}/translate?${params.toString()}`, {
        method: 'POST',
        headers: {
          'Ocp-Apim-Subscription-Key': env.AZURE_KEY,
          'Ocp-Apim-Subscription-Region': env.AZURE_REGION,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(texts.map((Text) => ({ Text }))),
      });
    } catch (err) {
      return json({ error: 'Failed to reach Azure', detail: String(err) }, 502, cors);
    }

    if (!azureRes.ok) {
      const detail = await azureRes.text();
      return json({ error: 'Azure error', status: azureRes.status, detail }, 502, cors);
    }

    const data = await azureRes.json();
    // Azure returns one entry per input text, each with a translations[] array
    // ({ text, to }). Reshape to { [lang]: text } aligned to the input order.
    const results = data.map((item) => {
      const out = {};
      (item.translations || []).forEach((tr) => {
        out[tr.to] = tr.text;
      });
      return out;
    });

    return json({ results }, 200, cors);
  },
};
