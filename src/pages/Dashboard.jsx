import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2 } from 'lucide-react';
import { useTheme } from '@/lib/ThemeContext';
import OnboardingForm from '@/components/onboarding/OnboardingForm';
import DarkHeroBanner from '@/components/dashboard/DarkHeroBanner';
import DarkStatsRow from '@/components/dashboard/DarkStatsRow';
import DailyCheckIn from '@/components/dashboard/DailyCheckIn';

import WeeklyChallenge from '@/components/dashboard/WeeklyChallenge';
import WeeklyAISummary from '@/components/dashboard/WeeklyAISummary';
import CoachInsights from '@/components/dashboard/CoachInsights';
import RecoveryWidget from '@/components/dashboard/RecoveryWidget';
import AchievementBadges from '@/components/gamification/AchievementBadges';
import FitnessScores from '@/components/dashboard/FitnessScores';
import UserGoalsWidget from '@/components/goals/UserGoalsWidget';
import OnboardingTutorial from '@/components/onboarding/OnboardingTutorial';
import NotificationSetup from '@/components/notifications/NotificationSetup';
import { getLevel } from '@/lib/levels';
import EmptyProgramCTA from '@/components/dashboard/EmptyProgramCTA';
import PostOnboardingTrial from '@/components/dashboard/PostOnboardingTrial';
import StreakRecovery from '@/components/dashboard/StreakRecovery';

const TUTORIAL_KEY = 'nationalfit_tutorial_done';

