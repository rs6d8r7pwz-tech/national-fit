import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Gift, Copy, Check, Users, Crown, Share2, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { base44 } from '@/api/base44Client';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '@/lib/ThemeContext';
import { useQuery } from '@tanstack/react-query';

export default function Referral() {
  const { language } = useTheme();
  const isFR = language === 'fr';
  const navigate = useNavigate();
  const [copied, setCopied] = useState(false);

  const { data: profiles = [] } = useQuery({
    queryKey: ['userProfile'],
    queryFn: () => base44.entities.UserProfile.list(),
    initialData: [],
  });
  const profile = profiles?.[0];

  const { data: referrals = [] } = useQuery({
    queryKey: ['referrals'],
    queryFn: () => base44.entities.Referral.list('-created_at'),
    initialData: [],
  });

  const referredCount = referrals.length;
  const rewardedCount = referrals.filter(r => r.status === 'rewarded').length;

  // Track ref code from URL on first visit
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const ref = params.get('ref');
    if (ref && ref.startsWith('NFIT-')) {
      // Store for use at registration
      try { sessionStorage.setItem('nfit_ref_code', ref); } catch {}
    }
  }, []);

  const referralCode = profile ? `NFIT-${(profile.first_name || 'USER').toUpperCase().slice(0, 4)}-${profile.id?.slice(-4).toUpperCase()}` : 'NFIT-XXXX';
  const referralLink = `${window.location.origin}?ref=${referralCode}`;

  const copyLink = () => {
    navigator.clipboard.writeText(referralLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const shareLink = () => {
    const text = isFR
      ? `🏋️ Je m'entraîne avec National Fit — l'app IA qui génère des programmes sur mesure ! Essaie gratuitement avec mon lien : ${referralLink}`
      : `🏋️ I train with National Fit — the AI app that creates custom workout plans! Try it free with my link: ${referralLink}`;
    if (navigator.share) {
      navigator.share({ title: 'National Fit', text, url: referralLink });
    } else {
      navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  const steps = isFR
    ? [
        { icon: '📤', title: 'Partage ton lien', desc: 'Envoie ton lien unique à tes amis' },
        { icon: '🆓', title: 'Ils s\'inscrivent', desc: 'Ils obtiennent 7 jours Premium offerts' },
        { icon: '🎁', title: 'Tu gagnes', desc: '1 mois Premium offert pour chaque ami inscrit' },
      ]
    : [
        { icon: '📤', title: 'Share your link', desc: 'Send your unique link to friends' },
        { icon: '🆓', title: 'They sign up', desc: 'They get 7 days Premium free' },
        { icon: '🎁', title: 'You earn', desc: '1 month Premium free per friend who joins' },
      ];

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="min-h-screen bg-gradient-to-br from-blue-50 to-white pb-16">
      <div className="max-w-lg mx-auto px-4 pt-8 space-y-6">

        {/* Header */}
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="p-2 rounded-xl hover:bg-blue-100 transition-colors">
            <ArrowLeft className="h-5 w-5 text-blue-600" />
          </button>
          <div>
            <h1 className="font-heading text-3xl tracking-wider text-blue-700">
              {isFR ? 'PARRAINAGE' : 'REFER A FRIEND'}
            </h1>
            <p className="text-xs text-slate-500">
              {isFR ? 'Invitez vos amis, gagnez ensemble' : 'Invite friends, earn together'}
            </p>
          </div>
        </div>

        {/* Hero card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          className="relative rounded-3xl overflow-hidden p-6 text-white shadow-xl"
          style={{ background: 'linear-gradient(135deg, hsl(220,90%,50%), hsl(220,90%,38%))' }}
        >
          <div className="absolute top-0 right-0 w-40 h-40 bg-white/5 rounded-full -translate-y-20 translate-x-20" />
          <div className="relative">
            <div className="flex items-center gap-3 mb-3">
              <div className="h-12 w-12 rounded-2xl bg-white/20 flex items-center justify-center">
                <Gift className="h-6 w-6 text-yellow-300" />
              </div>
              <div>
                <p className="font-heading text-2xl tracking-wider">
                  {isFR ? '1 MOIS OFFERT' : '1 MONTH FREE'}
                </p>
                <p className="text-blue-200 text-sm">
                  {isFR ? 'par ami parrainé' : 'per referred friend'}
                </p>
              </div>
            </div>
            <p className="text-blue-100 text-sm leading-relaxed">
              {isFR
                ? 'Chaque ami qui s\'inscrit via ton lien obtient 7 jours Premium gratuits. Toi, tu gagnes 1 mois Premium pour chaque parrainage réussi.'
                : 'Every friend who signs up via your link gets 7 days Premium free. You earn 1 month Premium for each successful referral.'}
            </p>
          </div>
        </motion.div>

        {/* Steps */}
        <div className="space-y-3">
          {steps.map((step, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.1 }}
              className="flex items-center gap-4 bg-white rounded-2xl p-4 border border-blue-100 shadow-sm"
            >
              <div className="h-12 w-12 rounded-2xl bg-blue-50 flex items-center justify-center text-2xl shrink-0">
                {step.icon}
              </div>
              <div>
                <p className="font-semibold text-slate-800 text-sm">{step.title}</p>
                <p className="text-slate-500 text-xs mt-0.5">{step.desc}</p>
              </div>
              {i < steps.length - 1 && (
                <div className="ml-auto text-slate-300 text-lg">→</div>
              )}
            </motion.div>
          ))}
        </div>

        {/* Referral link box */}
        <motion.div
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
          className="bg-white rounded-2xl border border-blue-200 p-5 shadow-sm space-y-4"
        >
          <div className="flex items-center gap-2 mb-1">
            <Users className="h-4 w-4 text-blue-600" />
            <p className="font-semibold text-slate-800 text-sm">
              {isFR ? 'Ton lien de parrainage' : 'Your referral link'}
            </p>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-xl px-4 py-3 flex items-center justify-between gap-3">
            <p className="text-blue-700 text-sm font-mono truncate flex-1">{referralLink}</p>
            <button
              onClick={copyLink}
              className="shrink-0 h-8 w-8 rounded-lg bg-blue-600 text-white flex items-center justify-center hover:bg-blue-700 transition-colors"
            >
              {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
            </button>
          </div>

          <div className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 flex items-center justify-between">
            <div>
              <p className="text-xs text-slate-500">{isFR ? 'Ton code' : 'Your code'}</p>
              <p className="font-mono font-bold text-slate-800 text-sm">{referralCode}</p>
            </div>
            <Badge className="bg-blue-600 text-white border-0">
              {isFR ? 'Actif' : 'Active'}
            </Badge>
          </div>

          <Button
            onClick={shareLink}
            className="w-full gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold h-12"
          >
            <Share2 className="h-4 w-4" />
            {isFR ? 'Partager mon lien' : 'Share my link'}
          </Button>
        </motion.div>

        {/* Stats placeholder */}
        <motion.div
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}
          className="grid grid-cols-2 gap-3"
        >
          {[
            { value: String(referredCount), label: isFR ? 'Amis parrainés' : 'Friends referred', icon: Users },
            { value: String(rewardedCount), label: isFR ? 'Mois gagnés' : 'Months earned', icon: Crown },
          ].map((stat, i) => (
            <div key={i} className="bg-white rounded-2xl border border-blue-100 p-4 text-center shadow-sm">
              <stat.icon className="h-5 w-5 mx-auto mb-2 text-blue-600" />
              <p className="font-heading text-3xl text-blue-700">{stat.value}</p>
              <p className="text-xs text-slate-500 mt-1">{stat.label}</p>
            </div>
          ))}
        </motion.div>

        <p className="text-center text-xs text-slate-400 pb-4">
          {isFR
            ? '* Offre valable pour tout nouvel utilisateur inscrit via ton lien. Le mois offert est crédité après 7 jours d\'utilisation active de ton filleul.'
            : '* Offer valid for any new user who signs up via your link. The free month is credited after 7 days of active use by your referral.'}
        </p>
      </div>
    </motion.div>
  );
}