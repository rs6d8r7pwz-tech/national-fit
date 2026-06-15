import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Zap, Crown, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '@/lib/ThemeContext';

const TRIAL_BANNER_KEY = 'nfit_trial_banner_dismissed';

export default function PostOnboardingTrial() {
  const navigate = useNavigate();
  const { language } = useTheme();
  const isFR = language === 'fr';

  const [dismissed, setDismissed] = useState(() => {
    try { return !!localStorage.getItem(TRIAL_BANNER_KEY); } catch { return false; }
  });

  const handleDismiss = (e) => {
    e.stopPropagation();
    try { localStorage.setItem(TRIAL_BANNER_KEY, '1'); } catch {}
    setDismissed(true);
  };

  return (
    <AnimatePresence>
      {!dismissed && (
        <motion.div
          initial={{ opacity: 0, y: -12, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -12, scale: 0.97 }}
          className="relative rounded-2xl overflow-hidden shadow-xl cursor-pointer"
          style={{ background: 'linear-gradient(135deg, #1e3a8a 0%, #1e50dc 50%, #7c3aed 100%)' }}
          onClick={() => navigate('/pricing')}
        >
          {/* Shine effect */}
          <div className="absolute inset-0 opacity-20"
            style={{ background: 'radial-gradient(ellipse at 20% 50%, rgba(255,255,255,0.3) 0%, transparent 60%)' }} />

          <div className="relative px-5 py-4 flex items-center gap-4">
            <div className="h-11 w-11 rounded-xl bg-white/20 flex items-center justify-center shrink-0 backdrop-blur-sm">
              <Crown className="h-6 w-6 text-yellow-300" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5 mb-0.5">
                <Zap className="h-3 w-3 text-yellow-300" />
                <p className="text-xs font-bold text-yellow-300 uppercase tracking-wider">
                  {isFR ? '🎁 Offre de bienvenue' : '🎁 Welcome offer'}
                </p>
              </div>
              <p className="text-base font-heading text-white tracking-wide">
                {isFR ? '7 jours Premium GRATUITS' : '7 days Premium FREE'}
              </p>
              <p className="text-xs text-white/70 truncate">
                {isFR ? 'Accès illimité · Sans engagement · Annulable à tout moment' : 'Unlimited access · No commitment · Cancel anytime'}
              </p>
            </div>
            <ChevronRight className="h-5 w-5 text-white/60 shrink-0" />
          </div>

          {/* Dismiss button */}
          <button
            onClick={handleDismiss}
            className="absolute top-2 right-2 h-6 w-6 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors"
          >
            <X className="h-3.5 w-3.5 text-white/70" />
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}