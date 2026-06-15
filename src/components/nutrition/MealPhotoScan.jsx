import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Camera, X, Loader2, Zap, Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { base44 } from '@/api/base44Client';

export default function MealPhotoScan({ onResult, isFR = true }) {
  const [scanning, setScanning] = useState(false);
  const [result, setResult] = useState(null);
  const [show, setShow] = useState(false);
  const fileRef = useRef();

  const handleFile = async (file) => {
    if (!file) return;
    setScanning(true);
    setResult(null);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      const res = await base44.integrations.Core.InvokeLLM({
        prompt: `Analyse cette photo de repas et estime les macronutriments. Réponds en ${isFR ? 'français' : 'anglais'}.
Donne une estimation réaliste basée sur les aliments visibles.
Format JSON strict :
{
  "dish_name": "nom du plat",
  "calories": nombre,
  "protein_g": nombre,
  "carbs_g": nombre,
  "fat_g": nombre,
  "confidence": "faible|moyen|élevé",
  "notes": "brève observation sur les ingrédients principaux identifiés"
}`,
        image_url: file_url,
        response_json_schema: {
          type: 'object',
          properties: {
            dish_name: { type: 'string' },
            calories: { type: 'number' },
            protein_g: { type: 'number' },
            carbs_g: { type: 'number' },
            fat_g: { type: 'number' },
            confidence: { type: 'string' },
            notes: { type: 'string' },
          },
        },
      });
      setResult(res);
      if (onResult) onResult(res);
    } catch (e) {
      console.error('Scan erreur:', e);
      setResult({ error: true });
    }
    setScanning(false);
  };

  const confidenceColor = {
    faible: 'text-orange-600 bg-orange-50',
    moyen: 'text-blue-600 bg-blue-50',
    élevé: 'text-green-600 bg-green-50',
    low: 'text-orange-600 bg-orange-50',
    medium: 'text-blue-600 bg-blue-50',
    high: 'text-green-600 bg-green-50',
  };

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        onClick={() => setShow(true)}
        className="gap-2 border-purple-200 text-purple-700 hover:bg-purple-50"
      >
        <Camera className="h-4 w-4" />
        {isFR ? 'Scanner un repas' : 'Scan a meal'}
      </Button>

      <AnimatePresence>
        {show && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-end justify-center p-4"
            style={{ background: 'rgba(0,0,0,0.5)' }}
            onClick={(e) => { if (e.target === e.currentTarget) setShow(false); }}
          >
            <motion.div
              initial={{ y: 80, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 80, opacity: 0 }}
              className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl"
            >
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-2">
                  <div className="h-9 w-9 rounded-xl bg-purple-100 flex items-center justify-center">
                    <Camera className="h-5 w-5 text-purple-600" />
                  </div>
                  <h3 className="font-heading text-xl tracking-wider text-purple-700">
                    {isFR ? 'SCAN REPAS IA' : 'AI MEAL SCAN'}
                  </h3>
                </div>
                <button onClick={() => { setShow(false); setResult(null); }}>
                  <X className="h-5 w-5 text-slate-400" />
                </button>
              </div>

              {!result && !scanning && (
                <div
                  onClick={() => fileRef.current?.click()}
                  className="border-2 border-dashed border-purple-200 rounded-2xl p-10 flex flex-col items-center gap-3 cursor-pointer hover:border-purple-400 hover:bg-purple-50 transition-colors"
                >
                  <Upload className="h-10 w-10 text-purple-400" />
                  <p className="font-semibold text-slate-700">
                    {isFR ? 'Prends une photo de ton repas' : 'Take a photo of your meal'}
                  </p>
                  <p className="text-xs text-slate-400 text-center">
                    {isFR ? "L'IA va estimer les macros instantanément" : 'AI will estimate macros instantly'}
                  </p>
                  <input
                    ref={fileRef}
                    type="file"
                    accept="image/*"
                    capture="environment"
                    className="hidden"
                    onChange={(e) => handleFile(e.target.files?.[0])}
                  />
                </div>
              )}

              {scanning && (
                <div className="flex flex-col items-center gap-4 py-10">
                  <Loader2 className="h-10 w-10 animate-spin text-purple-500" />
                  <p className="text-slate-600 font-medium">
                    {isFR ? "Analyse en cours..." : "Analyzing..."}
                  </p>
                  <p className="text-xs text-slate-400">
                    {isFR ? "L'IA identifie les aliments et calcule les macros" : "AI is identifying foods and calculating macros"}
                  </p>
                </div>
              )}

              {result && !result.error && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="font-semibold text-slate-800 text-lg">{result.dish_name}</h4>
                    {result.confidence && (
                      <span className={`text-xs px-2 py-1 rounded-full font-medium ${confidenceColor[result.confidence] || 'text-slate-600 bg-slate-100'}`}>
                        {isFR ? 'Confiance:' : 'Confidence:'} {result.confidence}
                      </span>
                    )}
                  </div>

                  {/* Calories big */}
                  <div className="text-center py-3 bg-purple-50 rounded-2xl">
                    <p className="font-heading text-4xl text-purple-700">{result.calories}</p>
                    <p className="text-xs text-slate-500">{isFR ? 'calories estimées' : 'estimated calories'}</p>
                  </div>

                  {/* Macros */}
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { label: isFR ? 'Protéines' : 'Protein', value: result.protein_g, unit: 'g', color: 'text-blue-700 bg-blue-50' },
                      { label: isFR ? 'Glucides' : 'Carbs', value: result.carbs_g, unit: 'g', color: 'text-orange-700 bg-orange-50' },
                      { label: isFR ? 'Lipides' : 'Fat', value: result.fat_g, unit: 'g', color: 'text-yellow-700 bg-yellow-50' },
                    ].map(m => (
                      <div key={m.label} className={`rounded-xl p-3 text-center ${m.color}`}>
                        <p className="font-bold text-xl leading-none">{m.value}<span className="text-xs">{m.unit}</span></p>
                        <p className="text-xs mt-0.5 opacity-70">{m.label}</p>
                      </div>
                    ))}
                  </div>

                  {result.notes && (
                    <div className="flex items-start gap-2 p-3 bg-slate-50 rounded-xl">
                      <Zap className="h-4 w-4 text-slate-400 mt-0.5 shrink-0" />
                      <p className="text-xs text-slate-600">{result.notes}</p>
                    </div>
                  )}

                  <p className="text-[10px] text-slate-400 text-center italic">
                    {isFR ? '⚠️ Estimation IA — peut varier selon les portions réelles' : '⚠️ AI estimate — may vary based on actual portions'}
                  </p>

                  <Button
                    variant="outline"
                    onClick={() => setResult(null)}
                    className="w-full gap-2 text-purple-600 border-purple-200"
                  >
                    <Camera className="h-4 w-4" />
                    {isFR ? 'Scanner un autre repas' : 'Scan another meal'}
                  </Button>
                </motion.div>
              )}

              {result?.error && (
                <div className="text-center py-8 space-y-3">
                  <p className="text-red-500 font-medium">
                    {isFR ? "Impossible d'analyser cette image" : 'Unable to analyze this image'}
                  </p>
                  <Button variant="outline" onClick={() => setResult(null)} size="sm">
                    {isFR ? 'Réessayer' : 'Try again'}
                  </Button>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}