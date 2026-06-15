import React, { useState, useEffect, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { motion } from 'framer-motion';
import { Brain, Loader2 } from 'lucide-react';

const CACHE_KEY = 'nationalfit_weekly_summary';
const CACHE_TTL_MS = 24 * 60 * 60 * 1000;

export default function WeeklyAISummary({ profile, progressEntries, programs }) {
  const [summary, setSummary] = useState('');
  const [loading, setLoading] = useState(false);
  const hasFetched = useRef(false);

  useEffect(() => {
    if (!profile || hasFetched.current) return;
    hasFetched.current = true;

    try {
      const cached = JSON.parse(localStorage.getItem(CACHE_KEY) || 'null');
      if (cached && Date.now() - cached.ts < CACHE_TTL_MS && cached.profileId === profile.id) {
        setSummary(cached.text);
        return;
      }
    } catch {}

    const generate = async () => {
      setLoading(true);
      const weekAgo = new Date(); weekAgo.setDate(weekAgo.getDate() - 7);
      const twoWeekAgo = new Date(); twoWeekAgo.setDate(twoWeekAgo.getDate() - 14);
      const weekEntries = (progressEntries || []).filter(e => new Date(e.date) >= weekAgo);
      const prevEntries = (progressEntries || []).filter(e => new Date(e.date) >= twoWeekAgo && new Date(e.date) < weekAgo);
      const weekCompleted = weekEntries.filter(e => e.workout_completed).length;
      const prevCompleted = prevEntries.filter(e => e.workout_completed).length;
      const avgEnergy = weekEntries.length ? (weekEntries.reduce((a, e) => a + (e.energy_level || 3), 0) / weekEntries.length).toFixed(1) : null;
      const moods = weekEntries.map(e => e.mood).filter(Boolean);
      const fatigued = moods.filter(m => m === 'fatigué').length;
      const skippedDays = (profile?.available_days || 3) - weekCompleted;

      const prompt = `Tu es un coach sportif professionnel de l'application NATIONAL FIT. Génère un bilan hebdomadaire court (max 90 mots) pour ${profile.first_name}, en français, ton coach professionnel et motivant.

DONNÉES SEMAINE:
- Séances: ${weekCompleted}/${profile?.available_days || 3} (semaine précédente: ${prevCompleted})
- Énergie moyenne: ${avgEnergy || 'N/A'}/5
- Humeurs: ${moods.join(', ') || 'non renseigné'} (${fatigued} fois fatigué)
- Séances sautées: ${skippedDays}
- Streak: ${profile.streak_days || 0} jours
- XP: ${profile.xp_points || 0}

${fatigued >= 2 || skippedDays >= 2 ? 'DÉTECTE la fatigue et recommande repos/allègement.' : 'Motive fortement.'}
Donne 1 conseil précis et personnalisé pour la prochaine semaine. Style professionnel.`;

      let msg;
      try {
        msg = await base44.integrations.Core.InvokeLLM({ prompt });
      } catch {
        msg = "Continue sur ta lancée cette semaine ! Chaque séance compte. Reste régulier et progresse pas à pas. 💪";
      }
      setSummary(msg);
      try {
        localStorage.setItem(CACHE_KEY, JSON.stringify({ ts: Date.now(), text: msg, profileId: profile.id }));
      } catch {}
      setLoading(false);
    };

    generate();
  }, [profile?.id]);

  if (!profile) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
      className="rounded-2xl border border-blue-200 p-4"
      style={{ background: 'linear-gradient(135deg, #eff6ff, #ffffff)', boxShadow: '0 2px 12px rgba(30,80,220,0.08)' }}
    >
      <div className="flex items-center gap-2 mb-3">
        <div className="h-8 w-8 rounded-xl bg-blue-100 flex items-center justify-center">
          <Brain className="h-4 w-4 text-blue-600" />
        </div>
        <div>
          <p className="font-semibold text-sm text-blue-800">Bilan IA de la semaine</p>
          <p className="text-xs text-blue-500">Analyse personnalisée · Coach National Fit</p>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center gap-2 text-blue-500">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span className="text-sm italic">Analyse en cours...</span>
        </div>
      ) : (
        <p className="text-sm text-slate-700 leading-relaxed">{summary}</p>
      )}

      <p className="text-xs text-blue-400 mt-2 italic">Mis à jour toutes les 24h</p>
    </motion.div>
  );
}