/**
 * Hook pour les rappels locaux (séance du jour & streak).
 * Utilise l'API Notification du navigateur -- pas de serveur requis.
 *
 * Fiabilité : les notifications passent par le Service Worker
 * (registration.showNotification) quand il est dispo -- indispensable sur
 * Android / PWA installée, et rend la notif cliquable (voir sw.js).
 * Limite connue : une notification ne peut PAS se déclencher quand l'app est
 * complètement fermée sans un vrai serveur push (VAPID). Ici on ré-arme les
 * rappels à CHAQUE ouverture de l'app, ce qui couvre le cas "app ouverte /
 * en arrière-plan" de façon fiable.
 */

const NOTIF_KEY = 'nationalfit_notifs_enabled';
const NOTIF_TIME_KEY = 'nationalfit_notif_time';
const ARMED_KEY = 'nationalfit_reminders_armed'; // garde anti-doublon par jour

function todayStr() {
  return new Date().toISOString().split('T')[0];
}

export function useNotifications() {
  const isSupported = typeof window !== 'undefined' && 'Notification' in window;

  function getPermission() {
    if (!isSupported) return 'unsupported';
    return Notification.permission;
  }

  function isEnabled() {
    try { return localStorage.getItem(NOTIF_KEY) === '1'; } catch { return false; }
  }

  function getSavedTime() {
    try { return localStorage.getItem(NOTIF_TIME_KEY) || '09:00'; } catch { return '09:00'; }
  }

  async function requestPermission() {
    if (!isSupported) return false;
    const result = await Notification.requestPermission();
    if (result === 'granted') {
      try { localStorage.setItem(NOTIF_KEY, '1'); } catch {}
      return true;
    }
    return false;
  }

  function disable() {
    try { localStorage.setItem(NOTIF_KEY, '0'); } catch {}
    try { localStorage.removeItem(ARMED_KEY); } catch {}
  }

  function saveTime(time) {
    try { localStorage.setItem(NOTIF_TIME_KEY, time); } catch {}
    try { localStorage.removeItem(ARMED_KEY); } catch {} // permet de ré-armer avec la nouvelle heure
  }

  /**
   * Affiche une notification -- via le Service Worker si possible (fiable +
   * cliquable), sinon via l'API Notification classique.
   */
  async function deliver(title, body, tag) {
    if (!isSupported || Notification.permission !== 'granted') return;
    const options = { body, icon: '/logo192.png', badge: '/logo192.png', tag: tag || 'nfit', renotify: true };
    try {
      if ('serviceWorker' in navigator) {
        const reg = await navigator.serviceWorker.ready;
        if (reg && reg.showNotification) {
          await reg.showNotification(title, options);
          return;
        }
      }
    } catch {}
    try { new Notification(title, options); } catch {}
  }

  /**
   * Planifie une notification locale dans X millisecondes (setTimeout : ne
   * survit pas à la fermeture de l'onglet -- on ré-arme à chaque ouverture).
   */
  function scheduleNotification({ title, body, delayMs = 0, tag }) {
    if (!isSupported || Notification.permission !== 'granted') return;
    if (delayMs <= 0) {
      deliver(title, body, tag);
    } else {
      setTimeout(() => { deliver(title, body, tag); }, delayMs);
    }
  }

  function msUntil(hours, minutes, allowTomorrow = true) {
    const now = new Date();
    const target = new Date();
    target.setHours(hours, minutes, 0, 0);
    if (target <= now) {
      if (!allowTomorrow) return null;
      target.setDate(target.getDate() + 1);
    }
    return target - now;
  }

  /**
   * Planifie le rappel de séance du jour à l'heure choisie.
   */
  function scheduleWorkoutReminder(profileFirstName, sessionName, targetTime) {
    if (!isSupported || Notification.permission !== 'granted') return;
    const [hours, minutes] = (targetTime || '09:00').split(':').map(Number);
    const delayMs = msUntil(hours, minutes, true);
    if (delayMs == null) return;
    scheduleNotification({
      title: `💪 C'est l'heure ${profileFirstName || ''} !`.trim(),
      body: sessionName ? `Séance du jour : ${sessionName}` : `Ta séance t'attend -- Let's go !`,
      delayMs,
      tag: 'nfit-workout',
    });
    saveTime(targetTime);
  }

  /**
   * Notifie si le streak est en danger (pas de séance aujourd'hui à 20h).
   */
  function scheduleStreakReminder(profileFirstName, streak) {
    if (!isSupported || Notification.permission !== 'granted' || !streak || streak < 2) return;
    const delayMs = msUntil(20, 0, false); // uniquement si 20h n'est pas encore passé
    if (delayMs == null) return;
    scheduleNotification({
      title: `🔥 Streak en danger, ${profileFirstName || ''} !`.trim(),
      body: `${streak} jours de suite -- ne laisse pas tomber aujourd'hui !`,
      delayMs,
      tag: 'nfit-streak',
    });
  }

  /**
   * Ré-arme intelligemment les rappels du jour. À appeler au chargement de
   * l'app (une fois profil/séances connus).
   *  - ne fait rien si les rappels sont désactivés ou permission non accordée
   *  - ne re-planifie pas deux fois le même jour (garde ARMED_KEY)
   *  - ne rappelle PAS la séance si elle est déjà faite aujourd'hui
   */
  function armDailyReminders({ firstName, sessionName, streak = 0, doneToday = false } = {}) {
    if (!isSupported || Notification.permission !== 'granted' || !isEnabled()) return;
    const today = todayStr();
    try { if (localStorage.getItem(ARMED_KEY) === today) return; } catch {}
    try { localStorage.setItem(ARMED_KEY, today); } catch {}

    if (!doneToday) {
      scheduleWorkoutReminder(firstName, sessionName, getSavedTime());
      scheduleStreakReminder(firstName, streak);
    }
  }

  return {
    isSupported,
    getPermission,
    isEnabled,
    getSavedTime,
    requestPermission,
    disable,
    saveTime,
    scheduleWorkoutReminder,
    scheduleStreakReminder,
    scheduleNotification,
    armDailyReminders,
  };
}
