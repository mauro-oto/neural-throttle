/* ===========================================
   NEURAL THROTTLE - Main Game Logic
   =========================================== */

// ===========================================
// CONFIGURATION - Easy tuning constants
// ===========================================
const CONFIG = {
  // Timing
  TICK_MS: 100,

  // Canvas
  CANVAS_WIDTH: 600,
  CANVAS_HEIGHT: 300,
  CORE_X: 60,
  SPAWN_X: 580,

  // RAM System - No passive regen, must use sync
  RAM_MAX: 128,
  RAM_REGEN_PER_SEC: 0,

  // Core
  CORE_HP_MAX: 120,

  // Minion base stats
  MINIONS: {
    grunt: {
      hp: 50,
      speed: 42,
      coreDmg: 10,
      money: 12,
      color: '#00ffff',
      label: 'GRT',
      towerResist: 1.0
    },
    swarm: {
      hp: 28,
      speed: 62,
      coreDmg: 6,
      money: 7,
      color: '#ff00ff',
      label: 'SWM',
      towerResist: 1.0
    },
    shielded: {
      hp: 90,
      speed: 32,
      coreDmg: 15,
      money: 20,
      color: '#ffcc00',
      label: 'SHD',
      rmResist: 0.85,
      towerResist: 0.15
    },
    heavy: {
      hp: 120,
      speed: 25,
      coreDmg: 20,
      money: 30,
      color: '#ff6600',
      label: 'HVY',
      rmResist: 1.0,
      towerResist: 0
    }
  },

  // Attack commands - BALANCED for fast typers
  RM_DAMAGE: 38,
  RM_FORCE_DAMAGE: 130,
  RM_RAM_COST: 10,        // Reduced from 12
  RM_FORCE_RAM_COST: 32,  // Reduced from 40
  RM_COOLDOWN: 0.5,       // Reduced from 0.6
  RM_FORCE_COOLDOWN: 1.6, // Reduced from 2.0

  // Sync command - More forgiving
  SYNC_RESTORE: 70,       // Increased from 56
  SYNC_COOLDOWN: 6,       // Reduced from 8

  // Killall command - Panic button
  KILLALL_RAM_COST: 40,   // Moderate RAM cost
  KILLALL_COOLDOWN: 75,   // 75 seconds - use sparingly

  // WPM Bonus System - Rewards fast typing with more damage
  // Uses rolling window to measure ACTUAL typing speed, not penalized by cooldowns
  WPM_BONUS_ENABLED: true,
  WPM_WINDOW_MS: 12000,   // 12 second rolling window for WPM calculation
  WPM_BASELINE: 50,       // WPM at which bonus = 1.0x
  WPM_MAX_BONUS: 2.0,     // Max damage multiplier at high WPM
  WPM_SCALE: 0.012,       // Bonus per WPM above baseline

  // Tower - First tower affordable quickly
  TOWER_BASE_COST: 80,   // Reduced from 100
  TOWER_COST_SCALE: 1.35,
  TOWER_FIRE_RATE: 0.6,  // Slower firing (was 1.1) - fires every ~1.7s
  TOWER_DAMAGE: 18,      // Compensate with more damage per shot
  TOWER_X: 90,
  TOWER_MAX: 6,
  TOWER_UPGRADE_COST: 50,
  TOWER_UPGRADE_DAMAGE_MULT: 1.4,

  // Scaling per wave
  HP_SCALE_PER_WAVE: 0.22,
  DMG_SCALE_PER_WAVE: 0.12,
  TOWER_DMG_SCALE_PER_WAVE: 0.04,
  MONEY_SCALE_PER_WAVE: 0.06,

  // Wave settings
  WAVE_COUNTDOWN_SEC: 3,
  WAVE_CLEAR_BONUS_BASE: 50,
  WAVE_CLEAR_BONUS_PER_WAVE: 15,

  // Starting resources - More forgiving start
  START_MONEY: 75,
  START_RAM: 100,

  // Wave definitions - Gentler ramp, still challenging late
  WAVES: [
    { count: 5,  interval: 2000, weights: { grunt: 1, swarm: 0, shielded: 0, heavy: 0 }, speedScale: 1.0 },
    { count: 6,  interval: 1800, weights: { grunt: 0.8, swarm: 0.2, shielded: 0, heavy: 0 }, speedScale: 1.0 },
    { count: 8,  interval: 1600, weights: { grunt: 0.6, swarm: 0.3, shielded: 0.1, heavy: 0 }, speedScale: 1.05 },
    { count: 10, interval: 1500, weights: { grunt: 0.5, swarm: 0.35, shielded: 0.15, heavy: 0 }, speedScale: 1.08 },
    { count: 12, interval: 1400, weights: { grunt: 0.4, swarm: 0.4, shielded: 0.2, heavy: 0 }, speedScale: 1.12 },
    { count: 14, interval: 1300, weights: { grunt: 0.35, swarm: 0.4, shielded: 0.2, heavy: 0.05 }, speedScale: 1.16 },
    { count: 16, interval: 1200, weights: { grunt: 0.3, swarm: 0.4, shielded: 0.2, heavy: 0.1 }, speedScale: 1.20 },
    { count: 18, interval: 1100, weights: { grunt: 0.25, swarm: 0.4, shielded: 0.2, heavy: 0.15 }, speedScale: 1.25 },
    { count: 20, interval: 1000, weights: { grunt: 0.2, swarm: 0.35, shielded: 0.25, heavy: 0.2 }, speedScale: 1.30 },
    { count: 23, interval: 900,  weights: { grunt: 0.15, swarm: 0.35, shielded: 0.25, heavy: 0.25 }, speedScale: 1.35 },
    { count: 26, interval: 800,  weights: { grunt: 0.1, swarm: 0.3, shielded: 0.3, heavy: 0.3 }, speedScale: 1.42 }
  ],

  // Speed input options (0 = pause, 1/2/3 = speed levels)
  // Mapped to true timescale values via SPEED_TIMESCALE
  SPEED_OPTIONS: [0, 1, 2, 3],
  // True timescale values: input -> actual multiplier
  SPEED_TIMESCALE: { 0: 0, 1: 1, 2: 1.25, 3: 1.5 }
};

// ===========================================
// TOWER TARGETING SYSTEM
// ===========================================
const TARGETING_MODES = ['first', 'strong', 'weak'];
const TARGETING_STORAGE_KEY = 'nt_target_mode';

// Load targeting mode from localStorage or default to 'first'
function loadTargetingMode() {
  try {
    const saved = localStorage.getItem(TARGETING_STORAGE_KEY);
    if (saved && TARGETING_MODES.includes(saved)) {
      return saved;
    }
  } catch (e) {
    // localStorage unavailable
  }
  return 'first';
}

// Save targeting mode to localStorage
function saveTargetingMode(mode) {
  try {
    localStorage.setItem(TARGETING_STORAGE_KEY, mode);
  } catch (e) {
    // localStorage unavailable
  }
}

// ===========================================
// TUTORIAL SYSTEM
// ===========================================
const TUTORIAL_STEPS_KEY = 'nt_tutorial_steps';

