import React from 'react';
import { motion } from 'framer-motion';
import { Moon, Droplets, Heart, Zap } from 'lucide-react';
import { useTheme } from '@/lib/ThemeContext';

function calcRecoveryScore({ sleep_hours, stress_level, energy_level, water_intake_l }) {
  let score = 50;
  if (sleep_hours) {
    if (sleep_hours >= 8) score += 20;
    else if (sleep_hours >= 7) score += 12;
    else if (sleep_hours >= 6) score += 4;
    else score -= 10;
  }
  if (stress_level) {
    score += (6 - stress_level) * 5; // 1=+25, 5=-15
  }
  if (energy_level) {
    score += (energy_level - 3) * 5;
  }
  if (water_intake_l) {
    if (water_intake_l >= 2) score += 10;
    else if (water_intake_l >= 1.5) score += 5;
    else score -= 5;
  }
  return Math.max(0, Math.min(100, score));
}

export default function RecoveryWidget({ entries }) {
  const { language } = useTheme();
  const isFR = language === 'fr';
  const today = new Date().toISOString().split('T')[0];
  const todayEntry = entries?.find(e => e.date === today);

  if (!todayEntry) return null;

  const score = todayEntry.recovery_score || calcRecoveryScore(todayEntry);
  const color = score >= 70 ? '#22c55e' : score >= 40 ? '#f59e0b' : '#ef4444';
  const gradBg = score >= 70
    ? 'linear-gradient(135deg, rgba(16,185,129,0.15) 0%, rgba(255,255,255,0.88) 100%)'
    : score >= 40
    ? 'linear-gradient(135deg, rgba(245,158,11,0.15) 0%, rgba(255,255,255,0.88) 100%)'
    : 'linear-gradient(135deg, rgba(239,68,68,0.18) 0%, rgba(255,255,255,0.88) 100%)';
  const borderColor = score >= 70 ? 'rgba(34,197,94,0.35)' : score >= 40 ? 'rgba(245,158,11,0.35)' : 'rgba(239,68,68,0.35)';
  const label = score >= 70
    ? (isFR ? '✅ Bonne récupération' : '✅ Good recovery')
    : score >= 40
    ? (isFR ? '⚠️ Récup modérée' : '⚠️ Moderate recovery')
    : (isFR ? '🔴 Repos recommandé' : '🔴 Rest recommended');

  const metrics = [
    todayEntry.sleep_hours && { icon: Moon, label: `${todayEntry.sleep_hours}h ${isFR ? 'sommeil' : 'sleep'}`, color: 'text-indigo-500' },
    todayEntry.stress_level && { icon: Heart, label: `${isFR ? 'Stress' : 'Stress'} ${todayEntry.stress_level}/5`, color: 'text-rose-500' },
    todayEntry.water_intake_l && { icon: Droplets, label: `${todayEntry.water_intake_l}L ${isFR ? 'eau' : 'water'}`, color: 'text-blue-500' },
    todayEntry.energy_level && { icon: Zap, label: `${isFR ? 'Énergie' : 'Energy'} ${todayEntry.energy_level}/5`, color: 'text-amber-500' },
  ].filter(Boolean);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.97 }}
      animate={{ opacity: 1, scale: 1 }}
      className="rounded-2xl p-3.5 shadow-md"
      style={{ background: gradBg, border: `1px solid ${borderColor}`, backdropFilter: 'blur(8px)' }}
    >
      <div className="flex items-center justify-between mb-2">
        <p className="text-xs font-bold text-slate-600 uppercase tracking-wider">{isFR ? 'Score récupération' : 'Recovery score'}</p>
        <span className="text-sm font-bold" style={{ color }}>{score}/100</span>
      </div>

      {/* Score bar */}
      <div className="h-2 bg-white/70 rounded-full overflow-hidden mb-3">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${score}%` }}
          transition={{ duration: 0.7 }}
          className="h-full rounded-full"
          style={{ background: color }}
        />
      </div>

      <p className="text-xs font-semibold text-slate-700 mb-2">{label}</p>

      {metrics.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {metrics.map(({ icon: Icon, label: l, color: c }, i) => (
            <div key={i} className="flex items-center gap-1 bg-white/70 rounded-lg px-2 py-1 border border-white/50">
              <Icon className={`h-3 w-3 ${c}`} />
              <span className="text-xs text-slate-600">{l}</span>
            </div>
          ))}
        </div>
      )}
    </motion.div>
  );
}