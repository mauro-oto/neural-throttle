/* ===========================================
   NEURAL THROTTLE - Audio System
   Procedural SFX with rate limiting & batching
   =========================================== */

// ===========================================
// CONFIGURATION
// ===========================================
const AUDIO_CONFIG = {
  // Default settings
  DEFAULT_VOLUME: 0.35,
  DEFAULT_MUTED: false,

  // LocalStorage keys
  STORAGE_VOLUME: 'nt_audio_volume',
  STORAGE_MUTED: 'nt_audio_muted',

  // Rate limiting thresholds (max plays per second)
  RATE_LIMITS: {
    'tower.fire': { max: 10, windowMs: 1000 },
    'world.minionDeath': { max: 6, windowMs: 1000 },
    'world.coreHit': { max: 4, windowMs: 1000 },
    'cmd.error': { max: 4, windowMs: 1000 },
  },

  // Pitch variation settings (±percentage)
  PITCH_VARIATION: {
    'tower.fire': 0.03,
    'world.minionDeath': 0.05,
    'cmd.rm': 0.02,
    'cmd.rmForce': 0.02,
  }
};

// ===========================================
// AUDIO STATE
// ===========================================
const audioState = {
  initialized: false,
  unlocked: false,
  muted: AUDIO_CONFIG.DEFAULT_MUTED,
  volume: AUDIO_CONFIG.DEFAULT_VOLUME,

  // Rate limiter buckets: { soundName: [timestamp1, timestamp2, ...] }
  rateLimitBuckets: {}
};

// ===========================================
// SFX PALETTE - Cyberpunk Terminal Theme
// ===========================================
// Format: [volume, randomness, frequency, attack, sustain, release, shape, shapeCurve, slide, deltaSlide, pitchJump, pitchJumpTime, repeatTime, noise, modulation, bitCrush, delay, sustainVolume, decay, tremolo]
// Keep all volumes LOW (0.1-0.4) to avoid harshness

