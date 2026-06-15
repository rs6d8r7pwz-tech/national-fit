import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, BellOff, X, Clock, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNotifications } from '@/hooks/useNotifications';

export default function NotificationSetup({ profile, nextSession, onClose }) {
  const notif = useNotifications();
  const [permission, setPermission] = useState(notif.getPermission());
  const [enabled, setEnabled] = useState(notif.isEnabled());
  const [time, setTime] = useState(notif.getSavedTime());
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setPermission(notif.getPermission());
    setEnabled(notif.isEnabled());
  }, []);

  const handleEnable = async () => {
    const granted = await notif.requestPermission();
    setPermission(notif.getPermission());
    if (granted) {
      setEnabled(true);
      notif.scheduleWorkoutReminder(profile?.first_name || 'Champion', nextSession?.name, time);
      notif.scheduleStreakReminder(profile?.first_name || 'Champion', profile?.streak_days);
    }
  };

  const handleSaveTime = () => {
    notif.saveTime(time);
    if (permission === 'granted') {
      notif.scheduleWorkoutReminder(profile?.first_name || 'Champion', nextSession?.name, time);
      notif.scheduleStreakReminder(profile?.first_name || 'Champion', profile?.streak_days);
    }
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleDisable = () => {
    notif.disable();
    setEnabled(false);
  };

  if (!notif.isSupported) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 10 }}
      className="rounded-2xl overflow-hidden border border-blue-200 bg-white shadow-lg"
    >
      {/* Header */}
      <div className="px-4 pt-4 pb-3 flex items-center justify-between"
        style={{ background: 'linear-gradient(135deg, #eff6ff, #f0f9ff)' }}>
        <div className="flex items-center gap-2.5">
          <div className="h-8 w-8 rounded-xl bg-blue-600 flex items-center justify-center shadow-sm">
            <Bell className="h-4 w-4 text-white" />
          </div>
          <div>
            <p className="font-bold text-sm text-blue-900">Rappels d'entraînement</p>
            <p className="text-[10px] text-blue-500">Ne rate plus jamais une séance</p>
          </div>
        </div>
        {onClose && (
          <button onClick={onClose} className="h-7 w-7 rounded-lg bg-white/80 border border-blue-100 flex items-center justify-center">
            <X className="h-3.5 w-3.5 text-slate-500" />
          </button>
        )}
      </div>

      <div className="p-4 space-y-4">
        {permission === 'denied' ? (
          <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-center">
            <BellOff className="h-5 w-5 text-red-400 mx-auto mb-1" />
            <p className="text-xs text-red-600 font-medium">Notifications bloquées par le navigateur</p>
            <p className="text-xs text-red-400 mt-1">Autorise-les dans les paramètres de ton navigateur</p>
          </div>
        ) : permission !== 'granted' ? (
          <div className="text-center space-y-3">
            <p className="text-sm text-slate-600 leading-relaxed">
              Reçois un rappel chaque jour à l'heure de ta séance, et une alerte si ton streak est en danger 🔥
            </p>
            <Button onClick={handleEnable} className="w-full gap-2 text-white bg-blue-600 hover:bg-blue-700">
              <Bell className="h-4 w-4" />
              Activer les rappels
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            {/* Time picker */}
            <div className="flex items-center gap-3 bg-blue-50 rounded-xl px-3 py-2.5">
              <Clock className="h-4 w-4 text-blue-600 shrink-0" />
              <div className="flex-1">
                <p className="text-xs font-semibold text-blue-800">Heure du rappel</p>
              </div>
              <input
                type="time"
                value={time}
                onChange={e => setTime(e.target.value)}
                className="text-sm font-bold text-blue-900 bg-transparent border-none outline-none"
              />
            </div>

            {/* Rappels actifs */}
            <div className="space-y-1.5">
              <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-green-50 border border-green-200">
                <div className="h-5 w-5 rounded-full bg-green-500 flex items-center justify-center shrink-0">
                  <Check className="h-3 w-3 text-white" />
                </div>
                <p className="text-xs text-green-800 font-medium">Rappel séance du jour à {time}</p>
              </div>
              {(profile?.streak_days || 0) >= 2 && (
                <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-orange-50 border border-orange-200">
                  <div className="h-5 w-5 rounded-full bg-orange-500 flex items-center justify-center shrink-0">
                    <Check className="h-3 w-3 text-white" />
                  </div>
                  <p className="text-xs text-orange-800 font-medium">Alerte streak à 20h00 si pas de séance</p>
                </div>
              )}
            </div>

            <div className="flex gap-2">
              <Button onClick={handleSaveTime} className="flex-1 gap-2 text-white bg-blue-600 hover:bg-blue-700 h-9">
                {saved ? <><Check className="h-3.5 w-3.5" /> Sauvegardé !</> : <><Clock className="h-3.5 w-3.5" /> Appliquer</>}
              </Button>
              <Button onClick={handleDisable} variant="outline" className="gap-1.5 text-slate-500 border-slate-200 h-9">
                <BellOff className="h-3.5 w-3.5" /> Désactiver
              </Button>
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
}