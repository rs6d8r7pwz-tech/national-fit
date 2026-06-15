import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { motion, AnimatePresence } from 'framer-motion';
import { Dumbbell, Clock, Trophy, ChevronDown, ChevronUp, TrendingUp, BarChart2, CalendarDays, ChevronLeft, ChevronRight } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, isSameMonth, addMonths, subMonths } from 'date-fns';
import { fr, enUS } from 'date-fns/locale';
import { useTheme } from '@/lib/ThemeContext';
import VolumeChart from '@/components/history/VolumeChart';
import FrequencyChart from '@/components/history/FrequencyChart';

function WorkoutCalendar({ sessions, isFR = true }) {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(null);
  const dateLocale = isFR ? fr : enUS;
  const dayLabels = isFR ? ['L', 'M', 'M', 'J', 'V', 'S', 'D'] : ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

  const start = startOfMonth(currentMonth);
  const end = endOfMonth(currentMonth);
  const days = eachDayOfInterval({ start, end });

  // Pad start
  const startDay = start.getDay() === 0 ? 6 : start.getDay() - 1;
  const paddedDays = [...Array(startDay).fill(null), ...days];

  const sessionDates = sessions.map(s => s.date);

  const selectedSessions = selectedDate
    ? sessions.filter(s => s.date === format(selectedDate, 'yyyy-MM-dd'))
    : [];

  return (
    <div>
      {/* Month nav */}
      <div className="flex items-center justify-between mb-3">
        <button onClick={() => setCurrentMonth(m => subMonths(m, 1))} className="p-1.5 rounded-lg hover:bg-blue-50">
          <ChevronLeft className="h-4 w-4 text-blue-600" />
        </button>
        <p className="font-semibold text-slate-700 capitalize text-sm">{format(currentMonth, 'MMMM yyyy', { locale: dateLocale })}</p>
        <button onClick={() => setCurrentMonth(m => addMonths(m, 1))} className="p-1.5 rounded-lg hover:bg-blue-50">
          <ChevronRight className="h-4 w-4 text-blue-600" />
        </button>
      </div>

      {/* Day labels */}
      <div className="grid grid-cols-7 mb-1">
        {dayLabels.map((d, i) => (
          <div key={i} className="text-center text-xs text-slate-400 py-1">{d}</div>
        ))}
      </div>

      {/* Days grid */}
      <div className="grid grid-cols-7 gap-0.5">
        {paddedDays.map((day, i) => {
          if (!day) return <div key={`pad-${i}`} />;
          const dateStr = format(day, 'yyyy-MM-dd');
          const hasSession = sessionDates.includes(dateStr);
          const isSelected = selectedDate && isSameDay(day, selectedDate);
          const isToday = isSameDay(day, new Date());
          return (
            <button
              key={dateStr}
              onClick={() => setSelectedDate(isSelected ? null : day)}
              className={`aspect-square flex flex-col items-center justify-center rounded-lg text-xs font-medium transition-all
                ${isSelected ? 'bg-blue-600 text-white' : ''}
                ${!isSelected && hasSession ? 'bg-blue-100 text-blue-700 hover:bg-blue-200' : ''}
                ${!isSelected && !hasSession ? 'text-slate-500 hover:bg-slate-100' : ''}
                ${isToday && !isSelected ? 'ring-2 ring-blue-400' : ''}
              `}
            >
              {format(day, 'd')}
              {hasSession && !isSelected && <div className="h-1 w-1 rounded-full bg-blue-500 mt-0.5" />}
            </button>
          );
        })}
      </div>

      {/* Selected day sessions */}
      {selectedDate && (
        <div className="mt-3 pt-3 border-t border-slate-100">
          <p className="text-xs font-bold text-blue-700 mb-2 capitalize">
            {format(selectedDate, 'EEEE d MMMM', { locale: dateLocale })}
          </p>
          {selectedSessions.length === 0 ? (
            <p className="text-xs text-slate-400 italic">{isFR ? 'Aucune séance ce jour.' : 'No sessions this day.'}</p>
          ) : selectedSessions.map(s => (
            <div key={s.id} className="flex items-center justify-between py-2 px-3 bg-blue-50 rounded-xl mb-1">
              <div>
                <p className="text-sm font-semibold text-slate-700">{s.session_name || 'Séance'}</p>
                <p className="text-xs text-slate-500">{s.program_title}</p>
              </div>
              <div className="text-right text-xs text-slate-500">
                {s.duration_min > 0 && <p>{s.duration_min} min</p>}
                {s.total_volume_kg > 0 && <p>{s.total_volume_kg.toLocaleString('fr')} kg</p>}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function History() {
  const [expandedId, setExpandedId] = useState(null);
  const [showCalendar, setShowCalendar] = useState(false);
  const { language } = useTheme();
  const isFR = language === 'fr';
  const dateLocale = isFR ? fr : enUS;

  const { data: sessions = [], isLoading } = useQuery({
    queryKey: ['workoutSessions'],
    queryFn: () => base44.entities.WorkoutSession.list('-date', 50),
    initialData: [],
  });

  const { data: logs = [] } = useQuery({
    queryKey: ['exerciseLogs'],
    queryFn: () => base44.entities.ExerciseLog.list('-created_at', 200),
    initialData: [],
  });

  // Stats globales
  const totalSessions = sessions.filter(s => s.completed).length;
  const totalVolume = sessions.reduce((a, s) => a + (s.total_volume_kg || 0), 0);
  const totalPRs = sessions.reduce((a, s) => a + (s.new_prs || 0), 0);
  const avgDuration = sessions.length
    ? Math.round(sessions.reduce((a, s) => a + (s.duration_min || 0), 0) / sessions.length)
    : 0;

  const getLogsForSession = (sessionId) => logs.filter(l => l.session_id === sessionId);

  const difficultyColor = {
    facile: 'bg-blue-100 text-blue-700',
    normal: 'bg-green-100 text-green-700',
    difficile: 'bg-orange-100 text-orange-700',
  };

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-5 pb-8">
      {/* Header */}
      <div className="flex items-center gap-3 pt-1">
        <div className="h-10 w-10 rounded-xl bg-blue-600 flex items-center justify-center shadow-md">
          <BarChart2 className="h-5 w-5 text-white" />
        </div>
        <div>
          <h1 className="font-heading text-3xl tracking-wider text-blue-700">{isFR ? 'HISTORIQUE' : 'HISTORY'}</h1>
          <p className="text-xs text-slate-500">{isFR ? 'Toutes tes séances enregistrées' : 'All your recorded sessions'}</p>
        </div>
      </div>

      {/* Calendar toggle */}
      {sessions.length > 0 && (
        <Card className="border-blue-100 shadow-sm">
          <button
            className="w-full flex items-center justify-between p-4"
            onClick={() => setShowCalendar(v => !v)}
          >
            <div className="flex items-center gap-2">
              <CalendarDays className="h-4 w-4 text-blue-600" />
              <span className="font-semibold text-sm text-slate-700">{isFR ? 'Calendrier des séances' : 'Session Calendar'}</span>
            </div>
            {showCalendar ? <ChevronUp className="h-4 w-4 text-slate-400" /> : <ChevronDown className="h-4 w-4 text-slate-400" />}
          </button>
          <AnimatePresence>
            {showCalendar && (
              <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                <CardContent className="pt-0 pb-4">
                  <WorkoutCalendar sessions={sessions} isFR={isFR} />
                </CardContent>
              </motion.div>
            )}
          </AnimatePresence>
        </Card>
      )}

      {/* Charts */}
      {sessions.length >= 2 && (
        <Card className="border-blue-100 shadow-sm">
          <CardContent className="pt-4 pb-4">
            <VolumeChart sessions={sessions} />
            <FrequencyChart sessions={sessions} />
          </CardContent>
        </Card>
      )}

      {/* Stats globales */}
      <div className="grid grid-cols-2 gap-3">
        {[
          { label: isFR ? 'Séances' : 'Sessions', value: totalSessions, icon: Dumbbell, color: 'text-blue-600', bg: 'bg-blue-50' },
          { label: isFR ? 'Volume total' : 'Total volume', value: `${totalVolume.toLocaleString()} kg`, icon: TrendingUp, color: 'text-green-600', bg: 'bg-green-50' },
          { label: isFR ? 'Records (PR)' : 'Records (PR)', value: totalPRs, icon: Trophy, color: 'text-yellow-600', bg: 'bg-yellow-50' },
          { label: isFR ? 'Durée moy.' : 'Avg duration', value: `${avgDuration} min`, icon: Clock, color: 'text-purple-600', bg: 'bg-purple-50' },
        ].map(({ label, value, icon: Icon, color, bg }) => (
          <Card key={label} className="border-blue-100 shadow-sm">
            <CardContent className="pt-4 pb-3">
              <div className="flex items-center gap-2">
                <div className={`h-8 w-8 rounded-lg ${bg} flex items-center justify-center`}>
                  <Icon className={`h-4 w-4 ${color}`} />
                </div>
                <div>
                  <p className="text-xs text-slate-500">{label}</p>
                  <p className={`text-lg font-bold ${color}`}>{value}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Liste des séances */}
      {isLoading ? (
        <div className="text-center py-10 text-slate-400">{isFR ? 'Chargement...' : 'Loading...'}</div>
      ) : sessions.length === 0 ? (
        <Card className="border-blue-100">
          <CardContent className="pt-8 pb-8 text-center">
            <Dumbbell className="h-12 w-12 text-slate-200 mx-auto mb-3" />
            <p className="text-slate-500 font-medium">{isFR ? 'Aucune séance enregistrée' : 'No sessions recorded'}</p>
            <p className="text-xs text-slate-400 mt-1">{isFR ? 'Lance ta première séance depuis Programmes !' : 'Start your first session from Programs!'}</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {sessions.map(session => {
            const isExpanded = expandedId === session.id;
            const sessionLogs = getLogsForSession(session.id);
            return (
              <motion.div key={session.id} layout>
                <Card className="border-blue-100 shadow-sm overflow-hidden">
                  <button
                    className="w-full text-left"
                    onClick={() => setExpandedId(isExpanded ? null : session.id)}
                  >
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <CardTitle className="text-base text-slate-800">{session.session_name || 'Séance'}</CardTitle>
                            {session.perceived_difficulty && (
                              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${difficultyColor[session.perceived_difficulty] || 'bg-slate-100 text-slate-600'}`}>
                                {session.perceived_difficulty}
                              </span>
                            )}
                            {session.new_prs > 0 && (
                              <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-yellow-100 text-yellow-700 flex items-center gap-1">
                                <Trophy className="h-3 w-3" />{session.new_prs} PR
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-slate-400 mt-1">
                            {session.program_title} · {session.date ? format(new Date(session.date), 'EEEE d MMM yyyy', { locale: dateLocale }) : ''}
                          </p>
                        </div>
                        <div className="flex items-center gap-1 text-slate-400 ml-2">
                          {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                        </div>
                      </div>
                      {/* Mini stats */}
                      <div className="flex items-center gap-4 mt-2">
                        {session.duration_min > 0 && (
                          <div className="flex items-center gap-1 text-xs text-slate-500">
                            <Clock className="h-3.5 w-3.5" />{session.duration_min} min
                          </div>
                        )}
                        {session.total_volume_kg > 0 && (
                          <div className="flex items-center gap-1 text-xs text-slate-500">
                            <TrendingUp className="h-3.5 w-3.5" />{session.total_volume_kg.toLocaleString('fr')} kg
                          </div>
                        )}
                        {session.total_sets > 0 && (
                          <div className="flex items-center gap-1 text-xs text-slate-500">
                            <Dumbbell className="h-3.5 w-3.5" />{session.total_sets} {isFR ? 'séries' : 'sets'}
                          </div>
                        )}
                      </div>
                    </CardHeader>
                  </button>

                  {/* Détails exercices */}
                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.25 }}
                        className="overflow-hidden"
                      >
                        <CardContent className="pt-0 pb-4">
                          <div className="border-t border-slate-100 pt-3 space-y-2">
                            {sessionLogs.length === 0 ? (
                              <p className="text-xs text-slate-400 italic">{isFR ? "Aucun log d'exercice enregistré pour cette séance." : 'No exercise logs for this session.'}</p>
                            ) : sessionLogs.map(log => (
                              <div key={log.id} className="flex items-center justify-between py-2 px-3 rounded-xl bg-slate-50 border border-slate-100">
                                <div>
                                  <p className="text-sm font-medium text-slate-700 flex items-center gap-1.5">
                                    {log.is_pr && <Trophy className="h-3.5 w-3.5 text-yellow-500" />}
                                    {log.exercise_name}
                                  </p>
                                  {log.muscle_group && <p className="text-xs text-slate-400">{log.muscle_group}</p>}
                                </div>
                                <div className="text-right">
                                  <p className="text-sm font-bold text-blue-700">
                                    {log.sets_completed} × {log.weight_per_set?.[0] || '?'} kg
                                  </p>
                                  <p className="text-xs text-slate-400">
                                   {log.reps_per_set?.[0] || '?'} {isFR ? 'reps/série' : 'reps/set'}
                                  </p>
                                </div>
                              </div>
                            ))}
                          </div>
                        </CardContent>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </Card>
              </motion.div>
            );
          })}
        </div>
      )}
    </motion.div>
  );
}