const SFX = {
  // =========================================
  // UI SOUNDS - Clean, subtle clicks
  // =========================================
  'ui.menuClick': () => [
    0.2,    // volume - soft
    0,      // randomness
    880,    // frequency - high blip
    0.01,   // attack - instant
    0.02,   // sustain - very short
    0.03,   // release - quick fade
    0,      // shape - sine (smooth)
    1,      // shapeCurve
    0,      // slide
    0,      // deltaSlide
    0,      // pitchJump
    0,      // pitchJumpTime
    0,      // repeatTime
    0,      // noise
    0,      // modulation
    0,      // bitCrush
    0,      // delay
    1,      // sustainVolume
    0,      // decay
    0       // tremolo
  ],

  'ui.confirm': () => [
    0.25,   // volume
    0,      // randomness
    660,    // frequency - pleasant tone
    0.01,   // attack
    0.04,   // sustain
    0.08,   // release
    0,      // shape - sine
    1,      // shapeCurve
    50,     // slide - slight upward pitch
    0,      // deltaSlide
    0,      // pitchJump
    0,      // pitchJumpTime
    0,      // repeatTime
    0,      // noise
    0,      // modulation
    0,      // bitCrush
    0,      // delay
    1,      // sustainVolume
    0.02,   // decay
    0       // tremolo
  ],

  // =========================================
  // GAME FLOW SOUNDS - Impactful but not loud
  // =========================================
  'game.missionStart': () => [
    0.18,   // volume - softer
    0,      // randomness
    440,    // frequency - pleasant mid tone
    0.03,   // attack - slightly softer onset
    0.08,   // sustain
    0.15,   // release
    0,      // shape - sine (smooth)
    1,      // shapeCurve
    40,     // slide - gentle rise
    0,      // deltaSlide
    0,      // pitchJump - removed
    0,      // pitchJumpTime
    0,      // repeatTime
    0,      // noise
    0,      // modulation
    0,      // bitCrush
    0,      // delay
    0.7,    // sustainVolume
    0.04,   // decay
    0       // tremolo
  ],

  'game.missionComplete': () => [
    0.35,   // volume
    0,      // randomness
    440,    // frequency
    0.02,   // attack
    0.15,   // sustain
    0.3,    // release - longer victory chord
    0,      // shape - sine
    1,      // shapeCurve
    100,    // slide - rising
    10,     // deltaSlide - accelerating rise
    220,    // pitchJump - jump to higher note
    0.1,    // pitchJumpTime
    0,      // repeatTime
    0,      // noise
    0,      // modulation
    0,      // bitCrush
    0.1,    // delay - slight echo
    0.7,    // sustainVolume
    0.08,   // decay
    0       // tremolo
  ],

  'game.missionFail': () => [
    0.3,    // volume
    0,      // randomness
    180,    // frequency - low ominous
    0.03,   // attack
    0.2,    // sustain
    0.4,    // release
    1,      // shape - square (harsh edge)
    0.5,    // shapeCurve - soften it
    -80,    // slide - downward doom
    -5,     // deltaSlide - accelerating down
    0,      // pitchJump
    0,      // pitchJumpTime
    0,      // repeatTime
    0.1,    // noise - add grit
    0,      // modulation
    0,      // bitCrush
    0.05,   // delay
    0.5,    // sustainVolume
    0.1,    // decay
    0       // tremolo
  ],

  'game.unlockCampaignPlus': () => [
    0.35,   // volume
    0,      // randomness
    330,    // frequency
    0.01,   // attack
    0.3,    // sustain - epic
    0.5,    // release
    0,      // shape - sine
    1,      // shapeCurve
    150,    // slide
    5,      // deltaSlide
    165,    // pitchJump
    0.15,   // pitchJumpTime
    0,      // repeatTime
    0,      // noise
    0,      // modulation
    0,      // bitCrush
    0.15,   // delay
    0.8,    // sustainVolume
    0.1,    // decay
    0.1     // tremolo - slight shimmer
  ],

  // =========================================
  // COMMAND SOUNDS - Tactical feedback
  // =========================================
  'cmd.rm': (pitchMult = 1) => [
    0.2,          // volume - soft attack sound
    0.02,         // randomness
    660 * pitchMult, // frequency - sharp zap
    0.005,        // attack - instant
    0.03,         // sustain - quick
    0.05,         // release
    2,            // shape - saw (edgy)
    0.3,          // shapeCurve - soften
    -100,         // slide - quick drop
    0,            // deltaSlide
    0,            // pitchJump
    0,            // pitchJumpTime
    0,            // repeatTime
    0.05,         // noise - slight texture
    0,            // modulation
    0,            // bitCrush
    0,            // delay
    0.6,          // sustainVolume
    0.01,         // decay
    0             // tremolo
  ],

  'cmd.rmForce': (pitchMult = 1) => [
    0.3,          // volume - heavier attack
    0.02,         // randomness
    440 * pitchMult, // frequency - lower power hit
    0.01,         // attack
    0.06,         // sustain
    0.1,          // release
    2,            // shape - saw
    0.4,          // shapeCurve
    -200,         // slide - dramatic drop
    0,            // deltaSlide
    -110,         // pitchJump - sub bass hit
    0.03,         // pitchJumpTime
    0,            // repeatTime
    0.1,          // noise
    0,            // modulation
    0,            // bitCrush
    0.02,         // delay
    0.5,          // sustainVolume
    0.02,         // decay
    0             // tremolo
  ],

  'cmd.killall': () => [
    0.35,   // volume - dramatic
    0,      // randomness
    220,    // frequency
    0.01,   // attack
    0.15,   // sustain
    0.25,   // release
    1,      // shape - square
    0.5,    // shapeCurve
    300,    // slide - sweeping up
    -10,    // deltaSlide - then back down
    0,      // pitchJump
    0,      // pitchJumpTime
    0,      // repeatTime
    0.15,   // noise - static burst
    5,      // modulation - warble
    0,      // bitCrush
    0.1,    // delay - echo
    0.6,    // sustainVolume
    0.05,   // decay
    0.2     // tremolo - pulsing
  ],

  'cmd.sync': () => [
    0.2,    // volume
    0,      // randomness
    550,    // frequency
    0.02,   // attack
    0.08,   // sustain
    0.15,   // release
    0,      // shape - sine (smooth restore)
    1,      // shapeCurve
    80,     // slide - gentle rise
    0,      // deltaSlide
    0,      // pitchJump
    0,      // pitchJumpTime
    0,      // repeatTime
    0,      // noise
    2,      // modulation - slight wobble
    0,      // bitCrush
    0.05,   // delay
    0.7,    // sustainVolume
    0.03,   // decay
    0.1     // tremolo
  ],

  'cmd.error': () => [
    0.15,   // volume - soft error, not annoying
    0,      // randomness
    180,    // frequency - low buzz
    0.005,  // attack
    0.04,   // sustain
    0.06,   // release
    1,      // shape - square (digital feel)
    0.3,    // shapeCurve - soften harsh edges
    0,      // slide
    0,      // deltaSlide
    -30,    // pitchJump - slight dip
    0.02,   // pitchJumpTime
    0,      // repeatTime
    0.1,    // noise
    0,      // modulation
    0,      // bitCrush
    0,      // delay
    0.5,    // sustainVolume
    0.02,   // decay
    0       // tremolo
  ],

  // =========================================
  // WORLD EVENT SOUNDS - Combat feedback
  // =========================================
  'world.coreHit': () => [
    0.3,    // volume - alarming but not piercing
    0.05,   // randomness
    120,    // frequency - low impact
    0.01,   // attack
    0.08,   // sustain
    0.15,   // release
    3,      // shape - triangle (warm impact)
    0.5,    // shapeCurve
    -50,    // slide - impact drop
    0,      // deltaSlide
    0,      // pitchJump
    0,      // pitchJumpTime
    0,      // repeatTime
    0.2,    // noise - crunch
    0,      // modulation
    0,      // bitCrush
    0.03,   // delay
    0.4,    // sustainVolume
    0.03,   // decay
    0       // tremolo
  ],

  'world.minionDeath': (pitchMult = 1) => [
    0.15,         // volume - soft pop
    0.05,         // randomness
    380 * pitchMult, // frequency
    0.005,        // attack
    0.02,         // sustain
    0.04,         // release - quick death pop
    4,            // shape - noise-ish sine
    0.8,          // shapeCurve
    -300,         // slide - rapid fall
    0,            // deltaSlide
    0,            // pitchJump
    0,            // pitchJumpTime
    0,            // repeatTime
    0.3,          // noise - shatter
    0,            // modulation
    0,            // bitCrush
    0,            // delay
    0.3,          // sustainVolume
    0.01,         // decay
    0             // tremolo
  ],

  'tower.fire': (pitchMult = 1) => [
    0.12,         // volume - quiet pew
    0.03,         // randomness
    800 * pitchMult, // frequency - laser pew
    0.005,        // attack - instant
    0.015,        // sustain - very short
    0.025,        // release
    0,            // shape - sine (clean laser)
    1,            // shapeCurve
    -500,         // slide - rapid pitch drop
    0,            // deltaSlide
    0,            // pitchJump
    0,            // pitchJumpTime
    0,            // repeatTime
    0,            // noise
    0,            // modulation
    0,            // bitCrush
    0,            // delay
    0.5,          // sustainVolume
    0.005,        // decay
    0             // tremolo
  ],

  'tower.place': () => [
    0.15,   // volume - softer
    0,      // randomness
    520,    // frequency - pleasant mid tone
    0.02,   // attack
    0.05,   // sustain
    0.12,   // release - gentle fade
    0,      // shape - sine (smooth)
    1,      // shapeCurve
    30,     // slide - gentle rise
    0,      // deltaSlide
    0,      // pitchJump - no jump
    0,      // pitchJumpTime
    0,      // repeatTime
    0,      // noise - none
    0,      // modulation
    0,      // bitCrush
    0,      // delay
    0.8,    // sustainVolume
    0.03,   // decay
    0       // tremolo
  ]
};

