import React from 'react';
import { motion } from 'framer-motion';
import { playSound } from '@/lib/sounds';
import { cn } from '@/lib/utils';

/**
 * Bouton avec retour sonore + animation tactile premium.
 * Remplace les <Button> ou <button> sur les actions importantes.
 */
export default function SoundButton({
  children,
  onClick,
  sound = 'tap',
  className = '',
  disabled = false,
  variant = 'primary', // 'primary' | 'ghost' | 'danger'
  ...props
}) {
  const handleClick = (e) => {
    if (disabled) return;
    playSound(sound);
    onClick?.(e);
  };

  const baseStyle = 'relative inline-flex items-center justify-center gap-2 font-semibold rounded-xl transition-colors select-none';

  const variants = {
    primary: 'bg-primary text-primary-foreground shadow-md hover:bg-primary/90',
    ghost: 'bg-transparent text-foreground hover:bg-muted',
    danger: 'bg-destructive text-destructive-foreground hover:bg-destructive/90',
  };

  return (
    <motion.button
      whileTap={{ scale: disabled ? 1 : 0.93, y: disabled ? 0 : 1 }}
      whileHover={{ scale: disabled ? 1 : 1.02 }}
      transition={{ type: 'spring', stiffness: 500, damping: 25 }}
      className={cn(baseStyle, variants[variant], disabled && 'opacity-50 pointer-events-none', className)}
      onClick={handleClick}
      disabled={disabled}
      {...props}
    >
      {/* Ripple layer */}
      <span className="absolute inset-0 rounded-xl overflow-hidden pointer-events-none">
        <span className="ripple-effect" />
      </span>
      {children}
    </motion.button>
  );
}