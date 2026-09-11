// api/llm.js
// Fonction serverless Vercel : proxy vers le(s) fournisseur(s) IA.
// La clé API reste côté serveur (variable d'env sur Vercel), jamais dans le navigateur.
//
// FOURNISSEUR PRINCIPAL : Google Gemini (gratuit), via son endpoint compatible OpenAI.
//   AI_API_KEY  = <ta clé Google AI Studio>   (obligatoire)
//   AI_BASE_URL = https://generativelanguage.googleapis.com/v1beta/openai  (optionnel)
//   AI_MODEL    = gemini-flash-latest          (optionnel)
//
// FALLBACK AUTOMATIQUE : Groq (gratuit). Utilisé UNIQUEMENT si Gemini échoue
// (ex: 503 "high demand"). Actif seulement si GROQ_API_KEY est défini.
//   GROQ_API_KEY  = <ta clé console.groq.com>
//   GROQ_BASE_URL = https://api.groq.com/openai/v1   (optionnel)
//   GROQ_MODEL    = openai/gpt-oss-20b               (optionnel)

const RETRYABLE = new Set([429, 500, 502, 503, 504]);
const MAX_ATTEMPTS = 2; // par fournisseur

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// Construit la liste ordonnée des fournisseurs disponibles.
function providers() {
  const list = [];
  const geminiKey = process.env.AI_API_KEY || process.env.GEMINI_API_KEY;
  if (geminiKey) {
    list.push({
      name: 'gemini',
      baseUrl: process.env.AI_BASE_URL || 'https://generativelanguage.googleapis.com/v1beta/openai',
      model: process.env.AI_MODEL || 'gemini-flash-latest',
      key: geminiKey,
    });
  }
  if (process.env.GROQ_API_KEY) {
    list.push({
      name: 'groq',
      baseUrl: process.env.GROQ_BASE_URL || 'https://api.groq.com/openai/v1',
      model: process.env.GROQ_MODEL || 'openai/gpt-oss-20b',
      key: process.env.GROQ_API_KEY,
    });
  }
  return list;
}

async function callProvider(p, messages, jsonMode) {
  const payload = {
    model: p.model,
    messages,
    temperature: 0.7,
    max_tokens: 2000,
    ...(jsonMode && { response_format: { type: 'json_object' } }),
  };

  let last = { status: 502, text: '' };
  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 25000);
    try {
      const r = await fetch(`${p.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${p.key}` },
        body: JSON.stringify(payload),
        signal: controller.signal,
      });
      clearTimeout(timeout);
      if (r.ok) {
        const data = await r.json();
        return { ok: true, text: data.choices?.[0]?.message?.content || '' };
      }
      const errText = await r.text().catch(() => '');
      last = { status: r.status, text: errText };
      if (RETRYABLE.has(r.status) && attempt < MAX_ATTEMPTS) {
        await sleep(attempt * 800);
        continue;
      }
      return { ok: false, retryable: RETRYABLE.has(r.status), status: r.status, text: errText };
    } catch (e) {
      clearTimeout(timeout);
      last = { status: 504, text: e.name === 'AbortError' ? 'timeout' : String(e) };
      if (attempt < MAX_ATTEMPTS) { await sleep(attempt * 800); continue; }
    }
  }
  return { ok: false, retryable: true, status: last.status, text: last.text };
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Méthode non autorisée' });
  }

  const list = providers();
  if (list.length === 0) {
    return res.status(500).json({ error: 'Aucune clé IA configurée côté serveur (AI_API_KEY).' });
  }

  let body = req.body;
  if (typeof body === 'string') {
    try { body = JSON.parse(body); } catch { body = {}; }
  }
  const { prompt, response_json_schema } = body || {};
  if (!prompt || typeof prompt !== 'string') {
    return res.status(400).json({ error: 'Paramètre "prompt" manquant.' });
  }

  const messages = response_json_schema
    ? [
        { role: 'system', content: 'Réponds uniquement en JSON valide.' },
        { role: 'user', content: prompt },
      ]
    : [{ role: 'user', content: prompt }];

  let lastErr = { status: 502, text: 'Erreur inconnue.' };

  // On essaie chaque fournisseur dans l'ordre ; on bascule au suivant si échec récupérable.
  for (const p of list) {
    const result = await callProvider(p, messages, !!response_json_schema);
    if (result.ok) {
      return res.status(200).json({ text: result.text });
    }
    lastErr = { status: result.status, text: result.text };
    // Erreur non récupérable (ex: 400/401) → inutile de basculer, on renvoie tout de suite.
    if (!result.retryable) {
      return res
        .status(result.status)
        .json({ error: `Fournisseur IA (${p.name}): ${result.status} ${result.text}`.slice(0, 500) });
    }
    // sinon on passe au fournisseur suivant (fallback)
  }

  const msg = lastErr.text === 'timeout'
    ? "L'IA a mis trop de temps à répondre. Réessaie."
    : 'Tous les services IA sont momentanément surchargés. Réessaie dans quelques secondes.';
  // On expose le vrai statut/motif du fournisseur (sans jamais la cle) pour faciliter le diagnostic.
  return res.status(503).json({
    error: msg,
    provider_status: lastErr.status,
    provider_detail: String(lastErr.text || '').slice(0, 300),
  });
}
