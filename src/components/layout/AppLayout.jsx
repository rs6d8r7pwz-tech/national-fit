import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, Dumbbell, UtensilsCrossed, User, Settings, History } from 'lucide-react';
import { getLevel } from '@/lib/levels';
import LevelRewardsModal from '@/components/dashboard/LevelRewardsModal';
import { cn } from '@/lib/utils';

import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { useTheme } from '@/lib/ThemeContext';
import FloatingChat from '@/components/coach/FloatingChat';
import AnimatedBackground from '@/components/ui/AnimatedBackground';
import { playSound, startAmbient, isMusicEnabled } from '@/lib/sounds';

// Session timeout: 60 minutes d'inactivité → déconnexion automatique
const SESSION_TIMEOUT_MS = 60 * 60 * 1000;

const navItems = [
  { path: '/', icon: LayoutDashboard, labelKey: 'dashboard' },
  { path: '/programmes', icon: Dumbbell, labelKey: 'programmes' },
  { path: '/nutrition', icon: UtensilsCrossed, labelKey: 'nutrition' },
  { path: '/historique', icon: History, labelKey: 'historique' },
  { path: '/parametres', icon: Settings, labelKey: 'parametres' },
];

export default function AppLayout() {
  const location = useLocation();
  const { t } = useTheme();
  const timerRef = useRef(null);

  // Session inactivity timeout — désactivé sur la page séance (/seance)
  useEffect(() => {
    if (location.pathname === '/seance') return;
    const resetTimer = () => {
      clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => {
        base44.auth.logout();
      }, SESSION_TIMEOUT_MS);
    };
    const events = ['mousedown', 'mousemove', 'keydown', 'touchstart', 'scroll', 'click'];
    events.forEach(e => window.addEventListener(e, resetTimer, { passive: true }));
    resetTimer();
    return () => {
      clearTimeout(timerRef.current);
      events.forEach(e => window.removeEventListener(e, resetTimer));
    };
  }, [location.pathname]);

  // Prevent content caching on back/forward navigation
  useEffect(() => {
    window.history.replaceState(null, '', window.location.href);
  }, [location.pathname]);

  const [showLevels, setShowLevels] = useState(false);

  // Démarrer la musique d'ambiance au premier geste utilisateur (autoplay policy)
  useEffect(() => {
    const start = () => { startAmbient(); window.removeEventListener('click', start); window.removeEventListener('touchstart', start); };
    window.addEventListener('click', start, { once: true, passive: true });
    window.addEventListener('touchstart', start, { once: true, passive: true });
    return () => { window.removeEventListener('click', start); window.removeEventListener('touchstart', start); };
  }, []);

  const { data: profiles } = useQuery({
    queryKey: ['userProfile'],
    queryFn: () => base44.entities.UserProfile.list(),
    initialData: [],
  });
  const profile = profiles?.[0];
  const xp = profile?.xp_points || 0;
  const level = getLevel(xp);

  return (
    <div className="min-h-screen flex flex-col" style={{ background: 'linear-gradient(160deg, #b8d4ff 0%, #d6e8ff 18%, #eef4ff 38%, #f8f8ff 55%, #ffeef0 75%, #ffc8cc 100%)', backgroundAttachment: 'fixed' }}>
      <AnimatedBackground />
      {showLevels && <LevelRewardsModal xp={xp} onClose={() => setShowLevels(false)} />}

      {/* Top header */}
      <header className="fixed top-0 left-0 right-0 z-40 h-14 flex items-center justify-between px-4 border-b border-blue-200"
        style={{ background: 'linear-gradient(135deg, rgba(20,50,180,0.92) 0%, rgba(30,70,200,0.88) 60%, rgba(180,20,30,0.82) 100%)', backdropFilter: 'blur(20px)', boxShadow: '0 2px 24px rgba(20,50,180,0.30)' }}>
        <Link to="/" className="flex items-center gap-2.5">
          <div className="h-8 w-8 rounded-lg flex items-center justify-center shadow-md" style={{ background: 'linear-gradient(135deg, hsl(220,90%,50%), hsl(0,80%,52%))' }}>
            <span className="text-base font-heading text-white font-bold">N</span>
          </div>
          <span className="font-heading text-xl tracking-widest" style={{ color: '#fff', textShadow: '0 0 18px rgba(255,255,255,0.5)' }}>NATIONAL FIT</span>
        </Link>
        {profile && (
          <div className="flex items-center gap-2">
            {/* Level badge — clickable */}
            <button id="level-badge" onClick={() => setShowLevels(true)}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl transition-all active:scale-95"
              style={{ background: 'rgba(255,255,255,0.18)', border: '1px solid rgba(255,255,255,0.35)', backdropFilter: 'blur(8px)' }}>
              <span className="text-sm">{level.emoji}</span>
              <div className="text-left">
                <p className="text-[9px] font-semibold leading-none text-white/90">{level.label}</p>
                <p className="text-[10px] font-bold text-yellow-300 leading-none mt-0.5">{xp.toLocaleString('fr-FR')} XP</p>
              </div>
            </button>
            <Link to="/parametres" className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-white/15 border border-white/25 backdrop-blur-sm hover:bg-white/20 transition-all">
              <User className="h-4 w-4 text-white" />
            </Link>
          </div>
        )}
      </header>

      {/* Main Content */}
      <main className="flex-1 pt-14 pb-20">
        <div className="max-w-lg mx-auto px-4 py-4">
          <Outlet />
        </div>
      </main>

      {/* Bottom navigation */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 flex items-center justify-around"
        style={{ background: 'linear-gradient(180deg, rgba(12,28,100,0.97) 0%, rgba(15,35,120,0.99) 100%)', backdropFilter: 'blur(24px)', borderTop: '1px solid rgba(80,120,255,0.30)', paddingBottom: 'env(safe-area-inset-bottom, 0)', boxShadow: '0 -4px 24px rgba(10,30,160,0.35)' }}>
        {navItems.map(item => {
          const active = location.pathname === item.path;
          const navId = `nav-${item.labelKey}`;
          return (
            <Link key={item.path} to={item.path} id={navId}
              className={cn(
                'flex flex-col items-center gap-0.5 px-4 py-3 rounded-xl transition-all duration-150 relative',
                active ? 'text-white' : 'text-blue-300/70 hover:text-blue-200'
              )}
              onClick={() => { if (!active) playSound('tap'); }}
            >
              {active && (
                <motion.span
                  layoutId="nav-indicator"
                  className="absolute top-1 left-1/2 -translate-x-1/2 h-0.5 w-8 rounded-full"
                  style={{ background: 'linear-gradient(90deg, #3b82f6, #ef4444)' }}
                  transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                />
              )}
              {active && (
                <motion.div
                  layoutId="nav-bg"
                  className="absolute inset-1 rounded-xl"
                  style={{ background: 'linear-gradient(135deg, rgba(59,130,246,0.25), rgba(239,68,68,0.18))' }}
                  transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                />
              )}
              <motion.div
                whileTap={{ scale: 0.75, rotate: active ? 0 : -8 }}
                animate={active ? { scale: [1, 1.25, 1], y: [0, -3, 0] } : { scale: 1 }}
                transition={{ duration: 0.35, ease: 'easeOut' }}
                className="relative z-10"
              >
                <item.icon className={cn('h-5 w-5 transition-all duration-200', active ? 'text-white drop-shadow-[0_0_6px_rgba(100,160,255,0.8)]' : '')} />
              </motion.div>
              <motion.span
                animate={active ? { y: [2, 0], opacity: [0.5, 1] } : {}}
                transition={{ duration: 0.2 }}
                className={cn('text-[10px] font-semibold relative z-10', active ? 'text-white' : 'font-medium')}
              >
                {t(item.labelKey)}
              </motion.span>
            </Link>
          );
        })}
      </nav>

      {profile?.onboarding_complete && <FloatingChat profile={profile} />}
    </div>
  );
}