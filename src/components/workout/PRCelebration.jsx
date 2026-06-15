import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trophy } from 'lucide-react';
import confetti from 'canvas-confetti';

export default function PRCelebration({ show, exerciseName, onClose }) {
  useEffect(() => {
    if (!show) return;
    // Vibration pattern: deux pulses courts + un long
    if (navigator.vibrate) navigator.vibrate([80, 60, 80, 60, 200]);
    // Confetti
    const fire = (angle, origin) => confetti({
      particleCount: 60,
      spread: 70,
      angle,
      origin,
      colors: ['#22c55e', '#16a34a', '#fbbf24', '#a855f7', '#fff'],
      scalar: 1.2,
    });
    fire(60, { x: 0.1, y: 0.6 });
    fire(120, { x: 0.9, y: 0.6 });
    // Son via Web Audio API
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const playNote = (freq, start, dur) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.frequency.value = freq;
        osc.type = 'sine';
        gain.gain.setValueAtTime(0, ctx.currentTime + start);
        gain.gain.linearRampToValueAtTime(0.15, ctx.currentTime + start + 0.01);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + start + dur);
        osc.start(ctx.currentTime + start);
        osc.stop(ctx.currentTime + start + dur + 0.1);
      };
      playNote(440, 0, 0.15);
      playNote(554, 0.15, 0.15);
      playNote(659, 0.3, 0.3);
      playNote(880, 0.6, 0.5);
    } catch { /* silence if audio not available */ }
    const t = setTimeout(onClose, 3200);
    return () => clearTimeout(t);
  }, [show]);

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-center justify-center pointer-events-none"
        >
          <motion.div
            initial={{ scale: 0.3, y: 60, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: 0.8, y: -30, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 18 }}
            className="bg-gradient-to-br from-yellow-400 via-amber-400 to-orange-500 rounded-3xl px-10 py-8 text-center shadow-2xl shadow-amber-300/60 pointer-events-auto mx-6"
          >
            {/* Glow ring */}
            <motion.div
              animate={{ scale: [1, 1.15, 1] }}
              transition={{ duration: 0.6, repeat: 4 }}
              className="h-20 w-20 rounded-full bg-white/30 flex items-center justify-center mx-auto mb-4"
            >
              <Trophy className="h-10 w-10 text-white drop-shadow-lg" />
            </motion.div>
            <motion.p
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="font-heading text-4xl text-white tracking-widest drop-shadow"
            >
              NOUVEAU RECORD !
            </motion.p>
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="text-white/90 font-semibold mt-2 text-lg"
            >
              {exerciseName}
            </motion.p>
            <motion.div
              initial={{ scaleX: 0 }}
              animate={{ scaleX: 1 }}
              transition={{ delay: 0.5, duration: 0.4 }}
              className="h-1 bg-white/50 rounded-full mt-4"
            />
            <p className="text-white/70 text-sm mt-2 font-heading tracking-widest">SMASH !</p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}