import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Flame, Zap } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import XPRing, { getLevel, getNextLevel } from './XPRing';
import StreakMilestone from './StreakMilestone';
import HulkAvatar from './HulkAvatar';

const GOAL_LABELS = {
  seche: '🔥 Sèche', prise_masse: '💪 Prise de masse',
  maintien: '⚖️ Maintien', force: '🏋️ Force', cardio: '🏃 Cardio',
};

const HERO_CACHE_KEY = 'hulkfit_hero_msg';
const HERO_CACHE_TTL = 6 * 60 * 60 * 1000; // 6h

const FALLBACK_QUOTES = [
  "La force naît de la discipline. Aucune excuse.",
  "Chaque rep te rapproche de World Breaker.",
  "Hulk ne s'arrête pas. Toi non plus.",
  "Le progrès est silencieux. La régression, elle, est bruyante.",
  "Douleur d'aujourd'hui = force de demain.",
];

export default function HeroBanner({ profile }) {
  const [aiMsg, setAiMsg] = useState('');
  const [loadingMsg, setLoadingMsg] = useState(false);

  const hour = new Date().getHours();
  const greeting = hour < 6 ? 'DEBOUT AGENT' : hour < 12 ? 'BONNE SÉANCE' : hour < 18 ? 'EN ROUTE' : 'ENCORE UN EFFORT';
  const xp = profile?.xp_points || 0;
  const streak = profile?.streak_days || 0;
  const currentLevel = getLevel(xp);
  const nextLevel = getNextLevel(xp);
  const xpToNext = nextLevel ? nextLevel.min - xp : 0;
  const xpPct = nextLevel ? Math.round(((xp - (getLevel(xp - 1)?.min || 0)) / (nextLevel.min - (getLevel(xp - 1)?.min || 0))) * 100) : 100;

  useEffect(() => {
    if (!profile) return;

    // Check cache first
    try {
      const cached = JSON.parse(localStorage.getItem(HERO_CACHE_KEY) || 'null');
      if (cached && Date.now() - cached.ts < HERO_CACHE_TTL && cached.profileId === profile.id) {
        setAiMsg(cached.text);
        return;
      }
    } catch {}

    // Use a random fallback immediately, then try AI
    setAiMsg(FALLBACK_QUOTES[Math.floor(Math.random() * FALLBACK_QUOTES.length)]);

    const fetchMsg = async () => {
      setLoadingMsg(true);
      try {
        const prompt = `Tu es le Professeur Hulk dans l'app HULK FIT. Génère UNE phrase de motivation ultra-courte (max 12 mots) pour ${profile.first_name} qui a ${streak} jours de streak et vise ${profile.goal || 'la progression'}. Style MCU, percutant, en français.`;
        const msg = await base44.integrations.Core.InvokeLLM({ prompt });
        setAiMsg(msg);
        try {
          localStorage.setItem(HERO_CACHE_KEY, JSON.stringify({ ts: Date.now(), text: msg, profileId: profile.id }));
        } catch {}
      } catch {
        // Keep the fallback quote already set
      }
      setLoadingMsg(false);
    };
    fetchMsg();
  }, [profile?.id]);

  return (
    <>
    <StreakMilestone streak={streak} />
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative rounded-3xl overflow-hidden"
      style={{ background: 'linear-gradient(135deg, #16a34a 0%, #15803d 40%, #166534 100%)' }}
    >
      {/* Decorative blobs */}
      <div className="absolute -top-8 -right-8 h-40 w-40 rounded-full bg-white/5 blur-2xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 h-28 w-28 rounded-full bg-white/5 blur-xl pointer-events-none" />

      <div className="relative p-6 md:p-8">
        {/* Top row */}
        <div className="flex items-start justify-between mb-4">
          <div>
            <p className="text-green-200 text-xs font-heading tracking-[0.25em] uppercase">{greeting}</p>
            <h1 className="font-heading text-4xl md:text-5xl text-white tracking-widest mt-0.5 drop-shadow">
              {profile?.first_name?.toUpperCase()} !
            </h1>
            {profile?.goal && (
              <span className="inline-block mt-2 bg-white/20 backdrop-blur text-white text-xs font-heading tracking-wider px-3 py-1 rounded-full">
                {GOAL_LABELS[profile.goal] || profile.goal}
              </span>
            )}
          </div>
          {/* Streak */}
          <div className="flex flex-col items-center bg-white/15 backdrop-blur rounded-2xl px-4 py-3 min-w-[70px]">
            <Flame className="h-5 w-5 text-orange-300 flame-pulse" />
            <span className="font-heading text-2xl text-white leading-none">{streak}</span>
            <span className="text-green-200 text-xs">streak</span>
          </div>
        </div>

        {/* AI Message */}
        <div className="bg-white/10 backdrop-blur rounded-2xl px-4 py-3 mb-4">
          {loadingMsg ? (
            <div className="flex gap-1 items-center">
              <span className="h-1.5 w-1.5 rounded-full bg-white animate-bounce" />
              <span className="h-1.5 w-1.5 rounded-full bg-white animate-bounce [animation-delay:150ms]" />
              <span className="h-1.5 w-1.5 rounded-full bg-white animate-bounce [animation-delay:300ms]" />
            </div>
          ) : (
            <p className="text-white text-sm italic">"{aiMsg || 'La force naît de la discipline.'}"</p>
          )}
          <p className="text-green-300 text-xs mt-1">— Professeur Hulk 🤖</p>
        </div>

        {/* XP Ring + Level + Avatar */}
        <div className="flex items-center gap-4">
          <XPRing xp={xp} size={90} />
          <div className="opacity-90">
            <HulkAvatar xp={xp} size={72} />
          </div>
          <div className="flex-1 ml-2">
            <div className="flex items-center gap-1.5 mb-1">
              <span className="text-base">{currentLevel.emoji}</span>
              <span className="text-white font-heading text-sm tracking-wide">{currentLevel.label}</span>
            </div>
            <div className="flex items-center gap-1 text-green-200 text-xs mb-2">
              <Zap className="h-3 w-3" />
              <span>{xp} XP</span>
              {nextLevel && <span>· {xpToNext} avant {nextLevel.label}</span>}
            </div>
            {nextLevel && (
              <div className="h-2 bg-white/20 rounded-full overflow-hidden">
                <motion.div
                  className="h-full rounded-full bg-white"
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.min(xpPct, 100)}%` }}
                  transition={{ duration: 1, ease: 'easeOut', delay: 0.5 }}
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </motion.div>
    </>
  );
}