const tutorial = {
  enabled: true,
  globallyCompleted: false,  // Persisted across sessions
  paused: false,
  currentStep: null,
  completedSteps: new Set(),  // Also persisted across sessions
  awaitingCommand: null,

  steps: {
    firstEnemy: {
      trigger: 'firstGrunt',
      messages: [
        '╔════════════════════════════════════╗',
        '║         TUTORIAL: BASICS           ║',
        '╚════════════════════════════════════╝',
        '',
        'An enemy process is approaching your core!',
        '',
        'Type "rm 0" to attack it.',
        '(0 = the closest enemy to your core)',
        '',
        '>>> Type: rm 0'
      ],
      awaitCommand: /^rm\s+0$/,
      successMessage: 'Nice hit! Keep attacking to finish it off. Each "rm" costs 10 MB RAM.'
    },
    lowRam: {
      trigger: 'lowRam',
      messages: [
        '╔════════════════════════════════════╗',
        '║       TUTORIAL: RAM RECOVERY       ║',
        '╚════════════════════════════════════╝',
        '',
        'WARNING: RAM is getting low!',
        'There is NO passive RAM regeneration.',
        '',
        'Type "sync" to restore +70 MB RAM.',
        '',
        '>>> Type: sync'
      ],
      awaitCommand: /^sync$/,
      successMessage: 'RAM restored! Use "sync" whenever you need RAM (6s cooldown).'
    },
    canBuildTower: {
      trigger: 'canBuild',
      messages: [
        '╔════════════════════════════════════╗',
        '║        TUTORIAL: DEFENSES          ║',
        '╚════════════════════════════════════╝',
        '',
        'You have enough credits to build a cannon!',
        'Cannons auto-fire at the closest enemy.',
        '',
        'Type "build cannon" to deploy one.',
        '',
        '>>> Type: build cannon'
      ],
      awaitCommand: /^build\s+cannon$/,
      successMessage: 'Cannon deployed! It will help defend automatically.'
    },
    firstShielded: {
      trigger: 'firstShielded',
      messages: [
        '╔════════════════════════════════════╗',
        '║      TUTORIAL: SHIELDED ENEMY      ║',
        '╚════════════════════════════════════╝',
        '',
        'A SHIELDED enemy (yellow) appeared!',
        'Towers only deal 15% damage to it.',
        '',
        'Use "rm -f <index>" for heavy damage.',
        '(Costs more RAM but deals 120 base damage)',
        '',
        '>>> Try: rm -f 0 (if it\'s closest)'
      ],
      awaitCommand: /^rm\s+-f\s+\d+$/,
      successMessage: 'Powerful! Use "rm -f" for tough enemies. It has a longer cooldown.'
    },
    firstHeavy: {
      trigger: 'firstHeavy',
      messages: [
        '╔════════════════════════════════════╗',
        '║       TUTORIAL: HEAVY ENEMY        ║',
        '╚════════════════════════════════════╝',
        '',
        'A HEAVY enemy (orange) appeared!',
        'These are IMMUNE to tower damage.',
        '',
        'You MUST use "rm" commands to kill it.',
        'Focus fire with multiple rm commands!',
        '',
        '(Press ENTER to continue)'
      ],
      awaitCommand: null, // Just acknowledge
      successMessage: null
    },
    killallIntro: {
      trigger: 'manyEnemies',
      messages: [
        '╔════════════════════════════════════╗',
        '║      TUTORIAL: PANIC BUTTON        ║',
        '╚════════════════════════════════════╝',
        '',
        'Multiple hostiles detected! Feeling overwhelmed?',
        '',
        'Type "killall" to terminate ALL enemies instantly.',
        'Cost: 40 MB RAM, Cooldown: 75 seconds',
        '',
        'This is your emergency panic button.',
        'Use it wisely - the long cooldown means',
        'you can only use it once or twice per mission!',
        '',
        '>>> Try it now: killall (FREE this time!)'
      ],
      awaitCommand: /^killall$/,
      successMessage: 'All hostiles terminated! Remember: killall has a 75s cooldown.'
    },
    speedTutorial: {
      trigger: 'doingWell',
      messages: [
        '╔════════════════════════════════════╗',
        '║       TUTORIAL: GAME SPEED         ║',
        '╚════════════════════════════════════╝',
        '',
        'You\'re doing great! Core at full health.',
        '',
        'Want more challenge? Speed up the game!',
        '',
        'Type "speed 2" for 1.25x speed',
        'Type "speed 3" for 1.5x speed (faster)',
        'Type "speed 1" to return to normal',
        'Type "speed 0" or "pause" to pause',
        '',
        '>>> Try: speed 2'
      ],
      awaitCommand: /^speed\s+2$/,
      successMessage: 'Now we\'re moving! Use "speed 1" if things get too intense.'
    },
    tutorialComplete: {
      trigger: 'complete',
      messages: [
        '╔════════════════════════════════════╗',
        '║       TUTORIAL COMPLETE!           ║',
        '╚════════════════════════════════════╝',
        '',
        'You\'ve learned the basics! Quick reference:',
        '',
        '  rm <idx>       - Attack (10 MB)',
        '  rm -f <idx>    - Heavy attack (32 MB)',
        '  sync           - Restore RAM',
        '  build cannon   - Build tower',
        '  upgrade cannon - Upgrade towers',
        '  killall        - PANIC BUTTON (40 MB, 75s cd)',
        '  pause          - Pause the game',
        '',
        'PRO TIPS:',
        '  • Type faster for up to 2x damage bonus!',
        '  • Press UP ARROW to recall previous commands',
        '',
        'Type "help" anytime for more info.',
        '',
        '>>> Good luck, operator!'
      ],
      awaitCommand: null,
      successMessage: null
    }
  },

  show(stepName) {
    if (!this.enabled || this.completedSteps.has(stepName)) return;

    const step = this.steps[stepName];
    if (!step) return;

    // Once tutorial is globally completed, ALL tutorials are blocked (unless force replay)
    // This ensures tutorials only show once per "save", not once per session
    if (this.globallyCompleted && !this.forceReplay) return;

    this.paused = true;
    this.currentStep = stepName;
    gameState.paused = true;

    // Show tutorial messages
    step.messages.forEach(msg => {
      GameAPI.log(msg, 'tutorial');
    });

    if (step.awaitCommand) {
      this.awaitingCommand = step.awaitCommand;
    } else {
      // Just need to press Enter to continue
      this.awaitingCommand = 'enter';
    }
  },

  checkCommand(input) {
    if (!this.paused || !this.awaitingCommand) return false;

    const trimmed = input.trim().toLowerCase();

    // Check if awaiting just Enter
    if (this.awaitingCommand === 'enter') {
      this.complete(true);
      return true;
    }

    // Check if command matches the expected pattern
    if (this.awaitingCommand.test(trimmed)) {
      // Mark that we're expecting this command to complete
      this.pendingCompletion = true;
      return false; // Let the command execute normally
    }

    return false;
  },

  // Called after a command executes to check if tutorial should complete
  onCommandExecuted(success) {
    if (!this.pendingCompletion) return;

    this.pendingCompletion = false;

    if (success) {
      this.complete(true);
    } else {
      // Command failed - don't complete tutorial, let player retry
      GameAPI.log('Try again when ready.', 'tutorial');
    }
  },

  complete(showSuccess = true) {
    const step = this.steps[this.currentStep];

    if (showSuccess && step && step.successMessage) {
      GameAPI.log(step.successMessage, 'tutorial-success');
    }

    this.completedSteps.add(this.currentStep);
    this.saveCompletedSteps();  // Persist to localStorage
    this.paused = false;
    this.currentStep = null;
    this.awaitingCommand = null;
    this.pendingCompletion = false;
    gameState.paused = false;

    // Check if all main tutorials are done
    // Note: killallIntro is optional - doesn't block tutorial completion
    const mainSteps = ['firstEnemy', 'lowRam', 'canBuildTower', 'firstShielded', 'firstHeavy'];
    const allDone = mainSteps.every(s => this.completedSteps.has(s));
    if (allDone && !this.completedSteps.has('tutorialComplete')) {
      setTimeout(() => this.show('tutorialComplete'), 500);
    }

    // When tutorialComplete is done, persist it
    if (this.currentStep === null && this.completedSteps.has('tutorialComplete')) {
      this.globallyCompleted = true;
      this.forceReplay = false;
      markTutorialCompleted();
    }
  },

  reset() {
    this.paused = false;
    this.currentStep = null;
    // Don't clear completedSteps - they persist across missions
    this.awaitingCommand = null;
    this.pendingCompletion = false;
    // Don't reset globallyCompleted here - that's persistent
  },

  // Load global completion state from localStorage
  loadGlobalState() {
    this.globallyCompleted = isTutorialCompleted();
    this.forceReplay = false;

    // Load completed steps from localStorage
    try {
      const savedSteps = localStorage.getItem(TUTORIAL_STEPS_KEY);
      if (savedSteps) {
        const stepsArray = JSON.parse(savedSteps);
        this.completedSteps = new Set(stepsArray);
      }
    } catch (e) {
      console.warn('Failed to load tutorial steps:', e);
    }
  },

  // Save completed steps to localStorage
  saveCompletedSteps() {
    try {
      const stepsArray = Array.from(this.completedSteps);
      localStorage.setItem(TUTORIAL_STEPS_KEY, JSON.stringify(stepsArray));
    } catch (e) {
      console.warn('Failed to save tutorial steps:', e);
    }
  },

  // Force replay of tutorial (user requested)
  enableReplay() {
    this.globallyCompleted = false;
    this.forceReplay = true;
    this.completedSteps.clear();
    resetTutorialCompletion();
    // Also clear saved steps
    try {
      localStorage.removeItem(TUTORIAL_STEPS_KEY);
    } catch (e) {
      // Ignore
    }
  },

  // Check for tutorial triggers during gameplay
  checkTriggers() {
    // Skip all trigger checks if tutorials are disabled or already completed
    if (!this.enabled || this.paused) return;
    if (this.globallyCompleted && !this.forceReplay) return;

    const config = getConfig();

    // First enemy (grunt) - show rm tutorial
    if (!this.completedSteps.has('firstEnemy') && gameState.minions.length > 0) {
      this.show('firstEnemy');
      return;
    }

    // Low RAM - show sync tutorial (trigger at 50% RAM or less)
    const maxRam = config.RAM_MAX || CONFIG.RAM_MAX;
    const ramThreshold = Math.min(50, maxRam * 0.5);

    if (!this.completedSteps.has('lowRam') &&
        this.completedSteps.has('firstEnemy') &&
        gameState.ram <= ramThreshold &&
        gameState.cooldowns.sync === 0 &&
        !config.DISABLE_SYNC) {
      this.show('lowRam');
      return;
    }

    // Can afford tower - show build tutorial
    const towerCost = config.TOWER_BASE_COST || CONFIG.TOWER_BASE_COST;
    if (!this.completedSteps.has('canBuildTower') &&
        this.completedSteps.has('firstEnemy') &&
        gameState.money >= towerCost &&
        gameState.towerCount === 0 &&
        !config.DISABLE_TOWERS) {
      this.show('canBuildTower');
      return;
    }

    // First shielded enemy - teaches rm -f
    if (!this.completedSteps.has('firstShielded') &&
        gameState.minions.some(m => m.type === 'shielded')) {
      this.show('firstShielded');
      return;
    }

    // First heavy enemy - teaches tower immunity
    if (!this.completedSteps.has('firstHeavy') &&
        gameState.minions.some(m => m.type === 'heavy')) {
      this.show('firstHeavy');
      return;
    }

    // Killall tutorial - trigger when 5+ enemies on screen
    if (!this.completedSteps.has('killallIntro') &&
        gameState.minions.length >= 5 &&
        gameState.cooldowns.killall === 0) {
      this.show('killallIntro');
      return;
    }

    // Speed tutorial - trigger when player is doing well
    // (full health after wave 3+, at 1x speed)
    const maxCore = config.CORE_HP_MAX || CONFIG.CORE_HP_MAX;
    if (!this.completedSteps.has('speedTutorial') &&
        gameState.waveIndex >= 3 &&
        gameState.coreHp >= maxCore &&
        gameState.speedMultiplier === 1 &&
        !gameState.paused &&
        gameState.minions.length === 0) {  // Between waves
      this.show('speedTutorial');
      return;
    }
  }
};

// ===========================================
// GAME STATE
// ===========================================
const gameState = {
  running: false,
  paused: false,
  gameOver: false,

  // Game mode: "endless" or "campaign"
  gameMode: 'endless',

  // Speed multiplier (true timescale: 1x, 1.25x, 1.5x)
  speedMultiplier: 1,

  // Tower targeting mode: 'first' | 'strong' | 'weak'
  targetMode: loadTargetingMode(),

  // Resources
  ram: CONFIG.START_RAM,
  coreHp: CONFIG.CORE_HP_MAX,
  money: CONFIG.START_MONEY,

  // Wave management
  waveIndex: 1,
  waveActive: false,
  countdown: 0,
  spawnQueue: [],
  spawnTimer: 0,
  spawned: 0,
  totalToSpawn: 0,

  // Entities
  minions: [],
  towers: [],
  projectiles: [],
  particles: [],  // Death particles for shatter effect
  minionIdCounter: 0,
  towerCount: 0,

  // Cooldowns (remaining seconds)
  cooldowns: {
    rm: 0,
    rmForce: 0,
    sync: 0,
    killall: 0
  },

  // Scaling multipliers
  hpMult: 1,
  dmgMult: 1,
  towerDmgMult: 1,

  // Active config (may be modified by mission modifiers)
  activeConfig: null,

  // Metrics
  metrics: {
    charsTyped: 0,
    commandsSubmitted: 0,
    correctCommands: 0,
    startTime: null,
    kills: 0,
    wpmSamples: [],
    lastWpmCalcTime: 0,
    // Rolling window for accurate WPM - stores {time, chars} entries
    recentInputs: [],
    peakWpm: 0
  },

  // UI preview state - for highlighting target while typing
  previewTargetIndex: null,

  // Notification state - track one-time notifications
  notifications: {
    canAffordTower: false  // Has player been notified they can afford a tower?
  }
};

// Helper to get current config (either modified by mission or default)
function getConfig() {
  return gameState.activeConfig || CONFIG;
}

// ===========================================
// DOM ELEMENTS
// ===========================================
let canvas, ctx;
let scrollback, cmdInput;
let hudElements = {};

function initDOMElements() {
  canvas = document.getElementById('gameCanvas');
  ctx = canvas.getContext('2d');
  scrollback = document.getElementById('scrollback');
  cmdInput = document.getElementById('cmdInput');

  hudElements = {
    ramBar: document.getElementById('ramBar'),
    ramValue: document.getElementById('ramValue'),
    coreBar: document.getElementById('coreBar'),
    coreValue: document.getElementById('coreValue'),
    waveValue: document.getElementById('waveValue'),
    moneyValue: document.getElementById('moneyValue'),
    wpmValue: document.getElementById('wpmValue'),
    wpmBonusValue: document.getElementById('wpmBonusValue'),
    accValue: document.getElementById('accValue'),
    cdRm: document.getElementById('cdRm'),
    cdRmF: document.getElementById('cdRmF'),
    cdSync: document.getElementById('cdSync'),
    cdKillall: document.getElementById('cdKillall'),
    gameStatus: document.getElementById('gameStatus'),
    speedValue: document.getElementById('speedValue'),
    targetValue: document.getElementById('targetValue')
  };
}

// ===========================================
// UTILITY FUNCTIONS
// ===========================================

function getWaveDefinition(waveIndex) {
  // Campaign mode uses mission-specific wave configs
  if (gameState.gameMode === 'campaign') {
    const campaignWave = getCampaignWaveDefinition(waveIndex);
    if (campaignWave) {
      return campaignWave;
    }
  }

  // Endless mode uses standard wave progression
  if (waveIndex <= CONFIG.WAVES.length) {
    return CONFIG.WAVES[waveIndex - 1];
  }
  // Procedural wave generation - gets much harder
  const baseWave = CONFIG.WAVES[CONFIG.WAVES.length - 1];
  const extraWaves = waveIndex - CONFIG.WAVES.length;
  return {
    count: baseWave.count + extraWaves * 4,
    interval: Math.max(500, baseWave.interval - extraWaves * 40),
    weights: {
      grunt: Math.max(0.05, 0.1 - extraWaves * 0.01),
      swarm: Math.max(0.2, 0.35 - extraWaves * 0.02),
      shielded: Math.min(0.4, 0.3 + extraWaves * 0.02),
      heavy: Math.min(0.45, 0.25 + extraWaves * 0.03)
    },
    speedScale: baseWave.speedScale + extraWaves * 0.06
  };
}

function weightedRandomType(weights) {
  const total = Object.values(weights).reduce((a, b) => a + b, 0);
  let r = Math.random() * total;
  for (const [type, weight] of Object.entries(weights)) {
    r -= weight;
    if (r <= 0) return type;
  }
  return 'grunt';
}

function getMinionsIndexed() {
  return [...gameState.minions].sort((a, b) => a.x - b.x);
}

function getMinionByIndex(index) {
  const sorted = getMinionsIndexed();
  if (index < 0 || index >= sorted.length) return null;
  return sorted[index];
}

