import React, { useState, useEffect, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { motion } from 'framer-motion';
import { Brain, TrendingUp, TrendingDown, Minus, ChevronRight, Loader2, RefreshCw } from 'lucide-react';

const CACHE_KEY = 'nfit_adaptive_coach_v2';
const CACHE_TTL = 6 * 60 * 60 * 1000; // 6h

function RecoveryBar({ score }) {
  const color = score >= 70 ? '#22c55e' : score >= 40 ? '#f59e0b' : '#ef4444';
  const label = score >= 70 ? 'Excellente récup' : score >= 40 ? 'Récup correcte' : 'Récup insuffisante';
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
        <motion.div
          className="h-full rounded-full"
          initial={{ width: 0 }}
          animate={{ width: `${score}%` }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
          style={{ background: color }}
        />
      </div>
      <span className="text-xs font-bold" style={{ color }}>{score}/100</span>
      <span className="text-xs text-slate-400">{label}</span>
    </div>
  );
}

export default function AIAdaptiveCoach({ profile, progressEntries }) {
  const [advice, setAdvice] = useState(null);
  const [loading, setLoading] = useState(false);
  const [recoveryScore, setRecoveryScore] = useState(null);
  const [trend, setTrend] = useState(null); // 'up' | 'down' | 'stable'
  const hasFetched = useRef(false);

  useEffect(() => {
    if (!profile || hasFetched.current) return;
    hasFetched.current = true;

    // Try cache
    try {
      const cached = JSON.parse(localStorage.getItem(CACHE_KEY) || 'null');
      if (cached && Date.now() - cached.ts < CACHE_TTL && cached.profileId === profile.id) {
        setAdvice(cached.advice);
        setRecoveryScore(cached.recoveryScore);
        setTrend(cached.trend);
        return;
      }
    } catch {}

    fetchAnalysis();
  }, [profile?.id]);

  const fetchAnalysis = async () => {
    setLoading(true);
    try {
      // Récupère les 10 dernières séances
      const sessions = await base44.entities.WorkoutSession.list('-date', 10);
      const last7Days = progressEntries?.filter(e => {
        const d = new Date(e.date);
        const limit = new Date(); limit.setDate(limit.getDate() - 7);
        return d >= limit;
      }) || [];

      // Calcul du recovery score moyen
      const avgRecovery = last7Days.reduce((a, e) => {
        const r = e.recovery_score;
        return r ? { sum: a.sum + r, count: a.count + 1 } : a;
      }, { sum: 0, count: 0 });
      const recScore = avgRecovery.count > 0 ? Math.round(avgRecovery.sum / avgRecovery.count) : null;
      setRecoveryScore(recScore);

      // Tendance du volume (comparaison 2 dernières semaines)
      const thisWeek = sessions.filter(s => {
        const d = new Date(s.date);
        const limit = new Date(); limit.setDate(limit.getDate() - 7);
        return d >= limit;
      });
      const lastWeek = sessions.filter(s => {
        const d = new Date(s.date);
        const limit1 = new Date(); limit1.setDate(limit1.getDate() - 14);
        const limit2 = new Date(); limit2.setDate(limit2.getDate() - 7);
        return d >= limit1 && d < limit2;
      });
      const thisVol = thisWeek.reduce((a, s) => a + (s.total_volume_kg || 0), 0);
      const lastVol = lastWeek.reduce((a, s) => a + (s.total_volume_kg || 0), 0);
      const t = lastVol === 0 ? 'stable' : thisVol > lastVol * 1.1 ? 'up' : thisVol < lastVol * 0.9 ? 'down' : 'stable';
      setTrend(t);

      // Difficulté perçue récente
      const recentDiff = sessions.slice(0, 5).map(s => s.perceived_difficulty);
      const allEasy = recentDiff.length >= 3 && recentDiff.slice(0, 3).every(d => d === 'facile');
      const allHard = recentDiff.length >= 3 && recentDiff.slice(0, 3).every(d => d === 'difficile');

      const prompt = `Tu es un coach IA de NATIONAL FIT. Génère 1 conseil adaptatif ultra-court (max 60 mots) en français pour ${profile.first_name}.

DONNÉES RÉELLES:
- Séances cette semaine: ${thisWeek.length} (semaine passée: ${lastWeek.length})
- Volume: ${thisVol}kg cette semaine vs ${lastVol}kg semaine passée (tendance: ${t})
- Score récupération moyen 7j: ${recScore ? recScore + '/100' : 'non mesuré'}
- 3 dernières perceptions: ${recentDiff.slice(0, 3).join(', ') || 'N/A'}
- Streak: ${profile.streak_days || 0}j
${allEasy ? '→ 3 seances consecutives FACILES → suggere d augmenter la charge/volume' : ''}
${allHard ? '→ 3 séances consécutives DIFFICILES → suggère un deload ou repos' : ''}
${recScore && recScore < 40 ? '→ Récupération insuffisante → repos prioritaire' : ''}

Format: Direct, actionnable, 1-2 phrases max. Pas de généralité.`;

      let msg;
      try {
        msg = await base44.integrations.Core.InvokeLLM({ prompt });
      } catch {
        msg = allHard
          ? "Tes 3 dernières séances étaient difficiles. Intègre un jour de décharge cette semaine pour optimiser la récupération musculaire."
          : allEasy
          ? "Tu maîtrises bien ta charge actuelle. Augmente le poids de 5% sur tes exercices principaux."
          : "Continue sur ta lancée ! Reste régulier et ajuste les charges selon tes sensations.";
      }

      setAdvice(msg);
      try {
        localStorage.setItem(CACHE_KEY, JSON.stringify({
          ts: Date.now(), profileId: profile.id,
          advice: msg, recoveryScore: recScore, trend: t
        }));
      } catch {}
    } catch {}
    setLoading(false);
  };

  if (!profile) return null;

  const trendIcon = trend === 'up'
    ? <TrendingUp className="h-4 w-4 text-green-500" />
    : trend === 'down'
    ? <TrendingDown className="h-4 w-4 text-red-400" />
    : <Minus className="h-4 w-4 text-slate-400" />;

  const trendLabel = trend === 'up' ? 'Volume en hausse 🔥' : trend === 'down' ? 'Volume en baisse ⚠️' : 'Volume stable 📊';

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
      className="rounded-2xl border border-blue-200 overflow-hidden"
      style={{ background: 'linear-gradient(135deg, #eff6ff 0%, #f5f3ff 50%, #ffffff 100%)', boxShadow: '0 4px 20px rgba(30,80,220,0.10)' }}
    >
      {/* Header */}
      <div className="px-4 pt-4 pb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="h-9 w-9 rounded-xl flex items-center justify-center shadow-sm" style={{ background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)' }}>
            <Brain className="h-4 w-4 text-white" />
          </div>
          <div>
            <p className="font-bold text-sm text-blue-900">Coach IA Adaptatif</p>
            <p className="text-xs text-blue-400">Basé sur tes vraies données</p>
          </div>
        </div>
        <button
          onClick={() => { localStorage.removeItem(CACHE_KEY); hasFetched.current = false; fetchAnalysis(); }}
          className="h-7 w-7 rounded-lg bg-blue-50 border border-blue-200 flex items-center justify-center hover:bg-blue-100 transition-colors"
        >
          <RefreshCw className="h-3.5 w-3.5 text-blue-500" />
        </button>
      </div>

      <div className="px-4 pb-4 space-y-3">
        {/* Recovery bar */}
        {recoveryScore !== null && (
          <div className="space-y-1">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Récupération 7 jours</p>
            <RecoveryBar score={recoveryScore} />
          </div>
        )}

        {/* Volume trend */}
        {trend && (
          <div className="flex items-center gap-2 bg-white/60 rounded-xl px-3 py-2 border border-blue-100">
            {trendIcon}
            <span className="text-xs font-semibold text-slate-700">{trendLabel}</span>
          </div>
        )}

        {/* AI advice */}
        <div className="bg-white/70 rounded-xl p-3 border border-blue-100">
          {loading ? (
            <div className="flex items-center gap-2 text-blue-500">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span className="text-sm italic">Analyse de tes données...</span>
            </div>
          ) : advice ? (
            <p className="text-sm text-slate-700 leading-relaxed">{advice}</p>
          ) : (
            <p className="text-sm text-slate-400 italic">Lance ta première séance pour obtenir des conseils personnalisés !</p>
          )}
        </div>
      </div>
    </motion.div>
  );
}