/**
 * Rate limiter côté frontend pour les appels IA
 * Evite le spam et les coûts excessifs
 */

const STORAGE_KEY = 'nfit_ai_rate_limit';
const MAX_CALLS_PER_HOUR = 20;
const COOLDOWN_MS = 8000; // 8s entre chaque appel

function getState() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
  } catch {
    return {};
  }
}

function saveState(state) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {}
}

/**
 * Vérifie si un appel IA est autorisé.
 * @returns {{ allowed: boolean, reason?: string, retryInMs?: number }}
 */
export function checkAIRateLimit() {
  const now = Date.now();
  const state = getState();

  // Cooldown entre appels
  if (state.lastCall && now - state.lastCall < COOLDOWN_MS) {
    const retryInMs = COOLDOWN_MS - (now - state.lastCall);
    return { allowed: false, reason: 'cooldown', retryInMs };
  }

  // Max par heure (fenêtre glissante)
  const oneHourAgo = now - 60 * 60 * 1000;
  const recentCalls = (state.calls || []).filter(ts => ts > oneHourAgo);

  if (recentCalls.length >= MAX_CALLS_PER_HOUR) {
    const oldestInWindow = recentCalls[0];
    const retryInMs = oldestInWindow + 60 * 60 * 1000 - now;
    return { allowed: false, reason: 'hourly_limit', retryInMs };
  }

  return { allowed: true };
}

/**
 * Enregistre un appel IA effectué.
 */
export function recordAICall() {
  const now = Date.now();
  const state = getState();
  const oneHourAgo = now - 60 * 60 * 1000;
  const recentCalls = (state.calls || []).filter(ts => ts > oneHourAgo);
  recentCalls.push(now);
  saveState({ ...state, lastCall: now, calls: recentCalls });
}

/**
 * Wrapper pratique pour les appels InvokeLLM avec rate limiting intégré.
 * @param {object} base44 - instance sdk
 * @param {object} params - paramètres InvokeLLM
 * @throws si rate limit atteint
 */
export async function invokeAIWithLimit(base44, params) {
  const check = checkAIRateLimit();
  if (!check.allowed) {
    if (check.reason === 'cooldown') {
      throw new Error(`Attends encore ${Math.ceil(check.retryInMs / 1000)}s avant de renvoyer.`);
    }
    throw new Error('Limite horaire atteinte (20 appels/h). Reviens dans un moment.');
  }
  recordAICall();
  return base44.integrations.Core.InvokeLLM(params);
}

/**
 * Alias sans rate-limit (pour les appels internes)
 */
export async function invokeAI(base44, params) {
  return base44.integrations.Core.InvokeLLM(params);
}