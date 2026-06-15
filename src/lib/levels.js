// NATIONAL FIT -- Système de niveaux & récompenses
export const LEVELS = [
  {
    index: 0, min: 0, max: 2499, label: 'Recrue', emoji: '🎽', color: '#64748b',
    gradient: 'from-slate-400 to-slate-600',
    reward_title: 'Bienvenue !',
    reward_desc: 'Tu viens de rejoindre National Fit. L\'aventure commence ici.',
    reward_unlocked: true,
    reward_preview: null,
  },
  {
    index: 1, min: 2500, max: 7499, label: 'Sportif', emoji: '💪', color: '#3b82f6',
    gradient: 'from-blue-400 to-blue-600',
    reward_title: 'Badge Sportif',
    reward_desc: 'Prochainement : un badge exclusif "Sportif" sur ton profil.',
    reward_unlocked: false,
    reward_preview: '🏅 Badge profil',
  },
  {
    index: 2, min: 7500, max: 17499, label: 'Athlète', emoji: '⚡', color: '#2563eb',
    gradient: 'from-blue-500 to-indigo-600',
    reward_title: 'Cadre de profil',
    reward_desc: 'Prochainement : un cadre animé "Athlète" autour de ton avatar.',
    reward_unlocked: false,
    reward_preview: '🖼️ Cadre animé',
  },
  {
    index: 3, min: 17500, max: 34999, label: 'Compétiteur', emoji: '🏆', color: '#f59e0b',
    gradient: 'from-yellow-400 to-orange-500',
    reward_title: 'Thème Doré',
    reward_desc: 'Prochainement : un thème visuel doré exclusif pour l\'app.',
    reward_unlocked: false,
    reward_preview: '✨ Thème doré',
  },
  {
    index: 4, min: 35000, max: 69999, label: 'Élite', emoji: '💎', color: '#0ea5e9',
    gradient: 'from-cyan-400 to-blue-600',
    reward_title: 'Décoration diamant',
    reward_desc: 'Prochainement : des animations diamant sur ton tableau de bord.',
    reward_unlocked: false,
    reward_preview: '💠 Décor diamant',
  },
  {
    index: 5, min: 70000, max: 139999, label: 'Champion', emoji: '👑', color: '#dc2626',
    gradient: 'from-red-500 to-rose-600',
    reward_title: 'Couronne Champion',
    reward_desc: 'Prochainement : une couronne exclusive et un fond rouge premium.',
    reward_unlocked: false,
    reward_preview: '👑 Couronne + fond',
  },
  {
    index: 6, min: 140000, max: Infinity, label: 'Légende', emoji: '🌟', color: '#7c3aed',
    gradient: 'from-violet-500 to-purple-700',
    reward_title: 'Statut Légende',
    reward_desc: 'Prochainement : un statut unique visible par toute la communauté.',
    reward_unlocked: false,
    reward_preview: '🌟 Statut légendaire',
  },
];

export function getLevel(xp) {
  for (let i = LEVELS.length - 1; i >= 0; i--) {
    if (xp >= LEVELS[i].min) return LEVELS[i];
  }
  return LEVELS[0];
}

export function getNextLevel(xp) {
  const current = getLevel(xp);
  return LEVELS[current.index + 1] || null;
}

export function getLevelProgress(xp) {
  const current = getLevel(xp);
  const next = getNextLevel(xp);
  if (!next) return 100;
  return Math.round(((xp - current.min) / (next.min - current.min)) * 100);
}