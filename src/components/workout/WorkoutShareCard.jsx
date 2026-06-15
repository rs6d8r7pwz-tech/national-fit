import React, { useRef } from 'react';
import { motion } from 'framer-motion';
import { Share2, Download, X, Trophy, Flame, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function WorkoutShareCard({ sessionName, exercises, setsCompleted, prCount, profile, xpEarned, onClose, isFR = true }) {
  const cardRef = useRef(null);

  const shareText = isFR
    ? `🏋️ Séance "${sessionName}" terminée sur National Fit !\n💪 ${exercises.length} exercices · ${setsCompleted} séries${prCount > 0 ? ` · ${prCount} PR 🏆` : ''}\n⚡ +${xpEarned} XP\n\nTélécharge National Fit : ${window.location.origin}`
    : `🏋️ Crushed "${sessionName}" on National Fit!\n💪 ${exercises.length} exercises · ${setsCompleted} sets${prCount > 0 ? ` · ${prCount} PR 🏆` : ''}\n⚡ +${xpEarned} XP\n\nGet National Fit: ${window.location.origin}`;

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: 'National Fit',
        text: shareText,
        url: window.location.origin,
      });
    } else {
      navigator.clipboard.writeText(shareText);
    }
  };

  const handleDownload = async () => {
    try {
      const { default: html2canvas } = await import('html2canvas');
      const canvas = await html2canvas(cardRef.current, { scale: 2, useCORS: true });
      const link = document.createElement('a');
      link.download = `national-fit-${sessionName.replace(/\s+/g, '-').toLowerCase()}.png`;
      link.href = canvas.toDataURL();
      link.click();
    } catch {
      handleShare();
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[90] flex items-center justify-center bg-black/60 backdrop-blur-sm px-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.8, opacity: 0 }}
        transition={{ type: 'spring', stiffness: 300, damping: 25 }}
        className="w-full max-w-sm"
        onClick={e => e.stopPropagation()}
      >
        {/* Share card (screenshot target) */}
        <div ref={cardRef} className="rounded-3xl overflow-hidden shadow-2xl"
          style={{ background: 'linear-gradient(135deg, hsl(220,90%,42%), hsl(220,90%,28%))' }}>

          {/* Top decoration */}
          <div className="relative px-6 pt-8 pb-6 text-white">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -translate-y-16 translate-x-16" />
            <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/5 rounded-full translate-y-12 -translate-x-12" />

            <div className="relative">
              {/* App name */}
              <div className="flex items-center gap-2 mb-5">
                <div className="h-8 w-8 rounded-xl bg-white/20 flex items-center justify-center">
                  <span className="font-heading text-white font-bold text-sm">N</span>
                </div>
                <span className="font-heading tracking-widest text-white/80 text-sm">NATIONAL FIT</span>
              </div>

              {/* Trophy */}
              <div className="flex items-center gap-4 mb-4">
                <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center shadow-lg">
                  <Trophy className="h-8 w-8 text-white" />
                </div>
                <div>
                  <p className="font-heading text-3xl tracking-wider text-white">
                    {isFR ? 'BRAVO !' : 'CRUSHED IT!'}
                  </p>
                  <p className="text-blue-200 text-sm mt-0.5">{sessionName}</p>
                </div>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-3 gap-3">
                {[
                  { icon: Zap, value: exercises.length, label: isFR ? 'Exercices' : 'Exercises', color: 'text-blue-300' },
                  { icon: Flame, value: setsCompleted, label: isFR ? 'Séries' : 'Sets', color: 'text-orange-300' },
                  { icon: Trophy, value: prCount, label: 'PRs', color: 'text-yellow-300' },
                ].map((stat, i) => (
                  <div key={i} className="bg-white/10 rounded-2xl p-3 text-center">
                    <stat.icon className={`h-4 w-4 mx-auto mb-1 ${stat.color}`} />
                    <p className={`font-heading text-2xl leading-none ${stat.color}`}>{stat.value}</p>
                    <p className="text-white/60 text-xs mt-0.5">{stat.label}</p>
                  </div>
                ))}
              </div>

              {/* XP */}
              <div className="mt-4 bg-white/10 rounded-2xl px-4 py-3 flex items-center justify-between">
                <span className="text-white/70 text-sm">{isFR ? 'Points XP gagnés' : 'XP Points earned'}</span>
                <span className="font-heading text-xl text-yellow-300">+{xpEarned} XP</span>
              </div>

              {/* Name */}
              {profile?.first_name && (
                <p className="text-center text-white/50 text-xs mt-4">
                  {isFR ? `Séance de ${profile.first_name}` : `${profile.first_name}'s session`} • {new Date().toLocaleDateString(isFR ? 'fr-FR' : 'en-US', { day: 'numeric', month: 'long' })}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex gap-3 mt-4">
          <Button onClick={handleDownload} variant="outline" className="flex-1 gap-2 bg-white/10 border-white/20 text-white hover:bg-white/20">
            <Download className="h-4 w-4" />
            {isFR ? 'Enregistrer' : 'Save'}
          </Button>
          <Button onClick={handleShare} className="flex-1 gap-2 bg-white text-blue-700 hover:bg-blue-50 font-semibold">
            <Share2 className="h-4 w-4" />
            {isFR ? 'Partager' : 'Share'}
          </Button>
        </div>

        <button onClick={onClose} className="w-full mt-3 text-center text-white/60 text-sm py-2 hover:text-white/80 transition-colors">
          {isFR ? 'Fermer' : 'Close'}
        </button>
      </motion.div>
    </motion.div>
  );
}