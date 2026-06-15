import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Lock, CheckCircle2, ChevronRight } from 'lucide-react';
import { LEVELS, getLevel } from '@/lib/levels';

export default function LevelRewardsModal({ xp, onClose }) {
  const current = getLevel(xp);

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-[100] flex items-end justify-center"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        {/* Backdrop */}
        <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />

        {/* Sheet */}
        <motion.div
          className="relative w-full max-w-lg rounded-t-3xl overflow-hidden"
          style={{ maxHeight: '85vh', background: 'linear-gradient(170deg, #f8fbff 0%, #ffffff 60%)' }}
          initial={{ y: '100%' }}
          animate={{ y: 0 }}
          exit={{ y: '100%' }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        >
          {/* Flag strip */}
          <div className="h-1 flex">
            <div className="flex-1" style={{ background: 'hsl(220,90%,50%)' }} />
            <div className="flex-1 bg-white" />
            <div className="flex-1" style={{ background: 'hsl(0,80%,52%)' }} />
          </div>

          <div className="p-5 pb-2 flex items-center justify-between border-b border-blue-100">
            <div>
              <h2 className="font-heading text-2xl text-blue-800 tracking-widest">NIVEAUX & RÉCOMPENSES</h2>
              <p className="text-xs text-slate-500 mt-0.5">Progresse pour débloquer des récompenses exclusives</p>
            </div>
            <button onClick={onClose} className="h-8 w-8 rounded-xl bg-slate-100 flex items-center justify-center">
              <X className="h-4 w-4 text-slate-600" />
            </button>
          </div>

          <div className="overflow-y-auto" style={{ maxHeight: 'calc(85vh - 120px)' }}>
            <div className="p-4 space-y-3">
              {LEVELS.map((lvl, i) => {
                const isReached = xp >= lvl.min;
                const isCurrent = lvl.index === current.index;
                return (
                  <motion.div
                    key={lvl.label}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className={`rounded-2xl border p-4 transition-all ${
                      isCurrent
                        ? 'border-blue-400 shadow-lg'
                        : isReached
                        ? 'border-green-200 bg-green-50/50'
                        : 'border-slate-200 bg-slate-50/50'
                    }`}
                    style={isCurrent ? { background: `linear-gradient(135deg, ${lvl.color}12, #ffffff)`, borderColor: lvl.color, boxShadow: `0 4px 20px ${lvl.color}25` } : {}}
                  >
                    <div className="flex items-center gap-3">
                      {/* Level badge */}
                      <div className={`h-12 w-12 rounded-2xl flex items-center justify-center text-2xl shrink-0 relative ${!isReached ? 'grayscale opacity-50' : ''}`}
                        style={{ background: isReached ? `${lvl.color}18` : '#f1f5f9', border: `2px solid ${isReached ? lvl.color + '40' : '#e2e8f0'}` }}>
                        {lvl.emoji}
                        {isCurrent && (
                          <div className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-blue-500 border-2 border-white flex items-center justify-center">
                            <div className="h-1.5 w-1.5 rounded-full bg-white" />
                          </div>
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-heading text-lg tracking-wider" style={{ color: isReached ? lvl.color : '#94a3b8' }}>
                            {lvl.label}
                          </span>
                          {isCurrent && (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full text-white" style={{ background: lvl.color }}>
                              NIVEAU ACTUEL
                            </span>
                          )}
                          {isReached && !isCurrent && (
                            <CheckCircle2 className="h-4 w-4 text-green-500" />
                          )}
                        </div>
                        <p className="text-xs text-slate-500 mt-0.5">
                          {lvl.min === 0 ? 'Départ' : `Dès ${lvl.min.toLocaleString('fr-FR')} XP`}
                          {lvl.max !== Infinity ? ` → ${lvl.max.toLocaleString('fr-FR')} XP` : ' et au-delà'}
                        </p>
                      </div>

                      {/* Reward preview */}
                      <div className={`text-right ${!isReached && 'opacity-50'}`}>
                        {isReached ? (
                          <div className="flex items-center gap-1 text-green-600">
                            <CheckCircle2 className="h-3 w-3" />
                            <span className="text-[10px] font-semibold">Atteint</span>
                          </div>
                        ) : (
                          <Lock className="h-4 w-4 text-slate-400 ml-auto" />
                        )}
                        {lvl.reward_preview && (
                          <p className={`text-[10px] mt-0.5 font-medium ${isReached ? 'text-green-600' : 'text-slate-400'}`}>
                            {lvl.reward_preview}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Reward description */}
                    <div className={`mt-3 pt-3 border-t ${isCurrent ? 'border-blue-100' : 'border-slate-100'}`}>
                      <p className="text-xs font-semibold mb-0.5" style={{ color: isReached ? lvl.color : '#94a3b8' }}>
                        🎁 {lvl.reward_title}
                      </p>
                      <p className="text-xs text-slate-500 leading-relaxed">{lvl.reward_desc}</p>
                    </div>

                    {/* Progress bar for current level */}
                    {isCurrent && xp < (LEVELS[i + 1]?.min || Infinity) && LEVELS[i + 1] && (
                      <div className="mt-3">
                        <div className="flex justify-between text-[10px] text-slate-400 mb-1">
                          <span>{xp.toLocaleString('fr-FR')} XP</span>
                          <span>{LEVELS[i + 1].min.toLocaleString('fr-FR')} XP</span>
                        </div>
                        <div className="h-1.5 bg-slate-200 rounded-full overflow-hidden">
                          <motion.div
                            className="h-full rounded-full"
                            style={{ background: `linear-gradient(90deg, ${lvl.color}, ${lvl.color}aa)` }}
                            initial={{ width: 0 }}
                            animate={{ width: `${Math.round(((xp - lvl.min) / (LEVELS[i + 1].min - lvl.min)) * 100)}%` }}
                            transition={{ duration: 1, delay: 0.5 }}
                          />
                        </div>
                        <p className="text-[10px] text-slate-400 mt-1 text-right">
                          encore {(LEVELS[i + 1].min - xp).toLocaleString('fr-FR')} XP
                        </p>
                      </div>
                    )}
                  </motion.div>
                );
              })}
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}