import React from 'react';
import { motion } from 'framer-motion';
import { LEVELS, getLevel, getNextLevel } from '@/lib/levels';

// Athlete SVG figures evolving with XP level
const ATHLETE_SVGS = {
  'Recrue': (
    <svg viewBox="0 0 80 120" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
      <ellipse cx="40" cy="20" rx="12" ry="13" fill="#64748b"/>
      <rect x="30" y="32" width="20" height="30" rx="5" fill="#64748b"/>
      <rect x="18" y="34" width="10" height="24" rx="4" fill="#64748b"/>
      <rect x="52" y="34" width="10" height="24" rx="4" fill="#64748b"/>
      <rect x="30" y="62" width="8" height="30" rx="4" fill="#64748b"/>
      <rect x="42" y="62" width="8" height="30" rx="4" fill="#64748b"/>
      <circle cx="34" cy="17" r="2.5" fill="#1e293b"/>
      <circle cx="46" cy="17" r="2.5" fill="#1e293b"/>
      <path d="M34 27 Q40 31 46 27" stroke="#1e293b" strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
  ),
  'Sportif': (
    <svg viewBox="0 0 80 120" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
      <ellipse cx="40" cy="20" rx="13" ry="14" fill="#3b82f6"/>
      <rect x="27" y="33" width="26" height="33" rx="6" fill="#3b82f6"/>
      <rect x="14" y="35" width="12" height="26" rx="5" fill="#3b82f6"/>
      <rect x="54" y="35" width="12" height="26" rx="5" fill="#3b82f6"/>
      <rect x="28" y="65" width="10" height="32" rx="5" fill="#3b82f6"/>
      <rect x="42" y="65" width="10" height="32" rx="5" fill="#3b82f6"/>
      <circle cx="34" cy="17" r="3" fill="#1d4ed8"/>
      <circle cx="46" cy="17" r="3" fill="#1d4ed8"/>
      <path d="M33 27 Q40 32 47 27" stroke="#1d4ed8" strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
  ),
  'Athlète': (
    <svg viewBox="0 0 80 120" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
      <ellipse cx="40" cy="19" rx="15" ry="15" fill="#2563eb"/>
      <rect x="24" y="33" width="32" height="36" rx="6" fill="#2563eb"/>
      <rect x="11" y="35" width="14" height="28" rx="6" fill="#2563eb"/>
      <rect x="55" y="35" width="14" height="28" rx="6" fill="#2563eb"/>
      <rect x="26" y="68" width="12" height="34" rx="6" fill="#2563eb"/>
      <rect x="42" y="68" width="12" height="34" rx="6" fill="#2563eb"/>
      <circle cx="33" cy="16" r="3.5" fill="#1e3a8a"/>
      <circle cx="47" cy="16" r="3.5" fill="#1e3a8a"/>
      <path d="M32 27 Q40 33 48 27" stroke="#1e3a8a" strokeWidth="2" strokeLinecap="round"/>
      <line x1="40" y1="36" x2="40" y2="55" stroke="#1d4ed8" strokeWidth="1.5" opacity="0.5"/>
    </svg>
  ),
  'Compétiteur': (
    <svg viewBox="0 0 80 120" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
      <ellipse cx="40" cy="18" rx="17" ry="16" fill="#f59e0b"/>
      <rect x="21" y="33" width="38" height="38" rx="7" fill="#f59e0b"/>
      <rect x="8" y="34" width="15" height="32" rx="6" fill="#f59e0b"/>
      <rect x="57" y="34" width="15" height="32" rx="6" fill="#f59e0b"/>
      <rect x="24" y="70" width="14" height="36" rx="6" fill="#f59e0b"/>
      <rect x="42" y="70" width="14" height="36" rx="6" fill="#f59e0b"/>
      <circle cx="32" cy="15" r="4" fill="#92400e"/>
      <circle cx="48" cy="15" r="4" fill="#92400e"/>
      <path d="M31 27 Q40 35 49 27" stroke="#92400e" strokeWidth="2.5" strokeLinecap="round"/>
      <line x1="40" y1="34" x2="40" y2="56" stroke="#d97706" strokeWidth="2" opacity="0.6"/>
      <ellipse cx="29" cy="48" rx="5" ry="7" fill="#d97706" opacity="0.4"/>
      <ellipse cx="51" cy="48" rx="5" ry="7" fill="#d97706" opacity="0.4"/>
    </svg>
  ),
  'Élite': (
    <svg viewBox="0 0 80 120" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
      <circle cx="40" cy="17" r="22" fill="#0ea5e9" opacity="0.2"/>
      <ellipse cx="40" cy="17" rx="18" ry="17" fill="#0ea5e9"/>
      <rect x="18" y="33" width="44" height="40" rx="8" fill="#0ea5e9"/>
      <rect x="5" y="33" width="16" height="35" rx="7" fill="#0ea5e9"/>
      <rect x="59" y="33" width="16" height="35" rx="7" fill="#0ea5e9"/>
      <rect x="22" y="72" width="15" height="38" rx="7" fill="#0ea5e9"/>
      <rect x="43" y="72" width="15" height="38" rx="7" fill="#0ea5e9"/>
      <circle cx="31" cy="14" r="4.5" fill="#0369a1"/>
      <circle cx="49" cy="14" r="4.5" fill="#0369a1"/>
      <path d="M30 27 Q40 37 50 27" stroke="#0369a1" strokeWidth="3" strokeLinecap="round"/>
      <line x1="40" y1="33" x2="40" y2="57" stroke="#0284c7" strokeWidth="2.5" opacity="0.7"/>
    </svg>
  ),
  'Champion': (
    <svg viewBox="0 0 80 120" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
      <ellipse cx="40" cy="17" rx="19" ry="17" fill="#dc2626"/>
      <rect x="18" y="33" width="44" height="40" rx="8" fill="#dc2626"/>
      <rect x="5" y="33" width="16" height="35" rx="7" fill="#dc2626"/>
      <rect x="59" y="33" width="16" height="35" rx="7" fill="#dc2626"/>
      <rect x="22" y="72" width="15" height="38" rx="7" fill="#dc2626"/>
      <rect x="43" y="72" width="15" height="38" rx="7" fill="#dc2626"/>
      <circle cx="31" cy="14" r="4.5" fill="#7f1d1d"/>
      <circle cx="49" cy="14" r="4.5" fill="#7f1d1d"/>
      <path d="M30 27 Q40 37 50 27" stroke="#7f1d1d" strokeWidth="3" strokeLinecap="round"/>
      <path d="M25 10 L28 4 L31 9 L34 3 L37 8 L40 2 L43 8 L46 3 L49 9 L52 4 L55 10" stroke="#fbbf24" strokeWidth="1.5" fill="none" opacity="0.8"/>
    </svg>
  ),
  'Légende': (
    <svg viewBox="0 0 80 120" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
      <circle cx="40" cy="17" r="22" fill="#7c3aed" opacity="0.2"/>
      <ellipse cx="40" cy="17" rx="20" ry="18" fill="#7c3aed"/>
      <rect x="16" y="34" width="48" height="42" rx="9" fill="#7c3aed"/>
      <rect x="3" y="33" width="17" height="38" rx="8" fill="#7c3aed"/>
      <rect x="60" y="33" width="17" height="38" rx="8" fill="#7c3aed"/>
      <rect x="20" y="75" width="16" height="40" rx="8" fill="#7c3aed"/>
      <rect x="44" y="75" width="16" height="40" rx="8" fill="#7c3aed"/>
      <circle cx="30" cy="13" r="5" fill="#4c1d95"/>
      <circle cx="50" cy="13" r="5" fill="#4c1d95"/>
      <circle cx="30" cy="13" r="2.5" fill="#a78bfa"/>
      <circle cx="50" cy="13" r="2.5" fill="#a78bfa"/>
      <path d="M28 27 Q40 40 52 27" stroke="#4c1d95" strokeWidth="3.5" strokeLinecap="round"/>
      <path d="M22 10 L26 3 L30 8 L34 2 L37 7 L40 1 L43 7 L46 2 L50 8 L54 3 L58 10" stroke="#fbbf24" strokeWidth="2" fill="none"/>
      <circle cx="40" cy="17" r="24" stroke="#a78bfa" strokeWidth="0.8" opacity="0.5"/>
      <circle cx="40" cy="17" r="28" stroke="#a78bfa" strokeWidth="0.5" opacity="0.25"/>
    </svg>
  ),
};

