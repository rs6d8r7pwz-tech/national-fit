import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { base44 } from '@/api/base44Client';
import { Activity, Dumbbell, Brain, Target, Flame } from 'lucide-react';

const SCORE_CONFIG = [
  { key: 'strength',     label: 'Force',        icon: Dumbbell, color: '#3b82f6', desc: 'Basé sur tes PRs et volume' },
  { key: 'consistency',  label: 'Régularité',   icon: Target,   color: '#22c55e', desc: 'Streak & fréquence séances' },
  { key: 'recovery',     label: 'Récupération', icon: Activity, color: '#f59e0b', desc: 'Sommeil, stress, hydratation' },
  { key: 'cardio',       label: 'Cardio',       icon: Flame,    color: '#ef4444', desc: 'Durée & intensité séances' },
  { key: 'nutrition',    label: 'Nutrition',    icon: Brain,    color: '#8b5cf6', desc: 'Adhérence plan alimentaire' },
];

function ScoreArc({ score, color }) {
  const r = 28;
  const circ = 2 * Math.PI * r;
  const pct = Math.max(0, Math.min(score, 100)) / 100;
  return (
    <svg width="70" height="70" viewBox="0 0 70 70">
      <circle cx="35" cy="35" r={r} fill="none" stroke="#f1f5f9" strokeWidth="6" />
      <motion.circle
        cx="35" cy="35" r={r}
        fill="none" stroke={color} strokeWidth="6"
        strokeLinecap="round"
        strokeDasharray={circ}
        initial={{ strokeDashoffset: circ }}
        animate={{ strokeDashoffset: circ * (1 - pct) }}
        transition={{ duration: 1, ease: 'easeOut' }}
        transform="rotate(-90 35 35)"
      />
      <text x="35" y="39" textAnchor="middle" fontSize="13" fontWeight="bold" fill={color}>{score}</text>
    </svg>
  );
}

export default function FitnessScores({ profile }) {
  const [scores, setScores] = useState(null);
  const [fitnessAge, setFitnessAge] = useState(null);

  useEffect(() => {
    if (!profile) return;
    (async () => {
      const [sessions, entries] = await Promise.all([
        base44.entities.WorkoutSession.list('-date', 30),
        base44.entities.ProgressEntry.list('-date', 14),
      ]);

      // Strength score — basé sur volume total et PRs
      const totalVol = sessions.reduce((a, s) => a + (s.total_volume_kg || 0), 0);
      const totalPRs = sessions.reduce((a, s) => a + (s.new_prs || 0), 0);
      const strengthScore = Math.min(100, Math.round((totalVol / 500) * 40 + totalPRs * 5 + 20));

      // Consistency — streak + séances/semaine
      const streak = profile.streak_days || 0;
      const recentSessions = sessions.filter(s => {
        const d = new Date(s.date);
        const limit = new Date(); limit.setDate(limit.getDate() - 30);
        return d >= limit;
      }).length;
      const consistencyScore = Math.min(100, Math.round(streak * 2 + recentSessions * 3 + 5));

      // Recovery — sleep, stress, hydratation
      const recentEntries = entries.slice(0, 7);
      const avgRecovery = recentEntries.reduce((a, e) => {
        const r = e.recovery_score;
        return r ? { sum: a.sum + r, n: a.n + 1 } : a;
      }, { sum: 0, n: 0 });
      const recoveryScore = avgRecovery.n > 0 ? Math.round(avgRecovery.sum / avgRecovery.n) : 50;

      // Cardio — durée moyenne séances
      const avgDuration = sessions.length > 0
        ? sessions.reduce((a, s) => a + (s.duration_min || 45), 0) / sessions.length
        : 0;
      const cardioScore = Math.min(100, Math.round(avgDuration * 1.2 + recentSessions * 2));

      // Nutrition — check si plan alimentaire actif
      const plans = await base44.entities.MealPlan.filter({ is_active: true });
      const nutritionScore = plans.length > 0
        ? Math.min(100, 60 + recentEntries.filter(e => e.water_intake_l >= 1.5).length * 5)
        : 30;

      const computed = {
        strength: Math.max(5, strengthScore),
        consistency: Math.max(5, consistencyScore),
        recovery: Math.max(5, recoveryScore),
        cardio: Math.max(5, cardioScore),
        nutrition: Math.max(5, nutritionScore),
      };
      setScores(computed);

      // Fitness age
      const avg = Math.round(Object.values(computed).reduce((a, b) => a + b, 0) / 5);
      const realAge = profile.age || 25;
      const delta = Math.round((avg - 50) / 10);
      setFitnessAge(Math.max(18, realAge - delta));
    })();
  }, [profile?.id]);

  if (!scores) return null;

  return (
    <div className="rounded-2xl border border-indigo-100 bg-white/90 shadow-sm overflow-hidden">
      <div className="px-4 pt-4 pb-2 flex items-center justify-between">
        <div>
          <p className="font-bold text-sm text-indigo-900">Scores Fitness</p>
          <p className="text-xs text-slate-400">Basés sur tes vraies données</p>
        </div>
        {fitnessAge && profile?.age && (
          <div className="text-right bg-indigo-50 border border-indigo-100 rounded-xl px-3 py-1.5">
            <p className="text-xs text-indigo-400">Âge fitness</p>
            <p className="text-lg font-bold text-indigo-700">{fitnessAge} <span className="text-xs font-normal">ans</span></p>
          </div>
        )}
      </div>
      <div className="px-3 pb-4 grid grid-cols-5 gap-1">
        {SCORE_CONFIG.map(({ key, label, icon: Icon, color }) => (
          <div key={key} className="flex flex-col items-center gap-1">
            <ScoreArc score={scores[key]} color={color} />
            <p className="text-[9px] font-semibold text-slate-500 text-center leading-tight">{label}</p>
          </div>
        ))}
      </div>
    </div>
  );
}