// AI Memory system — tracks user behavior for personalized coaching

const MEM_KEY = 'nationalfit_ai_memory_v2';

export function getMemory() {
  try { return JSON.parse(localStorage.getItem(MEM_KEY) || '{}'); } catch { return {}; }
}

export function saveMemory(data) {
  try { localStorage.setItem(MEM_KEY, JSON.stringify({ ...data, _updated: Date.now() })); } catch {}
}

// Record a completed workout session with feedback
export function recordSession({ exercises = [], feedback = 'normal', duration = 0, hour = new Date().getHours() }) {
  const mem = getMemory();
  const sessions = mem.sessions || [];

  // Track exercise frequency
  const exerciseFreq = { ...(mem.exerciseFreq || {}) };
  exercises.forEach(ex => {
    exerciseFreq[ex.name] = (exerciseFreq[ex.name] || 0) + 1;
  });

  // Track skipped exercises
  const skippedFreq = { ...(mem.skippedFreq || {}) };

  // Track feedback pattern
  const feedbackLog = [...(mem.feedbackLog || []), { feedback, date: new Date().toISOString().split('T')[0] }].slice(-20);

  // Hard sessions = feedback 'hard'
  const hardSessions = feedbackLog.filter(f => f.feedback === 'hard').length;
  const totalSessions = feedbackLog.length;
  const fatigueRate = totalSessions > 0 ? Math.round((hardSessions / totalSessions) * 100) : 0;

  // Training hours
  const trainingHours = { ...(mem.trainingHours || {}) };
  const hourKey = `h${hour}`;
  trainingHours[hourKey] = (trainingHours[hourKey] || 0) + 1;

  // Average duration
  const durations = [...(mem.durations || []), duration].slice(-10);
  const avgDuration = durations.length > 0 ? Math.round(durations.reduce((a, b) => a + b, 0) / durations.length) : 0;

  sessions.push({ date: new Date().toISOString().split('T')[0], feedback, duration });
  
  saveMemory({
    ...mem,
    sessions: sessions.slice(-30),
    exerciseFreq,
    skippedFreq,
    feedbackLog,
    fatigueRate,
    trainingHours,
    durations,
    avgDuration,
    totalSessionsCount: (mem.totalSessionsCount || 0) + 1,
  });
}

// Record a skipped/ignored exercise
export function recordSkipped(exerciseName) {
  const mem = getMemory();
  const skippedFreq = { ...(mem.skippedFreq || {}) };
  skippedFreq[exerciseName] = (skippedFreq[exerciseName] || 0) + 1;
  saveMemory({ ...mem, skippedFreq });
}

// Get top exercises (most done)
export function getTopExercises(n = 5) {
  const mem = getMemory();
  const freq = mem.exerciseFreq || {};
  return Object.entries(freq).sort((a, b) => b[1] - a[1]).slice(0, n).map(([name]) => name);
}

// Get most skipped exercises
export function getMostSkipped(n = 3) {
  const mem = getMemory();
  const freq = mem.skippedFreq || {};
  return Object.entries(freq).sort((a, b) => b[1] - a[1]).slice(0, n).map(([name]) => name);
}

// Save a personal record for an exercise
export function savePR(exerciseName, weightKg, reps) {
  const mem = getMemory();
  const prs = { ...(mem.prs || {}) };
  prs[exerciseName] = { weight: weightKg, reps, date: new Date().toISOString().split('T')[0] };
  saveMemory({ ...mem, prs });
}

// Save injury/pain note for memory
export function saveInjuryNote(note) {
  const mem = getMemory();
  const injuries = [...(mem.injuryLog || []), { note, date: new Date().toISOString().split('T')[0] }].slice(-10);
  saveMemory({ ...mem, injuryLog: injuries });
}

// Save recovery context (sleep, stress, water)
export function saveRecoveryContext({ sleepHours, stressLevel, waterLitres, recoveryScore }) {
  const mem = getMemory();
  const log = [...(mem.recoveryLog || []), {
    sleep: sleepHours, stress: stressLevel, water: waterLitres, score: recoveryScore,
    date: new Date().toISOString().split('T')[0]
  }].slice(-14);
  const avgRecovery = log.filter(r => r.score).reduce((a, r) => ({ sum: a.sum + r.score, n: a.n + 1 }), { sum: 0, n: 0 });
  saveMemory({ ...mem, recoveryLog: log, avgRecoveryScore: avgRecovery.n > 0 ? Math.round(avgRecovery.sum / avgRecovery.n) : null });
}

// Build a concise memory context string for AI prompts
export function buildMemoryContext() {
  const mem = getMemory();
  if (!mem.totalSessionsCount) return '';

  const topEx = getTopExercises(3).join(', ') || 'N/A';
  const skipped = getMostSkipped(2).join(', ') || 'N/A';
  const recentFeedbacks = (mem.feedbackLog || []).slice(-5).map(f => f.feedback);
  const recentFatigue = recentFeedbacks.filter(f => f === 'hard').length;

  // Preferred training hours
  const hours = mem.trainingHours || {};
  const preferredHour = Object.entries(hours).sort((a, b) => b[1] - a[1])[0]?.[0]?.replace('h', '') || 'N/A';

  // Top PRs
  const prs = mem.prs || {};
  const prSummary = Object.entries(prs).slice(0, 3).map(([name, d]) => `${name}: ${d.weight}kg`).join(', ') || 'N/A';

  // Recent injuries
  const lastInjury = mem.injuryLog?.slice(-1)[0];
  const injuryContext = lastInjury ? `derniere douleur signalee: "${lastInjury.note}" le ${lastInjury.date}` : '';

  // Recovery
  const recoveryContext = mem.avgRecoveryScore ? `score recuperation moyen: ${mem.avgRecoveryScore}/100` : '';

  return `[Memoire coach: ${mem.totalSessionsCount} seances total, exercices favoris: ${topEx}, exercices souvent ignores: ${skipped}, fatigue recente: ${recentFatigue}/5 seances difficiles, heure habituelle: ${preferredHour}h, duree moy: ${mem.avgDuration || '?'}min, PRs: ${prSummary}${injuryContext ? ', ' + injuryContext : ''}${recoveryContext ? ', ' + recoveryContext : ''}]`;
}