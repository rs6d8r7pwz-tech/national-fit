import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Check, Sparkles, Crown, Star, ArrowLeft, ExternalLink, Smartphone } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useNavigate, Link } from 'react-router-dom';
import { isNativeApp, isInIframe, SUBSCRIPTION_WEB_URL } from '@/lib/platformDetect';

const FREE_FEATURES = [
  '1 programme actif maximum',
  '3 recettes IA par jour',
  '1 plan alimentaire par semaine',
  'Suivi basique des séances',
  'Check-in quotidien',
];

const PREMIUM_FEATURES = [
  'Programmes illimités',
  'Recettes IA illimitées',
  'Plans alimentaires illimités',
  'Statistiques avancées',
  'Export PDF programmes & plans',
  'Optimisation IA avancée',
  'Historique complet des séances',
  'Adaptation automatique selon progression',
];

export default function Pricing() {
  const navigate = useNavigate();
  const [billingPeriod, setBillingPeriod] = useState('yearly');
  const [loading, setLoading] = useState(null);
  const [trialStarted, setTrialStarted] = useState(false);

  // Check if coming via referral
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const ref = urlParams.get('ref');
    if (ref) sessionStorage.setItem('referral_code', ref);
  }, []);

  const { data: profiles = [] } = useQuery({
    queryKey: ['userProfile'],
    queryFn: () => base44.entities.UserProfile.list(),
    initialData: [],
  });

  const profile = profiles?.[0];
  const expiresAt = profile?.premium_expires_at || profile?.subscription_end_date || profile?.trial_ends_at;
  const isPremium = (profile?.is_premium === true || profile?.subscription_status === 'premium') && (!expiresAt || new Date(expiresAt) > new Date());

  const nativeApp = isNativeApp();
  const inIframe = isInIframe();

  const handleSubscribe = async (plan) => {
    // ⚠️ Dans un aperçu iframe (base44 preview)
    if (inIframe) {
      alert('Le paiement est uniquement disponible depuis l\'application publiée, pas depuis l\'aperçu.');
      return;
    }
    // ⚠️ Dans l'app native iOS/Android : redirection vers le site web
    // (Apple App Store & Google Play interdisent Stripe en in-app)
    if (nativeApp) {
      window.open(SUBSCRIPTION_WEB_URL, '_system');
      return;
    }

    // Stripe pas encore configuré — afficher un message clair
    alert(‘Le paiement en ligne arrive bientôt ! Pour l\’instant, contacte l\’admin pour activer ton accès Premium.’);
    return;
  };

  const handleStartTrial = async () => {
    // Essai gratuit géré manuellement via l’admin pour l’instant
    alert(‘Pour activer ton essai gratuit, contacte l\’administrateur de l\’application.’);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white pb-16">
      <div className="max-w-lg mx-auto px-4 pt-8 space-y-8">

        {/* Header */}
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="p-2 rounded-xl hover:bg-blue-100 transition-colors">
            <ArrowLeft className="h-5 w-5 text-blue-600" />
          </button>
          <div>
            <h1 className="font-heading text-3xl tracking-wider text-blue-700">PREMIUM</h1>
            <p className="text-xs text-slate-500">Débloque tout le potentiel de National Fit</p>
          </div>
        </div>

        {/* Bannière info app native — conformité App Store / Google Play */}
        {nativeApp && !isPremium && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
            className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-start gap-3">
            <Smartphone className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-amber-800 text-sm">Abonnement via le site web</p>
              <p className="text-amber-700 text-xs mt-1 leading-relaxed">
                Pour vous abonner depuis l'application mobile, vous serez redirigé vers notre site web. C'est rapide et sécurisé.
              </p>
            </div>
          </motion.div>
        )}

        {/* Premium badge if already subscribed */}
        {isPremium && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
            className="bg-gradient-to-r from-blue-600 to-blue-500 rounded-2xl p-4 flex items-center gap-3 text-white shadow-lg">
            <Crown className="h-6 w-6 text-yellow-300" />
            <div>
              <p className="font-bold text-sm">Tu es déjà Premium ! 🎉</p>
              <p className="text-blue-100 text-xs">Plan {profile?.subscription_plan === 'monthly' ? 'mensuel' : 'annuel'} actif</p>
            </div>
          </motion.div>
        )}

        {/* Trial 7 jours banner */}
        {!isPremium && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
            className="relative rounded-2xl overflow-hidden p-5 text-white shadow-xl"
            style={{ background: 'linear-gradient(135deg, hsl(35,92%,50%), hsl(0,80%,52%))' }}
          >
            <div className="absolute top-0 right-0 w-28 h-28 bg-white/10 rounded-full -translate-y-14 translate-x-14" />
            <div className="relative">
              <div className="flex items-center gap-2 mb-2">
                <Sparkles className="h-5 w-5 text-yellow-200" />
                <Badge className="bg-white/20 text-white border-0 text-xs font-bold">OFFRE LIMITÉE</Badge>
              </div>
              <p className="font-heading text-2xl tracking-wider mb-1">7 JOURS GRATUITS</p>
              <p className="text-white/80 text-sm mb-4">Essaie Premium sans engagement. Annule quand tu veux.</p>
              <Button
                onClick={handleStartTrial}
                disabled={loading === 'trial'}
                className="w-full bg-white text-orange-600 hover:bg-orange-50 font-bold h-11"
              >
                {loading === 'trial'
                  ? <div className="flex items-center gap-2"><div className="w-4 h-4 border-2 border-orange-600 border-t-transparent rounded-full animate-spin" />Chargement...</div>
                  : '🎁 Commencer l\'essai gratuit'}
              </Button>
            </div>
          </motion.div>
        )}

        {/* Toggle mensuel / annuel */}
        <div className="flex items-center justify-center">
          <div className="flex bg-white rounded-2xl p-1 border border-blue-100 shadow-sm gap-1">
            <button
              onClick={() => setBillingPeriod('monthly')}
              className={`px-5 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                billingPeriod === 'monthly'
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'text-slate-500 hover:text-blue-600'
              }`}
            >
              Mensuel
            </button>
            <button
              onClick={() => setBillingPeriod('yearly')}
              className={`px-5 py-2.5 rounded-xl text-sm font-semibold transition-all flex items-center gap-2 ${
                billingPeriod === 'yearly'
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'text-slate-500 hover:text-blue-600'
              }`}
            >
              Annuel
              <span className={`text-xs px-2 py-0.5 rounded-full font-bold ${
                billingPeriod === 'yearly' ? 'bg-yellow-400 text-yellow-900' : 'bg-green-100 text-green-700'
              }`}>-50%</span>
            </button>
          </div>
        </div>

        {/* Cards */}
        <div className="space-y-4">

          {/* Plan Free */}
          <motion.div
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
            className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm"
          >
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="font-bold text-lg text-slate-800">Gratuit</h2>
                <p className="text-slate-500 text-sm">Pour découvrir l'app</p>
              </div>
              <div className="text-right">
                <p className="text-3xl font-black text-slate-800">0€</p>
                <p className="text-xs text-slate-400">pour toujours</p>
              </div>
            </div>
            <div className="space-y-2.5 mb-5">
              {FREE_FEATURES.map((f, i) => (
                <div key={i} className="flex items-center gap-2.5 text-sm text-slate-600">
                  <Check className="h-4 w-4 text-slate-400 shrink-0" />
                  {f}
                </div>
              ))}
            </div>
            <Button variant="outline" className="w-full border-slate-200 text-slate-500" disabled>
              Plan actuel
            </Button>
          </motion.div>

          {/* Plan Premium */}
          <motion.div
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
            className="relative bg-gradient-to-br from-blue-600 to-blue-700 rounded-2xl p-6 shadow-xl text-white overflow-hidden"
          >
            {/* Best choice badge */}
            {billingPeriod === 'yearly' && (
              <div className="absolute top-4 right-4">
                <Badge className="bg-yellow-400 text-yellow-900 font-bold border-0 flex items-center gap-1">
                  <Star className="h-3 w-3" /> Meilleur choix
                </Badge>
              </div>
            )}

            {/* Decorative background */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -translate-y-16 translate-x-16" />
            <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/5 rounded-full translate-y-12 -translate-x-12" />

            <div className="relative">
              <div className="flex items-center gap-2 mb-1">
                <Crown className="h-5 w-5 text-yellow-300" />
                <h2 className="font-bold text-xl">Premium</h2>
              </div>
              <p className="text-blue-200 text-sm mb-5">Accès complet, sans limite</p>

              <div className="mb-6">
                {billingPeriod === 'monthly' ? (
                  <div>
                    <span className="text-5xl font-black">10€</span>
                    <span className="text-blue-200 ml-1">/mois</span>
                    <p className="text-blue-300 text-xs mt-1">120€/an</p>
                  </div>
                ) : (
                  <div>
                    <span className="text-5xl font-black">60€</span>
                    <span className="text-blue-200 ml-1">/an</span>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-sm text-blue-300 line-through">120€</span>
                      <Badge className="bg-yellow-400 text-yellow-900 text-xs border-0">Économisez 60€</Badge>
                    </div>
                    <p className="text-blue-300 text-xs mt-1">soit 5€/mois seulement</p>
                  </div>
                )}
              </div>

              <div className="space-y-2.5 mb-6">
                {PREMIUM_FEATURES.map((f, i) => (
                  <div key={i} className="flex items-center gap-2.5 text-sm">
                    <div className="h-4 w-4 rounded-full bg-green-400 flex items-center justify-center shrink-0">
                      <Check className="h-2.5 w-2.5 text-white" strokeWidth={3} />
                    </div>
                    {f}
                  </div>
                ))}
              </div>

              {isPremium ? (
                <Button className="w-full bg-white text-blue-700 hover:bg-blue-50 font-bold shadow-lg" disabled>
                  <Crown className="h-4 w-4 mr-2 text-yellow-500" /> Abonnement actif
                </Button>
              ) : (
                <Button
                  onClick={() => handleSubscribe(billingPeriod)}
                  disabled={loading !== null}
                  className="w-full bg-white text-blue-700 hover:bg-blue-50 font-bold shadow-lg h-12 text-base"
                >
                  {loading === billingPeriod ? (
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                      Redirection...
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      {nativeApp ? <ExternalLink className="h-4 w-4" /> : <Sparkles className="h-4 w-4" />}
                      {nativeApp
                        ? `S'abonner sur le site web`
                        : `Passer Premium — ${billingPeriod === 'monthly' ? '10€/mois' : '60€/an'}`}
                    </div>
                  )}
                </Button>
              )}
            </div>
          </motion.div>
        </div>

        {/* Garanties */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { icon: '🔒', label: 'Paiement sécurisé', sub: 'via Stripe' },
            { icon: '↩️', label: 'Résiliation', sub: 'à tout moment' },
            { icon: '⚡', label: 'Accès immédiat', sub: 'après paiement' },
          ].map((g, i) => (
            <div key={i} className="bg-white rounded-xl p-3 text-center border border-slate-100 shadow-sm">
              <p className="text-xl mb-1">{g.icon}</p>
              <p className="text-xs font-semibold text-slate-700">{g.label}</p>
              <p className="text-xs text-slate-400">{g.sub}</p>
            </div>
          ))}
        </div>

        <p className="text-center text-xs text-slate-400 pb-4">
          En t'abonnant, tu acceptes nos{' '}
          <Link to="/legal?tab=cgu" className="underline hover:text-blue-500">Conditions Générales d'Utilisation</Link>
          {' '}et notre{' '}
          <Link to="/legal?tab=privacy" className="underline hover:text-blue-500">Politique de Confidentialité</Link>.
          Tu peux annuler à tout moment.
        </p>
      </div>
    </div>
  );
}