export default function Dashboard() {
  const { t, language, getThemePersonality } = useTheme();
  const themePersonality = getThemePersonality();
  const queryClient = useQueryClient();
  const [checkInDone, setCheckInDone] = useState(() => {
    const key = 'nationalfit_checkin_' + new Date().toISOString().split('T')[0];
    try { return !!localStorage.getItem(key); } catch { return false; }
  });
  const [showTutorial, setShowTutorial] = useState(() => {
    try { return !localStorage.getItem(TUTORIAL_KEY); } catch { return false; }
  });
  const [onboardingDone, setOnboardingDone] = useState(false);

  const { data: profiles, isLoading: loadingProfile } = useQuery({
    queryKey: ['userProfile'],
    queryFn: () => base44.entities.UserProfile.list(),
    initialData: [],
  });

  const { data: progressEntries = [] } = useQuery({
    queryKey: ['progress'],
    queryFn: () => base44.entities.ProgressEntry.list('-date', 30),
    initialData: [],
  });

  const { data: programs = [] } = useQuery({
    queryKey: ['programs'],
    queryFn: () => base44.entities.WorkoutProgram.list('-created_at'),
    initialData: [],
  });

  const createProfileMutation = useMutation({
    mutationFn: async (data) => {
      const authUser = await base44.auth.me();
      return base44.entities.UserProfile.create({ ...data, email: authUser?.email || '' });
    },
    onSuccess: async (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['userProfile'] });
    },
  });

  const profile = profiles?.[0];

  if (loadingProfile) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="h-14 w-14 rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-xl" style={{ background: `linear-gradient(135deg, hsl(${themePersonality.colors.primary}), hsl(${themePersonality.colors.accent}))`, boxShadow: `0 0 30px hsla(${themePersonality.colors.primary}, 0.3)` }}>
            <span className="text-2xl font-heading text-white font-bold">N</span>
          </div>
          <Loader2 className="h-6 w-6 animate-spin mx-auto" style={{ color: `hsl(${themePersonality.colors.primary})` }} />
        </div>
      </div>
    );
  }

  // Affiche le form d'onboarding si pas encore fait (et pas juste terminé)
  if (!profile?.onboarding_complete && !onboardingDone) {
    return (
      <OnboardingForm onComplete={(data) => {
        if (!createProfileMutation.isPending && !createProfileMutation.isSuccess) {
          createProfileMutation.mutate(data);
          try { localStorage.removeItem(TUTORIAL_KEY); } catch {}
          setShowTutorial(true);
          setOnboardingDone(true);
        }
      }} />
    );
  }

  // Compute next session for hero banner
  const activeProgram = programs.find(p => p.is_active && !p.completed);
  const sessionIdx = activeProgram?.sessions_done || 0;
  const nextSession = activeProgram && activeProgram.sessions?.[sessionIdx] ? {
    name: activeProgram.sessions[sessionIdx].name,
    programId: activeProgram.id,
    sessionIdx,
  } : null;

  const stagger = {
    hidden: {},
    show: { transition: { staggerChildren: 0.09 } },
  };
  const fadeUp = {
    hidden: { opacity: 0, y: 22 },
    show: { opacity: 1, y: 0, transition: { duration: 0.45, ease: [0.22, 1, 0.36, 1] } },
  };

  const hasNoProgram = programs.length === 0;

  return (
    <>
    {showTutorial && (
      <OnboardingTutorial onDone={() => {
        localStorage.setItem(TUTORIAL_KEY, '1');
        setShowTutorial(false);
      }} />
    )}
    <motion.div variants={stagger} initial="hidden" animate="show" className="space-y-4 pb-4">
      {/* Trial banner for new users */}
      <motion.div variants={fadeUp}>
        <PostOnboardingTrial />
      </motion.div>

      {/* Daily Check-In -- shown if not done today */}
      <AnimatePresence>
        {!checkInDone && (
          <motion.div variants={fadeUp}>
            <DailyCheckIn onComplete={(answers) => {
              setCheckInDone(true);
              queryClient.invalidateQueries({ queryKey: ['progress'] });
            }} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Streak Recovery */}
      {profile && (
        <motion.div variants={fadeUp}>
          <StreakRecovery profile={profile} onRecovered={() => queryClient.invalidateQueries({ queryKey: ['userProfile'] })} />
        </motion.div>
      )}

      {/* CTA si aucun programme */}
      {hasNoProgram && (
        <motion.div variants={fadeUp}>
          <EmptyProgramCTA />
        </motion.div>
      )}

      {/* Hero Banner */}
      <motion.div variants={fadeUp}>
        <DarkHeroBanner profile={profile} nextSession={nextSession} progressEntries={progressEntries} />
      </motion.div>



      {/* Stats row */}
      <motion.div variants={fadeUp}>
        <DarkStatsRow progressEntries={progressEntries} programs={programs} profile={profile} />
      </motion.div>

      {/* Recovery Widget -- affiché si check-in fait aujourd'hui */}
      <motion.div variants={fadeUp}>
        <RecoveryWidget entries={progressEntries} />
      </motion.div>

      {/* Coach IA -- Analyse proactive */}
      <motion.div variants={fadeUp}>
        <CoachInsights profile={profile} progressEntries={progressEntries} />
      </motion.div>

      {/* Badges compact */}
      {profile && (
        <motion.div variants={fadeUp}>
          <div className="rounded-2xl p-4 shadow-md"
            style={{ background: 'linear-gradient(135deg, rgba(20,50,180,0.10) 0%, rgba(255,255,255,0.85) 60%)', border: '1px solid rgba(30,80,220,0.20)', backdropFilter: 'blur(8px)' }}>
            <p className="text-xs font-bold text-blue-700 uppercase tracking-wider mb-3">🏆 {language === 'fr' ? 'Mes badges' : 'My badges'}</p>
            <AchievementBadges profile={profile} compact />
          </div>
        </motion.div>
      )}

      {/* Weekly Challenge */}
      <motion.div variants={fadeUp}>
        <WeeklyChallenge profile={profile} progressEntries={progressEntries} />
      </motion.div>

      {/* Fitness Scores */}
      {profile && (
        <motion.div variants={fadeUp}>
          <FitnessScores profile={profile} />
        </motion.div>
      )}

      {/* Objectifs */}
      {profile && (
        <motion.div variants={fadeUp}>
          <UserGoalsWidget profile={profile} />
        </motion.div>
      )}

      {/* Notifications setup */}
      {profile && (
        <motion.div variants={fadeUp}>
          <NotificationSetup profile={profile} nextSession={nextSession} />
        </motion.div>
      )}

      {/* Weekly AI Summary */}
      <motion.div variants={fadeUp}>
        <WeeklyAISummary profile={profile} progressEntries={progressEntries} programs={programs} />
      </motion.div>
    </motion.div>
    </>
  );
}