// ===========================================
// INITIALIZATION
// ===========================================

/**
 * Initialize the audio system
 * Loads persisted settings and sets up unlock listener
 */
function initAudio() {
  if (audioState.initialized) return;

  // Load persisted settings
  loadAudioSettings();

  // Set up audio unlock on first user interaction
  const unlockHandler = () => {
    unlockAudio();
    document.removeEventListener('click', unlockHandler);
    document.removeEventListener('keydown', unlockHandler);
    document.removeEventListener('touchstart', unlockHandler);
  };

  document.addEventListener('click', unlockHandler);
  document.addEventListener('keydown', unlockHandler);
  document.addEventListener('touchstart', unlockHandler);

  audioState.initialized = true;
  console.log('[Audio] System initialized');
}

/**
 * Unlock audio context (required after user gesture)
 */
function unlockAudio() {
  if (audioState.unlocked) return;

  // Initialize zzfx audio context silently
  try {
    if (typeof zzfx !== 'undefined') {
      // Play a silent sound to unlock
      zzfx(0, 0, 0, 0, 0, 0);
      audioState.unlocked = true;
      console.log('[Audio] Unlocked');
    }
  } catch (e) {
    console.warn('[Audio] Failed to unlock:', e);
  }
}

// ===========================================
// SETTINGS PERSISTENCE
// ===========================================

