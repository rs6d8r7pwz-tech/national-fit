/**
 * Détection de la plateforme d'exécution.
 * 
 * Apple App Store et Google Play interdisent les paiements via des processeurs
 * tiers (Stripe, PayPal, etc.) dans les apps mobiles natives. Les achats
 * in-app DOIVENT passer par StoreKit (iOS) ou Google Play Billing (Android).
 * 
 * EXCEPTION légale : les apps "Reader" et les WebApps/PWA peuvent utiliser
 * Stripe si l'achat est initié depuis un navigateur externe.
 * 
 * Stratégie ici : dans l'app native (Capacitor/Cordova/WebView), on masque
 * le bouton Stripe et on redirige vers le site web pour l'abonnement.
 */

/**
 * Vérifie si l'app tourne dans un WebView natif (iOS/Android packagé).
 */
export function isNativeApp() {
  // Capacitor (base44 mobile wrapper)
  if (window.Capacitor && window.Capacitor.isNativePlatform?.()) return true;
  // Cordova
  if (window.cordova) return true;
  // ReactNative WebView
  if (window.ReactNativeWebView) return true;
  // User-agent based detection (fallback)
  const ua = navigator.userAgent || '';
  if (/wv\)/.test(ua) && /Android/.test(ua)) return true; // Android WebView
  // iOS WebView: WKWebView ne contient pas "Safari"
  if (/iPhone|iPad|iPod/.test(ua) && !/Safari/.test(ua) && !/CriOS/.test(ua) && !/FxiOS/.test(ua)) return true;
  return false;
}

/**
 * Vérifie si l'app tourne dans un iframe (aperçu base44).
 */
export function isInIframe() {
  try { return window.self !== window.top; } catch { return true; }
}

/**
 * URL du site web public pour l'abonnement (hors app store).
 * L'utilisateur peut s'abonner depuis Safari/Chrome sur ce lien,
 * ce qui est autorisé par Apple et Google (achat initié hors de l'app).
 * 
 * ⚠️ IMPORTANT : Cette URL doit pointer vers votre domaine personnalisé
 * ou l'URL de votre app base44 publiée avant de soumettre sur les stores.
 */
export const SUBSCRIPTION_WEB_URL =
  typeof window !== 'undefined'
    ? `${window.location.origin}/pricing`
    : 'https://national-fit.base44.app/pricing';