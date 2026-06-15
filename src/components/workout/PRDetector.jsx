import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trophy } from 'lucide-react';

export default function PRDetector({ show, exerciseName, onClose }) {
  if (!show) return null;

  // Vibrate on PR
  if (navigator.vibrate) navigator.vibrate([200, 100, 400]);

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, scale: 0.5, y: 30 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.5 }}
        transition={{ type: 'spring', stiffness: 400, damping: 20 }}
        className="fixed bottom-32 left-1/2 -translate-x-1/2 z-50"
      >
        <div className="bg-gradient-to-r from-yellow-400 to-orange-500 text-white px-6 py-4 rounded-2xl shadow-2xl text-center min-w-[200px]">
          <motion.div
            animate={{ rotate: [0, -15, 15, -15, 0] }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="text-3xl mb-1"
          >
            🏆
          </motion.div>
          <p className="font-heading text-xl tracking-wider">RECORD BATTU !</p>
          <p className="text-sm opacity-90 mt-0.5">{exerciseName}</p>
          <p className="text-xs opacity-70 mt-1">+50 XP</p>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}