function loadAudioSettings() {
  try {
    const savedVolume = localStorage.getItem(AUDIO_CONFIG.STORAGE_VOLUME);
    const savedMuted = localStorage.getItem(AUDIO_CONFIG.STORAGE_MUTED);

    if (savedVolume !== null) {
      audioState.volume = parseFloat(savedVolume);
    }
    if (savedMuted !== null) {
      audioState.muted = savedMuted === 'true';
    }

    // Update zzfx global volume
    updateZzfxVolume();
  } catch (e) {
    console.warn('[Audio] Failed to load settings:', e);
  }
}

function saveAudioSettings() {
  try {
    localStorage.setItem(AUDIO_CONFIG.STORAGE_VOLUME, audioState.volume.toString());
    localStorage.setItem(AUDIO_CONFIG.STORAGE_MUTED, audioState.muted.toString());
  } catch (e) {
    console.warn('[Audio] Failed to save settings:', e);
  }
}

function updateZzfxVolume() {
  if (typeof window !== 'undefined' && typeof window.setZzfxVolume === 'function') {
    // Use the setter function to update zzfx volume
    window.setZzfxVolume(audioState.muted ? 0 : audioState.volume);
  } else if (typeof window !== 'undefined') {
    // Fallback: set directly
    window._zzfxVolume = audioState.muted ? 0 : audioState.volume;
  }
}

// ===========================================
// PUBLIC API
// ===========================================

/**
 * Set master volume (0-1)
 */
function setVolume(value) {
  audioState.volume = Math.max(0, Math.min(1, value));
  updateZzfxVolume();
  saveAudioSettings();
  updateVolumeUI();
}

/**
 * Get current volume (0-1)
 */
function getVolume() {
  return audioState.volume;
}

/**
 * Set muted state
 */
function setMuted(muted) {
  audioState.muted = !!muted;
  updateZzfxVolume();
  saveAudioSettings();
  updateMuteUI();
}

/**
 * Get muted state
 */
function getMuted() {
  return audioState.muted;
}

/**
 * Toggle mute
 */
function toggleMute() {
  setMuted(!audioState.muted);
}

// ===========================================
// RATE LIMITING
// ===========================================

/**
 * Check if a sound can be played (rate limiting)
 * @returns {boolean} true if sound can play
 */
