import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { base44 } from '@/api/base44Client';
import { Trophy, Star, Flame, Zap, Dumbbell, Target, Crown, Shield, Award } from 'lucide-react';

const BADGES_DEF = [
  // Streak
  { id: 'streak_3',   icon: Flame,    color: '#f97316', bg: '#fff7ed', label: '3 jours de suite',    desc: 'Brûle, ne t\'arrête pas !',     check: (d) => d.streak >= 3 },
  { id: 'streak_7',   icon: Flame,    color: '#ef4444', bg: '#fef2f2', label: '7 jours de suite',    desc: 'Semaine parfaite !',             check: (d) => d.streak >= 7 },
  { id: 'streak_30',  icon: Crown,    color: '#eab308', bg: '#fefce8', label: '30 jours de suite',   desc: 'Légende vivante !',              check: (d) => d.streak >= 30 },
  // Séances
  { id: 'sessions_5',  icon: Dumbbell, color: '#3b82f6', bg: '#eff6ff', label: '5 séances',           desc: 'La machine est lancée !',        check: (d) => d.sessions >= 5 },
  { id: 'sessions_20', icon: Dumbbell, color: '#8b5cf6', bg: '#f5f3ff', label: '20 séances',          desc: 'Régularité exemplaire.',         check: (d) => d.sessions >= 20 },
  { id: 'sessions_50', icon: Trophy,   color: '#f59e0b', bg: '#fffbeb', label: '50 séances',          desc: 'Half-century champion !',        check: (d) => d.sessions >= 50 },
  // XP
  { id: 'xp_500',  icon: Zap,  color: '#06b6d4', bg: '#ecfeff', label: '500 XP',            desc: 'Tu montes en puissance !',       check: (d) => d.xp >= 500 },
  { id: 'xp_2000', icon: Star, color: '#f59e0b', bg: '#fffbeb', label: '2000 XP',           desc: 'Athlète confirmé.',              check: (d) => d.xp >= 2000 },
  { id: 'xp_5000', icon: Crown,color: '#8b5cf6', bg: '#f5f3ff', label: '5000 XP',           desc: 'Elite performer !',              check: (d) => d.xp >= 5000 },
  // PRs
  { id: 'pr_first',icon: Target,  color: '#22c55e', bg: '#f0fdf4', label: 'Premier PR',         desc: 'Tu surpasses tes limites !',     check: (d) => d.prs >= 1 },
  { id: 'pr_10',   icon: Target,  color: '#16a34a', bg: '#f0fdf4', label: '10 Records',         desc: 'Machine à records !',            check: (d) => d.prs >= 10 },
  // Volume
  { id: 'vol_1000', icon: Shield, color: '#64748b', bg: '#f8fafc', label: '1 000 kg soulevés', desc: 'Volume impressionnant.',         check: (d) => d.volume >= 1000 },
  { id: 'vol_10000',icon: Award,  color: '#0ea5e9', bg: '#f0f9ff', label: '10 000 kg soulevés',desc: 'Titan de la fonte !',            check: (d) => d.volume >= 10000 },
];

export default function AchievementBadges({ profile, compact = false }) {
  const [data, setData] = useState(null);

  useEffect(() => {
    if (!profile) return;
    (async () => {
      const sessions = await base44.entities.WorkoutSession.list('-date', 100);
      const totalSessions = sessions.length;
      const totalVolume = sessions.reduce((a, s) => a + (s.total_volume_kg || 0), 0);
      const totalPRs = sessions.reduce((a, s) => a + (s.new_prs || 0), 0);
      setData({
        streak: profile.streak_days || 0,
        sessions: totalSessions,
        xp: profile.xp_points || 0,
        prs: totalPRs,
        volume: totalVolume,
      });
    })();
  }, [profile?.id]);

  if (!data) return null;

  const earned = BADGES_DEF.filter(b => b.check(data));
  const locked = BADGES_DEF.filter(b => !b.check(data));

  if (compact) {
    return (
      <div className="flex flex-wrap gap-2">
        {earned.map(badge => {
          const Icon = badge.icon;
          return (
            <motion.div
              key={badge.id}
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              whileHover={{ scale: 1.1 }}
              title={badge.label}
              className="h-9 w-9 rounded-xl flex items-center justify-center shadow-sm border"
              style={{ background: badge.bg, borderColor: badge.color + '40' }}
            >
              <Icon className="h-4 w-4" style={{ color: badge.color }} />
            </motion.div>
          );
        })}
        {earned.length === 0 && (
          <p className="text-xs text-slate-400 italic">Aucun badge encore -- lance-toi !</p>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Earned */}
      {earned.length > 0 && (
        <div>
          <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">🏆 Badges obtenus ({earned.length})</p>
          <div className="grid grid-cols-2 gap-2">
            {earned.map(badge => {
              const Icon = badge.icon;
              return (
                <motion.div
                  key={badge.id}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="flex items-center gap-3 p-3 rounded-xl border shadow-sm"
                  style={{ background: badge.bg, borderColor: badge.color + '30' }}
                >
                  <div className="h-9 w-9 rounded-xl flex items-center justify-center shrink-0 shadow-sm" style={{ background: badge.color + '20' }}>
                    <Icon className="h-4.5 w-4.5" style={{ color: badge.color }} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-slate-800 leading-tight">{badge.label}</p>
                    <p className="text-xs text-slate-500 leading-tight mt-0.5">{badge.desc}</p>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      )}

      {/* Locked */}
      {locked.length > 0 && (
        <div>
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">🔒 À débloquer ({locked.length})</p>
          <div className="grid grid-cols-2 gap-2">
            {locked.slice(0, 6).map(badge => {
              const Icon = badge.icon;
              return (
                <div key={badge.id} className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 border border-slate-200 opacity-50">
                  <div className="h-9 w-9 rounded-xl flex items-center justify-center shrink-0 bg-slate-200">
                    <Icon className="h-4 w-4 text-slate-400" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-slate-500 leading-tight">{badge.label}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Stats summary */}
      <div className="rounded-xl bg-blue-50 border border-blue-100 p-3 grid grid-cols-2 gap-3">
        {[
          { label: 'Streak', value: `${data.streak}j`, icon: Flame, color: '#f97316' },
          { label: 'Séances', value: data.sessions, icon: Dumbbell, color: '#3b82f6' },
          { label: 'Records', value: data.prs, icon: Target, color: '#22c55e' },
          { label: 'Volume', value: `${(data.volume / 1000).toFixed(1)}T`, icon: Shield, color: '#8b5cf6' },
        ].map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="flex items-center gap-2 bg-white/70 rounded-lg px-2.5 py-2 border border-white">
            <Icon className="h-3.5 w-3.5 shrink-0" style={{ color }} />
            <div>
              <p className="text-xs text-slate-400 leading-none">{label}</p>
              <p className="text-sm font-bold text-slate-800 leading-tight">{value}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}