import React, { useState, useEffect, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, Battery, BatteryLow, Zap, ChevronDown, ChevronUp, Loader2 } from 'lucide-react';
import { getMemory } from '@/lib/aiMemory';

const CACHE_KEY = 'hulkfit_fatigue_analysis';
const CACHE_TTL = 6 * 60 * 60 * 1000; // 6h

function detectFatigueLevel(progressEntries = [], profile, mem = {}) {
  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const weekEntries = progressEntries.filter(e => new Date(e.date) >= weekAgo);
  const moods = weekEntries.map(e => e.mood).filter(Boolean);
  const energies = weekEntries.map(e => e.energy_level).filter(Boolean);
  const avgEnergy = energies.length ? energies.reduce((a, b) => a + b, 0) / energies.length : 3;
  const fatiguedMoods = moods.filter(m => m === 'fatigué').length;
  const targetDays = profile?.available_days || 3;
  const completedThisWeek = weekEntries.filter(e => e.workout_completed).length;
  const skipped = targetDays - completedThisWeek;
  const recentFeedbacks = (mem.feedbackLog || []).slice(-5);
  const hardRecent = recentFeedbacks.filter(f => f.feedback === 'hard').length;

  if (fatiguedMoods >= 3 || avgEnergy < 2 || hardRecent >= 4) return 'critical';
  if (fatiguedMoods >= 2 || avgEnergy < 2.5 || skipped >= 2 || hardRecent >= 3) return 'warning';
  if (avgEnergy < 3 || skipped >= 1 || hardRecent >= 2) return 'caution';
  return 'good';
}

const FATIGUE_CONFIG = {
  critical: {
    icon: BatteryLow, color: 'from-red-50 to-red-100', border: 'border-red-200',
    iconBg: 'bg-red-500', textColor: 'text-red-800', badge: '⚠️ REPOS URGENT',
    badgeColor: 'bg-red-100 text-red-700 border-red-200',
  },
  warning: {
    icon: AlertTriangle, color: 'from-orange-50 to-amber-50', border: 'border-orange-200',
    iconBg: 'bg-orange-500', textColor: 'text-orange-800', badge: '😓 Fatigue détectée',
    badgeColor: 'bg-orange-100 text-orange-700 border-orange-200',
  },
  caution: {
    icon: Battery, color: 'from-yellow-50 to-amber-50/50', border: 'border-yellow-200',
    iconBg: 'bg-yellow-500', textColor: 'text-yellow-800', badge: '🔋 Surveille ta récup',
    badgeColor: 'bg-yellow-100 text-yellow-700 border-yellow-200',
  },
  good: {
    icon: Zap, color: 'from-green-50 to-emerald-50', border: 'border-green-200',
    iconBg: 'bg-green-500', textColor: 'text-green-800', badge: '💚 En pleine forme',
    badgeColor: 'bg-green-100 text-green-700 border-green-200',
  },
};

export default function FatigueAlert({ profile, progressEntries = [] }) {
  const [advice, setAdvice] = useState('');
  const [loading, setLoading] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const hasFetched = useRef(false);
  const mem = getMemory();
  const fatigueLevel = detectFatigueLevel(progressEntries, profile, mem);
  const cfg = FATIGUE_CONFIG[fatigueLevel];
  const Icon = cfg.icon;

  useEffect(() => {
    if (!profile || hasFetched.current) return;
    hasFetched.current = true;

    try {
      const cached = JSON.parse(localStorage.getItem(CACHE_KEY) || 'null');
      if (cached && Date.now() - cached.ts < CACHE_TTL && cached.profileId === profile.id && cached.level === fatigueLevel) {
        setAdvice(cached.text);
        return;
      }
    } catch {}

    const generate = async () => {
      setLoading(true);
      const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      const weekEntries = progressEntries.filter(e => new Date(e.date) >= weekAgo);
      const moods = weekEntries.map(e => e.mood).filter(Boolean).join(', ');
      const energies = weekEntries.map(e => e.energy_level).filter(Boolean);
      const avgEnergy = energies.length ? (energies.reduce((a, b) => a + b, 0) / energies.length).toFixed(1) : 'N/A';

      const prompt = `Tu es Professeur Hulk coach IA. Analyse fatigue de ${profile.first_name} (objectif: ${profile.goal}).
Niveau fatigue détecté: ${fatigueLevel}.
Humeurs semaine: ${moods || 'non renseigné'}. Énergie moy: ${avgEnergy}/5.
Taux fatigue historique: ${mem.fatigueRate || 0}%.
Séances dures récentes: ${(mem.feedbackLog || []).slice(-5).filter(f => f.feedback === 'hard').length}/5.

Donne UN conseil précis ultra-court (max 2 phrases) adapté au niveau de fatigue, style MCU direct. ${fatigueLevel === 'critical' || fatigueLevel === 'warning' ? 'Recommande repos/allègement.' : 'Encourage à maintenir.'}`;

      try {
        const res = await base44.integrations.Core.InvokeLLM({ prompt });
        setAdvice(res);
        localStorage.setItem(CACHE_KEY, JSON.stringify({ ts: Date.now(), text: res, profileId: profile.id, level: fatigueLevel }));
      } catch {
        setAdvice(fatigueLevel === 'good' ? 'Continue sur ta lancée ! Ta récupération est optimale. 💚' : 'Écoute ton corps. La récupération fait partie du programme.');
      }
      setLoading(false);
    };
    generate();
  }, [profile?.id]);

  if (!profile) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.15 }}
      className={`rounded-2xl border ${cfg.border} bg-gradient-to-br ${cfg.color} overflow-hidden`}
    >
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full p-4 flex items-center justify-between"
      >
        <div className="flex items-center gap-3">
          <div className={`h-9 w-9 rounded-xl ${cfg.iconBg} flex items-center justify-center shadow-sm shrink-0`}>
            <Icon className="h-4 w-4 text-white" />
          </div>
          <div className="text-left">
            <p className={`font-semibold text-sm ${cfg.textColor}`}>Analyse fatigue IA</p>
            <span className={`inline-block mt-0.5 text-xs font-medium border rounded-full px-2 py-0.5 ${cfg.badgeColor}`}>
              {cfg.badge}
            </span>
          </div>
        </div>
        {expanded ? <ChevronUp className={`h-4 w-4 ${cfg.textColor} opacity-60`} /> : <ChevronDown className={`h-4 w-4 ${cfg.textColor} opacity-60`} />}
      </button>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4">
              {loading ? (
                <div className="flex items-center gap-2">
                  <Loader2 className={`h-4 w-4 animate-spin ${cfg.textColor} opacity-60`} />
                  <span className={`text-sm ${cfg.textColor} opacity-60`}>Analyse en cours...</span>
                </div>
              ) : (
                <p className={`text-sm ${cfg.textColor} leading-relaxed`}>{advice}</p>
              )}
              <p className={`text-xs mt-2 opacity-50 ${cfg.textColor}`}>Mis à jour toutes les 6h · Basé sur tes données réelles</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}