function canPlaySound(name) {
  const limit = AUDIO_CONFIG.RATE_LIMITS[name];
  if (!limit) return true; // No limit for this sound

  const now = Date.now();
  const bucket = audioState.rateLimitBuckets[name] || [];

  // Remove old timestamps outside the window
  const windowStart = now - limit.windowMs;
  const recentPlays = bucket.filter(t => t > windowStart);

  // Update bucket
  audioState.rateLimitBuckets[name] = recentPlays;

  // Check if under limit
  return recentPlays.length < limit.max;
}

/**
 * Record a sound play for rate limiting
 */
function recordSoundPlay(name) {
  if (!AUDIO_CONFIG.RATE_LIMITS[name]) return;

  if (!audioState.rateLimitBuckets[name]) {
    audioState.rateLimitBuckets[name] = [];
  }

  audioState.rateLimitBuckets[name].push(Date.now());
}

// ===========================================
// PITCH VARIATION
// ===========================================

/**
 * Get pitch multiplier for a sound (with random variation)
 */
function getPitchMultiplier(name) {
  const variation = AUDIO_CONFIG.PITCH_VARIATION[name];
  if (!variation) return 1;

  // Random value between (1 - variation) and (1 + variation)
  return 1 + (Math.random() * 2 - 1) * variation;
}

// ===========================================
// MAIN PLAY FUNCTION
// ===========================================

/**
 * Play a sound by name
 * @param {string} name - Sound name from SFX map
 * @param {object} opts - Optional settings (currently unused, reserved for future)
 */
function playSound(name, opts = {}) {
  // Early exit if muted or not initialized
  if (audioState.muted) return;
  if (!audioState.unlocked) return;

  // Check if sound exists
  const soundFn = SFX[name];
  if (!soundFn) {
    console.warn(`[Audio] Unknown sound: ${name}`);
    return;
  }

  // Check rate limiting
  if (!canPlaySound(name)) {
    return; // Skip - rate limited
  }

  // Record this play
  recordSoundPlay(name);

  try {
    // Get pitch variation
    const pitchMult = getPitchMultiplier(name);

    // Get sound parameters (some sounds accept pitchMult)
    const params = soundFn(pitchMult);

    // Play via zzfx
    zzfx(...params);
  } catch (e) {
    console.warn(`[Audio] Failed to play ${name}:`, e);
  }
}

// ===========================================
// UI INTEGRATION
// ===========================================

/**
 * Update mute button UI
 */
function updateMuteUI() {
  const btn = document.getElementById('audioMuteBtn');
  if (btn) {
    btn.textContent = audioState.muted ? '🔇' : '🔊';
    btn.classList.toggle('muted', audioState.muted);
  }
}

/**
 * Update volume slider UI
 */
function updateVolumeUI() {
  const slider = document.getElementById('audioVolumeSlider');
  if (slider) {
    slider.value = Math.round(audioState.volume * 100);
  }

  const label = document.getElementById('audioVolumeLabel');
  if (label) {
    label.textContent = Math.round(audioState.volume * 100);
  }
}

/**
 * Set up UI event handlers (call after DOM ready)
 */
function setupAudioUI() {
  const muteBtn = document.getElementById('audioMuteBtn');
  if (muteBtn) {
    muteBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      toggleMute();
      playSound('ui.menuClick');
    });
  }

  const slider = document.getElementById('audioVolumeSlider');
  if (slider) {
    slider.addEventListener('input', (e) => {
      setVolume(parseInt(e.target.value) / 100);
    });

    // Play feedback on release
    slider.addEventListener('change', () => {
      playSound('ui.menuClick');
    });
  }

  // Initial UI state
  updateMuteUI();
  updateVolumeUI();
}

// ===========================================
// EXPORTS
// ===========================================
window.Audio = {
  init: initAudio,
  unlock: unlockAudio,
  play: playSound,
  setVolume,
  getVolume,
  setMuted,
  getMuted,
  toggleMute,
  setupUI: setupAudioUI
};

// Also expose directly for convenience
window.playSound = playSound;
window.initAudio = initAudio;

// Auto-init when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initAudio);
} else {
  initAudio();
}
