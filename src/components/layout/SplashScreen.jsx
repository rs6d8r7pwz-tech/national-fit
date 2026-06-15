import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export default function SplashScreen({ onDone }) {
  const [phase, setPhase] = useState(0); // 0=logo, 1=text, 2=exit

  useEffect(() => {
    const t1 = setTimeout(() => setPhase(1), 600);
    const t2 = setTimeout(() => setPhase(2), 2200);
    const t3 = setTimeout(() => onDone(), 2900);
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
  }, []);

  return (
    <AnimatePresence>
      {phase < 2 && (
        <motion.div
          key="splash"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0, scale: 1.04 }}
          transition={{ duration: 0.5, ease: 'easeInOut' }}
          className="fixed inset-0 z-[99999] flex flex-col items-center justify-center"
          style={{ background: 'linear-gradient(160deg, #0a1628 0%, #0f1f45 40%, #1a0a0a 80%, #2d0a0a 100%)' }}
        >
          {/* Background particles */}
          {Array.from({ length: 20 }).map((_, i) => (
            <motion.div
              key={i}
              className="absolute rounded-full pointer-events-none"
              style={{
                width: Math.random() * 4 + 1,
                height: Math.random() * 4 + 1,
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                background: i % 2 === 0 ? 'rgba(59,130,246,0.6)' : 'rgba(220,38,38,0.6)',
              }}
              animate={{
                y: [0, -30, 0],
                opacity: [0, 0.8, 0],
                scale: [0, 1.5, 0],
              }}
              transition={{
                duration: 2 + Math.random() * 2,
                delay: Math.random() * 1.5,
                repeat: Infinity,
                ease: 'easeInOut',
              }}
            />
          ))}

          {/* Glow ring */}
          <motion.div
            className="absolute rounded-full"
            style={{ width: 200, height: 200, background: 'radial-gradient(circle, rgba(59,130,246,0.15) 0%, transparent 70%)' }}
            animate={{ scale: [0.8, 1.3, 0.8] }}
            transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
          />

          {/* Logo */}
          <motion.div
            initial={{ scale: 0, rotate: -20 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 18, delay: 0.1 }}
            className="relative z-10"
          >
            <div
              className="h-24 w-24 rounded-3xl flex items-center justify-center shadow-2xl"
              style={{
                background: 'linear-gradient(135deg, hsl(220,90%,50%), hsl(0,80%,52%))',
                boxShadow: '0 0 60px rgba(59,130,246,0.4), 0 0 30px rgba(220,38,38,0.3), 0 20px 40px rgba(0,0,0,0.5)',
              }}
            >
              <span className="font-heading text-5xl text-white font-bold" style={{ letterSpacing: 2 }}>N</span>
            </div>
          </motion.div>

          {/* Text */}
          <AnimatePresence>
            {phase >= 1 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="mt-6 text-center z-10"
              >
                <motion.p
                  className="font-heading text-4xl tracking-[0.25em] text-white"
                  initial={{ letterSpacing: '0.1em', opacity: 0 }}
                  animate={{ letterSpacing: '0.25em', opacity: 1 }}
                  transition={{ duration: 0.6 }}
                >
                  NATIONAL FIT
                </motion.p>
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.3 }}
                  className="text-xs tracking-[0.4em] text-blue-400 mt-1 uppercase"
                >
                  Coach IA · France
                </motion.p>

                {/* Loading bar */}
                <motion.div
                  className="mt-6 h-0.5 rounded-full overflow-hidden mx-auto"
                  style={{ width: 120, background: 'rgba(255,255,255,0.1)' }}
                >
                  <motion.div
                    className="h-full rounded-full"
                    style={{ background: 'linear-gradient(90deg, #3b82f6, #ef4444)' }}
                    initial={{ width: '0%' }}
                    animate={{ width: '100%' }}
                    transition={{ duration: 1.4, ease: 'easeInOut' }}
                  />
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      )}
    </AnimatePresence>
  );
}