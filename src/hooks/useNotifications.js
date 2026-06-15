/**
 * Hook pour les notifications Web Push (rappels séance & streak).
 * Utilise l'API Notification du navigateur -- pas de serveur requis.
 * Les notifications locales fonctionnent en PWA installée.
 */

const NOTIF_KEY = 'nationalfit_notifs_enabled';
const NOTIF_TIME_KEY = 'nationalfit_notif_time';

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
      localStorage.setItem(NOTIF_KEY, '1');
      return true;
    }
    return false;
  }

  function disable() {
    localStorage.setItem(NOTIF_KEY, '0');
  }

  function saveTime(time) {
    localStorage.setItem(NOTIF_TIME_KEY, time);
  }

  /**
   * Planifie une notification locale dans X millisecondes.
   * Note: les notifications locales ne survivent pas au fermeture de l'onglet
   * SAUF en PWA installée (Service Worker).
   */
  function scheduleNotification({ title, body, icon = '/logo192.png', delayMs = 0 }) {
    if (!isSupported || Notification.permission !== 'granted') return;
    if (delayMs === 0) {
      new Notification(title, { body, icon, badge: '/logo192.png' });
    } else {
      setTimeout(() => {
        new Notification(title, { body, icon, badge: '/logo192.png' });
      }, delayMs);
    }
  }

  /**
   * Planifie le rappel de séance du jour à l'heure choisie.
   */
  function scheduleWorkoutReminder(profileFirstName, sessionName, targetTime) {
    if (!isSupported || Notification.permission !== 'granted') return;

    const [hours, minutes] = (targetTime || '09:00').split(':').map(Number);
    const now = new Date();
    const target = new Date();
    target.setHours(hours, minutes, 0, 0);

    // Si l'heure est passée aujourd'hui, planifier pour demain
    if (target <= now) target.setDate(target.getDate() + 1);

    const delayMs = target - now;

    scheduleNotification({
      title: `💪 C'est l'heure ${profileFirstName} !`,
      body: sessionName ? `Séance du jour : ${sessionName}` : `Ta séance t'attend -- Let's go !`,
      delayMs,
    });

    // Sauvegarder pour re-planifier au prochain chargement
    saveTime(targetTime);
  }

  /**
   * Notifie si le streak est en danger (pas de séance aujourd'hui à 20h).
   */
  function scheduleStreakReminder(profileFirstName, streak) {
    if (!isSupported || Notification.permission !== 'granted' || !streak || streak < 2) return;

    const now = new Date();
    const target = new Date();
    target.setHours(20, 0, 0, 0);
    if (target <= now) return; // Déjà passé

    const delayMs = target - now;
    scheduleNotification({
      title: `🔥 Streak en danger, ${profileFirstName} !`,
      body: `${streak} jours de suite -- ne laisse pas tomber aujourd'hui !`,
      delayMs,
    });
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
  };
}