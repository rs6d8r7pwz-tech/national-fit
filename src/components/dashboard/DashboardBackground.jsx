import React from 'react';
import { motion } from 'framer-motion';

// Premium animated background -- Marvel/Sport vibes, light theme
export default function DashboardBackground() {
  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden -z-10">
      {/* Primary green glow -- top right */}
      <motion.div
        animate={{ scale: [1, 1.2, 1], opacity: [0.10, 0.18, 0.10], x: [0, 15, 0] }}
        transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut' }}
        className="absolute -top-24 -right-24 h-[450px] w-[450px] rounded-full bg-green-400 blur-[80px]"
      />
      {/* Purple glow -- bottom left */}
      <motion.div
        animate={{ scale: [1, 1.15, 1], opacity: [0.07, 0.13, 0.07], x: [0, -10, 0] }}
        transition={{ duration: 13, repeat: Infinity, ease: 'easeInOut', delay: 4 }}
        className="absolute -bottom-24 -left-24 h-[400px] w-[400px] rounded-full bg-purple-400 blur-[70px]"
      />
      {/* Center emerald drift */}
      <motion.div
        animate={{ y: [-15, 15, -15], opacity: [0.04, 0.09, 0.04] }}
        transition={{ duration: 14, repeat: Infinity, ease: 'easeInOut', delay: 2 }}
        className="absolute top-1/3 left-1/2 -translate-x-1/2 h-72 w-72 rounded-full bg-emerald-300 blur-[60px]"
      />
      {/* Small accent top-left */}
      <motion.div
        animate={{ scale: [1, 1.3, 1], opacity: [0.05, 0.12, 0.05] }}
        transition={{ duration: 7, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
        className="absolute top-10 left-10 h-32 w-32 rounded-full bg-lime-300 blur-[40px]"
      />

      {/* Subtle hexagonal grid overlay */}
      <div
        className="absolute inset-0 opacity-[0.018]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='60' height='52' viewBox='0 0 60 52'%3E%3Cpolygon points='30,2 58,17 58,47 30,62 2,47 2,17' fill='none' stroke='%2316a34a' stroke-width='1'/%3E%3C/svg%3E")`,
          backgroundSize: '60px 52px',
        }}
      />

      {/* Fine dot grid */}
      <div
        className="absolute inset-0 opacity-[0.035]"
        style={{
          backgroundImage: 'radial-gradient(circle, #16a34a 1px, transparent 1px)',
          backgroundSize: '32px 32px',
        }}
      />

      {/* Diagonal light ray -- top */}
      <div
        className="absolute top-0 right-0 w-1/2 h-1/2 opacity-[0.04]"
        style={{
          background: 'linear-gradient(135deg, transparent 0%, #22c55e 50%, transparent 100%)',
        }}
      />
    </div>
  );
}