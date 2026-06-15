import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { base44 } from '@/api/base44Client';
import { useTheme } from '@/lib/ThemeContext';
import { usePremium } from '@/hooks/usePremium';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useQueryClient } from '@tanstack/react-query';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Settings as SettingsIcon,
  LogOut,
  Languages,
  User,
  Bell,
  Shield,
  ChevronRight,
  Mail,
  HeadphonesIcon,
  MessageCircle,
  Info,
  Crown,
  Sparkles,
  FileText,
  Trash2,
  ExternalLink,
  Volume2,
  VolumeX,
  Music,
  Music2,
  Gift,
  BarChart2,
} from 'lucide-react';
import { isNativeApp, SUBSCRIPTION_WEB_URL } from '@/lib/platformDetect';
import { isSoundEnabled, toggleSound, playSound, isMusicEnabled, toggleMusic } from '@/lib/sounds';

// Génère un code ami unique style "NF-XXXX"
function generateFriendCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = 'NF-';
  for (let i = 0; i < 4; i++) code += chars[Math.floor(Math.random() * chars.length)];
  return code;
}

export default function Settings() {
  const navigate = useNavigate();
  const { language, setLanguage, t } = useTheme();
  const { isPremium, profile } = usePremium();
  const qc = useQueryClient();
  const [showLogoutDialog, setShowLogoutDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [soundOn, setSoundOn] = useState(() => isSoundEnabled());
  const [musicOn, setMusicOn] = useState(() => isMusicEnabled());


  const handleToggleSound = () => {
    const newState = toggleSound();
    setSoundOn(newState);
    if (newState) playSound('tap');
  };

  const handleToggleMusic = () => {
    const newState = toggleMusic();
    setMusicOn(newState);
  };

  const handleLanguageChange = (newLang) => {
    localStorage.setItem('nationalfit-language', newLang);
    if (window.confirm(language === 'fr' ? 'La page va se recharger pour appliquer la langue. Continuer ?' : 'Page will reload to apply language. Continue?')) {
      window.location.reload();
    }
  };

  const handleLogout = async () => {
    await base44.auth.logout();
    window.location.reload();
  };

  const handleDeleteAccount = async () => {
    setDeleteLoading(true);
    const user = await base44.auth.me();
    const email = user.email;

    // Supprimer toutes les données de l'utilisateur
    const [profiles, programs, mealPlans, progressEntries, favRecipes, favPrograms, sessions, shoppingLists, prs] = await Promise.all([
      base44.entities.UserProfile.filter({ created_by: email }),
      base44.entities.WorkoutProgram.filter({ created_by: email }),
      base44.entities.MealPlan.filter({ created_by: email }),
      base44.entities.ProgressEntry.filter({ created_by: email }),
      base44.entities.FavoriteRecipe.filter({ created_by: email }),
      base44.entities.FavoriteProgram.filter({ created_by: email }),
      base44.entities.WorkoutSession.filter({ created_by: email }),
      base44.entities.ShoppingList.filter({ created_by: email }),
      base44.entities.PersonalRecord.filter({ created_by: email }),
    ]);

    await Promise.all([
      ...profiles.map(r => base44.entities.UserProfile.delete(r.id)),
      ...programs.map(r => base44.entities.WorkoutProgram.delete(r.id)),
      ...mealPlans.map(r => base44.entities.MealPlan.delete(r.id)),
      ...progressEntries.map(r => base44.entities.ProgressEntry.delete(r.id)),
      ...favRecipes.map(r => base44.entities.FavoriteRecipe.delete(r.id)),
      ...favPrograms.map(r => base44.entities.FavoriteProgram.delete(r.id)),
      ...sessions.map(r => base44.entities.WorkoutSession.delete(r.id)),
      ...shoppingLists.map(r => base44.entities.ShoppingList.delete(r.id)),
      ...prs.map(r => base44.entities.PersonalRecord.delete(r.id)),
    ]);

    await base44.auth.logout();
    window.location.reload();
  };



  const nativeApp = isNativeApp();

  const menuItems = [
    { icon: User, label: t('profil'), action: () => navigate('/profil'), color: 'text-blue-600', bg: 'bg-blue-50' },
    { icon: Gift, label: language === 'fr' ? '🎁 Parrainage -- 1 mois offert' : '🎁 Refer a friend -- 1 month free', action: () => navigate('/parrainage'), color: 'text-orange-600', bg: 'bg-orange-50' },
    { icon: BarChart2, label: '📊 Admin Dashboard', action: () => navigate('/admin'), color: 'text-purple-600', bg: 'bg-purple-50' },
    {
      icon: nativeApp ? ExternalLink : Crown,
      label: language === 'fr' ? 'Abonnement Premium' : 'Premium Subscription',
      action: () => nativeApp ? window.open(SUBSCRIPTION_WEB_URL, '_system') : navigate('/pricing'),
      color: 'text-yellow-600',
      bg: 'bg-yellow-50',
    },
    { icon: Bell, label: t('notifications'), action: () => {}, disabled: true, color: 'text-slate-400', bg: 'bg-slate-50' },
    { icon: Shield, label: language === 'fr' ? 'Confidentialité & CGU' : 'Privacy & ToS', action: () => navigate('/legal?tab=privacy'), color: 'text-green-600', bg: 'bg-green-50' },
    { icon: FileText, label: language === 'fr' ? 'Mentions légales' : 'Legal notices', action: () => navigate('/legal?tab=mentions'), color: 'text-slate-600', bg: 'bg-slate-100' },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-5 pb-8"
    >
      {/* Header */}
      <div className="flex items-center gap-3 pt-1">
        <div className="h-10 w-10 rounded-xl bg-blue-600 flex items-center justify-center shadow-md">
          <SettingsIcon className="h-5 w-5 text-white" />
        </div>
        <div>
          <h1 className="font-heading text-3xl tracking-wider text-blue-700">{t('settings')}</h1>
          <p className="text-xs text-slate-500">{language === 'fr' ? 'Gérer mon compte' : 'Manage my account'}</p>
        </div>
      </div>

      {/* Premium Status Banner */}
      {isPremium ? (
        <div className="bg-gradient-to-r from-blue-600 to-blue-500 rounded-2xl p-4 flex items-center gap-3 text-white shadow-md">
          <Crown className="h-6 w-6 text-yellow-300 shrink-0" />
          <div className="flex-1">
            <p className="font-bold text-sm">{language === 'fr' ? 'Abonnement Premium actif ✨' : 'Premium subscription active ✨'}</p>
            <p className="text-blue-100 text-xs">{language === 'fr' ? `Plan ${profile?.subscription_plan === 'monthly' ? 'mensuel' : 'annuel'} -- toutes les fonctionnalités débloquées` : `${profile?.subscription_plan === 'monthly' ? 'Monthly' : 'Annual'} plan -- all features unlocked`}</p>
          </div>
        </div>
      ) : (
        <button
          onClick={() => nativeApp ? window.open(SUBSCRIPTION_WEB_URL, '_system') : navigate('/pricing')}
          className="w-full bg-gradient-to-r from-blue-50 to-white border border-blue-200 rounded-2xl p-4 flex items-center gap-3 shadow-sm hover:shadow-md transition-shadow text-left"
        >
          <div className="h-10 w-10 rounded-xl bg-blue-600 flex items-center justify-center shrink-0">
            <Sparkles className="h-5 w-5 text-white" />
          </div>
          <div className="flex-1">
            <p className="font-bold text-sm text-blue-800">{language === 'fr' ? 'Passer Premium' : 'Go Premium'}</p>
            <p className="text-blue-500 text-xs">{language === 'fr' ? 'Dès 5€/mois -- accès illimité à tout' : 'From €5/month -- unlimited access to everything'}</p>
          </div>
          <ChevronRight className="h-4 w-4 text-blue-400" />
        </button>
      )}

      {/* Audio Settings */}
      <Card className="border-blue-100 shadow-sm">
        <CardHeader className="pb-2">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-blue-100 flex items-center justify-center">
              <Volume2 className="h-4 w-4 text-blue-600" />
            </div>
            <CardTitle className="text-base text-slate-800">Audio</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-1 pt-0">
          {/* Toggle Effets sonores */}
          <button
            onClick={handleToggleSound}
            className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-blue-50 transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className={`h-8 w-8 rounded-lg flex items-center justify-center ${soundOn ? 'bg-blue-100' : 'bg-slate-100'}`}>
                {soundOn ? <Volume2 className="h-4 w-4 text-blue-600" /> : <VolumeX className="h-4 w-4 text-slate-400" />}
              </div>
              <div className="text-left">
                <p className="text-sm font-medium text-slate-700">{language === 'fr' ? 'Effets sonores' : 'Sound effects'}</p>
                <p className="text-xs text-slate-400">{soundOn ? (language === 'fr' ? 'Clics, succès, timer...' : 'Clicks, success, timer...') : (language === 'fr' ? 'Désactivés' : 'Disabled')}</p>
              </div>
            </div>
            <div className={`w-11 h-6 rounded-full transition-colors relative ${soundOn ? 'bg-blue-600' : 'bg-slate-300'}`}>
              <div className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${soundOn ? 'translate-x-5' : 'translate-x-0.5'}`} />
            </div>
          </button>

          {/* Toggle Musique d'ambiance */}
          <button
            onClick={handleToggleMusic}
            className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-blue-50 transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className={`h-8 w-8 rounded-lg flex items-center justify-center ${musicOn ? 'bg-purple-100' : 'bg-slate-100'}`}>
                {musicOn ? <Music className="h-4 w-4 text-purple-600" /> : <Music2 className="h-4 w-4 text-slate-400" />}
              </div>
              <div className="text-left">
                <p className="text-sm font-medium text-slate-700">{language === 'fr' ? "Musique d'ambiance" : 'Ambient music'}</p>
                <p className="text-xs text-slate-400">{musicOn ? (language === 'fr' ? 'Pad doux en fond -- motivant' : 'Soft ambient pad -- motivating') : (language === 'fr' ? 'Désactivée' : 'Disabled')}</p>
              </div>
            </div>
            <div className={`w-11 h-6 rounded-full transition-colors relative ${musicOn ? 'bg-purple-500' : 'bg-slate-300'}`}>
              <div className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${musicOn ? 'translate-x-5' : 'translate-x-0.5'}`} />
            </div>
          </button>
        </CardContent>
      </Card>

      {/* Language Selection */}
      <Card className="border-blue-100 shadow-sm">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-blue-100 flex items-center justify-center">
              <Languages className="h-4 w-4 text-blue-600" />
            </div>
            <div>
              <CardTitle className="text-base text-slate-800">{t('language')}</CardTitle>
              <CardDescription className="text-xs">{language === 'fr' ? 'Sélectionne ta langue' : 'Select your language'}</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Select value={language} onValueChange={handleLanguageChange}>
            <SelectTrigger className="border-blue-200 focus:ring-blue-400">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="fr">🇫🇷 Français</SelectItem>
              <SelectItem value="en">🇬🇧 English</SelectItem>
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {/* Navigation Menu */}
      <Card className="border-blue-100 shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-base text-slate-800">{language === 'fr' ? 'Navigation' : 'Navigation'}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-1 pt-0">
          {menuItems.map((item, i) => (
            <button
              key={i}
              onClick={item.action}
              disabled={item.disabled}
              className={`w-full flex items-center justify-between p-3 rounded-xl transition-colors ${
                item.disabled
                  ? 'opacity-40 cursor-not-allowed'
                  : 'hover:bg-blue-50 active:bg-blue-100'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className={`h-8 w-8 rounded-lg ${item.bg} flex items-center justify-center`}>
                  <item.icon className={`h-4 w-4 ${item.color}`} />
                </div>
                <span className="text-sm font-medium text-slate-700">{item.label}</span>
              </div>
              {!item.disabled && (
                <ChevronRight className="h-4 w-4 text-slate-400" />
              )}
            </button>
          ))}
        </CardContent>
      </Card>

      {/* Support Section */}
      <Card className="border-blue-200 shadow-sm" style={{ background: 'linear-gradient(135deg, #eff6ff, #ffffff)' }}>
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-blue-600 flex items-center justify-center">
              <HeadphonesIcon className="h-4 w-4 text-white" />
            </div>
            <div>
              <CardTitle className="text-base text-blue-800">Aide & Support</CardTitle>
              <CardDescription className="text-xs text-blue-600">Nous sommes là pour vous aider</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-slate-600 leading-relaxed">
            {language === 'fr' ? "Une question ? Un problème ? Notre équipe est disponible pour t'accompagner dans ton parcours National Fit." : "A question? An issue? Our team is available to support you on your National Fit journey."}
          </p>
          <a
            href="mailto:nfitfrance@outlook.fr"
            className="flex items-center gap-3 p-3 rounded-xl bg-blue-600 text-white hover:bg-blue-700 transition-colors shadow-md group"
            style={{ boxShadow: '0 4px 14px rgba(30,80,220,0.25)' }}
          >
            <div className="h-8 w-8 rounded-lg bg-white/20 flex items-center justify-center">
              <Mail className="h-4 w-4 text-white" />
            </div>
            <div className="flex-1">
              <p className="text-xs text-blue-200 leading-none">{language === 'fr' ? 'Contacter le support' : 'Contact support'}</p>
              <p className="text-sm font-bold leading-none mt-0.5">nfitfrance@outlook.fr</p>
            </div>
            <ChevronRight className="h-4 w-4 text-blue-200 group-hover:translate-x-1 transition-transform" />
          </a>
          <div className="flex items-center gap-3 p-3 rounded-xl bg-blue-50 border border-blue-200">
            <div className="h-8 w-8 rounded-lg bg-blue-100 flex items-center justify-center">
              <MessageCircle className="h-4 w-4 text-blue-600" />
            </div>
            <div>
              <p className="text-xs text-blue-500 leading-none">{language === 'fr' ? 'Temps de réponse' : 'Response time'}</p>
              <p className="text-sm font-semibold text-blue-800 leading-none mt-0.5">{language === 'fr' ? 'Sous 24h en jours ouvrés' : 'Within 24h on business days'}</p>
            </div>
          </div>
          <div className="flex items-start gap-2 p-3 rounded-xl bg-slate-50 border border-slate-200">
            <Info className="h-4 w-4 text-slate-400 mt-0.5 shrink-0" />
            <p className="text-xs text-slate-500 leading-relaxed">
              {language === 'fr' ? "Merci d'indiquer ton prénom et ton objectif dans ton email pour un suivi personnalisé." : "Please include your first name and goal in your email for personalized support."}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Logout + Delete */}
      <Card className="border-red-100 shadow-sm">
        <CardContent className="pt-4 space-y-2">
          <Button
            variant="outline"
            onClick={() => setShowLogoutDialog(true)}
            className="w-full gap-2 border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300"
          >
            <LogOut className="h-4 w-4" />
            {t('logout')}
          </Button>
          <Button
            variant="ghost"
            onClick={() => setShowDeleteDialog(true)}
            className="w-full gap-2 text-slate-400 hover:text-red-500 hover:bg-red-50 text-xs"
          >
            <Trash2 className="h-3.5 w-3.5" />
            {language === 'fr' ? 'Supprimer mon compte' : 'Delete my account'}
          </Button>
        </CardContent>
      </Card>

      {/* Version + Legal links */}
      <div className="text-center space-y-1 pb-2">
        <p className="text-xs text-slate-400">NATIONAL FIT · v1.0.0</p>
        <div className="flex items-center justify-center gap-3 text-xs text-slate-400">
          <button onClick={() => navigate('/legal?tab=cgu')} className="underline hover:text-blue-500">{language === 'fr' ? 'CGU' : 'ToS'}</button>
          <span>·</span>
          <button onClick={() => navigate('/legal?tab=privacy')} className="underline hover:text-blue-500">{language === 'fr' ? 'Confidentialité' : 'Privacy'}</button>
          <span>·</span>
          <button onClick={() => navigate('/legal?tab=mentions')} className="underline hover:text-blue-500">{language === 'fr' ? 'Mentions légales' : 'Legal notices'}</button>
        </div>
      </div>

      {/* Delete Account Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="text-red-600">{language === 'fr' ? 'Supprimer mon compte ?' : 'Delete my account?'}</AlertDialogTitle>
            <AlertDialogDescription>
              {language === 'fr' ? <span>Cette action est <strong>irréversible</strong>. Toutes tes données (profil, programmes, progression) seront définitivement supprimées. Ton abonnement Stripe devra être annulé séparément.</span> : <span>This action is <strong>irreversible</strong>. All your data (profile, programs, progress) will be permanently deleted. Your Stripe subscription must be cancelled separately.</span>}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteLoading}>{language === 'fr' ? 'Annuler' : 'Cancel'}</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteAccount}
              disabled={deleteLoading}
              className="bg-red-600 hover:bg-red-700"
            >
              {deleteLoading ? (language === 'fr' ? 'Suppression...' : 'Deleting...') : (language === 'fr' ? 'Supprimer définitivement' : 'Delete permanently')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Logout Dialog */}
      <AlertDialog open={showLogoutDialog} onOpenChange={setShowLogoutDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{language === 'fr' ? 'Se déconnecter ?' : 'Logout?'}</AlertDialogTitle>
            <AlertDialogDescription>
              {language === 'fr'
                ? 'Es-tu sûr de vouloir te déconnecter ? Tu devras te reconnecter pour accéder à ton compte.'
                : 'Are you sure you want to logout? You will need to sign in again to access your account.'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{language === 'fr' ? 'Annuler' : 'Cancel'}</AlertDialogCancel>
            <AlertDialogAction onClick={handleLogout} className="bg-red-600 hover:bg-red-700">
              {language === 'fr' ? 'Se déconnecter' : 'Logout'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </motion.div>
  );
}