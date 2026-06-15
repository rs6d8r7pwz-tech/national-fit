import React, { useState, useRef, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { MessageCircle, Send, Loader2, Zap, Bot, User } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

export default function CoachChat() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef(null);

  const { data: profiles } = useQuery({
    queryKey: ['userProfile'],
    queryFn: () => base44.entities.UserProfile.list(),
    initialData: [],
  });
  const profile = profiles?.[0];

  const { data: progressEntries } = useQuery({
    queryKey: ['progress'],
    queryFn: () => base44.entities.ProgressEntry.list('-date', 10),
    initialData: [],
  });

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async () => {
    if (!input.trim() || loading) return;
    const userMsg = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMsg }]);
    setLoading(true);

    const context = profile ? `
Profil utilisateur:
- Prénom: ${profile.first_name}, ${profile.age} ans, ${profile.gender}
- Niveau: ${profile.fitness_level}, Objectif: ${profile.goal}
- Poids: ${profile.weight_kg}kg, Taille: ${profile.height_cm}cm
- Équipement: ${profile.equipment}
- Jours dispo: ${profile.available_days}/semaine
- Blessures: ${profile.injuries || 'Aucune'}
- Régime: ${profile.dietary_preference}
${progressEntries.length > 0 ? `- Dernier poids enregistré: ${progressEntries[0].weight_kg}kg` : ''}
` : '';

    const history = messages.slice(-6).map(m => `${m.role === 'user' ? 'Utilisateur' : 'Coach'}: ${m.content}`).join('\n');

    const prompt = `Tu es le Professeur Hulk (Bruce Banner + Hulk fusionnés) : tu as l'intelligence et la précision scientifique de Banner, ET l'énergie, la puissance et la passion de Hulk. 
Tu es le coach IA de l'app HULK FIT. Tu parles en français, avec une légère touche MCU/comic (références occasionnelles à Hulk, Banner, Avengers, gamma). 
Tu es motivant, direct, expert en fitness et nutrition. Tu peux sortir un "SMASH tes excuses !" de temps en temps mais reste utile. Utilise des emojis avec modération.
Tu donnes des conseils personnalisés basés sur le profil de l'utilisateur.

${context}

Historique de conversation:
${history}

Utilisateur: ${userMsg}

Réponds en tant que coach:`;

    let response;
    try {
      response = await base44.integrations.Core.InvokeLLM({ prompt });
    } catch {
      response = "⚠️ Hulk a atteint sa limite de sagesse pour ce mois. Upgrade ton plan pour continuer à discuter avec le Professeur Hulk !";
    }
    setMessages(prev => [...prev, { role: 'assistant', content: response }]);
    setLoading(false);
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col h-[calc(100vh-8rem)] lg:h-[calc(100vh-4rem)]">
      <div className="mb-4">
        <h1 className="font-heading text-3xl text-blue-600 tracking-widest flex items-center gap-3">
          <MessageCircle className="h-7 w-7 text-blue-500" /> PROFESSEUR HULK
        </h1>
        <p className="text-muted-foreground mt-0.5 text-sm italic">"La science de Banner, la force de Hulk — à votre service."</p>
      </div>

      <Card className="flex-1 flex flex-col overflow-hidden bg-white border-gray-200">
        <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4">
          {messages.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full text-center py-12">
              <div className="h-20 w-20 rounded-2xl bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center mb-4 shadow-xl shadow-green-300/40">
                <span className="text-4xl font-heading text-white font-bold">H</span>
              </div>
              <h3 className="font-heading text-2xl text-green-600 tracking-wider">HULK ÉCOUTE.</h3>
              <p className="text-muted-foreground mt-2 max-w-sm text-sm italic">
                "Demande-moi n'importe quoi sur l'entraînement, la nutrition ou la récupération. Banner a les réponses. Hulk a l'énergie."
              </p>
              <div className="flex flex-wrap gap-2 mt-4 justify-center">
                {['Comment améliorer mes pompes ?', 'Quoi manger avant le sport ?', 'Comment récupérer comme un Avenger ?'].map(q => (
                  <Button key={q} variant="outline" size="sm" className="text-xs border-green-300 text-green-700 hover:bg-green-50" onClick={() => { setInput(q); }}>
                    {q}
                  </Button>
                ))}
              </div>
            </div>
          )}

          {messages.map((msg, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={cn("flex gap-3", msg.role === 'user' ? 'justify-end' : 'justify-start')}
            >
              {msg.role === 'assistant' && (
                <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center shrink-0 mt-0.5 shadow shadow-green-300/30">
                  <span className="text-sm font-heading text-white font-bold">H</span>
                </div>
              )}
              <div className={cn(
                "max-w-[80%] rounded-2xl px-4 py-3",
                msg.role === 'user'
                  ? "bg-gradient-to-br from-purple-500 to-purple-700 text-white"
                  : "bg-gray-50 border border-gray-200"
              )}>
                {msg.role === 'user' ? (
                  <p className="text-sm">{msg.content}</p>
                ) : (
                  <ReactMarkdown className="text-sm prose prose-sm prose-slate max-w-none [&>*:first-child]:mt-0 [&>*:last-child]:mb-0">
                    {msg.content}
                  </ReactMarkdown>
                )}
              </div>
              {msg.role === 'user' && (
                <div className="h-8 w-8 rounded-lg bg-purple-100 flex items-center justify-center shrink-0 mt-0.5 border border-purple-200">
                  <User className="h-4 w-4 text-purple-500" />
                </div>
              )}
            </motion.div>
          ))}

          {loading && (
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center shadow shadow-green-300/30">
                <span className="text-sm font-heading text-white font-bold">H</span>
              </div>
              <div className="bg-gray-50 border border-gray-200 rounded-2xl px-4 py-3 flex items-center gap-2">
                <div className="flex gap-1">
                  <span className="h-2 w-2 rounded-full bg-green-400 animate-bounce [animation-delay:0ms]" />
                  <span className="h-2 w-2 rounded-full bg-green-400 animate-bounce [animation-delay:150ms]" />
                  <span className="h-2 w-2 rounded-full bg-green-400 animate-bounce [animation-delay:300ms]" />
                </div>
                <span className="text-xs text-muted-foreground italic">Banner réfléchit... Hulk s'impatiente...</span>
              </div>
            </div>
          )}
          <div ref={scrollRef} />
        </div>

        <div className="border-t border-border p-4">
          <form onSubmit={(e) => { e.preventDefault(); sendMessage(); }} className="flex gap-2">
            <Input
              placeholder="Pose ta question au Professeur Hulk..."
              value={input}
              onChange={e => setInput(e.target.value)}
              disabled={loading}
              className="flex-1 border-gray-300 bg-gray-50"
            />
            <Button type="submit" disabled={loading || !input.trim()} size="icon" className="bg-green-500 hover:bg-green-600 text-white shadow shadow-green-200 hulk-glow">
              <Send className="h-4 w-4" />
            </Button>
          </form>
        </div>
      </Card>
    </motion.div>
  );
}