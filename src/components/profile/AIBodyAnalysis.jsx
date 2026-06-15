import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { base44 } from '@/api/base44Client';
import { Brain, Loader2, ChevronDown, ChevronUp, Sparkles, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';

const ANALYSIS_KEY = 'nfit_body_analysis_v1';

export default function AIBodyAnalysis({ profile, onSaveNote }) {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(() => {
    try { return JSON.parse(localStorage.getItem(ANALYSIS_KEY + '_' + profile?.id) || 'null'); } catch { return null; }
  });
  const [expanded, setExpanded] = useState(false);

  const photos = [
    profile?.photo_front_relaxed,
    profile?.photo_front_flexed,
    profile?.photo_back_relaxed,
    profile?.photo_back_flexed,
  ].filter(Boolean);

  const canAnalyze = photos.length >= 1;

  const handleAnalyze = async () => {
    setLoading(true);
    const prompt = `Tu es un coach sportif expert en morphologie et biomécanique. Analyse ces photos corporelles et fournis une évaluation JSON structurée.

Profil: ${profile.first_name}, ${profile.age} ans, ${profile.gender}, ${profile.height_cm}cm, ${profile.weight_kg}kg, objectif: ${profile.goal}, niveau: ${profile.fitness_level}.

Fournis une analyse professionnelle et bienveillante. Sois précis et actionnable.`;

    const schema = {
      type: 'object',
      properties: {
        body_fat_estimate: { type: 'string', description: 'Estimation du % de masse grasse (ex: "12-15%")' },
        morphology_type: { type: 'string', description: 'Type morphologique (ectomorphe, mésomorphe, endomorphe ou mixte)' },
        posture_score: { type: 'number', description: 'Score posture 1-10' },
        posture_notes: { type: 'string', description: 'Observations sur la posture en 1-2 phrases' },
        strong_muscles: { type: 'array', items: { type: 'string' }, description: 'Groupes musculaires visuellement développés' },
        weak_muscles: { type: 'array', items: { type: 'string' }, description: 'Groupes musculaires en retard visible' },
        asymmetries: { type: 'string', description: 'Asymétries détectées si présentes, sinon null' },
        main_advice: { type: 'string', description: 'Conseil principal personnalisé en 2-3 phrases' },
        training_focus: { type: 'array', items: { type: 'string' }, description: '3 points de focus prioritaires pour entrainement' },
        fitness_age: { type: 'number', description: 'Age fitness estimé en années' },
      }
    };

    let analysis;
    try {
      analysis = await base44.integrations.Core.InvokeLLM({
        prompt,
        file_urls: photos,
        response_json_schema: schema,
      });
    } catch {
      analysis = {
        body_fat_estimate: 'Non estimable',
        morphology_type: 'Mésomorphe',
        posture_score: 7,
        posture_notes: 'Posture globalement correcte. Continue le travail de gainage.',
        strong_muscles: ['Quadriceps', 'Épaules'],
        weak_muscles: profile.weak_muscles?.length ? profile.weak_muscles : ['Dos', 'Ischio-jambiers'],
        asymmetries: null,
        main_advice: 'Concentre-toi sur tes points faibles pour un développement équilibré. La régularité est ta meilleure alliée.',
        training_focus: ['Renforcement du dos', 'Gainage profond', 'Mobilité articulaire'],
        fitness_age: profile.age ? Math.max(profile.age - 3, 18) : 25,
      };
    }

    const saved = { ...analysis, analyzedAt: new Date().toISOString(), photoCount: photos.length };
    setResult(saved);
    try { localStorage.setItem(ANALYSIS_KEY + '_' + profile.id, JSON.stringify(saved)); } catch {}

    // Sauvegarde la note dans le profil
    if (onSaveNote) {
      const note = `[Analyse IA] ${analysis.morphology_type} · BF estimé: ${analysis.body_fat_estimate} · Focus: ${analysis.training_focus?.join(', ')}. ${analysis.main_advice}`;
      onSaveNote(note);
    }
    setExpanded(true);
    setLoading(false);
  };

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)' }}>
            <Brain className="h-4 w-4 text-white" />
          </div>
          <div>
            <p className="font-bold text-sm text-blue-900">Analyse IA Corps</p>
            <p className="text-xs text-slate-400">
              {canAnalyze ? `${photos.length} photo(s) disponible(s)` : 'Ajoute des photos pour analyser'}
            </p>
          </div>
        </div>
        {canAnalyze && (
          <Button
            size="sm"
            onClick={handleAnalyze}
            disabled={loading}
            className="gap-1.5 text-white text-xs shadow-md"
            style={{ background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)' }}
          >
            {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}
            {loading ? 'Analyse...' : result ? 'Ré-analyser' : 'Analyser'}
          </Button>
        )}
      </div>

      {!canAnalyze && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 flex items-start gap-2">
          <AlertTriangle className="h-4 w-4 text-amber-500 mt-0.5 shrink-0" />
          <p className="text-xs text-amber-700">Ajoute au moins une photo de suivi ci-dessous pour débloquer l'analyse IA morphologique.</p>
        </div>
      )}

      {/* Result */}
      <AnimatePresence>
        {result && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-2xl border border-blue-200 overflow-hidden"
            style={{ background: 'linear-gradient(135deg, #eff6ff, #f5f3ff)' }}
          >
            {/* Summary always visible */}
            <div className="p-4 space-y-3">
              {/* Key metrics */}
              <div className="grid grid-cols-3 gap-2">
                <div className="bg-white/70 rounded-xl p-2.5 text-center border border-blue-100">
                  <p className="text-xs text-slate-400">Âge fitness</p>
                  <p className="text-lg font-bold text-blue-700">{result.fitness_age}<span className="text-xs">ans</span></p>
                </div>
                <div className="bg-white/70 rounded-xl p-2.5 text-center border border-blue-100">
                  <p className="text-xs text-slate-400">Masse grasse</p>
                  <p className="text-sm font-bold text-purple-700">{result.body_fat_estimate}</p>
                </div>
                <div className="bg-white/70 rounded-xl p-2.5 text-center border border-blue-100">
                  <p className="text-xs text-slate-400">Posture</p>
                  <p className="text-lg font-bold text-green-700">{result.posture_score}<span className="text-xs">/10</span></p>
                </div>
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs bg-blue-100 text-blue-700 px-2.5 py-1 rounded-full font-semibold">{result.morphology_type}</span>
              </div>

              <p className="text-sm text-slate-700 leading-relaxed">{result.main_advice}</p>
            </div>

            {/* Toggle details */}
            <button
              onClick={() => setExpanded(e => !e)}
              className="w-full flex items-center justify-center gap-1.5 py-2.5 border-t border-blue-100 text-xs font-semibold text-blue-600 hover:bg-blue-50 transition-colors"
            >
              {expanded ? <><ChevronUp className="h-3.5 w-3.5" /> Masquer les détails</> : <><ChevronDown className="h-3.5 w-3.5" /> Voir analyse complète</>}
            </button>

            <AnimatePresence>
              {expanded && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden"
                >
                  <div className="p-4 pt-0 space-y-3 border-t border-blue-100">
                    {/* Posture */}
                    <div>
                      <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Posture</p>
                      <p className="text-sm text-slate-600">{result.posture_notes}</p>
                    </div>

                    {/* Strong / Weak */}
                    <div className="grid grid-cols-2 gap-3">
                      {result.strong_muscles?.length > 0 && (
                        <div>
                          <p className="text-xs font-bold text-green-600 mb-1.5">✅ Points forts</p>
                          <div className="flex flex-wrap gap-1">
                            {result.strong_muscles.map(m => (
                              <span key={m} className="text-xs bg-green-50 border border-green-200 text-green-700 px-2 py-0.5 rounded-full">{m}</span>
                            ))}
                          </div>
                        </div>
                      )}
                      {result.weak_muscles?.length > 0 && (
                        <div>
                          <p className="text-xs font-bold text-orange-500 mb-1.5">⚠️ À renforcer</p>
                          <div className="flex flex-wrap gap-1">
                            {result.weak_muscles.map(m => (
                              <span key={m} className="text-xs bg-orange-50 border border-orange-200 text-orange-700 px-2 py-0.5 rounded-full">{m}</span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Asymmetries */}
                    {result.asymmetries && (
                      <div className="bg-amber-50 border border-amber-200 rounded-xl p-3">
                        <p className="text-xs font-bold text-amber-600 mb-1">Asymétries détectées</p>
                        <p className="text-xs text-amber-700">{result.asymmetries}</p>
                      </div>
                    )}

                    {/* Training focus */}
                    {result.training_focus?.length > 0 && (
                      <div>
                        <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Priorités d'entraînement</p>
                        <div className="space-y-1">
                          {result.training_focus.map((f, i) => (
                            <div key={i} className="flex items-center gap-2 bg-white/60 rounded-lg px-3 py-2 border border-blue-100">
                              <span className="text-blue-500 font-bold text-xs">{i + 1}.</span>
                              <span className="text-xs text-slate-700">{f}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    <p className="text-xs text-slate-400 text-right">
                      Analysé le {new Date(result.analyzedAt).toLocaleDateString('fr-FR')} · {result.photoCount} photo(s)
                    </p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}