function formatTime(seconds) {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

function calculateWpmBonus() {
  if (!CONFIG.WPM_BONUS_ENABLED) return 1.0;

  const currentWpm = getRollingWpm();
  if (currentWpm < 10) return 1.0; // Need some typing data

  // Calculate bonus: 1.0 at baseline WPM, scales up with faster typing
  const wpmAboveBaseline = Math.max(0, currentWpm - CONFIG.WPM_BASELINE);
  const bonus = 1.0 + (wpmAboveBaseline * CONFIG.WPM_SCALE);

  // Cap at max bonus
  return Math.min(bonus, CONFIG.WPM_MAX_BONUS);
}

// Get WPM based on rolling window of recent typing activity
function getRollingWpm() {
  const metrics = gameState.metrics;
  const now = Date.now();
  const windowStart = now - CONFIG.WPM_WINDOW_MS;

  // Filter to recent inputs only
  const recentInputs = metrics.recentInputs.filter(entry => entry.time >= windowStart);

  if (recentInputs.length < 2) return 0;

  // Calculate chars typed in window
  const charsInWindow = recentInputs.reduce((sum, entry) => sum + entry.chars, 0);

  // Calculate actual time span of typing (first to last input in window)
  const firstTime = recentInputs[0].time;
  const lastTime = recentInputs[recentInputs.length - 1].time;
  const timeSpanMs = lastTime - firstTime;

  if (timeSpanMs < 1000) return 0; // Need at least 1 second of data

  // WPM = (chars / 5) / minutes
  const minutes = timeSpanMs / 1000 / 60;
  const wpm = (charsInWindow / 5) / minutes;

  // Track peak WPM
  if (wpm > metrics.peakWpm) {
    metrics.peakWpm = wpm;
  }

  return Math.round(wpm);
}

// Get overall average WPM (for stats)
function getOverallWpm() {
  const metrics = gameState.metrics;
  if (!metrics.startTime) return 0;

  const elapsed = (Date.now() - metrics.startTime) / 1000 / 60;
  if (elapsed < 0.05) return 0;

  return Math.round((metrics.charsTyped / 5) / elapsed);
}

// Record a typing input for rolling WPM calculation
function recordTypingInput(charCount) {
  const metrics = gameState.metrics;
  const now = Date.now();

  metrics.recentInputs.push({ time: now, chars: charCount });

  // Clean up old entries outside the window
  const windowStart = now - CONFIG.WPM_WINDOW_MS;
  metrics.recentInputs = metrics.recentInputs.filter(entry => entry.time >= windowStart);
}

// ===========================================
// GAME API (for commands.js)
// ===========================================
const GameAPI = {
  attack(index, force = false) {
    const config = getConfig();

    // Check if force rm is disabled by mission
    if (force && config.DISABLE_FORCE_RM) {
      this.log('rm -f: command disabled for this mission', 'error');
      if (typeof playSound === 'function') playSound('cmd.error');
      return false;
    }

    const cooldownKey = force ? 'rmForce' : 'rm';
    // Use config values for cooldowns (Campaign+ modifies these)
    const cooldownTime = force
      ? (config.RM_FORCE_COOLDOWN || CONFIG.RM_FORCE_COOLDOWN)
      : (config.RM_COOLDOWN || CONFIG.RM_COOLDOWN);
    const ramCost = force ? CONFIG.RM_FORCE_RAM_COST : CONFIG.RM_RAM_COST;
    const baseDamage = force
      ? CONFIG.RM_FORCE_DAMAGE
      : (config.RM_DAMAGE || CONFIG.RM_DAMAGE);

    if (gameState.cooldowns[cooldownKey] > 0) {
      const remaining = gameState.cooldowns[cooldownKey].toFixed(1);
      this.log(`rm: throttled (${remaining}s remaining)`, 'error');
      if (typeof playSound === 'function') playSound('cmd.error');
      return false;
    }

    if (gameState.ram < ramCost) {
      this.log(`rm: insufficient RAM (need ${ramCost} MB, have ${Math.floor(gameState.ram)} MB)`, 'error');
      if (typeof playSound === 'function') playSound('cmd.error');
      return false;
    }

    const target = getMinionByIndex(index);
    if (!target) {
      this.log(`rm: no target at index ${index}`, 'error');
      if (typeof playSound === 'function') playSound('cmd.error');
      return false;
    }

    gameState.ram -= ramCost;
    gameState.cooldowns[cooldownKey] = cooldownTime;

    // Calculate WPM bonus
    const wpmBonus = calculateWpmBonus();

    let damage = baseDamage * gameState.dmgMult * wpmBonus;
    const minionConfig = CONFIG.MINIONS[target.type];
    if (minionConfig.rmResist && minionConfig.rmResist !== 1.0) {
      damage *= minionConfig.rmResist;
    }

    target.lastDamageSource = 'rm';
    target.hp -= damage;

    if (target.hp <= 0) {
      killMinion(target, 'rm');
    } else {
      const bonusStr = wpmBonus > 1.05 ? ` [${wpmBonus.toFixed(2)}x WPM]` : '';
      this.log(`rm: ${Math.floor(damage)} dmg to #${index} (${target.type})${bonusStr}`, 'success');
    }

    return true;
  },

  buildTower(type) {
    const config = getConfig();

    // Check if towers are disabled by mission
    if (config.DISABLE_TOWERS) {
      this.log('build: tower construction disabled for this mission', 'error');
      if (typeof playSound === 'function') playSound('cmd.error');
      return false;
    }

    if (gameState.towerCount >= CONFIG.TOWER_MAX) {
      this.log(`build: max towers reached (${CONFIG.TOWER_MAX}). Use "upgrade cannon" instead.`, 'error');
      if (typeof playSound === 'function') playSound('cmd.error');
      return false;
    }

    const baseCost = config.TOWER_BASE_COST || CONFIG.TOWER_BASE_COST;
    const cost = Math.floor(baseCost * Math.pow(CONFIG.TOWER_COST_SCALE, gameState.towerCount));

    if (gameState.money < cost) {
      this.log(`build: insufficient credits (need $${cost})`, 'error');
      if (typeof playSound === 'function') playSound('cmd.error');
      return false;
    }

    gameState.money -= cost;
    gameState.towerCount++;

    const tower = {
      id: gameState.towerCount,
      type: type,
      x: CONFIG.TOWER_X,
      y: 50 + (gameState.towerCount - 1) * 42,
      fireTimer: 0,
      damage: CONFIG.TOWER_DAMAGE,
      level: 1
    };

    gameState.towers.push(tower);

    // Play tower place sound
    if (typeof playSound === 'function') {
      playSound('tower.place');
    }

    if (gameState.towerCount >= CONFIG.TOWER_MAX) {
      this.log(`build: cannon #${gameState.towerCount} deployed (MAX reached)`, 'success');
    } else {
      const nextCost = Math.floor(baseCost * Math.pow(CONFIG.TOWER_COST_SCALE, gameState.towerCount));
      this.log(`build: cannon #${gameState.towerCount} deployed (next: $${nextCost})`, 'success');
    }

    return true;
  },

  upgradeTowers() {
    const config = getConfig();

    // Check if towers are disabled by mission
    if (config.DISABLE_TOWERS) {
      this.log('upgrade: tower upgrades disabled for this mission', 'error');
      if (typeof playSound === 'function') playSound('cmd.error');
      return false;
    }

    if (gameState.towers.length === 0) {
      this.log(`upgrade: no towers to upgrade`, 'error');
      if (typeof playSound === 'function') playSound('cmd.error');
      return false;
    }

    const cost = CONFIG.TOWER_UPGRADE_COST * gameState.towers.length;

    if (gameState.money < cost) {
      this.log(`upgrade: insufficient credits (need $${cost} for ${gameState.towers.length} towers)`, 'error');
      if (typeof playSound === 'function') playSound('cmd.error');
      return false;
    }

    gameState.money -= cost;

    for (const tower of gameState.towers) {
      tower.level++;
      tower.damage = Math.floor(CONFIG.TOWER_DAMAGE * Math.pow(CONFIG.TOWER_UPGRADE_DAMAGE_MULT, tower.level - 1));
    }

    const avgLevel = gameState.towers[0].level;
    this.log(`upgrade: all cannons upgraded to level ${avgLevel} (+40% dmg)`, 'success');
    return true;
  },

  syncRam() {
    const config = getConfig();

    // Check if sync is disabled by mission
    if (config.DISABLE_SYNC) {
      this.log('sync: command disabled for this mission', 'error');
      if (typeof playSound === 'function') playSound('cmd.error');
      return false;
    }

    if (gameState.cooldowns.sync > 0) {
      const remaining = gameState.cooldowns.sync.toFixed(1);
      this.log(`sync: busy (${remaining}s remaining)`, 'error');
      if (typeof playSound === 'function') playSound('cmd.error');
      return false;
    }

    const syncCooldown = config.SYNC_COOLDOWN || CONFIG.SYNC_COOLDOWN;
    const syncRestore = config.SYNC_RESTORE || CONFIG.SYNC_RESTORE;
    const maxRam = config.RAM_MAX || CONFIG.RAM_MAX;

    gameState.cooldowns.sync = syncCooldown;
    const restored = Math.min(syncRestore, maxRam - gameState.ram);
    gameState.ram = Math.min(maxRam, gameState.ram + syncRestore);

    this.log(`sync: flushing caches... +${restored} MB restored`, 'success');
    return true;
  },

  killAll(freeUse = false) {
    const config = getConfig();
    const ramCost = CONFIG.KILLALL_RAM_COST;
    const cooldown = CONFIG.KILLALL_COOLDOWN;

    // Check cooldown
    if (gameState.cooldowns.killall > 0) {
      const remaining = gameState.cooldowns.killall.toFixed(1);
      this.log(`killall: system recharging (${remaining}s remaining)`, 'error');
      if (typeof playSound === 'function') playSound('cmd.error');
      return false;
    }

    // Check if any enemies exist
    if (gameState.minions.length === 0) {
      this.log('killall: no active processes to terminate', 'warning');
      if (typeof playSound === 'function') playSound('cmd.error');
      return false;
    }

    // Check RAM (unless free use from tutorial)
    if (!freeUse && gameState.ram < ramCost) {
      this.log(`killall: insufficient RAM (need ${ramCost} MB, have ${Math.floor(gameState.ram)} MB)`, 'error');
      if (typeof playSound === 'function') playSound('cmd.error');
      return false;
    }

    // Deduct RAM and start cooldown
    if (!freeUse) {
      gameState.ram -= ramCost;
    }
    gameState.cooldowns.killall = cooldown;

    // Kill all enemies with dramatic effect
    const killCount = gameState.minions.length;
    let totalReward = 0;

    // Process each minion
    for (const minion of [...gameState.minions]) {
      const baseStats = CONFIG.MINIONS[minion.type];
      const moneyScale = 1 + gameState.waveIndex * CONFIG.MONEY_SCALE_PER_WAVE;
      const config = getConfig();
      const moneyMult = config.MONEY_BONUS_MULTIPLIER || 1;

      // Full reward as if killed by rm
      let reward = Math.floor(baseStats.money * moneyScale * moneyMult * 1.5);
      totalReward += reward;
      gameState.money += reward;
      gameState.metrics.kills++;

      // Spawn death particles for each enemy
      spawnDeathParticles(minion.x, minion.y, baseStats.color);
    }

    // Clear all minions
    gameState.minions = [];

    this.log(`killall: TERMINATED ${killCount} processes (+$${totalReward})`, 'kill');
    this.log(`killall: system recharging... ${cooldown}s cooldown`, 'warning');

    return true;
  },

  setSpeed(inputLevel) {
    if (!CONFIG.SPEED_OPTIONS.includes(inputLevel)) {
      this.log(`speed: invalid value. Use 0 (pause), 1, 2, or 3`, 'error');
      return false;
    }

    if (inputLevel === 0) {
      gameState.paused = true;
      gameState.speedMultiplier = 1;  // Keep at 1 for when we unpause
      this.log(`speed: PAUSED (use "speed 1" to resume)`, 'warning');
    } else {
      gameState.paused = false;
      // Translate input level to actual timescale
      gameState.speedMultiplier = CONFIG.SPEED_TIMESCALE[inputLevel];
      this.log(`speed: set to ${gameState.speedMultiplier}x`, 'success');
    }
    return true;
  },

  setTargetMode(mode) {
    const normalizedMode = mode.toLowerCase();
    if (!TARGETING_MODES.includes(normalizedMode)) {
      this.log(`target: invalid mode (use first|strong|weak)`, 'error');
      if (typeof playSound === 'function') playSound('cmd.error');
      return false;
    }

    gameState.targetMode = normalizedMode;
    saveTargetingMode(normalizedMode);
    this.log(`target: mode set to ${normalizedMode}`, 'success');
    return true;
  },

  getStatus() {
    return {
      running: gameState.running,
      ram: gameState.ram,
      maxRam: CONFIG.RAM_MAX,
      coreHp: gameState.coreHp,
      maxCoreHp: CONFIG.CORE_HP_MAX,
      money: gameState.money,
      wave: gameState.waveIndex,
      minions: gameState.minions.length,
      towers: gameState.towerCount,
      towerMax: CONFIG.TOWER_MAX,
      towerLevel: gameState.towers.length > 0 ? gameState.towers[0].level : 0,
      cooldowns: { ...gameState.cooldowns },
      speed: gameState.speedMultiplier
    };
  },

  log(msg, type = 'info') {
    const entry = document.createElement('div');
    entry.className = `log-entry ${type}`;
    entry.textContent = msg;
    scrollback.appendChild(entry);
    scrollback.scrollTop = scrollback.scrollHeight;
  },

  start() {
    if (gameState.running) return;

    resetGameState();
    tutorial.reset();
    gameState.running = true;
    gameState.countdown = CONFIG.WAVE_COUNTDOWN_SEC;

    hudElements.gameStatus.textContent = '[ ONLINE ]';
    hudElements.gameStatus.style.color = '#00ff88';

    // Play mission start sound
    if (typeof playSound === 'function') {
      playSound('game.missionStart');
    }

    this.log('=== NEURAL THROTTLE INITIALIZED ===', 'system');

    // Show mode-specific startup messages
    if (gameState.gameMode === 'campaign' && campaignState.activeMission) {
      const mission = campaignState.activeMission;
      this.log(`Mission ${mission.id}: ${mission.title}`, 'system');
      this.log(`Objective: Survive ${mission.waveCount} waves`, 'info');

      // Show modifier warnings if any
      const modifiers = mission.modifiers || {};
      if (modifiers.disableSync) this.log('WARNING: sync command unavailable', 'warning');
      if (modifiers.disableForceRm) this.log('WARNING: rm -f unavailable', 'warning');
      if (modifiers.disableTowers) this.log('WARNING: tower construction disabled', 'warning');

      this.log(`Wave ${gameState.waveIndex}/${mission.waveCount} incoming in ${CONFIG.WAVE_COUNTDOWN_SEC}s...`, 'warning');
    } else {
      this.log(`Wave ${gameState.waveIndex} incoming in ${CONFIG.WAVE_COUNTDOWN_SEC}s...`, 'warning');
    }

    updateHUDForMode();
  },

  // Start a campaign mission (supports both normal campaign and Campaign+ mode)
  startCampaignMission(missionId) {
    if (!startMission(missionId)) {
      this.log('Failed to start mission', 'error');
      return false;
    }

    gameState.gameMode = 'campaign';

    // Campaign+ mode: disable tutorials entirely (player already proved they know the game)
    // Normal campaign: tutorials enabled but will be blocked by globallyCompleted if already done
    if (campaignState.activeCampaignMode === 'campaign_plus') {
      tutorial.enabled = false;
    } else {
      // In normal campaign, enable tutorials (globallyCompleted check handles the rest)
      tutorial.enabled = !tutorial.globallyCompleted || tutorial.forceReplay;
    }

    this.start();

    // Log Campaign+ mode indicator
    if (campaignState.activeCampaignMode === 'campaign_plus') {
      this.log('>>> CAMPAIGN+ MODE ACTIVE <<<', 'warning');
    }

    return true;
  },

  // Start endless mode
  startEndlessMode() {
    gameState.gameMode = 'endless';
    gameState.activeConfig = null;
    campaignState.activeMission = null;
    campaignState.currentMissionId = null;

    // Tutorial in endless mode only if not completed
    tutorial.enabled = !tutorial.globallyCompleted;

    this.start();
  },

  getTowerCost() {
    const config = getConfig();
    if (config.DISABLE_TOWERS) return null;
    if (gameState.towerCount >= CONFIG.TOWER_MAX) return null;
    const baseCost = config.TOWER_BASE_COST || CONFIG.TOWER_BASE_COST;
    return Math.floor(baseCost * Math.pow(CONFIG.TOWER_COST_SCALE, gameState.towerCount));
  },

  getUpgradeCost() {
    return CONFIG.TOWER_UPGRADE_COST * gameState.towers.length;
  }
};

window.GameAPI = GameAPI;

// ===========================================
// GAME LOGIC
// ===========================================

function resetGameState() {
  gameState.running = false;
  gameState.paused = false;
  gameState.gameOver = false;

  // Preserve speed setting across missions - don't reset speedMultiplier
  // Player can manually change it with "speed 1" if they want

  // Apply mission modifiers if in campaign mode
  if (gameState.gameMode === 'campaign' && campaignState.activeMission) {
    gameState.activeConfig = applyMissionModifiers(CONFIG);
  } else {
    gameState.activeConfig = null;
  }

  const config = getConfig();

  // Apply starting values from config (potentially modified by mission)
  gameState.ram = config.START_RAM || CONFIG.START_RAM;
  gameState.coreHp = config.CORE_HP_MAX || CONFIG.CORE_HP_MAX;
  gameState.money = config.START_MONEY || CONFIG.START_MONEY;

  gameState.waveIndex = 1;
  gameState.waveActive = false;
  gameState.countdown = 0;
  gameState.spawnQueue = [];
  gameState.spawnTimer = 0;
  gameState.spawned = 0;
  gameState.totalToSpawn = 0;

  gameState.minions = [];
  gameState.towers = [];
  gameState.projectiles = [];
  gameState.particles = [];
  gameState.minionIdCounter = 0;
  gameState.towerCount = 0;

  gameState.cooldowns = { rm: 0, rmForce: 0, sync: 0, killall: 0 };

  gameState.hpMult = 1;
  gameState.dmgMult = 1;
  gameState.towerDmgMult = 1;

  gameState.metrics = {
    charsTyped: 0,
    commandsSubmitted: 0,
    correctCommands: 0,
    startTime: null,
    kills: 0,
    wpmSamples: [],
    lastWpmCalcTime: 0,
    recentInputs: [],
    peakWpm: 0
  };

  gameState.previewTargetIndex = null;

  gameState.notifications = {
    canAffordTower: false
  };

  scrollback.innerHTML = '';
}

function updateScalingMultipliers() {
  const w = gameState.waveIndex;
  gameState.hpMult = 1 + (w - 1) * CONFIG.HP_SCALE_PER_WAVE;
  gameState.dmgMult = 1 + (w - 1) * CONFIG.DMG_SCALE_PER_WAVE;
  gameState.towerDmgMult = 1 + (w - 1) * CONFIG.TOWER_DMG_SCALE_PER_WAVE;
}

function startWave() {
  updateScalingMultipliers();

  const waveDef = getWaveDefinition(gameState.waveIndex);
  gameState.totalToSpawn = waveDef.count;
  gameState.spawned = 0;
  gameState.spawnTimer = 0;
  gameState.waveActive = true;

  gameState.spawnQueue = [];
  for (let i = 0; i < waveDef.count; i++) {
    gameState.spawnQueue.push({
      type: weightedRandomType(waveDef.weights),
      delay: i * waveDef.interval
    });
  }

  GameAPI.log(`=== WAVE ${gameState.waveIndex} STARTED ===`, 'system');
}

function spawnMinion(type) {
  const waveDef = getWaveDefinition(gameState.waveIndex);
  const baseStats = CONFIG.MINIONS[type];
  const config = getConfig();

  // Campaign+ enemy multipliers (default to 1.0 if not set)
  const enemyHpMult = config.ENEMY_HP_MULTIPLIER || 1.0;
  const enemySpeedMult = config.ENEMY_SPEED_MULTIPLIER || 1.0;

  // Calculate HP: base * wave scaling * Campaign+ multiplier
  const finalHp = Math.floor(baseStats.hp * gameState.hpMult * enemyHpMult);

  // Calculate speed: base * wave speed scale * Campaign+ multiplier
  const finalSpeed = baseStats.speed * waveDef.speedScale * enemySpeedMult;

  const minion = {
    id: ++gameState.minionIdCounter,
    type: type,
    hp: finalHp,
    maxHp: finalHp,
    speed: finalSpeed,
    x: CONFIG.SPAWN_X,
    y: 150 + (Math.random() - 0.5) * 100,
    lastDamageSource: 'tower'
  };

  gameState.minions.push(minion);
}

function killMinion(minion, source) {
  const config = getConfig();
  const baseStats = CONFIG.MINIONS[minion.type];
  const moneyScale = 1 + gameState.waveIndex * CONFIG.MONEY_SCALE_PER_WAVE;
  const moneyMult = config.MONEY_BONUS_MULTIPLIER || 1;
  let reward = Math.floor(baseStats.money * moneyScale * moneyMult);

  if (minion.lastDamageSource === 'rm') {
    reward = Math.floor(reward * 1.5);
  }

  gameState.money += reward;
  gameState.metrics.kills++;

  // Spawn death particles (shatter effect)
  spawnDeathParticles(minion.x, minion.y, baseStats.color);

  // Play minion death sound (rate-limited in audio.js)
  if (typeof playSound === 'function') {
    playSound('world.minionDeath');
  }

  const idx = gameState.minions.indexOf(minion);
  if (idx > -1) {
    gameState.minions.splice(idx, 1);
  }

  GameAPI.log(`process terminated: ${minion.type} (+$${reward})`, 'kill');
}

// Spawn shatter particles when enemy dies (Tron-style glass breaking)
function spawnDeathParticles(x, y, color) {
  const particleCount = 12 + Math.floor(Math.random() * 8);  // 12-20 particles

  for (let i = 0; i < particleCount; i++) {
    // Random angle for explosion direction
    const angle = (Math.PI * 2 * i / particleCount) + (Math.random() - 0.5) * 0.5;
    const speed = 80 + Math.random() * 120;  // 80-200 px/s

    // Create particle with velocity and lifetime
    gameState.particles.push({
      x: x + (Math.random() - 0.5) * 20,  // Slight random offset
      y: y + (Math.random() - 0.5) * 20,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      size: 2 + Math.random() * 4,  // 2-6 px
      color: color,
      life: 1.0,  // Full life
      decay: 1.5 + Math.random() * 1.0,  // How fast it fades (1.5-2.5 per second)
      rotation: Math.random() * Math.PI * 2,
      rotationSpeed: (Math.random() - 0.5) * 10,  // Spin
      shape: Math.random() > 0.5 ? 'shard' : 'square'  // Mix of shapes
    });
  }
}

function checkWaveComplete() {
  // Don't check wave completion if game is over (prevents victory after death)
  if (!gameState.waveActive || gameState.gameOver) return;

  const allSpawned = gameState.spawned >= gameState.totalToSpawn;
  const allDead = gameState.minions.length === 0;

  if (allSpawned && allDead) {
    gameState.waveActive = false;

    const config = getConfig();
    const bonus = CONFIG.WAVE_CLEAR_BONUS_BASE + gameState.waveIndex * CONFIG.WAVE_CLEAR_BONUS_PER_WAVE;

    // Apply money bonus multiplier if present (from mission modifiers)
    const finalBonus = config.MONEY_BONUS_MULTIPLIER
      ? Math.floor(bonus * config.MONEY_BONUS_MULTIPLIER)
      : bonus;
    gameState.money += finalBonus;

    // RAM bonus - can be customized by mission
    const ramBonus = config.WAVE_CLEAR_RAM_BONUS !== undefined ? config.WAVE_CLEAR_RAM_BONUS : 40;
    const maxRam = config.RAM_MAX || CONFIG.RAM_MAX;
    gameState.ram = Math.min(maxRam, gameState.ram + ramBonus);

    GameAPI.log(`=== WAVE ${gameState.waveIndex} CLEARED (+$${finalBonus}, +${ramBonus} MB) ===`, 'system');

    // Check for campaign victory
    if (gameState.gameMode === 'campaign' && isLastMissionWave(gameState.waveIndex)) {
      campaignVictory();
      return;
    }

    gameState.waveIndex++;
    gameState.countdown = CONFIG.WAVE_COUNTDOWN_SEC;

    // Show wave info with total for campaign
    if (gameState.gameMode === 'campaign' && campaignState.activeMission) {
      GameAPI.log(`Wave ${gameState.waveIndex}/${campaignState.activeMission.waveCount} incoming in ${CONFIG.WAVE_COUNTDOWN_SEC}s...`, 'warning');
    } else {
      GameAPI.log(`Wave ${gameState.waveIndex} incoming in ${CONFIG.WAVE_COUNTDOWN_SEC}s...`, 'warning');
    }
  }
}

// Campaign mode victory
function campaignVictory() {
  gameState.running = false;
  gameState.gameOver = true;

  // completeMission returns true if Campaign+ was just unlocked (Mission 20 in normal campaign)
  const justUnlockedCampaignPlus = completeMission();

  hudElements.gameStatus.textContent = '[ MISSION COMPLETE ]';
  hudElements.gameStatus.style.color = '#00ff88';

  // Play appropriate victory sound
  if (typeof playSound === 'function') {
    if (justUnlockedCampaignPlus) {
      playSound('game.unlockCampaignPlus');
    } else {
      playSound('game.missionComplete');
    }
  }

  GameAPI.log('=== MISSION COMPLETE ===', 'system');

  const stats = calculateFinalStats();

  // Show special Campaign Complete overlay if Campaign+ was just unlocked
  if (justUnlockedCampaignPlus) {
    showCampaignCompleteScreen(stats);
  } else {
    showCampaignVictoryScreen(stats);
  }
}

function gameOver() {
  gameState.running = false;
  gameState.gameOver = true;

  hudElements.gameStatus.textContent = '[ OFFLINE ]';
  hudElements.gameStatus.style.color = '#ff3366';

  // Play mission fail sound
  if (typeof playSound === 'function') {
    playSound('game.missionFail');
  }

  GameAPI.log('=== CORE BREACH - SYSTEM FAILURE ===', 'error');

  const stats = calculateFinalStats();

  if (gameState.gameMode === 'campaign') {
    failMission();
    showCampaignFailureScreen(stats);
  } else {
    showGameOverScreen(stats);
  }
}

function calculateFinalStats() {
  const metrics = gameState.metrics;
  const elapsed = metrics.startTime ? (Date.now() - metrics.startTime) / 1000 : 0;
  const avgWpm = getOverallWpm();
  const accuracy = metrics.commandsSubmitted > 0
    ? Math.round((metrics.correctCommands / metrics.commandsSubmitted) * 100)
    : 100;
  // Use peak rolling WPM as best WPM
  const bestWpm = Math.round(metrics.peakWpm) || avgWpm;

  return {
    waves: gameState.waveIndex - 1,
    bestWpm: bestWpm,
    avgWpm: avgWpm,
    accuracy: accuracy,
    time: elapsed,
    kills: metrics.kills
  };
}

// ===========================================
// UPDATE FUNCTIONS
// ===========================================

function updateCooldowns(dt) {
  for (const key of Object.keys(gameState.cooldowns)) {
    if (gameState.cooldowns[key] > 0) {
      gameState.cooldowns[key] = Math.max(0, gameState.cooldowns[key] - dt);
    }
  }
}

function regenRam(dt) {
  if (CONFIG.RAM_REGEN_PER_SEC > 0 && gameState.ram < CONFIG.RAM_MAX) {
    gameState.ram = Math.min(CONFIG.RAM_MAX, gameState.ram + CONFIG.RAM_REGEN_PER_SEC * dt);
  }
}

function updateCountdown(dt) {
  if (gameState.countdown > 0) {
    gameState.countdown -= dt;
    if (gameState.countdown <= 0) {
      gameState.countdown = 0;
      startWave();
    }
  }
}

function updateSpawning(dt) {
  if (!gameState.waveActive || gameState.spawned >= gameState.totalToSpawn) return;

  gameState.spawnTimer += dt * 1000;

  while (gameState.spawnQueue.length > 0 && gameState.spawnTimer >= gameState.spawnQueue[0].delay) {
    const spawn = gameState.spawnQueue.shift();
    spawnMinion(spawn.type);
    gameState.spawned++;
  }
}

function updateMinions(dt) {
  const config = getConfig();
  const coreDmgMult = config.CORE_DAMAGE_MULTIPLIER || 1;

  for (const minion of gameState.minions) {
    minion.x -= minion.speed * dt;

    if (minion.x <= CONFIG.CORE_X) {
      const baseDamage = CONFIG.MINIONS[minion.type].coreDmg;
      const damage = Math.floor(baseDamage * coreDmgMult);
      gameState.coreHp -= damage;

      const idx = gameState.minions.indexOf(minion);
      if (idx > -1) {
        gameState.minions.splice(idx, 1);
      }

      // Play core hit sound (rate-limited in audio.js)
      if (typeof playSound === 'function') {
        playSound('world.coreHit');
      }

      GameAPI.log(`core breach: -${damage} HP (${minion.type})`, 'error');

      if (gameState.coreHp <= 0) {
        gameState.coreHp = 0;
        gameOver();
        return;
      }
    }
  }
}

// Select tower target based on current targeting mode
function selectTowerTarget() {
  if (gameState.minions.length === 0) return null;

  const mode = gameState.targetMode;
  let minions = [...gameState.minions];

  // Sort by x position (closest to core first) for tie-breaking
  minions.sort((a, b) => a.x - b.x);

  // For strong/weak modes, filter out tower-immune enemies (e.g. Heavy)
  // This prevents towers from "wasting" shots or getting stuck on immune targets
  if (mode === 'strong' || mode === 'weak') {
    const damageable = minions.filter(m => {
      const resist = CONFIG.MINIONS[m.type].towerResist;
      return resist !== undefined && resist > 0;
    });
    // Only use filtered list if there are damageable targets
    if (damageable.length > 0) {
      minions = damageable;
    }
  }

  switch (mode) {
    case 'first':
      // Closest to core (lowest x)
      return minions[0];

    case 'strong':
      // Highest current HP, tie-breaker: closest to core
      return minions.reduce((best, m) => {
        if (m.hp > best.hp) return m;
        if (m.hp === best.hp && m.x < best.x) return m;
        return best;
      }, minions[0]);

    case 'weak':
      // Lowest current HP, tie-breaker: closest to core
      return minions.reduce((best, m) => {
        if (m.hp < best.hp) return m;
        if (m.hp === best.hp && m.x < best.x) return m;
        return best;
      }, minions[0]);

    default:
      return minions[0];
  }
}

function updateTowers(dt) {
  for (const tower of gameState.towers) {
    tower.fireTimer -= dt;

    if (tower.fireTimer <= 0 && gameState.minions.length > 0) {
      // Select target based on targeting mode
      const target = selectTowerTarget();
      if (target) {
        const minionConfig = CONFIG.MINIONS[target.type];
        const towerResist = minionConfig.towerResist !== undefined ? minionConfig.towerResist : 1.0;

        if (towerResist > 0) {
          const damage = tower.damage * gameState.towerDmgMult * towerResist;
          target.hp -= damage;

          createProjectile(tower, target);

          // Play tower fire sound (rate-limited in audio.js)
          if (typeof playSound === 'function') {
            playSound('tower.fire');
          }

          if (target.hp <= 0) {
            killMinion(target, 'tower');
          }
        } else {
          createProjectile(tower, target, true);
          // Still play sound for ineffective shots (sounds different with no damage)
          if (typeof playSound === 'function') {
            playSound('tower.fire');
          }
        }

        tower.fireTimer = 1 / CONFIG.TOWER_FIRE_RATE;
      }
    }
  }
}

function createProjectile(tower, target, ineffective = false) {
  gameState.projectiles.push({
    x: tower.x + 20,
    y: tower.y,
    targetX: target.x,
    targetY: target.y,
    progress: 0,
    speed: 8,
    ineffective: ineffective
  });
}

function updateProjectiles(dt) {
  for (let i = gameState.projectiles.length - 1; i >= 0; i--) {
    const proj = gameState.projectiles[i];
    proj.progress += proj.speed * dt;
    if (proj.progress >= 1) {
      gameState.projectiles.splice(i, 1);
    }
  }
}

function updateParticles(dt) {
  for (let i = gameState.particles.length - 1; i >= 0; i--) {
    const p = gameState.particles[i];

    // Update position
    p.x += p.vx * dt;
    p.y += p.vy * dt;

    // Apply drag/friction
    p.vx *= 0.98;
    p.vy *= 0.98;

    // Apply slight gravity
    p.vy += 30 * dt;

    // Update rotation
    p.rotation += p.rotationSpeed * dt;

    // Decay life
    p.life -= p.decay * dt;

    // Remove dead particles
    if (p.life <= 0) {
      gameState.particles.splice(i, 1);
    }
  }
}

function updateMetrics() {
  // WPM is now calculated on-demand via getRollingWpm()
  // This function can be used for other periodic metric updates if needed
}

// ===========================================
// RENDERING
// ===========================================

function drawCanvas() {
  ctx.fillStyle = '#0a0a0f';
  ctx.fillRect(0, 0, CONFIG.CANVAS_WIDTH, CONFIG.CANVAS_HEIGHT);

  ctx.strokeStyle = 'rgba(0, 255, 255, 0.05)';
  ctx.lineWidth = 1;
  for (let x = 0; x < CONFIG.CANVAS_WIDTH; x += 40) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, CONFIG.CANVAS_HEIGHT);
    ctx.stroke();
  }
  for (let y = 0; y < CONFIG.CANVAS_HEIGHT; y += 40) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(CONFIG.CANVAS_WIDTH, y);
    ctx.stroke();
  }

  drawCore();

  for (const tower of gameState.towers) {
    drawTower(tower);
  }

  for (const proj of gameState.projectiles) {
    drawProjectile(proj);
  }

  // Draw death particles (shatter effect)
  drawParticles();

  const sortedMinions = getMinionsIndexed();
  sortedMinions.forEach((minion, idx) => {
    drawMinion(minion, idx);
  });

  if (gameState.countdown > 0) {
    drawCountdown();
  }

  if (gameState.waveActive && gameState.spawned < gameState.totalToSpawn) {
    drawSpawnIndicator();
  }

  // Draw pause overlay if tutorial is active or game is manually paused
  if (tutorial.paused) {
    drawPauseOverlay();
  } else if (gameState.paused && gameState.running) {
    drawManualPauseOverlay();
  }
}

