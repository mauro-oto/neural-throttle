/* ===========================================
   ZZFX - Zuper Zmall Zound Zynth
   By Frank Force 2024
   MIT License - https://github.com/KilledByAPixel/ZzFX

   Local copy for Neural Throttle
   =========================================== */

// zzfxR - global sample rate
const zzfxR = 44100;

// zzfxV - global volume (use getter to always read current value)
function getZzfxVolume() {
  return typeof window !== 'undefined' && window._zzfxVolume !== undefined
    ? window._zzfxVolume
    : 0.3;
}

// zzfxX - the audio context
let zzfxX;

// zzfx() - the main sound function
// zzfx(...[volume, randomness, frequency, attack, sustain, release, shape, shapeCurve, slide, deltaSlide, pitchJump, pitchJumpTime, repeatTime, noise, modulation, bitCrush, delay, sustainVolume, decay, tremolo])
function zzfx(...args) {
  // Initialize audio context on first use
  if (!zzfxX) {
    zzfxX = new AudioContext();
  }

  // Resume context if suspended (handles autoplay policy)
  if (zzfxX.state === 'suspended') {
    zzfxX.resume();
  }

  // Build and play sound
  let buffer = zzfxG(...args);
  let source = zzfxX.createBufferSource();
  let audioBuffer = zzfxX.createBuffer(1, buffer.length, zzfxR);

  audioBuffer.getChannelData(0).set(buffer);
  source.buffer = audioBuffer;
  source.connect(zzfxX.destination);
  source.start();

  return source;
}

// zzfxG() - the sound generator function
function zzfxG(
  volume = 1,
  randomness = 0.05,
  frequency = 220,
  attack = 0,
  sustain = 0,
  release = 0.1,
  shape = 0,
  shapeCurve = 1,
  slide = 0,
  deltaSlide = 0,
  pitchJump = 0,
  pitchJumpTime = 0,
  repeatTime = 0,
  noise = 0,
  modulation = 0,
  bitCrush = 0,
  delay = 0,
  sustainVolume = 1,
  decay = 0,
  tremolo = 0
) {
  // Init parameters
  let PI2 = Math.PI * 2;
  let sign = v => v < 0 ? -1 : 1;
  let startSlide = slide *= 500 * PI2 / zzfxR / zzfxR;
  let startFrequency = frequency *=
    (1 + randomness * 2 * Math.random() - randomness) * PI2 / zzfxR;
  let b = [];
  let t = 0;
  let tm = 0;
  let i = 0;
  let j = 1;
  let r = 0;
  let c = 0;
  let s = 0;
  let f;
  let length;

  // Scale parameters
  attack = attack * zzfxR + 9;
  decay *= zzfxR;
  sustain *= zzfxR;
  release *= zzfxR;
  delay *= zzfxR;
  deltaSlide *= 500 * PI2 / zzfxR ** 3;
  modulation *= PI2 / zzfxR;
  pitchJump *= PI2 / zzfxR;
  pitchJumpTime *= zzfxR;
  repeatTime = repeatTime * zzfxR | 0;

  // Generate waveform
  length = attack + decay + sustain + release + delay | 0;

  // Get current volume (read each time to support dynamic volume changes)
  const currentVolume = getZzfxVolume();

  for (; i < length; b[i++] = s * currentVolume) {
    if (!(++c % (bitCrush * 100 | 0))) {
      // Generate sample
      s = shape ? shape > 1 ? shape > 2 ? shape > 3 ?
        // Wave 4 - Noise
        Math.sin((t % PI2) ** 3) :
        // Wave 3 - Triangle
        Math.max(Math.min(Math.tan(t), 1), -1) :
        // Wave 2 - Sawtooth
        1 - (2 * t / PI2 % 2 + 2) % 2 :
        // Wave 1 - Square
        1 - 4 * Math.abs(Math.round(t / PI2) - t / PI2) :
        // Wave 0 - Sine
        Math.sin(t);

      // Apply noise
      s = (repeatTime ?
        1 - tremolo + tremolo * Math.sin(PI2 * i / repeatTime) :
        1) *
        sign(s) * (Math.abs(s) ** shapeCurve) *
        (i < attack ? i / attack :
          i < attack + decay ?
            1 - ((i - attack) / decay) * (1 - sustainVolume) :
            i < attack + decay + sustain ?
              sustainVolume :
              i < length - delay ?
                (length - i - delay) / release * sustainVolume :
                0);

      // Apply noise
      s = delay ?
        s / 2 + (delay > i ? 0 :
          (i < length - delay ? 1 : (length - i) / delay) *
          b[i - delay | 0] / 2) :
        s;
    }

    // Apply frequency modulation
    f = (frequency += slide += deltaSlide) *
      Math.cos(modulation * tm++);

    // Update phase
    t += f - f * noise * (1 - (Math.sin(i) + 1) * 1e9 % 2);

    // Pitch jump
    if (j && ++j > pitchJumpTime) {
      frequency += pitchJump;
      startFrequency += pitchJump;
      j = 0;
    }

    // Repeat
    if (repeatTime && !(++r % repeatTime)) {
      frequency = startFrequency;
      slide = startSlide;
      j = j || 1;
    }
  }

  return b;
}

// zzfxP() - play a sound from array of zzfx parameters
function zzfxP(...params) {
  return zzfx(...params);
}

// zzfxM() - Generate music from zzfxM notation
// (Not included - we don't need music for this project)

// Export for global use
window.zzfx = zzfx;
window.zzfxG = zzfxG;
window.zzfxP = zzfxP;
window._zzfxVolume = 0.3; // Internal volume storage
window.zzfxX = zzfxX;

// Volume setter for external use
window.setZzfxVolume = function(v) {
  window._zzfxVolume = v;
};
