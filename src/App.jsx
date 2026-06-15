import React from 'react';
import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import { ThemeProvider } from '@/lib/ThemeContext';
import UserNotRegisteredError from '@/components/UserNotRegisteredError';

import AppLayout from '@/components/layout/AppLayout.jsx';
import SplashScreen from '@/components/layout/SplashScreen.jsx';
import Dashboard from '@/pages/Dashboard.jsx';
import Programs from '@/pages/Programs.jsx';
import LiveWorkout from '@/pages/LiveWorkout.jsx';
import Nutrition from '@/pages/Nutrition';
import Progress from '@/pages/Progress';
import Profile from '@/pages/Profile.jsx';
import Settings from '@/pages/Settings.jsx';
import Pricing from '@/pages/Pricing.jsx';
import Legal from '@/pages/Legal.jsx';
import History from '@/pages/History.jsx';
import Referral from '@/pages/Referral.jsx';
import Admin from '@/pages/Admin.jsx';
import Login from '@/pages/Login.jsx';
import Register from '@/pages/Register.jsx';
import ForgotPassword from '@/pages/ForgotPassword.jsx';
import ResetPassword from '@/pages/ResetPassword.jsx';
import CoachChat from '@/pages/CoachChat.jsx';

const AuthenticatedApp = () => {
  const { isLoadingAuth, isAuthenticated } = useAuth();

  if (isLoadingAuth) {
    return (
      <div className="fixed inset-0 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/legal" element={<Legal />} />
        <Route path="*" element={<Login />} />
      </Routes>
    );
  }

  return (
    <Routes>
      <Route element={<AppLayout />}>
        <Route path="/" element={<Dashboard />} />
        <Route path="/programmes" element={<Programs />} />
        <Route path="/nutrition" element={<Nutrition />} />
        <Route path="/progres" element={<Progress />} />
        <Route path="/profil" element={<Profile />} />
        <Route path="/parametres" element={<Settings />} />
        <Route path="/pricing" element={<Pricing />} />
        <Route path="/legal" element={<Legal />} />
        <Route path="/historique" element={<History />} />
        <Route path="/parrainage" element={<Referral />} />
        <Route path="/admin" element={<Admin />} />
        <Route path="/coach" element={<CoachChat />} />
      </Route>
      <Route path="/seance" element={<LiveWorkout />} />
      <Route path="*" element={<PageNotFound />} />
    </Routes>
  );
};

function App() {
  const SPLASH_KEY = 'nfit_splash_shown';
  const [splashDone, setSplashDone] = React.useState(() => {
    try { return !!sessionStorage.getItem(SPLASH_KEY); } catch { return false; }
  });

  const handleSplashDone = () => {
    try { sessionStorage.setItem(SPLASH_KEY, '1'); } catch {}
    setSplashDone(true);
  };

  return (
    <ThemeProvider>
      <AuthProvider>
        <QueryClientProvider client={queryClientInstance}>
          {!splashDone && <SplashScreen onDone={handleSplashDone} />}
          <Router>
            <AuthenticatedApp />
          </Router>
          <Toaster />
        </QueryClientProvider>
      </AuthProvider>
    </ThemeProvider>
  )
}

export default App