function drawCore() {
  const config = getConfig();
  const maxCore = config.CORE_HP_MAX || CONFIG.CORE_HP_MAX;
  const x = CONFIG.CORE_X;
  const y = CONFIG.CANVAS_HEIGHT / 2;
  const hpPercent = gameState.coreHp / maxCore;

  const gradient = ctx.createRadialGradient(x, y, 0, x, y, 40);
  gradient.addColorStop(0, `rgba(0, 255, 136, ${0.3 * hpPercent})`);
  gradient.addColorStop(1, 'transparent');
  ctx.fillStyle = gradient;
  ctx.fillRect(x - 50, y - 50, 100, 100);

  ctx.fillStyle = '#12121a';
  ctx.strokeStyle = hpPercent > 0.3 ? '#00ff88' : '#ff3366';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(x, y, 25, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = '#0a0a0f';
  ctx.fillRect(x - 20, y + 32, 40, 6);
  ctx.fillStyle = hpPercent > 0.3 ? '#00ff88' : '#ff3366';
  ctx.fillRect(x - 20, y + 32, 40 * hpPercent, 6);

  ctx.fillStyle = '#00ff88';
  ctx.font = '10px monospace';
  ctx.textAlign = 'center';
  ctx.fillText('CORE', x, y + 4);
}

function drawTower(tower) {
  const x = tower.x;
  const y = tower.y;

  ctx.fillStyle = '#1a1a2e';
  ctx.strokeStyle = '#00ffff';
  ctx.lineWidth = 2;
  ctx.fillRect(x - 12, y - 12, 24, 24);
  ctx.strokeRect(x - 12, y - 12, 24, 24);

  const firing = tower.fireTimer > (1 / CONFIG.TOWER_FIRE_RATE) - 0.15;
  ctx.fillStyle = firing ? '#ffffff' : '#00ffff';
  if (firing) {
    ctx.shadowColor = '#00ffff';
    ctx.shadowBlur = 10;
  }
  ctx.fillRect(x + 8, y - 3, firing ? 16 : 12, 6);
  ctx.shadowBlur = 0;

  ctx.fillStyle = '#00ffff';
  ctx.font = '8px monospace';
  ctx.textAlign = 'center';
  ctx.fillText(`T${tower.id}`, x, y + 3);

  if (tower.level > 1) {
    ctx.fillStyle = '#ffcc00';
    ctx.font = '7px monospace';
    ctx.fillText(`L${tower.level}`, x, y + 18);
  }
}

function drawProjectile(proj) {
  const x = proj.x + (proj.targetX - proj.x) * proj.progress;
  const y = proj.y + (proj.targetY - proj.y) * proj.progress;

  ctx.beginPath();
  ctx.arc(x, y, 3, 0, Math.PI * 2);
  ctx.fillStyle = proj.ineffective ? '#666666' : '#00ffff';
  ctx.fill();

  ctx.beginPath();
  ctx.moveTo(x, y);
  const trailX = proj.x + (proj.targetX - proj.x) * Math.max(0, proj.progress - 0.2);
  const trailY = proj.y + (proj.targetY - proj.y) * Math.max(0, proj.progress - 0.2);
  ctx.lineTo(trailX, trailY);
  ctx.strokeStyle = proj.ineffective ? 'rgba(100, 100, 100, 0.5)' : 'rgba(0, 255, 255, 0.5)';
  ctx.lineWidth = 2;
  ctx.stroke();
}

function drawParticles() {
  for (const p of gameState.particles) {
    ctx.save();
    ctx.translate(p.x, p.y);
    ctx.rotate(p.rotation);

    // Set alpha based on remaining life
    ctx.globalAlpha = Math.max(0, p.life);

    // Glow effect
    ctx.shadowColor = p.color;
    ctx.shadowBlur = 8 * p.life;

    ctx.fillStyle = p.color;

    if (p.shape === 'shard') {
      // Draw triangular shard
      ctx.beginPath();
      ctx.moveTo(0, -p.size);
      ctx.lineTo(p.size * 0.6, p.size * 0.5);
      ctx.lineTo(-p.size * 0.6, p.size * 0.5);
      ctx.closePath();
      ctx.fill();
    } else {
      // Draw square fragment
      const halfSize = p.size / 2;
      ctx.fillRect(-halfSize, -halfSize, p.size, p.size);
    }

    ctx.restore();
  }

  // Reset shadow
  ctx.shadowBlur = 0;
}

function drawMinion(minion, index) {
  const x = minion.x;
  const y = minion.y;
  const stats = CONFIG.MINIONS[minion.type];
  const hpPercent = minion.hp / minion.maxHp;

  // Check if this minion is being targeted (preview)
  const isTargeted = gameState.previewTargetIndex === index;

  // Draw targeting highlight if this minion is being targeted
  if (isTargeted) {
    // Pulsing effect
    const pulse = 0.5 + 0.5 * Math.sin(Date.now() / 100);

    // Outer glow
    ctx.shadowColor = '#ff0000';
    ctx.shadowBlur = 20 + pulse * 10;
    ctx.strokeStyle = `rgba(255, 50, 50, ${0.6 + pulse * 0.4})`;
    ctx.lineWidth = 4;
    ctx.strokeRect(x - 22, y - 19, 44, 38);

    // Target brackets
    ctx.fillStyle = '#ff3333';
    ctx.shadowBlur = 15;
    // Top-left bracket
    ctx.fillRect(x - 24, y - 21, 10, 3);
    ctx.fillRect(x - 24, y - 21, 3, 10);
    // Top-right bracket
    ctx.fillRect(x + 14, y - 21, 10, 3);
    ctx.fillRect(x + 21, y - 21, 3, 10);
    // Bottom-left bracket
    ctx.fillRect(x - 24, y + 18, 10, 3);
    ctx.fillRect(x - 24, y + 11, 3, 10);
    // Bottom-right bracket
    ctx.fillRect(x + 14, y + 18, 10, 3);
    ctx.fillRect(x + 21, y + 11, 3, 10);

    ctx.shadowBlur = 0;
  }

  ctx.shadowColor = stats.color;
  ctx.shadowBlur = 10;

  ctx.fillStyle = '#12121a';
  ctx.strokeStyle = stats.color;
  ctx.lineWidth = 2;
  ctx.fillRect(x - 18, y - 15, 36, 30);
  ctx.strokeRect(x - 18, y - 15, 36, 30);

  ctx.shadowBlur = 0;

  ctx.fillStyle = '#0a0a0f';
  ctx.fillRect(x - 16, y - 24, 32, 5);

  ctx.fillStyle = hpPercent > 0.5 ? stats.color : (hpPercent > 0.25 ? '#ffcc00' : '#ff3366');
  ctx.fillRect(x - 16, y - 24, 32 * hpPercent, 5);

  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 11px monospace';
  ctx.textAlign = 'center';
  ctx.fillText('#' + index, x, y - 30);

  ctx.fillStyle = stats.color;
  ctx.font = '9px monospace';
  ctx.fillText(stats.label, x, y + 4);

  if (stats.towerResist === 0) {
    ctx.fillStyle = '#ff6600';
    ctx.font = 'bold 7px monospace';
    ctx.fillText('IMMUNE', x, y + 20);
  } else if (stats.towerResist < 1) {
    ctx.fillStyle = '#ffcc00';
    ctx.font = '7px monospace';
    ctx.fillText('RESIST', x, y + 20);
  }
}

function drawCountdown() {
  ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
  ctx.fillRect(CONFIG.CANVAS_WIDTH / 2 - 60, CONFIG.CANVAS_HEIGHT / 2 - 30, 120, 60);

  ctx.strokeStyle = '#ffcc00';
  ctx.lineWidth = 2;
  ctx.strokeRect(CONFIG.CANVAS_WIDTH / 2 - 60, CONFIG.CANVAS_HEIGHT / 2 - 30, 120, 60);

  ctx.fillStyle = '#ffcc00';
  ctx.font = 'bold 24px monospace';
  ctx.textAlign = 'center';
  ctx.fillText(Math.ceil(gameState.countdown), CONFIG.CANVAS_WIDTH / 2, CONFIG.CANVAS_HEIGHT / 2 + 8);

  ctx.font = '10px monospace';
  ctx.fillText('WAVE ' + gameState.waveIndex, CONFIG.CANVAS_WIDTH / 2, CONFIG.CANVAS_HEIGHT / 2 - 15);
}

function drawSpawnIndicator() {
  ctx.fillStyle = '#ff00ff';
  ctx.globalAlpha = 0.5 + 0.5 * Math.sin(Date.now() / 200);
  ctx.beginPath();
  ctx.moveTo(CONFIG.SPAWN_X, CONFIG.CANVAS_HEIGHT / 2 - 20);
  ctx.lineTo(CONFIG.SPAWN_X - 15, CONFIG.CANVAS_HEIGHT / 2);
  ctx.lineTo(CONFIG.SPAWN_X, CONFIG.CANVAS_HEIGHT / 2 + 20);
  ctx.closePath();
  ctx.fill();
  ctx.globalAlpha = 1;
}

function drawPauseOverlay() {
  ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
  ctx.fillRect(0, 0, CONFIG.CANVAS_WIDTH, CONFIG.CANVAS_HEIGHT);

  ctx.fillStyle = '#ffcc00';
  ctx.font = 'bold 16px monospace';
  ctx.textAlign = 'center';
  ctx.fillText('PAUSED - TUTORIAL', CONFIG.CANVAS_WIDTH / 2, CONFIG.CANVAS_HEIGHT / 2);

  ctx.font = '12px monospace';
  ctx.fillStyle = '#888899';
  ctx.fillText('Follow instructions in terminal', CONFIG.CANVAS_WIDTH / 2, CONFIG.CANVAS_HEIGHT / 2 + 20);
}

function drawManualPauseOverlay() {
  ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
  ctx.fillRect(0, 0, CONFIG.CANVAS_WIDTH, CONFIG.CANVAS_HEIGHT);

  ctx.fillStyle = '#ffcc00';
  ctx.font = 'bold 20px monospace';
  ctx.textAlign = 'center';
  ctx.fillText('PAUSED', CONFIG.CANVAS_WIDTH / 2, CONFIG.CANVAS_HEIGHT / 2);

  ctx.font = '12px monospace';
  ctx.fillStyle = '#888899';
  ctx.fillText('Type "speed 1" or "speed 2" to resume', CONFIG.CANVAS_WIDTH / 2, CONFIG.CANVAS_HEIGHT / 2 + 25);
}

// Update HUD display based on game mode
function updateHUDForMode() {
  const hudMission = document.getElementById('hudMission');
  const missionTitle = document.getElementById('missionTitle');

  if (gameState.gameMode === 'campaign' && campaignState.activeMission) {
    // Show mission info
    if (hudMission) hudMission.classList.remove('hidden');

    // Add Campaign+ indicator to mission title if in that mode
    const modeIndicator = campaignState.activeCampaignMode === 'campaign_plus' ? ' [+]' : '';
    if (missionTitle) missionTitle.textContent = campaignState.activeMission.title + modeIndicator;
  } else {
    // Endless mode - hide mission
    if (hudMission) hudMission.classList.add('hidden');
  }
}

function updateHUD() {
  const config = getConfig();
  const maxRam = config.RAM_MAX || CONFIG.RAM_MAX;
  const maxCore = config.CORE_HP_MAX || CONFIG.CORE_HP_MAX;

  const ramPercent = (gameState.ram / maxRam) * 100;
  hudElements.ramBar.style.width = ramPercent + '%';
  hudElements.ramValue.textContent = `${Math.floor(gameState.ram)}/${maxRam} MB`;

  // RAM low indicator - glow when below 30% or can't afford rm
  const ramLow = gameState.ram < CONFIG.RM_RAM_COST || ramPercent < 30;
  const ramContainer = hudElements.ramBar.parentElement.parentElement;
  if (ramLow && gameState.running && !gameState.gameOver) {
    ramContainer.classList.add('resource-critical');
  } else {
    ramContainer.classList.remove('resource-critical');
  }

  const corePercent = (gameState.coreHp / maxCore) * 100;
  hudElements.coreBar.style.width = corePercent + '%';
  hudElements.coreValue.textContent = `${Math.floor(gameState.coreHp)}/${maxCore} HP`;

  // Wave display - show "3 / 5" format in campaign mode
  if (gameState.gameMode === 'campaign' && campaignState.activeMission) {
    hudElements.waveValue.textContent = `${gameState.waveIndex} / ${campaignState.activeMission.waveCount}`;
  } else {
    hudElements.waveValue.textContent = gameState.waveIndex;
  }

  // Credits display with can-afford indicator
  hudElements.moneyValue.textContent = '$' + gameState.money;

  // Check if player can afford a tower (and towers aren't disabled)
  const towerCost = GameAPI.getTowerCost();
  const canAffordTower = towerCost !== null && gameState.money >= towerCost;
  const creditsContainer = hudElements.moneyValue.parentElement;

  if (canAffordTower && gameState.running && !gameState.gameOver && gameState.towerCount < CONFIG.TOWER_MAX) {
    creditsContainer.classList.add('can-afford');

    // One-time notification when first becoming affordable
    if (!gameState.notifications.canAffordTower) {
      gameState.notifications.canAffordTower = true;
      GameAPI.log(`CREDITS: Cannon available! (build cannon - $${towerCost})`, 'system');
    }
  } else {
    creditsContainer.classList.remove('can-afford');
    // Reset notification flag when no longer affordable (or tower built)
    gameState.notifications.canAffordTower = false;
  }

  const metrics = gameState.metrics;
  if (metrics.startTime) {
    // Show rolling WPM (actual typing speed)
    const wpm = getRollingWpm();
    hudElements.wpmValue.textContent = wpm;

    // Update WPM bonus display
    const bonus = calculateWpmBonus();
    hudElements.wpmBonusValue.textContent = bonus.toFixed(2) + 'x';

    // Color code the bonus
    if (bonus >= 1.6) {
      hudElements.wpmBonusValue.style.color = '#00ff88'; // Green for high bonus
    } else if (bonus >= 1.3) {
      hudElements.wpmBonusValue.style.color = '#ffcc00'; // Amber for medium
    } else {
      hudElements.wpmBonusValue.style.color = '#00ffff'; // Cyan for normal
    }
  }

  const accuracy = metrics.commandsSubmitted > 0
    ? Math.round((metrics.correctCommands / metrics.commandsSubmitted) * 100)
    : 100;
  hudElements.accValue.textContent = accuracy + '%';

  updateCooldownIndicator(hudElements.cdRm, gameState.cooldowns.rm);
  updateCooldownIndicator(hudElements.cdRmF, gameState.cooldowns.rmForce);
  updateCooldownIndicator(hudElements.cdSync, gameState.cooldowns.sync);
  updateCooldownIndicator(hudElements.cdKillall, gameState.cooldowns.killall);

  if (hudElements.speedValue) {
    if (gameState.paused && !tutorial.paused) {
      hudElements.speedValue.textContent = 'PAUSED';
      hudElements.speedValue.style.color = '#ffcc00';
    } else {
      hudElements.speedValue.textContent = gameState.speedMultiplier + 'x';
      hudElements.speedValue.style.color = '';  // Reset to default
    }
  }

  // Update targeting mode display
  if (hudElements.targetValue) {
    hudElements.targetValue.textContent = gameState.targetMode.toUpperCase();
  }
}

function updateCooldownIndicator(element, remaining) {
  if (remaining > 0) {
    element.classList.add('on-cooldown');
    element.title = remaining.toFixed(1) + 's';
  } else {
    element.classList.remove('on-cooldown');
    element.title = 'ready';
  }
}

// ===========================================
// INPUT HANDLING
// ===========================================

// Command history for up/down arrow navigation
const commandHistory = {
  entries: [],
  index: -1,
  maxSize: 50,  // Keep last 50 commands
  tempInput: ''  // Store current input when navigating history
};

// Update target preview based on current input
function updateTargetPreview() {
  const input = cmdInput.value.trim().toLowerCase();

  // Match "rm <index>" or "rm -f <index>" or "rm -rf <index>"
  const rmMatch = input.match(/^rm\s+(?:-r?f\s+)?(\d+)$/);

  if (rmMatch) {
    const index = parseInt(rmMatch[1], 10);
    gameState.previewTargetIndex = index;
  } else {
    gameState.previewTargetIndex = null;
  }
}

function setupInputHandling() {
  cmdInput.addEventListener('keydown', (e) => {
    // Handle up arrow - go back in history
    if (e.key === 'ArrowUp') {
      e.preventDefault();  // Prevent cursor from moving to start of input

      if (commandHistory.entries.length === 0) return;

      // If we're at the current input (not in history), save it
      if (commandHistory.index === -1) {
        commandHistory.tempInput = cmdInput.value;
      }

      // Move back in history
      if (commandHistory.index < commandHistory.entries.length - 1) {
        commandHistory.index++;
        cmdInput.value = commandHistory.entries[commandHistory.entries.length - 1 - commandHistory.index];
        updateTargetPreview();
      }
      return;
    }

    // Handle down arrow - go forward in history
    if (e.key === 'ArrowDown') {
      e.preventDefault();  // Prevent cursor from moving to end of input

      if (commandHistory.index === -1) return;  // Already at current input

      commandHistory.index--;

      if (commandHistory.index === -1) {
        // Back to current input
        cmdInput.value = commandHistory.tempInput;
      } else {
        cmdInput.value = commandHistory.entries[commandHistory.entries.length - 1 - commandHistory.index];
      }
      updateTargetPreview();
      return;
    }

    if (e.key === 'Enter') {
      const input = cmdInput.value.trim();

      // Handle tutorial awaiting Enter
      if (tutorial.paused && tutorial.awaitingCommand === 'enter' && input === '') {
        tutorial.complete();
        cmdInput.value = '';
        return;
      }

      if (input) {
        // Add to command history (avoid duplicating consecutive commands)
        if (commandHistory.entries.length === 0 ||
            commandHistory.entries[commandHistory.entries.length - 1] !== input) {
          commandHistory.entries.push(input);

          // Trim history if it exceeds max size
          if (commandHistory.entries.length > commandHistory.maxSize) {
            commandHistory.entries.shift();
          }
        }

        // Reset history navigation state
        commandHistory.index = -1;
        commandHistory.tempInput = '';

        const charCount = cmdInput.value.length;
        gameState.metrics.charsTyped += charCount;

        // Record for rolling WPM calculation
        recordTypingInput(charCount);

        if (!gameState.metrics.startTime && gameState.running) {
          gameState.metrics.startTime = Date.now();
        }

        // Check if tutorial is waiting for this command
        if (tutorial.paused) {
          tutorial.checkCommand(input);
        }

        const success = executeCommand(input);

        // Notify tutorial of command result
        if (tutorial.pendingCompletion) {
          tutorial.onCommandExecuted(success);
        }

        cmdInput.value = '';
        gameState.previewTargetIndex = null;  // Clear preview after submit
      } else if (tutorial.paused && tutorial.awaitingCommand === 'enter') {
        // Empty enter during tutorial
        tutorial.complete(true);
      }
    }
  });

  cmdInput.addEventListener('input', () => {
    updateTargetPreview();
  });

  document.addEventListener('click', (e) => {
    if (e.target.closest('.overlay') && (e.target.tagName === 'INPUT' || e.target.tagName === 'BUTTON')) {
      return;
    }
    cmdInput.focus();
  });

  cmdInput.addEventListener('blur', () => {
    if (gameState.running && !gameState.gameOver) {
      setTimeout(() => cmdInput.focus(), 10);
    }
  });
}

// ===========================================
// GAME LOOPS
// ===========================================

function gameTick() {
  if (!gameState.running || gameState.paused || gameState.gameOver) return;

  const dt = (CONFIG.TICK_MS / 1000) * gameState.speedMultiplier;

  updateCooldowns(dt);
  regenRam(dt);
  updateCountdown(dt);
  updateSpawning(dt);
  updateMinions(dt);
  updateTowers(dt);
  updateProjectiles(dt);
  // Note: particles are updated in renderLoop for smooth animation
  checkWaveComplete();
  updateMetrics();

  // Check tutorial triggers
  tutorial.checkTriggers();
}

let lastRenderTime = 0;

function renderLoop(timestamp) {
  // Calculate delta time for smooth particle animation (independent of game tick)
  const dt = lastRenderTime ? (timestamp - lastRenderTime) / 1000 : 0.016;
  lastRenderTime = timestamp;

  // Update particles even during pause (visual effect only)
  if (dt > 0 && dt < 0.1) {  // Sanity check
    updateParticles(dt * gameState.speedMultiplier);
  }

  drawCanvas();
  updateHUD();
  requestAnimationFrame(renderLoop);
}

// ===========================================
// CAMPAIGN SCREEN FUNCTIONS
// ===========================================

function showCampaignVictoryScreen(stats) {
  const overlay = document.getElementById('campaignVictoryOverlay');
  const currentMissionId = campaignState.activeMission.id;
  const isCampaignPlusMode = campaignState.activeCampaignMode === 'campaign_plus';

  document.getElementById('victoryMission').textContent = currentMissionId;
  document.getElementById('victoryWaves').textContent = stats.waves;
  document.getElementById('victoryBestWpm').textContent = stats.bestWpm;
  document.getElementById('victoryAccuracy').textContent = stats.accuracy + '%';
  document.getElementById('victoryTime').textContent = formatTime(stats.time);
  document.getElementById('victoryKills').textContent = stats.kills;

  // Update subtitle based on mode
  const subtitle = document.getElementById('victorySubtitle');
  if (isCampaignPlusMode) {
    subtitle.textContent = 'Campaign+ mission complete. Enhanced difficulty conquered.';
  } else {
    subtitle.textContent = 'Neural link stable. Hostiles neutralized.';
  }

  // Set up next mission button
  const nextBtn = document.getElementById('btnNextMission');
  const nextMissionId = currentMissionId + 1;

  if (nextMissionId <= MISSIONS.length && isMissionUnlocked(nextMissionId)) {
    nextBtn.style.display = '';
    nextBtn.dataset.missionId = nextMissionId;
    nextBtn.textContent = 'NEXT MISSION';
  } else if (nextMissionId > MISSIONS.length) {
    // All missions complete in this mode
    if (isCampaignPlusMode) {
      nextBtn.style.display = '';
      nextBtn.textContent = 'CAMPAIGN+ COMPLETE!';
      nextBtn.dataset.missionId = '';
    } else {
      // This shouldn't normally happen since Mission 20 triggers the special screen
      nextBtn.style.display = '';
      nextBtn.textContent = 'CAMPAIGN COMPLETE!';
      nextBtn.dataset.missionId = '';
    }
  } else {
    nextBtn.style.display = 'none';
  }

  overlay.classList.remove('hidden');
}

// Special screen shown when Campaign+ is unlocked (after completing Mission 20 in normal campaign)
function showCampaignCompleteScreen(stats) {
  const overlay = document.getElementById('campaignCompleteOverlay');

  document.getElementById('completeBestWpm').textContent = stats.bestWpm;
  document.getElementById('completeAccuracy').textContent = stats.accuracy + '%';
  document.getElementById('completeTime').textContent = formatTime(stats.time);

  overlay.classList.remove('hidden');
}

function showCampaignFailureScreen(stats) {
  const overlay = document.getElementById('campaignFailureOverlay');

  document.getElementById('failureMission').textContent = campaignState.activeMission.id;
  document.getElementById('failureWave').textContent = stats.waves;
  document.getElementById('failureBestWpm').textContent = stats.bestWpm;
  document.getElementById('failureAccuracy').textContent = stats.accuracy + '%';
  document.getElementById('failureTime').textContent = formatTime(stats.time);
  document.getElementById('failureKills').textContent = stats.kills;

  overlay.classList.remove('hidden');
}

function showTitleScreen() {
  // Update campaign progress display
  const progress = getCampaignProgress('campaign');
  document.getElementById('campaignProgress').textContent =
    `Mission ${progress.highestUnlocked} / ${progress.total}`;

  // Update Campaign+ button state
  const campaignPlusBtn = document.getElementById('btnCampaignPlus');
  const campaignPlusProgress = document.getElementById('campaignPlusProgress');

  if (isCampaignPlusUnlocked()) {
    campaignPlusBtn.classList.remove('locked');
    campaignPlusBtn.querySelector('.mode-icon').textContent = '▶+';
    const plusProgress = getCampaignProgress('campaign_plus');
    campaignPlusProgress.textContent = `Mission ${plusProgress.highestUnlocked} / ${plusProgress.total}`;
  } else {
    campaignPlusBtn.classList.add('locked');
    campaignPlusBtn.querySelector('.mode-icon').textContent = '🔒';
    campaignPlusProgress.textContent = 'Complete Campaign to unlock';
  }

  document.getElementById('titleOverlay').classList.remove('hidden');
}

function hideTitleScreen() {
  document.getElementById('titleOverlay').classList.add('hidden');
}

function showMissionSelect(mode = null) {
  // Set active mode if provided, otherwise use current
  if (mode) {
    setActiveCampaignMode(mode);
  }

  const activeMode = getActiveCampaignMode();
  const isCampaignPlus = activeMode === 'campaign_plus';

  const grid = document.getElementById('missionGrid');
  const title = document.getElementById('missionSelectTitle');
  const progress = getCampaignProgress(activeMode);

  // Update title based on mode
  if (isCampaignPlus) {
    title.textContent = 'CAMPAIGN+ MISSIONS';
    title.classList.add('campaign-plus');
    grid.classList.add('campaign-plus-mode');
  } else {
    title.textContent = 'CAMPAIGN MISSIONS';
    title.classList.remove('campaign-plus');
    grid.classList.remove('campaign-plus-mode');
  }

  document.getElementById('missionSelectProgress').textContent =
    `Progress: ${progress.completed} / ${progress.total}`;

  // Update mode tabs
  updateModeTabsState();

  // Generate mission buttons
  grid.innerHTML = '';
  MISSIONS.forEach(mission => {
    const btn = document.createElement('button');
    btn.className = 'mission-btn';

    const isUnlocked = isMissionUnlocked(mission.id, activeMode);
    const isCompleted = isMissionCompleted(mission.id, activeMode);

    // Also check if completed in the other mode (for visual reference)
    const isCompletedInOtherMode = isCampaignPlus
      ? isMissionCompleted(mission.id, 'campaign')
      : isMissionCompleted(mission.id, 'campaign_plus');

    if (!isUnlocked) btn.classList.add('locked');
    if (isCompleted) {
      btn.classList.add(isCampaignPlus ? 'completed-plus' : 'completed');
    }

    btn.innerHTML = `
      <span class="mission-btn-num">${mission.id}</span>
      <span class="mission-btn-title">${mission.title}</span>
    `;

    if (isUnlocked) {
      btn.addEventListener('click', () => {
        if (typeof playSound === 'function') playSound('ui.menuClick');
        showMissionBriefing(mission.id);
      });
    }

    grid.appendChild(btn);
  });

  document.getElementById('missionSelectOverlay').classList.remove('hidden');
}

// Update mode tabs visual state
function updateModeTabsState() {
  const activeMode = getActiveCampaignMode();
  const tabCampaign = document.getElementById('tabCampaign');
  const tabCampaignPlus = document.getElementById('tabCampaignPlus');

  // Update active state
  tabCampaign.classList.toggle('active', activeMode === 'campaign');
  tabCampaignPlus.classList.toggle('active', activeMode === 'campaign_plus');

  // Update locked state for Campaign+ tab
  if (isCampaignPlusUnlocked()) {
    tabCampaignPlus.classList.remove('locked');
    tabCampaignPlus.disabled = false;
  } else {
    tabCampaignPlus.classList.add('locked');
    tabCampaignPlus.disabled = true;
  }
}

function hideMissionSelect() {
  document.getElementById('missionSelectOverlay').classList.add('hidden');
}

function showMissionBriefing(missionId) {
  const mission = getMission(missionId);
  if (!mission) return;

  const isCampaignPlusMode = getActiveCampaignMode() === 'campaign_plus';

  // Update mission number text to show mode
  const missionNumText = isCampaignPlusMode ? `MISSION ${mission.id} (CAMPAIGN+)` : `MISSION ${mission.id}`;
  document.getElementById('briefingMissionNum').textContent = missionNumText;
  document.getElementById('briefingTitle').textContent = mission.title;
  document.getElementById('briefingDescription').textContent = mission.description;
  document.getElementById('briefingWaves').textContent = mission.waveCount;

  // Calculate difficulty (Campaign+ is always one tier harder)
  let difficulty = 'EASY';
  if (mission.id >= 16) difficulty = 'HARD';
  else if (mission.id >= 10) difficulty = 'MEDIUM';
  else if (mission.id >= 7) difficulty = 'NORMAL';

  if (isCampaignPlusMode) {
    // Bump difficulty label for Campaign+ mode
    if (difficulty === 'EASY') difficulty = 'NORMAL';
    else if (difficulty === 'NORMAL') difficulty = 'MEDIUM';
    else if (difficulty === 'MEDIUM') difficulty = 'HARD';
    else difficulty = 'EXTREME';
  }
  document.getElementById('briefingDifficulty').textContent = difficulty;

  // Show modifiers
  const modifiersContainer = document.getElementById('briefingModifiers');
  modifiersContainer.innerHTML = '';

  // Campaign+ global modifiers (shown first if in Campaign+ mode)
  if (isCampaignPlusMode) {
    addModifierTag(modifiersContainer, 'Campaign+ active', false, true);  // Special highlight
    addModifierTag(modifiersContainer, '+25% enemy HP', true);
    addModifierTag(modifiersContainer, '+20% enemy speed', true);
    addModifierTag(modifiersContainer, '+15% core damage', true);
    addModifierTag(modifiersContainer, '-15% sync restore', true);
    addModifierTag(modifiersContainer, '+20% sync cooldown', true);
    addModifierTag(modifiersContainer, '+15% rm cooldowns', true);
    addModifierTag(modifiersContainer, '+15% tower costs', true);
  }

  // Mission-specific modifiers
  const modifiers = mission.modifiers || {};
  if (modifiers.disableSync) {
    addModifierTag(modifiersContainer, 'sync disabled', true);
  }
  if (modifiers.disableForceRm) {
    addModifierTag(modifiersContainer, 'rm -f disabled', true);
  }
  if (modifiers.disableTowers) {
    addModifierTag(modifiersContainer, 'no towers', true);
  }
  if (modifiers.syncCooldownMultiplier) {
    addModifierTag(modifiersContainer, 'sync slower', true);
  }
  if (modifiers.ramMaxMultiplier && modifiers.ramMaxMultiplier < 1) {
    addModifierTag(modifiersContainer, 'reduced RAM', true);
  }
  if (modifiers.towerCostMultiplier && modifiers.towerCostMultiplier > 1) {
    addModifierTag(modifiersContainer, 'towers cost more', true);
  }
  if (modifiers.coreHpMultiplier && modifiers.coreHpMultiplier < 1) {
    addModifierTag(modifiersContainer, 'fragile core', true);
  }

  // Store selected mission for start button
  document.getElementById('btnStartMission').dataset.missionId = missionId;

  // Show next mission button only if there is a next mission
  const nextBtn = document.getElementById('btnNextMission');
  const nextMissionId = missionId + 1;
  if (nextMissionId <= MISSIONS.length && isMissionUnlocked(nextMissionId)) {
    nextBtn.style.display = '';
    nextBtn.dataset.missionId = nextMissionId;
  } else if (nextMissionId <= MISSIONS.length) {
    // Next mission exists but locked
    nextBtn.style.display = 'none';
  } else {
    // No next mission (completed campaign)
    nextBtn.style.display = 'none';
  }

  hideMissionSelect();
  document.getElementById('missionBriefingOverlay').classList.remove('hidden');
}

function hideMissionBriefing() {
  document.getElementById('missionBriefingOverlay').classList.add('hidden');
}

function addModifierTag(container, text, isNegative, isCampaignPlusIndicator = false) {
  const tag = document.createElement('span');
  if (isCampaignPlusIndicator) {
    tag.className = 'modifier-tag campaign-plus-active';
  } else {
    tag.className = 'modifier-tag' + (isNegative ? ' negative' : '');
  }
  tag.textContent = text;
  container.appendChild(tag);
}

function hideAllOverlays() {
  document.getElementById('titleOverlay').classList.add('hidden');
  document.getElementById('missionSelectOverlay').classList.add('hidden');
  document.getElementById('missionBriefingOverlay').classList.add('hidden');
  document.getElementById('gameOverlay').classList.add('hidden');
  document.getElementById('leaderboardOverlay').classList.add('hidden');
  document.getElementById('campaignVictoryOverlay').classList.add('hidden');
  document.getElementById('campaignFailureOverlay').classList.add('hidden');
  document.getElementById('campaignCompleteOverlay').classList.add('hidden');
}

// ===========================================
// INITIALIZATION
// ===========================================

function init() {
  initDOMElements();
  setupInputHandling();
  setupOverlayButtons();
  setupTitleScreenButtons();
  setupCampaignButtons();

  // Load persistent data
  loadCampaignProgress();
  tutorial.loadGlobalState();

  // Initialize audio system
  if (typeof initAudio === 'function') {
    initAudio();
  }
  if (typeof Audio !== 'undefined' && Audio.setupUI) {
    Audio.setupUI();
  }

  setInterval(gameTick, CONFIG.TICK_MS);
  requestAnimationFrame(renderLoop);

  drawCanvas();
  updateHUD();

  // Show title screen on startup
  showTitleScreen();
}

function setupOverlayButtons() {
  // Endless mode game over buttons
  document.getElementById('btnSaveScore').addEventListener('click', () => {
    if (typeof playSound === 'function') playSound('ui.menuClick');
    const name = document.getElementById('playerName').value.trim() || 'anon';
    const stats = calculateFinalStats();
    saveScore({
      name: name,
      waves: stats.waves,
      bestWpm: stats.bestWpm,
      avgWpm: stats.avgWpm,
      accuracy: stats.accuracy,
      time: stats.time,
      date: new Date().toISOString()
    });
    GameAPI.log(`Score saved for ${name}!`, 'success');
    document.getElementById('btnSaveScore').disabled = true;
    document.getElementById('btnSaveScore').textContent = 'SAVED';
  });

  document.getElementById('btnLeaderboard').addEventListener('click', () => {
    if (typeof playSound === 'function') playSound('ui.menuClick');
    document.getElementById('gameOverlay').classList.add('hidden');
    renderLeaderboard();
    document.getElementById('leaderboardOverlay').classList.remove('hidden');
  });

  document.getElementById('btnPlayAgain').addEventListener('click', () => {
    if (typeof playSound === 'function') playSound('ui.menuClick');
    document.getElementById('gameOverlay').classList.add('hidden');
    document.getElementById('btnSaveScore').disabled = false;
    document.getElementById('btnSaveScore').textContent = 'SAVE SCORE';
    GameAPI.startEndlessMode();
    cmdInput.focus();
  });

  document.getElementById('btnBackToTitle').addEventListener('click', () => {
    if (typeof playSound === 'function') playSound('ui.menuClick');
    document.getElementById('gameOverlay').classList.add('hidden');
    document.getElementById('btnSaveScore').disabled = false;
    document.getElementById('btnSaveScore').textContent = 'SAVE SCORE';
    gameState.gameOver = false;
    showTitleScreen();
  });

  document.getElementById('btnResetLeaderboard').addEventListener('click', () => {
    if (confirm('Reset all leaderboard data?')) {
      if (typeof playSound === 'function') playSound('ui.menuClick');
      resetLeaderboard();
      renderLeaderboard();
    }
  });

  document.getElementById('btnCloseLeaderboard').addEventListener('click', () => {
    if (typeof playSound === 'function') playSound('ui.menuClick');
    document.getElementById('leaderboardOverlay').classList.add('hidden');
    if (gameState.gameOver) {
      if (gameState.gameMode === 'endless') {
        document.getElementById('gameOverlay').classList.remove('hidden');
      }
    } else {
      showTitleScreen();
    }
  });
}

function setupTitleScreenButtons() {
  // Campaign button
  document.getElementById('btnCampaign').addEventListener('click', () => {
    if (typeof playSound === 'function') playSound('ui.menuClick');
    setActiveCampaignMode('campaign');
    hideTitleScreen();
    showMissionSelect('campaign');
  });

  // Campaign+ button
  document.getElementById('btnCampaignPlus').addEventListener('click', () => {
    if (!isCampaignPlusUnlocked()) {
      if (typeof playSound === 'function') playSound('cmd.error');
      return;
    }
    if (typeof playSound === 'function') playSound('ui.menuClick');
    setActiveCampaignMode('campaign_plus');
    hideTitleScreen();
    showMissionSelect('campaign_plus');
  });

  // Endless button
  document.getElementById('btnEndless').addEventListener('click', () => {
    if (typeof playSound === 'function') playSound('ui.menuClick');
    hideTitleScreen();
    GameAPI.startEndlessMode();
    cmdInput.focus();
  });

  // Leaderboard from title
  document.getElementById('btnTitleLeaderboard').addEventListener('click', () => {
    if (typeof playSound === 'function') playSound('ui.menuClick');
    hideTitleScreen();
    renderLeaderboard();
    document.getElementById('leaderboardOverlay').classList.remove('hidden');
  });

  // Replay tutorial
  document.getElementById('btnTutorialReplay').addEventListener('click', () => {
    if (typeof playSound === 'function') playSound('ui.menuClick');
    tutorial.enableReplay();
    setActiveCampaignMode('campaign');
    hideTitleScreen();

    // Start mission 1 to replay tutorial
    GameAPI.startCampaignMission(1);
    cmdInput.focus();
  });
}

function setupCampaignButtons() {
  // Mission select back button
  document.getElementById('btnMissionSelectBack').addEventListener('click', () => {
    if (typeof playSound === 'function') playSound('ui.menuClick');
    hideMissionSelect();
    showTitleScreen();
  });

  // Mode tabs in mission select
  document.getElementById('tabCampaign').addEventListener('click', () => {
    if (getActiveCampaignMode() !== 'campaign') {
      if (typeof playSound === 'function') playSound('ui.menuClick');
      showMissionSelect('campaign');
    }
  });

  document.getElementById('tabCampaignPlus').addEventListener('click', () => {
    if (!isCampaignPlusUnlocked()) return;
    if (getActiveCampaignMode() !== 'campaign_plus') {
      if (typeof playSound === 'function') playSound('ui.menuClick');
      showMissionSelect('campaign_plus');
    }
  });

  // Mission briefing back button
  document.getElementById('btnBriefingBack').addEventListener('click', () => {
    if (typeof playSound === 'function') playSound('ui.menuClick');
    hideMissionBriefing();
    showMissionSelect();
  });

  // Start mission button
  document.getElementById('btnStartMission').addEventListener('click', (e) => {
    const missionId = parseInt(e.target.dataset.missionId);
    if (missionId) {
      if (typeof playSound === 'function') playSound('ui.menuClick');
      hideMissionBriefing();
      GameAPI.startCampaignMission(missionId);
      cmdInput.focus();
    }
  });

  // Victory screen buttons
  document.getElementById('btnVictoryMissions').addEventListener('click', () => {
    if (typeof playSound === 'function') playSound('ui.menuClick');
    document.getElementById('campaignVictoryOverlay').classList.add('hidden');
    gameState.gameOver = false;
    showMissionSelect();
  });

  document.getElementById('btnNextMission').addEventListener('click', (e) => {
    if (typeof playSound === 'function') playSound('ui.menuClick');
    const nextMissionId = parseInt(e.target.dataset.missionId);
    document.getElementById('campaignVictoryOverlay').classList.add('hidden');
    gameState.gameOver = false;

    if (nextMissionId && isMissionUnlocked(nextMissionId)) {
      showMissionBriefing(nextMissionId);
    } else {
      showMissionSelect();
    }
  });

  // Failure screen buttons
  document.getElementById('btnFailureMissions').addEventListener('click', () => {
    if (typeof playSound === 'function') playSound('ui.menuClick');
    document.getElementById('campaignFailureOverlay').classList.add('hidden');
    gameState.gameOver = false;
    showMissionSelect();
  });

  document.getElementById('btnRetryMission').addEventListener('click', () => {
    if (typeof playSound === 'function') playSound('ui.menuClick');
    document.getElementById('campaignFailureOverlay').classList.add('hidden');
    gameState.gameOver = false;

    const missionId = campaignState.currentMissionId;
    if (missionId) {
      GameAPI.startCampaignMission(missionId);
      cmdInput.focus();
    }
  });

  // Campaign Complete overlay buttons (shown when Campaign+ is unlocked)
  document.getElementById('btnCompleteMenu').addEventListener('click', () => {
    if (typeof playSound === 'function') playSound('ui.menuClick');
    document.getElementById('campaignCompleteOverlay').classList.add('hidden');
    gameState.gameOver = false;
    showTitleScreen();
  });

  document.getElementById('btnStartCampaignPlus').addEventListener('click', () => {
    if (typeof playSound === 'function') playSound('ui.menuClick');
    document.getElementById('campaignCompleteOverlay').classList.add('hidden');
    gameState.gameOver = false;
    setActiveCampaignMode('campaign_plus');
    showMissionSelect('campaign_plus');
  });
}

document.addEventListener('DOMContentLoaded', init);
