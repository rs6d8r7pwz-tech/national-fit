import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Flame, Zap, Target, ChevronRight, Trophy } from 'lucide-react';

import { Link } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { getLevel, getNextLevel, getLevelProgress } from '@/lib/levels';
import LevelRewardsModal from '@/components/dashboard/LevelRewardsModal';
import { useTheme } from '@/lib/ThemeContext';

const GOAL_LABELS_FR = {
  seche: '🔥 Sèche', prise_masse: '💪 Masse', maintien: '⚖️ Maintien', force: '🏋️ Force', cardio: '🏃 Cardio',
};
const GOAL_LABELS_EN = {
  seche: '🔥 Cut', prise_masse: '💪 Bulk', maintien: '⚖️ Maintenance', force: '🏋️ Strength', cardio: '🏃 Cardio',
};

const HERO_CACHE_KEY = 'nationalfit_hero_msg';
const HERO_TTL = 6 * 60 * 60 * 1000;
const FALLBACKS_FR = [
  "La force naît de la discipline. Aucune excuse.",
  "Chaque rep te rapproche de ton objectif.",
  "Le progrès est silencieux. La régression, elle, crie.",
  "Pas de raccourci. Juste de la sueur.",
];
const FALLBACKS_EN = [
  "Strength comes from discipline. No excuses.",
  "Every rep brings you closer to your goal.",
  "Progress is silent. Regression is loud.",
  "No shortcuts. Just sweat.",
];

const DAYS_FR = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
const DAYS_EN = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

