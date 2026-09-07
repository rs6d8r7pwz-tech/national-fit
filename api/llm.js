// api/llm.js
// Fonction serverless Vercel : proxy vers le fournisseur IA.
// La clé API reste côté serveur (variable d'env sur Vercel), jamais dans le navigateur.
//
// Par défaut : Google Gemini (offre gratuite), via son endpoint compatible OpenAI.
// Pour changer de fournisseur, il suffit de modifier les 3 variables d'environnement
// sur Vercel (AI_API_KEY, AI_BASE_URL, AI_MODEL) — aucun code à retoucher.
//
// Gemini (défaut, gratuit) :
//   AI_API_KEY  = <ta clé Google AI Studio>
//   AI_BASE_URL = https://generativelanguage.googleapis.com/v1beta/openai
//   AI_MODEL    = gemini-flash-latest
//
// Groq (alternative rapide, gratuit) :
//   AI_BASE_URL = https://api.groq.com/openai/v1
//   AI_MODEL    = openai/gpt-oss-20b
//
// OpenAI (payant) :
//   AI_BASE_URL = https://api.openai.com/v1
//   AI_MODEL    = gpt-4o-mini

const AI_BASE_URL =
  process.env.AI_BASE_URL ||
  'https://generativelanguage.googleapis.com/v1beta/openai';
const AI_MODEL = process.env.AI_MODEL || 'gemini-flash-latest';
// Rétro-compat : accepte AI_API_KEY, sinon GEMINI_API_KEY.
const AI_API_KEY = process.env.AI_API_KEY || process.env.GEMINI_API_KEY;

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Méthode non autorisée' });
  }
  if (!AI_API_KEY) {
    return res
      .status(500)
      .json({ error: 'Clé IA non configurée côté serveur (AI_API_KEY).' });
  }

  // req.body peut arriver en string selon la config : on parse par sécurité.
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

  const payload = {
    model: AI_MODEL,
    messages,
    temperature: 0.7,
    max_tokens: 2000,
    ...(response_json_schema && { response_format: { type: 'json_object' } }),
  };

  try {
    // Timeout pour éviter que le front reste bloqué indéfiniment.
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 45000);

    const upstream = await fetch(`${AI_BASE_URL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${AI_API_KEY}`,
      },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });
    clearTimeout(timeout);

    if (!upstream.ok) {
      const errText = await upstream.text().catch(() => '');
      return res
        .status(upstream.status)
        .json({ error: `Fournisseur IA: ${upstream.status} ${errText}`.slice(0, 500) });
    }

    const data = await upstream.json();
    const text = data.choices?.[0]?.message?.content || '';
    return res.status(200).json({ text });
  } catch (e) {
    const msg =
      e.name === 'AbortError'
        ? "L'IA a mis trop de temps à répondre. Réessaie."
        : 'Erreur lors de l’appel au fournisseur IA.';
    return res.status(502).json({ error: msg });
  }
}
