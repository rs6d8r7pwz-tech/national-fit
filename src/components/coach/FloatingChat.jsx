import React, { useState, useRef, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, ChevronDown, ChevronUp, Maximize2, Minimize2, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import ReactMarkdown from 'react-markdown';
import { cn } from '@/lib/utils';
import { useTheme } from '@/lib/ThemeContext';
import { buildMemoryContext, getMemory, saveMemory } from '@/lib/aiMemory';
import { invokeAIWithLimit } from '@/lib/aiRateLimit';

const QUICK_REPLIES = [
  "Analyse ma semaine 📊",
  "Que manger ce soir ?",
  "Comment progresser plus vite ?",
  "Je suis fatigué, que faire ?",
];

const FALLBACK_RESPONSES = {
  tricolore: {
    fr: "Repousse tes limites ! 🇫🇷 La limite mensuelle IA est atteinte -- reviens bientôt !",
    en: "Push your limits! 🇫🇷 Monthly AI limit reached -- come back soon!",
  },
  elite: {
    fr: "Performance maximale ! Limite IA atteinte ce mois-ci. Reviens vite !",
    en: "Maximum performance! AI limit reached this month. Come back soon!",
  },
  champion: {
    fr: "Les champions persistent ! Limite IA atteinte -- reviens bientôt !",
    en: "Champions persist! AI limit reached -- come back soon!",
  },
};



export default function FloatingChat({ profile }) {
  const { theme, language, getThemePersonality } = useTheme();
  const themePersonality = getThemePersonality();
  const [expanded, setExpanded] = useState(false);
  const [minimized, setMinimized] = useState(true);
  const chatRef = useRef(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef(null);

  // Fermeture au clic extérieur (uniquement hors de la barre du coach)
  useEffect(() => {
    if (minimized) return;
    const handleOutside = (e) => {
      if (chatRef.current && !chatRef.current.contains(e.target)) {
        setMinimized(true);
      }
    };
    // Délai pour éviter que le clic d'ouverture sur la barre ferme immédiatement
    const timer = setTimeout(() => {
      document.addEventListener('mousedown', handleOutside);
      document.addEventListener('touchstart', handleOutside);
    }, 50);
    return () => {
      clearTimeout(timer);
      document.removeEventListener('mousedown', handleOutside);
      document.removeEventListener('touchstart', handleOutside);
    };
  }, [minimized]);

  // Initialize greeting -- proactive based on profile data
  useEffect(() => {
    if (!profile) return;
    const streak = profile.streak_days || 0;
    const hour = new Date().getHours();
    const moment = hour < 12 ? 'matin' : hour < 18 ? 'après-midi' : 'soir';
    
    let contextLine = '';
    if (streak >= 7) contextLine = `Tu es sur une série de **${streak} jours** -- c'est exceptionnel. `;
    else if (streak === 0) contextLine = `Pas encore de séance cette semaine -- aujourd'hui c'est le jour idéal pour démarrer. `;
    else contextLine = `**${streak} jour${streak > 1 ? 's' : ''}** de streak -- continue sur cette dynamique. `;

    const greeting = `Salut **${profile.first_name}** ! 👋 Je suis ton coach IA National Fit. ${contextLine}Tu travailles sur **${profile.goal === 'seche' ? 'la sèche' : profile.goal === 'prise_masse' ? 'la prise de masse' : profile.goal === 'force' ? 'la force' : profile.goal === 'cardio' ? 'le cardio' : 'ton objectif'}**. Dis-moi comment tu vas ou pose ta question !`;
    setMessages([{ role: 'assistant', content: greeting }]);
  }, [profile?.id]);

  const { data: progressEntries = [] } = useQuery({
    queryKey: ['progress'],
    queryFn: () => base44.entities.ProgressEntry.list('-date', 7),
    initialData: [],
    enabled: !minimized,
  });

  const { data: recentSessions = [] } = useQuery({
    queryKey: ['sessions-chat'],
    queryFn: () => base44.entities.WorkoutSession.list('-date', 10),
    initialData: [],
    enabled: !minimized,
  });

  const { data: goals = [] } = useQuery({
    queryKey: ['goals-chat'],
    queryFn: () => base44.entities.UserGoal.list('-created_at', 5),
    initialData: [],
    enabled: !minimized,
  });

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async (text) => {
    const userMsg = (text || input).trim();
    if (!userMsg || loading) return;
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMsg }]);
    setLoading(true);

    // Build memory context
    const memCtx = buildMemoryContext();

    // Contexte enrichi avec toutes les données réelles
    const last7Progress = progressEntries.slice(0, 7);
    const avgRecovery = last7Progress.filter(e => e.recovery_score).reduce((a, e, _, arr) => a + e.recovery_score / arr.length, 0);
    const avgEnergy = last7Progress.filter(e => e.energy_level).reduce((a, e, _, arr) => a + e.energy_level / arr.length, 0);
    const sessionsThisWeek = recentSessions.filter(s => {
      const d = new Date(s.date);
      const limit = new Date(); limit.setDate(limit.getDate() - 7);
      return d >= limit;
    });
    const recentDiffs = recentSessions.slice(0, 3).map(s => s.perceived_difficulty).join(', ');
    const totalVolThisWeek = sessionsThisWeek.reduce((a, s) => a + (s.total_volume_kg || 0), 0);
    const activeGoal = goals.find(g => !g.completed);
    const lastWeight = last7Progress.find(e => e.weight_kg)?.weight_kg;

    const context = profile ? `
PROFIL COMPLET:
- Prénom: ${profile.first_name}, Objectif: ${profile.goal}, Niveau: ${profile.fitness_level}
- Poids actuel: ${lastWeight || profile.weight_kg || '?'}kg${profile.target_weight ? ` → cible: ${profile.target_weight}kg` : ''}
- Taille: ${profile.height_cm || '?'}cm, Âge: ${profile.age || '?'}
- Équipement: ${profile.equipment || '?'}, Jours dispo: ${profile.available_days || '?'}
- Streak: ${profile.streak_days || 0} jours, XP total: ${profile.xp_points || 0}
- Préférence alimentaire: ${profile.dietary_preference || 'N/A'}
${profile.injuries ? `- Limitations/blessures: ${profile.injuries}` : ''}
${profile.favorite_foods ? `- Aliments préférés: ${profile.favorite_foods}` : ''}
${profile.disliked_foods ? `- Aliments évités: ${profile.disliked_foods}` : ''}

DONNÉES RÉCENTES (vraies):
- Séances cette semaine: ${sessionsThisWeek.length}
- Volume total cette semaine: ${Math.round(totalVolThisWeek)}kg
- Difficulté récente (3 dernières): ${recentDiffs || 'N/A'}
- Score récupération moyen 7j: ${avgRecovery ? Math.round(avgRecovery) + '/100' : 'N/A'}
- Énergie moyenne 7j: ${avgEnergy ? (Math.round(avgEnergy * 10) / 10) + '/5' : 'N/A'}
${activeGoal ? `- Objectif actif: ${activeGoal.label || activeGoal.type} → ${activeGoal.current_value || '?'}/${activeGoal.target_value} ${activeGoal.unit || ''}` : ''}` : '';

    const history = messages.slice(-6).map(m => `${m.role === 'user' ? 'User' : 'Coach'}: ${m.content}`).join('\n');

    const prompt = `Tu es le coach IA personnel de l'application NATIONAL FIT. Tu connais l'utilisateur en profondeur grâce à ses données réelles.

${context}

${memCtx}

HISTORIQUE DE CETTE CONVERSATION:
${history}

MESSAGE DE L'UTILISATEUR: ${userMsg}

INSTRUCTIONS: Réponds en coach expert, précis, motivant. Utilise ses vraies données quand c'est pertinent. Max 3 phrases percutantes. En français. Sois direct et actionnable.`;

    try {
      const response = await invokeAIWithLimit(base44, { prompt });
      setMessages(prev => [...prev, { role: 'assistant', content: response }]);
      const mem = getMemory();
      const topics = [...(mem.conversationTopics || []), userMsg.slice(0, 30)].slice(-10);
      saveMemory({ ...mem, conversationTopics: topics, lastChat: new Date().toISOString() });
    } catch (err) {
      const isRateLimit = err?.message?.includes('Attends') || err?.message?.includes('Limite');
      const fallback = isRateLimit
        ? `⏱️ ${err.message}`
        : (FALLBACK_RESPONSES[theme]?.[language] || FALLBACK_RESPONSES.tricolore.fr);
      setMessages(prev => [...prev, { role: 'assistant', content: fallback }]);
    }
    setLoading(false);
  };

  const chatHeight = expanded ? 'h-[60vh] max-h-[520px]' : 'h-[340px]';

  return (
    <div ref={chatRef} className="fixed left-0 right-0 z-40 flex flex-col items-stretch pointer-events-none" style={{ bottom: 'calc(56px + env(safe-area-inset-bottom, 0px))' }}>
      {/* Chat window */}
      <AnimatePresence>
        {!minimized && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            transition={{ duration: 0.2 }}
            className={cn(
              "pointer-events-auto mx-auto w-full max-w-lg border-x border-t shadow-2xl flex flex-col overflow-hidden",
              chatHeight
            )}
            style={{ background: 'rgba(255,255,255,0.98)', backdropFilter: 'blur(20px)', borderColor: '#bfdbfe' }}
          >
            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-3 space-y-3" style={{ background: 'transparent' }}>
              {messages.map((msg, i) => (
                <div key={i} className={cn("flex gap-2", msg.role === 'user' ? 'justify-end' : 'justify-start')}>
                  {msg.role === 'assistant' && (
                    <div className="h-6 w-6 rounded-lg flex items-center justify-center shrink-0 mt-0.5 shadow" style={{ background: 'linear-gradient(135deg, hsl(220,90%,56%), hsl(0,80%,55%))' }}>
                      <span className="text-xs font-heading text-white font-bold">N</span>
                    </div>
                  )}
                  <div className={cn(
                    "max-w-[85%] rounded-2xl px-3 py-2 text-xs leading-relaxed",
                    msg.role === 'user'
                      ? "rounded-br-sm text-white"
                      : "bg-blue-50 border border-blue-200 text-slate-700 rounded-bl-sm"
                  )} style={msg.role === 'user' ? { background: 'linear-gradient(135deg, hsl(220,90%,50%), hsl(220,90%,40%))' } : {}}>
                    {msg.role === 'assistant' ? (
                      <ReactMarkdown className="prose prose-xs max-w-none [&>*:first-child]:mt-0 [&>*:last-child]:mb-0 [&_strong]:text-blue-700">
                        {msg.content}
                      </ReactMarkdown>
                    ) : msg.content}
                  </div>
                  {msg.role === 'user' && (
                    <div className="h-6 w-6 rounded-lg bg-blue-100 flex items-center justify-center shrink-0 mt-0.5">
                      <User className="h-3 w-3 text-blue-600" />
                    </div>
                  )}
                </div>
              ))}
              {loading && (
                <div className="flex gap-2 items-center">
                  <div className="h-6 w-6 rounded-lg flex items-center justify-center shrink-0 shadow" style={{ background: 'linear-gradient(135deg, hsl(220,90%,50%), hsl(0,80%,52%))' }}>
                    <span className="text-xs font-heading text-white font-bold">N</span>
                  </div>
                  <div className="bg-blue-50 border border-blue-200 rounded-2xl px-3 py-2 flex gap-1">
                    <span className="h-1.5 w-1.5 rounded-full bg-blue-400 animate-bounce [animation-delay:0ms]" />
                    <span className="h-1.5 w-1.5 rounded-full bg-blue-400 animate-bounce [animation-delay:150ms]" />
                    <span className="h-1.5 w-1.5 rounded-full bg-blue-400 animate-bounce [animation-delay:300ms]" />
                  </div>
                </div>
              )}
              <div ref={scrollRef} />
            </div>

            {/* Quick replies */}
            {messages.length <= 1 && (
              <div className="px-3 py-2 flex gap-1.5 overflow-x-auto shrink-0 border-t border-blue-100">
                {QUICK_REPLIES.map(q => (
                  <button
                    key={q}
                    onClick={() => sendMessage(q)}
                    className="shrink-0 text-xs px-2.5 py-1.5 rounded-full transition-colors whitespace-nowrap bg-blue-100 border border-blue-300 text-blue-700 hover:bg-blue-200"
                  >
                    {q}
                  </button>
                ))}
              </div>
            )}

            {/* Input */}
            <div className="border-t border-blue-100 p-2.5 shrink-0" style={{ background: 'rgba(255,255,255,0.98)' }}>
              <form onSubmit={e => { e.preventDefault(); sendMessage(); }} className="flex gap-2">
                <Input
                  placeholder={language === 'fr' ? 'Pose ta question au coach...' : 'Ask your coach...'}
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  disabled={loading}
                  className="flex-1 h-8 text-xs border-blue-200 bg-blue-50 text-slate-800 placeholder:text-slate-400 rounded-full"
                />
                <Button type="submit" disabled={loading || !input.trim()} size="sm"
                  className="h-8 w-8 p-0 rounded-full text-white shadow"
                  style={{ background: `hsl(${themePersonality.colors.primary})`, boxShadow: `0 4px 14px hsla(${themePersonality.colors.primary}, 0.4)` }}>
                  <Send className="h-3.5 w-3.5" />
                </Button>
              </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Always-visible bar */}
      <div id="floating-chat-btn" className="pointer-events-auto shadow-lg border-t"
        style={{ 
          background: `linear-gradient(to right, hsl(${themePersonality.colors.primary}), hsl(${themePersonality.colors.accent}))`,
          boxShadow: `0 4px 20px hsla(${themePersonality.colors.primary}, 0.4)`,
          borderColor: `hsla(${themePersonality.colors.primary}, 0.3)`
        }}>
        <div className="max-w-lg mx-auto flex items-center justify-between px-4 py-2">
          <div className="flex items-center gap-2">
            <div className="h-7 w-7 rounded-lg bg-black/20 flex items-center justify-center shrink-0">
              <span className="text-sm font-heading text-white font-bold">{themePersonality.name[0]}</span>
            </div>
            <div>
              <p className="text-white font-heading tracking-widest text-xs leading-none">{themePersonality.name.toUpperCase()}</p>
              <p className="text-white/80 text-[10px] mt-0.5">
                {minimized ? (language === 'fr' ? 'Coach IA · Tape pour discuter' : 'AI Coach · Tap to chat') : (language === 'fr' ? 'Coach IA actif' : 'AI Coach active')}
              </p>
            </div>
            {minimized && <span className="h-2 w-2 rounded-full bg-white/80 animate-pulse ml-1" />}
          </div>
          <div className="flex items-center gap-1">
            {!minimized && (
              <button onClick={() => setExpanded(!expanded)} className="text-white/70 hover:text-white p-1.5 rounded-lg hover:bg-white/10 transition-colors">
                {expanded ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
              </button>
            )}
            <motion.button
              whileTap={{ scale: 0.93 }}
              onClick={() => setMinimized(!minimized)}
              className="text-white p-1.5 rounded-lg hover:bg-white/10 transition-colors flex items-center gap-1"
            >
              {minimized
                ? <><ChevronUp className="h-4 w-4" /><span className="text-xs font-heading">OUVRIR</span></>
                : <><ChevronDown className="h-4 w-4" /><span className="text-xs font-heading">FERMER</span></>
              }
            </motion.button>
          </div>
        </div>
      </div>
    </div>
  );
}