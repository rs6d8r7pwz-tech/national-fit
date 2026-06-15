import React, { useEffect, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/lib/AuthContext';
import { motion } from 'framer-motion';
import { Users, TrendingUp, Dumbbell, Crown, Mail, RefreshCw, BarChart2, Zap, AlertTriangle, Loader2, Infinity, Calendar } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { format, subDays } from 'date-fns';
import { fr } from 'date-fns/locale';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';
import { useNavigate } from 'react-router-dom';

export default function Admin() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [sendingReactivation, setSendingReactivation] = useState(false);
  const [reactivationResult, setReactivationResult] = useState(null);
  const [premiumEdits, setPremiumEdits] = useState({});   // { [profileId]: { isPremium, unlimited, endDate, saving } }
  const [savedIds, setSavedIds] = useState({});

  // Admin détecté via app_metadata.role = 'admin' (défini dans Supabase)
  const isAdmin = user?.app_metadata?.role === 'admin';
  const loadingUser = !user;

  useEffect(() => {
    if (user && !isAdmin) {
      navigate('/', { replace: true });
    }
  }, [user, isAdmin, navigate]);

  const { data: allProfiles = [], isLoading: loadingProfiles } = useQuery({
    queryKey: ['adminProfiles'],
    queryFn: () => base44.entities.UserProfile.list('-created_at', 500),
    enabled: isAdmin,
  });

  const { data: allSessions = [] } = useQuery({
    queryKey: ['adminSessions'],
    queryFn: () => base44.entities.WorkoutSession.list('-date', 500),
    enabled: isAdmin,
  });

  const { data: allPrograms = [] } = useQuery({
    queryKey: ['adminPrograms'],
    queryFn: () => base44.entities.WorkoutProgram.list('-created_at', 500),
    enabled: isAdmin,
  });

  // --- Compute stats ---
  const totalUsers = allProfiles.length;
  const premiumUsers = allProfiles.filter(p => p.subscription_status === 'premium').length;
  const freeUsers = totalUsers - premiumUsers;
  const conversionRate = totalUsers > 0 ? Math.round((premiumUsers / totalUsers) * 100) : 0;

  const sevenDaysAgo = subDays(new Date(), 7);
  const thirtyDaysAgo = subDays(new Date(), 30);

  const newUsersLast7 = allProfiles.filter(p => p.created_at && new Date(p.created_at) > sevenDaysAgo).length;
  const newUsersLast30 = allProfiles.filter(p => p.created_at && new Date(p.created_at) > thirtyDaysAgo).length;

  const completedSessions = allSessions.filter(s => s.completed).length;
  const sessionsLast7 = allSessions.filter(s => s.date && new Date(s.date) > sevenDaysAgo).length;

  const inactiveUsers = allProfiles.filter(p => {
    if (!p.last_workout_date) return false;
    return new Date(p.last_workout_date) < sevenDaysAgo;
  }).length;

  // Churn risk: premium users inactive 5+ days
  const fiveDaysAgo = subDays(new Date(), 5);
  const churnRiskUsers = allProfiles.filter(p => {
    if (p.subscription_status !== 'premium') return false;
    if (!p.last_workout_date) return true;
    return new Date(p.last_workout_date) < fiveDaysAgo;
  });

  // Sessions per day (last 14 days)
  const sessionsByDay = Array.from({ length: 14 }, (_, i) => {
    const date = subDays(new Date(), 13 - i);
    const dateStr = format(date, 'yyyy-MM-dd');
    const count = allSessions.filter(s => s.date === dateStr).length;
    return { date: format(date, 'dd/MM'), count };
  });

  // Signups per day (last 14 days)
  const signupsByDay = Array.from({ length: 14 }, (_, i) => {
    const date = subDays(new Date(), 13 - i);
    const dayStart = new Date(date); dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(date); dayEnd.setHours(23, 59, 59, 999);
    const count = allProfiles.filter(p => {
      if (!p.created_at) return false;
      const d = new Date(p.created_at);
      return d >= dayStart && d <= dayEnd;
    }).length;
    return { date: format(date, 'dd/MM'), count };
  });

  // Goal distribution
  const goalDist = allProfiles.reduce((acc, p) => {
    if (p.goal) acc[p.goal] = (acc[p.goal] || 0) + 1;
    return acc;
  }, {});
  const goalData = Object.entries(goalDist).map(([goal, count]) => ({ goal, count }));

  const handleSendReactivation = async () => {
    setReactivationResult({ error: 'Fonction email non encore configurée' });
  };

  const [openUserId, setOpenUserId] = useState(null);

  const getEdit = (p) => premiumEdits[p.id] ?? {
    isPremium: p.subscription_status === 'premium',
    unlimited: !p.subscription_end_date,
    endDate: p.subscription_end_date ? p.subscription_end_date.substring(0, 10) : '',
  };

  const setEdit = (id, patch) =>
    setPremiumEdits(prev => ({ ...prev, [id]: { ...getEdit(allProfiles.find(x => x.id === id) || { id }), ...patch } }));

  const handleSavePremium = async (p) => {
    const edit = getEdit(p);
    setPremiumEdits(prev => ({ ...prev, [p.id]: { ...edit, saving: true } }));
    try {
      await base44.entities.UserProfile.update(p.id, {
        is_premium: edit.isPremium,
        subscription_status: edit.isPremium ? 'premium' : 'free',
        subscription_end_date: edit.isPremium && !edit.unlimited ? edit.endDate : null,
        premium_source: edit.isPremium ? 'trial' : null,
      });
      queryClient.invalidateQueries(['adminProfiles']);
      setSavedIds(prev => ({ ...prev, [p.id]: true }));
      setTimeout(() => setSavedIds(prev => { const n = { ...prev }; delete n[p.id]; return n; }), 2000);
      setOpenUserId(null);
    } catch (e) {
      alert('Erreur : ' + e.message);
    }
    setPremiumEdits(prev => ({ ...prev, [p.id]: { ...edit, saving: false } }));
  };

  if (loadingUser || (isAdmin && loadingProfiles) || !isAdmin) {
    return <div className="flex items-center justify-center min-h-screen"><Loader2 className="h-8 w-8 animate-spin text-blue-600" /></div>;
  }

  const stats = [
    { label: 'Utilisateurs total', value: totalUsers, icon: Users, color: 'text-blue-600', bg: 'bg-blue-50' },
    { label: 'Premium', value: premiumUsers, icon: Crown, color: 'text-yellow-600', bg: 'bg-yellow-50' },
    { label: 'Taux conversion', value: `${conversionRate}%`, icon: TrendingUp, color: 'text-green-600', bg: 'bg-green-50' },
    { label: 'Séances (7j)', value: sessionsLast7, icon: Dumbbell, color: 'text-purple-600', bg: 'bg-purple-50' },
    { label: 'Inscrits 7j', value: newUsersLast7, icon: Zap, color: 'text-orange-600', bg: 'bg-orange-50' },
    { label: 'Inactifs 7j+', value: inactiveUsers, icon: AlertTriangle, color: 'text-red-600', bg: 'bg-red-50' },
  ];

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6 pb-10">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-blue-600 flex items-center justify-center">
            <BarChart2 className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="font-heading text-3xl tracking-wider text-blue-700">ADMIN</h1>
            <p className="text-xs text-slate-500">Tableau de bord analytique</p>
          </div>
        </div>
        <Badge className="bg-red-100 text-red-700 border-red-200">Admin Only</Badge>
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-2 gap-3">
        {stats.map(({ label, value, icon: Icon, color, bg }) => (
          <Card key={label} className="border-blue-100 shadow-sm">
            <CardContent className="pt-4 pb-3">
              <div className="flex items-center gap-3">
                <div className={`h-9 w-9 rounded-xl ${bg} flex items-center justify-center shrink-0`}>
                  <Icon className={`h-5 w-5 ${color}`} />
                </div>
                <div>
                  <p className="text-xs text-slate-500 leading-tight">{label}</p>
                  <p className={`text-xl font-black ${color}`}>{value}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Revenue estimé */}
      <Card className="border-yellow-200 bg-yellow-50 shadow-sm">
        <CardContent className="pt-4 pb-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-yellow-700 font-semibold uppercase tracking-wider">Revenu mensuel estimé (MRR)</p>
              <p className="text-3xl font-black text-yellow-800 mt-1">{(premiumUsers * 10).toLocaleString('fr')} €</p>
              <p className="text-xs text-yellow-600 mt-0.5">{premiumUsers} abonnés × 10€/mois</p>
            </div>
            <Crown className="h-12 w-12 text-yellow-400" />
          </div>
        </CardContent>
      </Card>

      {/* Charts */}
      <Card className="border-blue-100 shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-bold text-slate-700">📈 Séances / jour (14 derniers jours)</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={140}>
            <BarChart data={sessionsByDay}>
              <XAxis dataKey="date" tick={{ fontSize: 10 }} />
              <YAxis tick={{ fontSize: 10 }} allowDecimals={false} />
              <Tooltip />
              <Bar dataKey="count" fill="#1e50dc" radius={[4, 4, 0, 0]} name="Séances" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card className="border-blue-100 shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-bold text-slate-700">👥 Inscriptions / jour (14 derniers jours)</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={140}>
            <LineChart data={signupsByDay}>
              <XAxis dataKey="date" tick={{ fontSize: 10 }} />
              <YAxis tick={{ fontSize: 10 }} allowDecimals={false} />
              <Tooltip />
              <Line type="monotone" dataKey="count" stroke="#10b981" strokeWidth={2} dot={false} name="Inscriptions" />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {goalData.length > 0 && (
        <Card className="border-blue-100 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-bold text-slate-700">🎯 Répartition des objectifs</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={140}>
              <BarChart data={goalData} layout="vertical">
                <XAxis type="number" tick={{ fontSize: 10 }} allowDecimals={false} />
                <YAxis dataKey="goal" type="category" tick={{ fontSize: 10 }} width={90} />
                <Tooltip />
                <Bar dataKey="count" fill="#7c3aed" radius={[0, 4, 4, 0]} name="Utilisateurs" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* Churn Risk Alert */}
      {churnRiskUsers.length > 0 && (
        <Card className="border-red-200 bg-red-50 shadow-sm">
          <CardContent className="pt-4 pb-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-red-500 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-sm text-red-700">⚠️ {churnRiskUsers.length} abonné{churnRiskUsers.length > 1 ? 's' : ''} Premium à risque de churn</p>
                <p className="text-xs text-red-600 mt-0.5">Inactifs depuis 5+ jours — risque d'annulation</p>
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {churnRiskUsers.slice(0, 5).map(u => (
                    <span key={u.id} className="text-xs bg-red-100 text-red-700 border border-red-200 px-2 py-0.5 rounded-full">
                      {u.first_name || '?'} · {u.last_workout_date ? `${Math.floor((Date.now() - new Date(u.last_workout_date)) / 86400000)}j` : 'jamais'}
                    </span>
                  ))}
                  {churnRiskUsers.length > 5 && <span className="text-xs text-red-500">+{churnRiskUsers.length - 5} autres</span>}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Actions */}
      <Card className="border-blue-100 shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-bold text-slate-700">📧 Actions marketing</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between p-3 bg-orange-50 rounded-xl border border-orange-200">
            <div>
              <p className="font-semibold text-sm text-orange-800">Email de relance</p>
              <p className="text-xs text-orange-600">{inactiveUsers} utilisateurs inactifs 7j+</p>
            </div>
            <Button
              size="sm"
              onClick={handleSendReactivation}
              disabled={sendingReactivation}
              className="gap-1 bg-orange-500 hover:bg-orange-600 text-white"
            >
              {sendingReactivation ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Mail className="h-3.5 w-3.5" />}
              Envoyer
            </Button>
          </div>
          {reactivationResult && (
            <div className={`p-3 rounded-xl text-xs ${reactivationResult.error ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'}`}>
              {reactivationResult.error
                ? `❌ Erreur : ${reactivationResult.error}`
                : `✅ ${reactivationResult.sent} emails envoyés sur ${reactivationResult.total} inactifs`}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Gestion Premium — accordéon */}
      <Card className="border-yellow-200 shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-bold text-slate-700">👑 Gestion des abonnements ({allProfiles.length})</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="divide-y divide-slate-100">
            {allProfiles.map(p => {
              const isOpen = openUserId === p.id;
              const edit = getEdit(p);
              const isPremium = p.subscription_status === 'premium';
              return (
                <div key={p.id}>
                  {/* Ligne cliquable */}
                  <button
                    onClick={() => setOpenUserId(isOpen ? null : p.id)}
                    className="w-full flex items-center justify-between px-4 py-3 hover:bg-slate-50 transition-colors text-left"
                  >
                    <div className="flex items-center gap-3">
                      <div className="h-9 w-9 rounded-full bg-blue-100 flex items-center justify-center text-sm font-bold text-blue-700 shrink-0">
                        {(p.first_name || '?')[0].toUpperCase()}
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-slate-800">{p.first_name || 'Inconnu'} {p.age ? `· ${p.age} ans` : ''}</p>
                        <p className="text-xs text-slate-400 truncate max-w-[180px]">{p.email || '—'}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <Badge className={isPremium ? 'bg-yellow-100 text-yellow-700 border-yellow-200 text-xs' : 'bg-slate-100 text-slate-400 border-slate-200 text-xs'}>
                        {isPremium ? '⭐ Premium' : 'Free'}
                      </Badge>
                      <span className="text-slate-400 text-xs">{isOpen ? '▲' : '▼'}</span>
                    </div>
                  </button>

                  {/* Panneau déroulant */}
                  {isOpen && (
                    <div className="px-4 pb-4 pt-1 bg-yellow-50 border-t border-yellow-100 space-y-3">
                      {/* Toggle */}
                      <div className="flex items-center gap-3">
                        <Switch
                          checked={edit.isPremium}
                          onCheckedChange={(v) => setEdit(p.id, { isPremium: v })}
                        />
                        <span className="text-sm font-medium text-slate-700">
                          {edit.isPremium ? '⭐ Premium activé' : 'Compte Free'}
                        </span>
                      </div>

                      {/* Options durée si premium */}
                      {edit.isPremium && (
                        <div className="space-y-2 pl-1">
                          <div className="flex items-center gap-3">
                            <input
                              type="checkbox"
                              id={`unlimited-${p.id}`}
                              checked={edit.unlimited}
                              onChange={(e) => setEdit(p.id, { unlimited: e.target.checked })}
                              className="w-4 h-4 accent-yellow-500"
                            />
                            <Label htmlFor={`unlimited-${p.id}`} className="text-sm text-slate-600 flex items-center gap-1 cursor-pointer">
                              <Infinity className="h-3.5 w-3.5 text-yellow-600" /> Illimité (pas de date de fin)
                            </Label>
                          </div>
                          {!edit.unlimited && (
                            <div className="flex items-center gap-2">
                              <Calendar className="h-4 w-4 text-slate-400" />
                              <Input
                                type="date"
                                value={edit.endDate}
                                onChange={(e) => setEdit(p.id, { endDate: e.target.value })}
                                className="h-8 text-sm w-44 bg-white"
                              />
                            </div>
                          )}
                        </div>
                      )}

                      {/* Bouton sauvegarder */}
                      <Button
                        onClick={() => handleSavePremium(p)}
                        disabled={edit.saving}
                        className={`w-full h-9 text-sm font-semibold ${savedIds[p.id] ? 'bg-green-500 hover:bg-green-500' : 'bg-blue-600 hover:bg-blue-700'} text-white`}
                      >
                        {edit.saving ? <Loader2 className="h-4 w-4 animate-spin" /> : savedIds[p.id] ? '✓ Sauvegardé !' : 'Enregistrer'}
                      </Button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Recent users */}
      <Card className="border-blue-100 shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-bold text-slate-700">🆕 Derniers inscrits</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {allProfiles.slice(0, 10).map(p => (
              <div key={p.id} className="flex items-center justify-between py-2 px-3 bg-slate-50 rounded-xl">
                <div className="flex items-center gap-2">
                  <div className="h-7 w-7 rounded-full bg-blue-100 flex items-cente