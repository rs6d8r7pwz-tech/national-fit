/**
 * Système audio National Fit -- Web Audio API pure, zéro fichier externe.
 * 1. playSound()   -- effets sonores UI/workout
 * 2. AmbientMusic  -- musique d'ambiance générative (pad atmosphérique)
 */

// ─── Shared AudioContext ───────────────────────────────────────────────────
let ctx = null;
function getCtx() {
  if (!ctx) {
    try { ctx = new (window.AudioContext || window.webkitAudioContext)(); } catch { return null; }
  }
  if (ctx.state === 'suspended') ctx.resume().catch(() => {});
  return ctx;
}

// ─── Sound FX ─────────────────────────────────────────────────────────────
function playTone({ freq = 440, type = 'sine', duration = 0.08, volume = 0.12, attack = 0.005, decay = 0.07, freqEnd = null }) {
  const ac = getCtx();
  if (!ac) return;
  try {
    const osc = ac.createOscillator();
    const gain = ac.createGain();
    osc.connect(gain);
    gain.connect(ac.destination);
    osc.type = type;
    osc.frequency.setValueAtTime(freq, ac.currentTime);
    if (freqEnd) osc.frequency.exponentialRampToValueAtTime(freqEnd, ac.currentTime + duration);
    gain.gain.setValueAtTime(0, ac.currentTime);
    gain.gain.linearRampToValueAtTime(volume, ac.currentTime + attack);
    gain.gain.exponentialRampToValueAtTime(0.0001, ac.currentTime + attack + decay);
    osc.start(ac.currentTime);
    osc.stop(ac.currentTime + duration + 0.05);
  } catch {}
}

export const sounds = {
  tap:          () => playTone({ freq: 800, type: 'sine', duration: 0.06, volume: 0.10, attack: 0.002, decay: 0.05 }),
  success:      () => {
    playTone({ freq: 523, type: 'sine', duration: 0.12, volume: 0.13, attack: 0.005, decay: 0.10 });
    setTimeout(() => playTone({ freq: 659, type: 'sine', duration: 0.12, volume: 0.13, attack: 0.005, decay: 0.10 }), 80);
    setTimeout(() => playTone({ freq: 784, type: 'sine', duration: 0.18, volume: 0.15, attack: 0.005, decay: 0.16 }), 160);
  },
  xp:           () => {
    playTone({ freq: 1046, type: 'sine', duration: 0.15, volume: 0.12, attack: 0.003, decay: 0.13 });
    setTimeout(() => playTone({ freq: 1318, type: 'sine', duration: 0.20, volume: 0.10, attack: 0.003, decay: 0.18 }), 100);
  },
  setDone:      () => playTone({ freq: 440, type: 'sine', duration: 0.10, volume: 0.14, attack: 0.002, decay: 0.08, freqEnd: 660 }),
  workoutStart: () => {
    playTone({ freq: 220, type: 'sawtooth', duration: 0.15, volume: 0.08, attack: 0.01, decay: 0.12, freqEnd: 440 });
    setTimeout(() => playTone({ freq: 440, type: 'sine', duration: 0.20, volume: 0.12, attack: 0.005, decay: 0.18 }), 100);
  },
  timerEnd:     () => {
    playTone({ freq: 880, type: 'square', duration: 0.08, volume: 0.10, attack: 0.002, decay: 0.07 });
    setTimeout(() => playTone({ freq: 880, type: 'square', duration: 0.08, volume: 0.10, attack: 0.002, decay: 0.07 }), 150);
  },
  cancel:       () => playTone({ freq: 220, type: 'sine', duration: 0.10, volume: 0.09, attack: 0.003, decay: 0.08 }),
  unlock:       () => {
    for (let i = 0; i < 5; i++) {
      setTimeout(() => playTone({ freq: 330 + i * 110, type: 'sine', duration: 0.12, volume: 0.10, attack: 0.003, decay: 0.10 }), i * 60);
    }
  },
};

const SOUND_KEY = 'nfit_sound_enabled';
export let isSoundEnabled = () => {
  try { return localStorage.getItem(SOUND_KEY) !== 'false'; } catch { return true; }
};
export function toggleSound() {
  try {
    const next = !isSoundEnabled();
    localStorage.setItem(SOUND_KEY, String(next));
    return next;
  } catch { return true; }
}
export function playSound(name) {
  if (!isSoundEnabled()) return;
  sounds[name]?.();
}

