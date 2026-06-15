import React from 'react';
import { motion } from 'framer-motion';

import { getLevel, getNextLevel } from '@/lib/levels';
export { getLevel, getNextLevel } from '@/lib/levels';

export default function XPRing({ xp = 0, size = 120 }) {
  const currentLevel = getLevel(xp);
  const nextLevel = getNextLevel(xp);
  const prevMin = currentLevel.min;
  const pct = nextLevel
    ? Math.min(((xp - prevMin) / (nextLevel.min - prevMin)) * 100, 100)
    : 100;

  const r = (size / 2) - 8;
  const circumference = 2 * Math.PI * r;
  const offset = circumference * (1 - pct / 100);

  return (
    <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90 absolute inset-0">
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="8" />
        <motion.circle
          cx={size/2} cy={size/2} r={r}
          fill="none"
          stroke="white"
          strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1.2, ease: 'easeOut', delay: 0.3 }}
        />
      </svg>
      <div className="relative z-10 flex flex-col items-center justify-center text-white">
        <span className="text-2xl">{currentLevel.emoji}</span>
        <span className="font-heading text-xs tracking-wide mt-0.5">{xp} XP</span>
      </div>
    </div>
  );
}