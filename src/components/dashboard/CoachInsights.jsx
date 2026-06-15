import React, { useState, useEffect, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { motion, AnimatePresence } from 'framer-motion';
import { Brain, TrendingUp, TrendingDown, AlertTriangle, CheckCircle, ChevronRight, Loader2, RefreshCw, Zap, Target } from 'lucide-react';
import { Link } from 'react-router-dom';
import { invokeAIWithLimit } from '@/lib/aiRateLimit';
import { useTheme } from '@/lib/ThemeContext';

const CACHE_KEY = 'nfit_coach_insights_v3';
const CACHE_TTL = 4 * 60 * 60 * 1000; // 4h

function InsightCard({ icon: Icon, color, title, value, sub, action, actionLink }) {
  const content = (
    <motion.div
      whileTap={{ scale: 0.97 }}
      className="flex items-center gap-3 bg-white/70 rounded-2xl p-3.5 border transition-all"
      style={{ borderColor: `${color}30` }}
    >
      <div className="h-10 w-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: `${color}15` }}>
        <Icon className="h-5 w-5" style={{ color }} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">{title}</p>
        <p className="text-sm font-bold text-slate-800 mt-0.5">{value}</p>
        {sub && <p className="text-xs text-slate-400 mt-0.5">{sub}</p>}
      </div>
      {action && (
        <div className="flex items-center gap-1 text-xs font-semibold shrink-0" style={{ color }}>
          {action} <ChevronRight className="h-3 w-3" />
        </div>
      )}
    </motion.div>
  );
  return actionLink ? <Link to={actionLink}>{content}</Link> : <div>{content}</div>;
}

export default function CoachInsights({ profile, progressEntries }) {
  const [insight, setInsight] = useState(null);
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(false);
  const hasFetched = useRef(false);
  const { language } = useTheme();
  const isFR = language === 'fr';

  useEffect(() => {
    if (!profile || hasFetched.current) return;
    hasFetched.current = true;
    try {
      const cached = JSON.parse(localStorage.getItem(CACHE_KEY) || 'null');
      if (cached && Date.now() - cached.ts < CACHE_TTL && cached.profileId === profile.id) {
        setInsight(cached.insight);
        setMetrics(cached.metrics);
        return;
      }
    } catch {}
    fetchInsights();
  }, [profile?.id]);

  const fetchInsights = async () => {
    setLoading(true);
    try {
      const [sessions, goals] = await Promise.all([
        base44.entities.WorkoutSession.list('-date', 14),
        base44.entities.UserGoal.list('-created_at', 5),
      ]);

      const last7 = progressEntries?.filter(e => {
        const d = new Date(e.date);
        const limit = new Date(); limit.setDate(limit.getDate() - 7);
        return d >= limit;
      }) || [];

      const thisWeek = sessions.filter(s => {
        const d = new Date(s.date);
        const limit = new Date(); limit.setDate(limit.getDate() - 7);
        return d >= limit;
      });
      const prevWeek = sessions.filter(s => {
        const d = new Date(s.date);
        const l1 = new Date(); l1.setDate(l1.getDate() - 14);
        const l2 = new Date(); l2.setDate(l2.getDate() - 7);
        return d >= l1 && d < l2;
      });

      const thisVol = thisWeek.reduce((a, s) => a + (s.total_volume_kg || 0), 0);
      const prevVol = prevWeek.reduce((a, s) => a + (s.total_volume_kg || 0), 0);
      const volTrend = prevVol === 0 ? 0 : Math.round(((thisVol - prevVol) / prevVol) * 100);

      const avgRecovery = last7.filter(e => e.recovery_score).reduce((a, e, _, arr) => a + e.recovery_score / arr.length, 0);
      const avgEnergy = last7.filter(e => e.energy_level).reduce((a, e, _, arr) => a + e.energy_level / arr.length, 0);

      const recentDiffs = sessions.slice(0, 5).map(s => s.perceived_difficulty);
      const allEasy = recentDiffs.length >= 3 && recentDiffs.slice(0, 3).every(d => d === 'facile');
      const allHard = recentDiffs.length >= 3 && recentDiffs.slice(0, 3).every(d => d === 'difficile');
      const totalPRs = sessions.slice(0, 7).reduce((a, s) => a + (s.new_prs || 0), 0);

      const activeGoal = goals.find(g => !g.completed);

      const computedMetrics = {
        sessionsThisWeek: thisWeek.length,
        volTrend,
        avgRecovery: Math.round(avgRecovery) || null,
        avgEnergy: Math.round(avgEnergy * 10) / 10 || null,
        allEasy,
        allHard,
        totalPRs,
        activeGoal,
      };
      setMetrics(computedMetrics);

      const prompt = `You are the AI coach for NATIONAL FIT. Generate 1 ultra-personalized coach message (max 70 words) based ONLY on these real data points for ${profile.first_name}.

DATA:
- Goal: ${profile.goal}, Level: ${profile.fitness_level}
- Sessions this week: ${thisWeek.length} (last week: ${prevWeek.length})
- Volume: ${Math.round(thisVol)}kg this week (${volTrend > 0 ? '+' : ''}${volTrend}% vs last week)
- Avg recovery 7d: ${Math.round(avgRecovery) || 'N/A'}/100
- Avg energy 7d: ${Math.round(avgEnergy * 10) / 10 || 'N/A'}/5
- Recent difficulty: ${recentDiffs.slice(0, 3).join(', ') || 'N/A'}
- PRs this week: ${totalPRs}
- Streak: ${profile.streak_days || 0} days
${activeGoal ? `- Active goal: ${activeGoal.label || activeGoal.type} → ${activeGoal.current_value || '?'}/${activeGoal.target_value} ${activeGoal.unit || ''}` : ''}
${allEasy ? '⚠️ 3 consecutive easy sessions → suggest increasing loads' : ''}
${allHard ? '⚠️ 3 consecutive hard sessions → suggest recovery or deload' : ''}
${avgRecovery && avgRecovery < 40 ? '🚨 Critical recovery → absolute priority on rest' : ''}

Message must be: direct, data-driven when possible, actionable. ONE observation + ONE concrete action. Reply in ${isFR ? 'French' : 'English'}.`;

      let msg;
      try {
        msg = await invokeAIWithLimit(base44, { prompt });
      } catch {
        msg = allHard
          ? (isFR ? `${profile.first_name}, tes 3 dernières séances étaient difficiles. Intègre 1-2 jours de récupération active cette semaine.` : `${profile.first_name}, your last 3 sessions were hard. Add 1-2 active recovery days this week -- that's where muscles grow.`)
          : allEasy
          ? (isFR ? `Tu gères facilement ta charge actuelle. Augmente le poids de 5-10% sur tes exercices principaux la prochaine séance.` : `You're handling your current load easily. Increase weight by 5-10% on your main exercises next session.`)
          : thisWeek.length === 0
          ? (isFR ? `Aucune séance cette semaine encore. 30 minutes aujourd'hui suffisent pour relancer la machine.` : `No sessions yet this week. 30 minutes today is enough to get back on track.`)
          : (isFR ? `${thisWeek.length} séance${thisWeek.length > 1 ? 's' : ''} cette semaine${totalPRs > 0 ? ` avec ${totalPRs} PR` : ''} -- continue !` : `${thisWeek.length} session${thisWeek.length !== 1 ? 's' : ''} this week${totalPRs > 0 ? ` with ${totalPRs} PR${totalPRs > 1 ? 's' : ''}` : ''} -- keep it up!`);
      }

      setInsight(msg);
      try {
        localStorage.setItem(CACHE_KEY, JSON.stringify({
          ts: Date.now(), profileId: profile.id,
          insight: msg, metrics: computedMetrics
        }));
      } catch {}
    } catch (e) {}
    setLoading(false);
  };

  const refresh = () => {
    localStorage.removeItem(CACHE_KEY);
    hasFetched.current = false;
    setInsight(null);
    setMetrics(null);
    fetchInsights();
  };

  if (!profile) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl overflow-hidden"
      style={{ background: 'linear-gradient(160deg, rgba(20,50,180,0.08) 0%, rgba(255,255,255,0.90) 40%, rgba(220,38,38,0.05) 100%)', border: '1px solid rgba(30,80,220,0.18)', boxShadow: '0 6px 28px rgba(20,50,180,0.14)' }}
    >
      {/* Header */}
      <div className="px-4 pt-4 pb-2 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="h-9 w-9 rounded-xl flex items-center justify-center shadow-sm" style={{ background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)' }}>
            <Brain className="h-4 w-4 text-white" />
          </div>
          <div>
            <p className="font-bold text-sm text-blue-900">{isFR ? 'Analyse du Coach' : 'Coach Analysis'}</p>
            <p className="text-[11px] text-blue-400">{isFR ? 'Basée sur tes vraies données' : 'Based on your real data'}</p>
          </div>
        </div>
        <button onClick={refresh} className="h-7 w-7 rounded-lg bg-blue-50 border border-blue-200 flex items-center justify-center hover:bg-blue-100 transition-colors">
          <RefreshCw className="h-3.5 w-3.5 text-blue-500" />
        </button>
      </div>

      {/* Insight message */}
      <div className="mx-4 mb-3 rounded-xl p-3.5" style={{ background: 'rgba(255,255,255,0.80)', border: '1px solid rgba(30,80,220,0.12)' }}>
        {loading ? (
          <div className="flex items-center gap-2 text-blue-500">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span className="text-sm italic text-blue-600">{isFR ? 'Analyse de tes données en cours...' : 'Analyzing your data...'}</span>
          </div>
        ) : insight ? (
          <p className="text-sm text-slate-700 leading-relaxed">{insight}</p>
        ) : (
          <p className="text-sm text-slate-400 italic">{isFR ? "Lance ta première séance pour activer l'analyse IA." : 'Start your first session to activate AI analysis.'}</p>
        )}
      </div>

      {/* Metrics grid */}
      {metrics && (
        <div className="px-4 pb-4 grid grid-cols-2 gap-2">
          <InsightCard
            icon={Zap}
            color="#3b82f6"
            title={isFR ? 'Séances / sem.' : 'Sessions / wk'}
            value={`${metrics.sessionsThisWeek} ${isFR ? `séance${metrics.sessionsThisWeek !== 1 ? 's' : ''}` : `session${metrics.sessionsThisWeek !== 1 ? 's' : ''}`}`}
            sub={metrics.sessionsThisWeek === 0 ? (isFR ? 'Aucune encore' : 'None yet') : metrics.sessionsThisWeek >= 3 ? (isFR ? 'Excellent rythme 🔥' : 'Great pace 🔥') : (isFR ? 'Continue !' : 'Keep going!')}
          />
          <InsightCard
            icon={metrics.volTrend >= 0 ? TrendingUp : TrendingDown}
            color={metrics.volTrend >= 5 ? '#22c55e' : metrics.volTrend <= -10 ? '#ef4444' : '#f59e0b'}
            title="Volume"
            value={metrics.volTrend !== 0 ? `${metrics.volTrend > 0 ? '+' : ''}${metrics.volTrend}%` : 'Stable'}
            sub={isFR ? 'vs semaine passée' : 'vs last week'}
          />
          {metrics.avgRecovery !== null && (
            <InsightCard
              icon={metrics.avgRecovery >= 60 ? CheckCircle : AlertTriangle}
              color={metrics.avgRecovery >= 60 ? '#22c55e' : metrics.avgRecovery >= 35 ? '#f59e0b' : '#ef4444'}
              title={isFR ? 'Récupération' : 'Recovery'}
              value={`${metrics.avgRecovery}/100`}
              sub={metrics.avgRecovery >= 60 ? (isFR ? 'Bonne récupération' : 'Good recovery') : metrics.avgRecovery >= 35 ? (isFR ? 'À surveiller' : 'Watch out') : (isFR ? 'Repos prioritaire !' : 'Rest is priority!')}
            />
          )}
          {metrics.activeGoal && (
            <InsightCard
              icon={Target}
              color="#8b5cf6"
              title={isFR ? 'Objectif actif' : 'Active goal'}
              value={`${metrics.activeGoal.current_value || 0}/${metrics.activeGoal.target_value} ${metrics.activeGoal.unit || ''}`}
              sub={metrics.activeGoal.label || metrics.activeGoal.type}
              action={isFR ? 'Voir' : 'View'}
              actionLink="/profil"
            />
          )}
        </div>
      )}
    </motion.div>
  );
}