export default function DarkHeroBanner({ profile, nextSession, progressEntries = [] }) {
  const [aiMsg, setAiMsg] = useState('');
  const [showLevels, setShowLevels] = useState(false);
  const { language } = useTheme();
  const isFR = language === 'fr';

  const xp = profile?.xp_points || 0;
  const streak = profile?.streak_days || 0;
  const level = getLevel(xp);
  const nextLevel = getNextLevel(xp);
  const xpPct = getLevelProgress(xp);

  // Jours de la semaine actuelle avec séance complétée
  const today = new Date();
  const startOfWeek = new Date(today);
  startOfWeek.setDate(today.getDate() - today.getDay()); // dimanche
  const weekDays = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(startOfWeek);
    d.setDate(startOfWeek.getDate() + i);
    return d.toISOString().split('T')[0];
  });
  const workedDays = new Set(
    progressEntries
      .filter(e => e.workout_completed && weekDays.includes(e.date?.split('T')[0]))
      .map(e => new Date(e.date).getDay())
  );

  const GOAL_LABELS = isFR ? GOAL_LABELS_FR : GOAL_LABELS_EN;
  const FALLBACKS = isFR ? FALLBACKS_FR : FALLBACKS_EN;

  const hour = new Date().getHours();
  const greeting = isFR
    ? (hour < 6 ? '🌙 Bonne nuit' : hour < 12 ? '⚡ Bonne séance' : hour < 18 ? '🔥 En route' : '💪 Encore un effort')
    : (hour < 6 ? '🌙 Good night' : hour < 12 ? '⚡ Great session' : hour < 18 ? '🔥 Let\'s go' : '💪 One more effort');

  useEffect(() => {
    if (!profile) return;
    try {
      const cached = JSON.parse(localStorage.getItem(HERO_CACHE_KEY) || 'null');
      if (cached && Date.now() - cached.ts < HERO_TTL && cached.id === profile.id) {
        setAiMsg(cached.text); return;
      }
    } catch {}
    setAiMsg(FALLBACKS[Math.floor(Math.random() * FALLBACKS.length)]);
    // Récupère une séance récente pour personnaliser
    base44.entities.WorkoutSession.list('-date', 3).then(sessions => {
      const lastSession = sessions[0];
      const sessionsThisWeek = sessions.filter(s => {
        const d = new Date(s.date);
        const limit = new Date(); limit.setDate(limit.getDate() - 7);
        return d >= limit;
      }).length;
      return base44.integrations.Core.InvokeLLM({
        prompt: `You are a pro fitness coach for NATIONAL FIT. Generate 1 ULTRA-short personalized sentence (max 12 words) for ${profile.first_name}.
        Data: streak=${streak} days, goal=${profile.goal}, sessions this week=${sessionsThisWeek}${lastSession ? `, last session="${lastSession.session_name || lastSession.perceived_difficulty}"` : ''}.
        Style: direct, punchy, data-driven if possible. ${isFR ? 'Reply in French.' : 'Reply in English.'} No generic phrases.`
      });
    }).then(msg => {
      setAiMsg(msg);
      try { localStorage.setItem(HERO_CACHE_KEY, JSON.stringify({ ts: Date.now(), text: msg, id: profile.id })); } catch {}
    }).catch(() => {});
  }, [profile?.id]);

  return (
    <>
      {showLevels && <LevelRewardsModal xp={xp} onClose={() => setShowLevels(false)} />}

      <div className="rounded-2xl overflow-hidden relative"
        style={{
          background: 'linear-gradient(155deg, #1a3fae 0%, #2255cc 25%, #3a70e0 45%, #eef5ff 60%, #fff2f2 80%, #ef4444 100%)',
          boxShadow: '0 12px 40px rgba(20,50,180,0.35), 0 4px 12px rgba(220,38,38,0.18)',
          border: '1px solid rgba(30,80,220,0.30)',
        }}>

        {/* Decorative blobs — no text overlap */}
        <div className="absolute top-0 right-0 w-32 h-32 rounded-full opacity-20 pointer-events-none"
          style={{ background: 'radial-gradient(circle, hsl(220,90%,60%) 0%, transparent 70%)', transform: 'translate(30%, -30%)' }} />
        <div className="absolute bottom-0 left-0 w-24 h-24 rounded-full opacity-15 pointer-events-none"
          style={{ background: 'radial-gradient(circle, hsl(0,80%,60%) 0%, transparent 70%)', transform: 'translate(-30%, 30%)' }} />

        {/* France flag accent strip */}
        <div className="absolute top-0 left-0 right-0 h-[3px] flex">
          <div className="flex-1" style={{ background: 'hsl(220,90%,50%)' }} />
          <div className="flex-1" style={{ background: '#fff', opacity: 0.9 }} />
          <div className="flex-1" style={{ background: 'hsl(0,80%,52%)' }} />
        </div>

        <div className="relative p-5 pt-6">
          {/* Greeting + streak */}
          <div className="flex items-start justify-between mb-3">
            <div>
              <p className="text-xs tracking-widest uppercase font-bold" style={{ color: '#d4af37' }}>{greeting}</p>
              <h1 className="font-heading text-4xl tracking-wider mt-0.5" style={{ color: '#fff', textShadow: '0 2px 12px rgba(30,80,220,0.5)' }}>
                {profile?.first_name?.toUpperCase()} !
              </h1>
              {profile?.goal && (
                <span className="inline-block mt-1.5 text-[11px] font-semibold px-2.5 py-1 rounded-full"
                  style={{ background: 'rgba(255,255,255,0.18)', border: '1px solid rgba(255,255,255,0.40)', color: '#fff' }}>
                  {GOAL_LABELS[profile.goal] || profile.goal}
                </span>
              )}
            </div>

            {/* Streak badge */}
            <div className="flex flex-col items-center gap-1">
              <div className="flex flex-col items-center rounded-2xl px-3 py-2"
                style={{ background: 'rgba(255,255,255,0.16)', border: '1px solid rgba(255,200,100,0.50)', backdropFilter: 'blur(8px)' }}>
                <Flame className="h-4 w-4 text-orange-500 flame-pulse" />
                <span className="font-heading text-2xl text-yellow-300 leading-none">{streak}</span>
                <span className="text-[10px] text-yellow-200 font-medium">streak</span>
              </div>
              {/* Crown for premium */}
              {profile?.subscription_status === 'premium' && (
                <div className="w-full flex justify-center -mt-2">
                  <svg viewBox="0 0 24 24" className="h-12 w-12 text-yellow-400" fill="currentColor" style={{ filter: 'drop-shadow(0 0 15px rgba(255,215,0,1))', animation: 'glow-pulse 2s infinite' }}>
                    <path d="M2 12l2-7 4 4 4-7 4 7 4-4 2 7v5H2v-5zm2 3h16v-2.5L18 14l-6-9-6 9-2-1.5V15z"/>
                    <circle cx="12" cy="6" r="1.5"/>
                    <circle cx="6" cy="8" r="1"/>
                    <circle cx="18" cy="8" r="1"/>
                  </svg>
                </div>
              )}
            </div>
          </div>

          {/* AI Quote */}
          <div className="rounded-xl px-4 py-2.5 mb-4"
            style={{ background: 'rgba(255,255,255,0.14)', border: '1px solid rgba(255,255,255,0.28)', backdropFilter: 'blur(8px)' }}>
            <p className="text-sm text-white italic leading-relaxed font-medium">"{aiMsg || '...'}"</p>
            <p className="text-[10px] mt-1 font-semibold" style={{ color: '#c9a84c' }}>— AI Coach · National Fit 🤖</p>
          </div>

          {/* Level + XP — clickable */}
          <button className="w-full text-left" onClick={() => setShowLevels(true)}>
            <div className="flex items-center gap-3 rounded-xl p-3 transition-all active:scale-[0.99]"
              style={{ background: 'rgba(255,255,255,0.16)', border: '1.5px solid rgba(255,255,255,0.32)', backdropFilter: 'blur(10px)' }}>
              {/* Level icon */}
              <div className="h-12 w-12 rounded-2xl flex flex-col items-center justify-center shrink-0 shadow-sm"
                style={{ background: `linear-gradient(135deg, ${level.color}25, ${level.color}10)`, border: `2px solid ${level.color}40` }}>
                <span className="text-xl leading-none">{level.emoji}</span>
                <span className="text-[8px] font-bold mt-0.5" style={{ color: level.color }}>LVL {level.index}</span>
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-1.5">
                    <span className="text-sm font-heading tracking-wider text-white">{level.label}</span>
                    <Trophy className="h-3 w-3 text-yellow-300" />
                  </div>
                  <div className="flex items-center gap-1">
                  <Zap className="h-3 w-3 text-yellow-300" />
                  <span className="text-xs font-bold text-yellow-200">{xp.toLocaleString('fr-FR')} XP</span>
                  </div>
                </div>
                {/* XP bar */}
                <div className="h-2.5 rounded-full overflow-hidden" style={{ background: `${level.color}18` }}>
                  <motion.div
                    className="h-full rounded-full"
                    style={{ background: `linear-gradient(90deg, ${level.color}, ${level.color}bb)` }}
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.min(xpPct, 100)}%` }}
                    transition={{ duration: 1.2, ease: 'easeOut', delay: 0.3 }}
                  />
                </div>
                {nextLevel ? (
                  <p className="text-[10px] mt-1 font-semibold" style={{ color: '#d4af37' }}>
                    {(nextLevel.min - xp).toLocaleString()} XP {isFR ? 'avant' : 'until'} {nextLevel.emoji} {nextLevel.label}
                  </p>
                ) : (
                  <p className="text-[10px] mt-1 font-bold text-yellow-300">🌟 {isFR ? 'Niveau maximum atteint !' : 'Max level reached!'}</p>
                )}
              </div>

              <ChevronRight className="h-4 w-4 shrink-0 text-white/50" />
            </div>
            <p className="text-center text-[10px] mt-1 font-semibold" style={{ color: '#c9a84c', opacity: 0.85 }}>{isFR ? 'Appuie pour voir les récompenses →' : 'Tap to see rewards →'}</p>
          </button>

          {/* Semaine en cours — dots */}
          <div className="flex items-center gap-1.5 mb-4 mt-3">
            <span className="text-[10px] font-bold mr-1 uppercase tracking-wider" style={{ color: '#ffd700', textShadow: '0 0 8px rgba(255,215,0,0.8)' }}>{isFR ? 'Sem.' : 'Week'}</span>
            {(isFR ? DAYS_FR : DAYS_EN).map((day, i) => {
              const isToday = i === today.getDay();
              const done = workedDays.has(i);
              return (
                <div key={i} className="flex flex-col items-center gap-0.5">
                  <div className={`h-8 w-8 rounded-full flex items-center justify-center text-[11px] font-extrabold transition-all shadow-lg`} style={
                    done
                      ? { background: 'linear-gradient(135deg, #ffd700, #ffed4e)', color: '#1a3fae', boxShadow: '0 0 15px rgba(255,215,0,0.7), 0 4px 12px rgba(0,0,0,0.3)' }
                      : isToday
                      ? { background: 'linear-gradient(135deg, #ffd700, #ffed4e)', color: '#1a3fae', border: '2px solid #fff', boxShadow: '0 0 20px rgba(255,215,0,0.9), 0 4px 15px rgba(0,0,0,0.4)', animation: 'pulse 1.5s infinite' }
                      : { background: 'rgba(255,255,255,0.15)', border: '2px solid rgba(255,215,0,0.6)', color: '#ffd700', textShadow: '0 0 6px rgba(255,215,0,0.6)', boxShadow: '0 2px 8px rgba(0,0,0,0.2)' }
                  }>
                    {done ? '✓' : day}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Next session CTA */}
          {nextSession && (
            <Link
              to={`/seance?program=${nextSession.programId}&session=${nextSession.sessionIdx}`}
              className="mt-4 flex items-center justify-between rounded-xl px-4 py-3 hover:opacity-90 transition-all group shadow-md"
              style={{
                background: 'linear-gradient(135deg, hsl(220,90%,48%), hsl(220,90%,38%))',
                boxShadow: '0 4px 16px rgba(30,80,220,0.28)',
              }}>
              <div className="flex items-center gap-2.5">
                <Target className="h-4 w-4 text-white" />
                <div>
                  <p className="text-[10px] uppercase tracking-wider font-bold" style={{ color: '#d4af37' }}>{isFR ? 'Séance du jour' : "Today's session"}</p>
                  <p className="text-sm font-bold text-white">{nextSession.name}</p>
                </div>
              </div>
              <ChevronRight className="h-4 w-4 text-white group-hover:translate-x-1 transition-transform" />
            </Link>
          )}
        </div>
      </div>
    </>
  );
}