export default function HulkAvatar({ xp = 0, size = 80 }) {
  const level = getLevel(xp);
  const nextLevel = getNextLevel(xp);
  const prevMin = level.min;
  const pct = nextLevel
    ? Math.min(((xp - prevMin) / (nextLevel.min - prevMin)) * 100, 100)
    : 100;

  const isMaxLevel = !nextLevel;
  const svg = ATHLETE_SVGS[level.label] || ATHLETE_SVGS['Recrue'];

  return (
    <motion.div
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ duration: 0.5, type: 'spring', stiffness: 200 }}
      className="flex flex-col items-center gap-1"
    >
      <div
        className="relative flex items-center justify-center"
        style={{ width: size, height: size }}
      >
        {(level.label === 'Champion' || level.label === 'Légende') && (
          <motion.div
            animate={{ opacity: [0.3, 0.6, 0.3], scale: [1, 1.05, 1] }}
            transition={{ duration: 2.5, repeat: Infinity }}
            className="absolute inset-0 rounded-full"
            style={{ background: `radial-gradient(circle, ${level.color}40 0%, transparent 70%)` }}
          />
        )}
        <motion.div
          animate={isMaxLevel ? { scale: [1, 1.03, 1] } : {}}
          transition={{ duration: 2, repeat: Infinity }}
          style={{ width: size * 0.85, height: size * 0.85 }}
        >
          {svg}
        </motion.div>
      </div>
      <span className="text-xs font-heading tracking-wide text-muted-foreground">{level.label}</span>
    </motion.div>
  );
}