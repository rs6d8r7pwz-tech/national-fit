import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Youtube, Search, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { base44 } from '@/api/base44Client';

export default function ExerciseVideoModal({ exerciseName, isOpen, onClose, isFR = true }) {
  const [videoId, setVideoId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  const searchVideo = async () => {
    if (loading || searched) return;
    setLoading(true);
    try {
      // Ask AI for the best YouTube search query for this exercise
      const query = await base44.integrations.Core.InvokeLLM({
        prompt: `Give me ONLY the YouTube video ID (11 characters) of the best tutorial video for the exercise: "${exerciseName}". 
Search for well-known fitness channels like Jeff Nippard, AthleanX, or Scott Herman.
Reply with ONLY the video ID, nothing else. Example: dQw4w9WgXcQ`,
      });
      const cleanId = query?.trim().replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 11);
      if (cleanId && cleanId.length === 11) {
        setVideoId(cleanId);
      } else {
        // Fallback: open YouTube search
        const searchQuery = encodeURIComponent(`${exerciseName} tutorial form`);
        window.open(`https://www.youtube.com/results?search_query=${searchQuery}`, '_blank');
        onClose();
      }
    } catch {
      const searchQuery = encodeURIComponent(`${exerciseName} tutorial`);
      window.open(`https://www.youtube.com/results?search_query=${searchQuery}`, '_blank');
      onClose();
    }
    setSearched(true);
    setLoading(false);
  };

  // Auto-search when opened
  React.useEffect(() => {
    if (isOpen && !searched) {
      searchVideo();
    }
    if (!isOpen) {
      setVideoId(null);
      setSearched(false);
    }
  }, [isOpen, exerciseName]);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] flex items-end justify-center bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      >
        <motion.div
          initial={{ y: '100%' }}
          animate={{ y: 0 }}
          exit={{ y: '100%' }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          className="w-full max-w-lg bg-white rounded-t-3xl overflow-hidden shadow-2xl"
          onClick={e => e.stopPropagation()}
        >
          {/* Handle */}
          <div className="flex items-center justify-center pt-3 pb-1">
            <div className="w-12 h-1.5 bg-slate-200 rounded-full" />
          </div>

          {/* Header */}
          <div className="flex items-center justify-between px-5 py-3">
            <div className="flex items-center gap-2">
              <Youtube className="h-5 w-5 text-red-500" />
              <p className="font-semibold text-slate-800 text-sm">
                {isFR ? 'Tutoriel' : 'Tutorial'}: {exerciseName}
              </p>
            </div>
            <button onClick={onClose} className="h-8 w-8 rounded-xl bg-slate-100 flex items-center justify-center hover:bg-slate-200 transition-colors">
              <X className="h-4 w-4 text-slate-600" />
            </button>
          </div>

          {/* Video area */}
          <div className="px-4 pb-6">
            {loading && (
              <div className="aspect-video bg-slate-100 rounded-2xl flex flex-col items-center justify-center gap-3">
                <Loader2 className="h-8 w-8 text-blue-600 animate-spin" />
                <p className="text-sm text-slate-500">
                  {isFR ? 'Recherche de la meilleure vidéo…' : 'Finding the best video…'}
                </p>
              </div>
            )}

            {!loading && videoId && (
              <div className="aspect-video rounded-2xl overflow-hidden shadow-lg">
                <iframe
                  width="100%"
                  height="100%"
                  src={`https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0`}
                  title={exerciseName}
                  frameBorder="0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              </div>
            )}

            {!loading && videoId && (
              <Button
                variant="outline"
                className="w-full mt-3 gap-2 text-sm border-red-200 text-red-600 hover:bg-red-50"
                onClick={() => {
                  const searchQuery = encodeURIComponent(`${exerciseName} tutorial form`);
                  window.open(`https://www.youtube.com/results?search_query=${searchQuery}`, '_blank');
                }}
              >
                <Search className="h-4 w-4" />
                {isFR ? 'Voir d\'autres vidéos' : 'See more videos'}
              </Button>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}