// ─── Ambient Music Engine ──────────────────────────────────────────────────
const MUSIC_KEY = 'nfit_music_enabled';
export const isMusicEnabled = () => {
  try { return localStorage.getItem(MUSIC_KEY) !== 'false'; } catch { return true; }
};
export function toggleMusic() {
  try {
    const next = !isMusicEnabled();
    localStorage.setItem(MUSIC_KEY, String(next));
    if (next) startAmbient(); else stopAmbient();
    return next;
  } catch { return true; }
}

// Nœuds actifs de la musique d'ambiance
let ambientNodes = [];
let ambientRunning = false;
let ambientMasterGain = null;

// Notes d'un accord de Am pentatonique doux -- calme mais motivant
const PAD_NOTES = [110, 165, 220, 275, 330]; // A2, E3, A3, C#4, E4

function createPadVoice(ac, freq, masterGain) {
  try {
    const osc1 = ac.createOscillator();
    const osc2 = ac.createOscillator();
    const gain = ac.createGain();
    const filter = ac.createBiquadFilter();

    osc1.type = 'sine';
    osc2.type = 'sine';
    osc1.frequency.value = freq;
    osc2.frequency.value = freq * 1.005; // légère détuning pour richesse

    filter.type = 'lowpass';
    filter.frequency.value = 600;
    filter.Q.value = 0.8;

    osc1.connect(filter);
    osc2.connect(filter);
    filter.connect(gain);
    gain.connect(masterGain);

    // Volume très doux -- pad d'ambiance
    gain.gain.setValueAtTime(0, ac.currentTime);
    gain.gain.linearRampToValueAtTime(0.018, ac.currentTime + 3); // fade-in 3s

    osc1.start();
    osc2.start();

    return { osc1, osc2, gain };
  } catch { return null; }
}

// Légère évolution harmonique toutes les ~8s pour éviter la monotonie
function scheduleHarmonicShift(ac, nodes) {
  if (!ambientRunning) return;
  const shifts = [0, 2, -3, 5, 0]; // demi-tons de variation subtile
  let step = 0;
  const interval = setInterval(() => {
    if (!ambientRunning) { clearInterval(interval); return; }
    step = (step + 1) % shifts.length;
    const semitone = Math.pow(2, shifts[step] / 12);
    nodes.forEach(({ osc1, osc2 }, i) => {
      if (!osc1) return;
      const base = PAD_NOTES[i] * semitone;
      try {
        osc1.frequency.linearRampToValueAtTime(base, ac.currentTime + 2);
        osc2.frequency.linearRampToValueAtTime(base * 1.005, ac.currentTime + 2);
      } catch {}
    });
  }, 8000);
  ambientNodes.push({ interval }); // stocker pour cleanup
}

export function startAmbient() {
  if (ambientRunning) return;
  if (!isMusicEnabled()) return;
  const ac = getCtx();
  if (!ac) return;

  ambientRunning = true;
  ambientMasterGain = ac.createGain();

  // Légère réverb simulée via delay
  const delay = ac.createDelay(0.5);
  delay.delayTime.value = 0.35;
  const delayGain = ac.createGain();
  delayGain.gain.value = 0.15;
  ambientMasterGain.connect(delay);
  delay.connect(delayGain);
  delayGain.connect(ambientMasterGain);
  ambientMasterGain.connect(ac.destination);

  ambientMasterGain.gain.setValueAtTime(0, ac.currentTime);
  ambientMasterGain.gain.linearRampToValueAtTime(1, ac.currentTime + 4);

  const voices = PAD_NOTES.map(freq => createPadVoice(ac, freq, ambientMasterGain)).filter(Boolean);
  ambientNodes = voices;

  scheduleHarmonicShift(ac, voices);
}

export function stopAmbient() {
  ambientRunning = false;
  const ac = getCtx();
  if (!ac || !ambientMasterGain) return;

  // Fade-out progressif
  try {
    ambientMasterGain.gain.linearRampToValueAtTime(0, ac.currentTime + 1.5);
  } catch {}

  setTimeout(() => {
    ambientNodes.forEach(node => {
      try { node.osc1?.stop(); } catch {}
      try { node.osc2?.stop(); } catch {}
      if (node.interval) clearInterval(node.interval);
    });
    ambientNodes = [];
    ambientMasterGain = null;
  }, 1600);
}