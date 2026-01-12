/* ===========================================
   NEURAL THROTTLE - Campaign Mode System
   =========================================== */

// ===========================================
// CAMPAIGN STORAGE KEYS
// ===========================================
const CAMPAIGN_STORAGE_KEY = 'neural_throttle_campaign';
const TUTORIAL_COMPLETED_KEY = 'neural_throttle_tutorial_done';

// Campaign+ specific keys (separate progress from normal campaign)
const CAMPAIGN_PLUS_STORAGE_KEY = 'neural_throttle_campaign_plus';
const CAMPAIGN_PLUS_UNLOCKED_KEY = 'nt_campaign_plus_unlocked';

// ===========================================
// CAMPAIGN+ DIFFICULTY MODIFIERS
// ===========================================
// These modifiers are applied ONLY in Campaign+ mode.
// Tune these values to adjust Campaign+ difficulty.
// All multipliers relative to normal Campaign (1.0 = no change).
const CAMPAIGN_PLUS_MODIFIERS = {
  // Resource constraints
  ramRegenMultiplier: 0.85,       // sync restores 15% less RAM
  syncCooldownMultiplier: 1.20,   // sync cooldown 20% longer
  rmCooldownMultiplier: 1.15,     // rm and rm -f cooldowns 15% longer
  towerCostMultiplier: 1.15,      // towers cost 15% more

  // Enemy buffs (the main difficulty increase)
  enemyHpMultiplier: 1.25,        // enemies have 25% more HP
  enemySpeedMultiplier: 1.20,     // enemies move 20% faster
  coreDamageMultiplier: 1.15      // enemies deal 15% more damage to core
};

// ===========================================
// MISSION DEFINITIONS
// ===========================================
// Each mission is a self-contained scenario with:
// - id: Unique identifier
// - title: Display name
// - description: Short thematic description
// - waveCount: Number of waves to survive
// - waveConfig: Custom wave spawning configuration
// - modifiers: Gameplay modifiers (optional)
// - unlocks: What completing this mission unlocks (optional)

const MISSIONS = [
  // =========================================
  // MISSIONS 1-3: FUNDAMENTALS
  // Single lane, grunt-heavy, slow pacing
  // Introduce rm, rm -f, RAM usage
  // =========================================
  {
    id: 1,
    title: "BOOT SEQUENCE",
    description: "Initialize defense protocols. Learn the basics.",
    waveCount: 3,
    waveConfig: [
      { count: 4, interval: 2200, weights: { grunt: 1, swarm: 0, shielded: 0, heavy: 0 }, speedScale: 0.9 },
      { count: 5, interval: 2000, weights: { grunt: 1, swarm: 0, shielded: 0, heavy: 0 }, speedScale: 0.95 },
      { count: 6, interval: 1900, weights: { grunt: 1, swarm: 0, shielded: 0, heavy: 0 }, speedScale: 1.0 }
    ],
    modifiers: {},
    showTutorial: true
  },
  {
    id: 2,
    title: "FIRST CONTACT",
    description: "More hostiles detected. Practice your targeting.",
    waveCount: 4,
    waveConfig: [
      { count: 5, interval: 2000, weights: { grunt: 1, swarm: 0, shielded: 0, heavy: 0 }, speedScale: 0.95 },
      { count: 6, interval: 1900, weights: { grunt: 1, swarm: 0, shielded: 0, heavy: 0 }, speedScale: 1.0 },
      { count: 7, interval: 1800, weights: { grunt: 1, swarm: 0, shielded: 0, heavy: 0 }, speedScale: 1.0 },
      { count: 8, interval: 1700, weights: { grunt: 1, swarm: 0, shielded: 0, heavy: 0 }, speedScale: 1.05 }
    ],
    modifiers: {}
  },
  {
    id: 3,
    title: "RAM MANAGEMENT",
    description: "Resources are limited. Use sync wisely.",
    waveCount: 5,
    waveConfig: [
      { count: 6, interval: 1900, weights: { grunt: 1, swarm: 0, shielded: 0, heavy: 0 }, speedScale: 1.0 },
      { count: 7, interval: 1800, weights: { grunt: 1, swarm: 0, shielded: 0, heavy: 0 }, speedScale: 1.0 },
      { count: 8, interval: 1700, weights: { grunt: 1, swarm: 0, shielded: 0, heavy: 0 }, speedScale: 1.05 },
      { count: 8, interval: 1600, weights: { grunt: 1, swarm: 0, shielded: 0, heavy: 0 }, speedScale: 1.05 },
      { count: 9, interval: 1500, weights: { grunt: 1, swarm: 0, shielded: 0, heavy: 0 }, speedScale: 1.1 }
    ],
    modifiers: {
      startRam: 80  // Reduced starting RAM
    }
  },

  // =========================================
  // MISSIONS 4-6: SWARM PRESSURE
  // Swarm enemies introduced
  // Higher spawn rates, teaches prioritization
  // =========================================
  {
    id: 4,
    title: "SWARM ALERT",
    description: "Fast-moving swarm processes detected. Prioritize targets.",
    waveCount: 5,
    waveConfig: [
      { count: 6, interval: 1800, weights: { grunt: 0.7, swarm: 0.3, shielded: 0, heavy: 0 }, speedScale: 1.0 },
      { count: 8, interval: 1700, weights: { grunt: 0.6, swarm: 0.4, shielded: 0, heavy: 0 }, speedScale: 1.05 },
      { count: 9, interval: 1600, weights: { grunt: 0.5, swarm: 0.5, shielded: 0, heavy: 0 }, speedScale: 1.1 },
      { count: 10, interval: 1500, weights: { grunt: 0.4, swarm: 0.6, shielded: 0, heavy: 0 }, speedScale: 1.1 },
      { count: 11, interval: 1400, weights: { grunt: 0.3, swarm: 0.7, shielded: 0, heavy: 0 }, speedScale: 1.15 }
    ],
    modifiers: {}
  },
  {
    id: 5,
    title: "INFESTATION",
    description: "Swarm numbers increasing. Build defenses.",
    waveCount: 6,
    waveConfig: [
      { count: 8, interval: 1600, weights: { grunt: 0.5, swarm: 0.5, shielded: 0, heavy: 0 }, speedScale: 1.05 },
      { count: 10, interval: 1500, weights: { grunt: 0.4, swarm: 0.6, shielded: 0, heavy: 0 }, speedScale: 1.1 },
      { count: 11, interval: 1400, weights: { grunt: 0.3, swarm: 0.7, shielded: 0, heavy: 0 }, speedScale: 1.1 },
      { count: 12, interval: 1300, weights: { grunt: 0.3, swarm: 0.7, shielded: 0, heavy: 0 }, speedScale: 1.15 },
      { count: 13, interval: 1200, weights: { grunt: 0.2, swarm: 0.8, shielded: 0, heavy: 0 }, speedScale: 1.2 },
      { count: 14, interval: 1100, weights: { grunt: 0.2, swarm: 0.8, shielded: 0, heavy: 0 }, speedScale: 1.25 }
    ],
    modifiers: {}
  },
  {
    id: 6,
    title: "RAPID RESPONSE",
    description: "High-speed assault. Type fast or fall behind.",
    waveCount: 6,
    waveConfig: [
      { count: 10, interval: 1400, weights: { grunt: 0.3, swarm: 0.7, shielded: 0, heavy: 0 }, speedScale: 1.15 },
      { count: 12, interval: 1300, weights: { grunt: 0.25, swarm: 0.75, shielded: 0, heavy: 0 }, speedScale: 1.2 },
      { count: 13, interval: 1200, weights: { grunt: 0.2, swarm: 0.8, shielded: 0, heavy: 0 }, speedScale: 1.25 },
      { count: 14, interval: 1100, weights: { grunt: 0.2, swarm: 0.8, shielded: 0, heavy: 0 }, speedScale: 1.3 },
      { count: 15, interval: 1000, weights: { grunt: 0.15, swarm: 0.85, shielded: 0, heavy: 0 }, speedScale: 1.35 },
      { count: 16, interval: 950, weights: { grunt: 0.1, swarm: 0.9, shielded: 0, heavy: 0 }, speedScale: 1.4 }
    ],
    modifiers: {}
  },

  // =========================================
  // MISSIONS 7-9: SHIELDED & TANKY ENEMIES
  // Shielded enemies appear
  // rm -f becomes important, RAM management
  // =========================================
  {
    id: 7,
    title: "ARMOR PLATING",
    description: "Shielded hostiles detected. Use rm -f for heavy damage.",
    waveCount: 5,
    waveConfig: [
      { count: 6, interval: 1800, weights: { grunt: 0.6, swarm: 0.2, shielded: 0.2, heavy: 0 }, speedScale: 1.0 },
      { count: 8, interval: 1700, weights: { grunt: 0.5, swarm: 0.25, shielded: 0.25, heavy: 0 }, speedScale: 1.05 },
      { count: 9, interval: 1600, weights: { grunt: 0.4, swarm: 0.3, shielded: 0.3, heavy: 0 }, speedScale: 1.1 },
      { count: 10, interval: 1500, weights: { grunt: 0.35, swarm: 0.3, shielded: 0.35, heavy: 0 }, speedScale: 1.15 },
      { count: 11, interval: 1400, weights: { grunt: 0.3, swarm: 0.3, shielded: 0.4, heavy: 0 }, speedScale: 1.2 }
    ],
    modifiers: {}
  },
  {
    id: 8,
    title: "HEAVY BREACH",
    description: "Heavy processes approaching. Towers can't stop them.",
    waveCount: 6,
    waveConfig: [
      { count: 5, interval: 2000, weights: { grunt: 0.6, swarm: 0.25, shielded: 0.1, heavy: 0.05 }, speedScale: 0.95 },
      { count: 6, interval: 1900, weights: { grunt: 0.5, swarm: 0.3, shielded: 0.1, heavy: 0.1 }, speedScale: 1.0 },
      { count: 7, interval: 1800, weights: { grunt: 0.45, swarm: 0.3, shielded: 0.15, heavy: 0.1 }, speedScale: 1.05 },
      { count: 8, interval: 1700, weights: { grunt: 0.4, swarm: 0.3, shielded: 0.15, heavy: 0.15 }, speedScale: 1.1 },
      { count: 9, interval: 1600, weights: { grunt: 0.35, swarm: 0.3, shielded: 0.15, heavy: 0.2 }, speedScale: 1.12 },
      { count: 10, interval: 1500, weights: { grunt: 0.3, swarm: 0.3, shielded: 0.2, heavy: 0.2 }, speedScale: 1.15 }
    ],
    modifiers: {
      startMoney: 90  // Extra starting money to build towers early
    }
  },
  {
    id: 9,
    title: "MIXED ASSAULT",
    description: "All enemy types confirmed. Adapt your strategy.",
    waveCount: 6,
    waveConfig: [
      { count: 6, interval: 1800, weights: { grunt: 0.45, swarm: 0.3, shielded: 0.15, heavy: 0.1 }, speedScale: 1.0 },
      { count: 7, interval: 1700, weights: { grunt: 0.4, swarm: 0.3, shielded: 0.15, heavy: 0.15 }, speedScale: 1.05 },
      { count: 8, interval: 1600, weights: { grunt: 0.35, swarm: 0.3, shielded: 0.2, heavy: 0.15 }, speedScale: 1.1 },
      { count: 9, interval: 1550, weights: { grunt: 0.3, swarm: 0.3, shielded: 0.2, heavy: 0.2 }, speedScale: 1.12 },
      { count: 10, interval: 1500, weights: { grunt: 0.3, swarm: 0.3, shielded: 0.2, heavy: 0.2 }, speedScale: 1.15 },
      { count: 11, interval: 1450, weights: { grunt: 0.25, swarm: 0.3, shielded: 0.25, heavy: 0.2 }, speedScale: 1.18 }
    ],
    modifiers: {
      startMoney: 85  // Help get first tower faster
    }
  },

  // =========================================
  // MISSIONS 10-12: RESOURCE STRESS
  // Reduced RAM regen, sync cooldown increased
  // Encourages efficiency and restraint
  // =========================================
  {
    id: 10,
    title: "POWER DRAIN",
    description: "System resources depleted. Sync cooldown extended.",
    waveCount: 6,
    waveConfig: [
      { count: 6, interval: 1800, weights: { grunt: 0.45, swarm: 0.35, shielded: 0.15, heavy: 0.05 }, speedScale: 1.0 },
      { count: 7, interval: 1700, weights: { grunt: 0.4, swarm: 0.35, shielded: 0.15, heavy: 0.1 }, speedScale: 1.05 },
      { count: 8, interval: 1600, weights: { grunt: 0.35, swarm: 0.35, shielded: 0.2, heavy: 0.1 }, speedScale: 1.1 },
      { count: 9, interval: 1550, weights: { grunt: 0.3, swarm: 0.35, shielded: 0.2, heavy: 0.15 }, speedScale: 1.12 },
      { count: 10, interval: 1500, weights: { grunt: 0.3, swarm: 0.35, shielded: 0.2, heavy: 0.15 }, speedScale: 1.15 },
      { count: 11, interval: 1450, weights: { grunt: 0.25, swarm: 0.35, shielded: 0.2, heavy: 0.2 }, speedScale: 1.18 }
    ],
    modifiers: {
      syncCooldownMultiplier: 1.15,  // Reduced from 1.4 - Campaign+ already adds +20%
      startMoney: 100  // More starting money to help get towers up
    }
  },
  {
    id: 11,
    title: "EFFICIENCY TEST",
    description: "Limited RAM reserves. Make every command count.",
    waveCount: 6,
    waveConfig: [
      { count: 6, interval: 1750, weights: { grunt: 0.4, swarm: 0.35, shielded: 0.15, heavy: 0.1 }, speedScale: 1.0 },
      { count: 7, interval: 1650, weights: { grunt: 0.35, swarm: 0.35, shielded: 0.2, heavy: 0.1 }, speedScale: 1.05 },
      { count: 8, interval: 1550, weights: { grunt: 0.3, swarm: 0.35, shielded: 0.2, heavy: 0.15 }, speedScale: 1.1 },
      { count: 9, interval: 1500, weights: { grunt: 0.3, swarm: 0.35, shielded: 0.2, heavy: 0.15 }, speedScale: 1.12 },
      { count: 10, interval: 1450, weights: { grunt: 0.25, swarm: 0.35, shielded: 0.2, heavy: 0.2 }, speedScale: 1.15 },
      { count: 11, interval: 1400, weights: { grunt: 0.25, swarm: 0.3, shielded: 0.25, heavy: 0.2 }, speedScale: 1.18 }
    ],
    modifiers: {
      ramMaxMultiplier: 0.9,  // 115 MB instead of 128 - less punishing with Campaign+
      startMoney: 100  // More starting money for towers
    }
  },
  {
    id: 12,
    title: "CONSERVATION",
    description: "Critical resource shortage. Rely on towers.",
    waveCount: 6,
    waveConfig: [
      { count: 7, interval: 1700, weights: { grunt: 0.4, swarm: 0.4, shielded: 0.15, heavy: 0.05 }, speedScale: 1.0 },
      { count: 8, interval: 1600, weights: { grunt: 0.35, swarm: 0.4, shielded: 0.15, heavy: 0.1 }, speedScale: 1.05 },
      { count: 9, interval: 1550, weights: { grunt: 0.3, swarm: 0.4, shielded: 0.2, heavy: 0.1 }, speedScale: 1.1 },
      { count: 10, interval: 1500, weights: { grunt: 0.3, swarm: 0.4, shielded: 0.2, heavy: 0.1 }, speedScale: 1.12 },
      { count: 11, interval: 1450, weights: { grunt: 0.25, swarm: 0.4, shielded: 0.2, heavy: 0.15 }, speedScale: 1.15 },
      { count: 12, interval: 1400, weights: { grunt: 0.25, swarm: 0.35, shielded: 0.25, heavy: 0.15 }, speedScale: 1.18 }
    ],
    modifiers: {
      ramMaxMultiplier: 0.9,  // Less punishing RAM cap
      startMoney: 120  // Extra starting money for towers
    }
  },

  // =========================================
  // MISSIONS 13-15: ECONOMY & TOWERS
  // Higher tower costs, limited early money
  // Focus on timing tower placement vs manual kills
  // =========================================
  {
    id: 13,
    title: "BUDGET CUTS",
    description: "Funding reduced. Towers cost more.",
    waveCount: 6,
    waveConfig: [
      { count: 6, interval: 1800, weights: { grunt: 0.45, swarm: 0.35, shielded: 0.15, heavy: 0.05 }, speedScale: 1.0 },
      { count: 7, interval: 1700, weights: { grunt: 0.4, swarm: 0.35, shielded: 0.15, heavy: 0.1 }, speedScale: 1.05 },
      { count: 8, interval: 1600, weights: { grunt: 0.35, swarm: 0.35, shielded: 0.2, heavy: 0.1 }, speedScale: 1.1 },
      { count: 9, interval: 1550, weights: { grunt: 0.35, swarm: 0.35, shielded: 0.2, heavy: 0.1 }, speedScale: 1.12 },
      { count: 10, interval: 1500, weights: { grunt: 0.3, swarm: 0.35, shielded: 0.2, heavy: 0.15 }, speedScale: 1.15 },
      { count: 11, interval: 1450, weights: { grunt: 0.3, swarm: 0.35, shielded: 0.2, heavy: 0.15 }, speedScale: 1.18 }
    ],
    modifiers: {
      towerCostMultiplier: 1.15,  // Reduced from 1.3 - Campaign+ already adds +15%
      startMoney: 95  // More starting money to offset
    }
  },
  {
    id: 14,
    title: "MANUAL OVERRIDE",
    description: "Tower grid offline. Rely on manual commands.",
    waveCount: 5,
    waveConfig: [
      { count: 5, interval: 2000, weights: { grunt: 0.55, swarm: 0.35, shielded: 0.08, heavy: 0.02 }, speedScale: 0.92 },
      { count: 5, interval: 1900, weights: { grunt: 0.5, swarm: 0.35, shielded: 0.12, heavy: 0.03 }, speedScale: 0.95 },
      { count: 6, interval: 1800, weights: { grunt: 0.45, swarm: 0.35, shielded: 0.15, heavy: 0.05 }, speedScale: 1.0 },
      { count: 7, interval: 1700, weights: { grunt: 0.4, swarm: 0.35, shielded: 0.17, heavy: 0.08 }, speedScale: 1.05 },
      { count: 7, interval: 1650, weights: { grunt: 0.4, swarm: 0.35, shielded: 0.18, heavy: 0.07 }, speedScale: 1.08 }
    ],
    modifiers: {
      disableTowers: true,
      startRam: 128,  // Full RAM since no towers to help
      waveClearRamBonus: 55  // Extra RAM on wave clear to compensate for no towers
    }
  },
  {
    id: 15,
    title: "STRATEGIC RESERVE",
    description: "Build wisely. Every credit counts.",
    waveCount: 6,
    waveConfig: [
      { count: 7, interval: 1700, weights: { grunt: 0.4, swarm: 0.35, shielded: 0.15, heavy: 0.1 }, speedScale: 1.0 },
      { count: 8, interval: 1600, weights: { grunt: 0.35, swarm: 0.35, shielded: 0.2, heavy: 0.1 }, speedScale: 1.05 },
      { count: 9, interval: 1550, weights: { grunt: 0.35, swarm: 0.35, shielded: 0.2, heavy: 0.1 }, speedScale: 1.1 },
      { count: 10, interval: 1500, weights: { grunt: 0.3, swarm: 0.35, shielded: 0.2, heavy: 0.15 }, speedScale: 1.12 },
      { count: 11, interval: 1450, weights: { grunt: 0.3, swarm: 0.35, shielded: 0.2, heavy: 0.15 }, speedScale: 1.15 },
      { count: 12, interval: 1400, weights: { grunt: 0.25, swarm: 0.35, shielded: 0.25, heavy: 0.15 }, speedScale: 1.18 }
    ],
    modifiers: {
      // Removed towerCostMultiplier - Campaign+ already adds +15%
      moneyBonusMultiplier: 0.9,  // Only 10% less money (was 15%)
      startMoney: 95  // More starting money
    }
  },

  // =========================================
  // MISSIONS 16-18: CONSTRAINT MISSIONS
  // Challenge missions with specific restrictions
  // =========================================
  {
    id: 16,
    title: "SYNC FAILURE",
    description: "Sync command unavailable. Manage RAM carefully.",
    waveCount: 5,
    waveConfig: [
      // Reduced heavies significantly - they're tower-immune and drain RAM fast without sync
      { count: 5, interval: 2000, weights: { grunt: 0.55, swarm: 0.35, shielded: 0.1, heavy: 0 }, speedScale: 0.92 },
      { count: 5, interval: 1900, weights: { grunt: 0.52, swarm: 0.35, shielded: 0.13, heavy: 0 }, speedScale: 0.95 },
      { count: 6, interval: 1800, weights: { grunt: 0.50, swarm: 0.35, shielded: 0.12, heavy: 0.03 }, speedScale: 1.0 },
      { count: 6, interval: 1750, weights: { grunt: 0.47, swarm: 0.35, shielded: 0.13, heavy: 0.05 }, speedScale: 1.03 },
      { count: 7, interval: 1700, weights: { grunt: 0.45, swarm: 0.35, shielded: 0.15, heavy: 0.05 }, speedScale: 1.05 }
    ],
    modifiers: {
      disableSync: true,
      startRam: 128,  // Full RAM to start
      waveClearRamBonus: 80,  // More RAM on wave clear - only source of RAM!
      startMoney: 110  // Help get towers faster to conserve RAM
    }
  },
  {
    id: 17,
    title: "LIGHT ARMS ONLY",
    description: "rm -f offline. Standard attacks only.",
    waveCount: 6,
    waveConfig: [
      { count: 6, interval: 1800, weights: { grunt: 0.55, swarm: 0.35, shielded: 0.08, heavy: 0.02 }, speedScale: 0.95 },
      { count: 7, interval: 1700, weights: { grunt: 0.5, swarm: 0.35, shielded: 0.1, heavy: 0.05 }, speedScale: 1.0 },
      { count: 8, interval: 1600, weights: { grunt: 0.45, swarm: 0.35, shielded: 0.12, heavy: 0.08 }, speedScale: 1.05 },
      { count: 9, interval: 1550, weights: { grunt: 0.4, swarm: 0.35, shielded: 0.15, heavy: 0.1 }, speedScale: 1.1 },
      { count: 10, interval: 1500, weights: { grunt: 0.4, swarm: 0.35, shielded: 0.15, heavy: 0.1 }, speedScale: 1.12 },
      { count: 11, interval: 1450, weights: { grunt: 0.35, swarm: 0.35, shielded: 0.18, heavy: 0.12 }, speedScale: 1.15 }
    ],
    modifiers: {
      disableForceRm: true,
      rmDamageMultiplier: 1.5,  // Bigger buff to compensate for Campaign+ rm cooldowns
      startMoney: 100
    }
  },
  {
    id: 18,
    title: "FRAGILE CORE",
    description: "Core integrity compromised. Don't let anything through.",
    waveCount: 6,
    waveConfig: [
      { count: 6, interval: 1800, weights: { grunt: 0.4, swarm: 0.4, shielded: 0.15, heavy: 0.05 }, speedScale: 1.0 },
      { count: 7, interval: 1700, weights: { grunt: 0.35, swarm: 0.4, shielded: 0.15, heavy: 0.1 }, speedScale: 1.05 },
      { count: 8, interval: 1600, weights: { grunt: 0.35, swarm: 0.4, shielded: 0.15, heavy: 0.1 }, speedScale: 1.1 },
      { count: 9, interval: 1550, weights: { grunt: 0.3, swarm: 0.4, shielded: 0.2, heavy: 0.1 }, speedScale: 1.12 },
      { count: 10, interval: 1500, weights: { grunt: 0.3, swarm: 0.4, shielded: 0.2, heavy: 0.1 }, speedScale: 1.15 },
      { count: 11, interval: 1450, weights: { grunt: 0.25, swarm: 0.4, shielded: 0.2, heavy: 0.15 }, speedScale: 1.18 }
    ],
    modifiers: {
      coreHpMultiplier: 0.8,  // 96 HP - less punishing with Campaign+'s +15% core damage
      startMoney: 100
    }
  },

  // =========================================
  // MISSIONS 19-20: FINAL TEST
  // Longest missions, mixed enemies, fast pacing
  // Designed as a climax, challenging but beatable
  // =========================================
  {
    id: 19,
    title: "SURGE PROTOCOL",
    description: "Massive assault incoming. Prove your worth.",
    waveCount: 7,
    waveConfig: [
      // Smoother ramp from mission 18, reduced heavies for Campaign+
      { count: 7, interval: 1750, weights: { grunt: 0.4, swarm: 0.35, shielded: 0.18, heavy: 0.07 }, speedScale: 1.0 },
      { count: 8, interval: 1700, weights: { grunt: 0.38, swarm: 0.35, shielded: 0.18, heavy: 0.09 }, speedScale: 1.03 },
      { count: 9, interval: 1650, weights: { grunt: 0.35, swarm: 0.35, shielded: 0.2, heavy: 0.1 }, speedScale: 1.06 },
      { count: 10, interval: 1600, weights: { grunt: 0.33, swarm: 0.35, shielded: 0.2, heavy: 0.12 }, speedScale: 1.09 },
      { count: 10, interval: 1550, weights: { grunt: 0.3, swarm: 0.35, shielded: 0.22, heavy: 0.13 }, speedScale: 1.12 },
      { count: 11, interval: 1500, weights: { grunt: 0.28, swarm: 0.35, shielded: 0.22, heavy: 0.15 }, speedScale: 1.15 },
      { count: 12, interval: 1450, weights: { grunt: 0.25, swarm: 0.35, shielded: 0.25, heavy: 0.15 }, speedScale: 1.18 }
    ],
    modifiers: {
      startMoney: 115,  // More starting money for Campaign+
      startRam: 128
    }
  },
  {
    id: 20,
    title: "NEURAL CORE",
    description: "Final defense. The system depends on you.",
    waveCount: 7,
    waveConfig: [
      // Final mission - reduced for Campaign+ balance (enemies are +25% HP, +20% speed)
      { count: 7, interval: 1750, weights: { grunt: 0.4, swarm: 0.38, shielded: 0.17, heavy: 0.05 }, speedScale: 1.0 },
      { count: 8, interval: 1700, weights: { grunt: 0.38, swarm: 0.37, shielded: 0.18, heavy: 0.07 }, speedScale: 1.03 },
      { count: 9, interval: 1650, weights: { grunt: 0.35, swarm: 0.37, shielded: 0.19, heavy: 0.09 }, speedScale: 1.06 },
      { count: 9, interval: 1600, weights: { grunt: 0.33, swarm: 0.36, shielded: 0.2, heavy: 0.11 }, speedScale: 1.09 },
      { count: 10, interval: 1550, weights: { grunt: 0.3, swarm: 0.36, shielded: 0.21, heavy: 0.13 }, speedScale: 1.12 },
      { count: 11, interval: 1500, weights: { grunt: 0.28, swarm: 0.35, shielded: 0.22, heavy: 0.15 }, speedScale: 1.15 },
      { count: 11, interval: 1475, weights: { grunt: 0.25, swarm: 0.35, shielded: 0.25, heavy: 0.15 }, speedScale: 1.18 }
    ],
    modifiers: {
      startMoney: 125,  // More starting money for the finale
      startRam: 128
    }
  }
];

// ===========================================
// CAMPAIGN STATE
// ===========================================
const campaignState = {
  unlockedMissions: [1],  // Start with mission 1 unlocked
  completedMissions: [],
  currentMissionId: null,

  // Active mission state
  activeMission: null,
  activeWaveIndex: 0,  // 0-based index into waveConfig
  missionComplete: false,
  missionFailed: false,

  // Campaign+ state (tracked separately from normal campaign)
  campaignPlusUnlocked: false,
  campaignPlusUnlockedMissions: [1],
  campaignPlusCompletedMissions: [],

  // Current mode: "campaign" or "campaign_plus"
  activeCampaignMode: 'campaign'
};

// ===========================================
// CAMPAIGN PERSISTENCE
// ===========================================

/**
 * Load campaign progress from localStorage
 */
function loadCampaignProgress() {
  try {
    // Load normal campaign progress
    const data = localStorage.getItem(CAMPAIGN_STORAGE_KEY);
    if (data) {
      const saved = JSON.parse(data);
      campaignState.unlockedMissions = saved.unlockedMissions || [1];
      campaignState.completedMissions = saved.completedMissions || [];
    }

    // Load Campaign+ progress
    const plusData = localStorage.getItem(CAMPAIGN_PLUS_STORAGE_KEY);
    if (plusData) {
      const savedPlus = JSON.parse(plusData);
      campaignState.campaignPlusUnlockedMissions = savedPlus.unlockedMissions || [1];
      campaignState.campaignPlusCompletedMissions = savedPlus.completedMissions || [];
    }

    // Load Campaign+ unlock status
    campaignState.campaignPlusUnlocked = localStorage.getItem(CAMPAIGN_PLUS_UNLOCKED_KEY) === 'true';

    // BACKWARDS COMPATIBILITY: If mission 20 was completed in normal campaign
    // but Campaign+ wasn't unlocked yet, auto-unlock it
    if (!campaignState.campaignPlusUnlocked && campaignState.completedMissions.includes(20)) {
      unlockCampaignPlus();
    }
  } catch (e) {
    console.error('Failed to load campaign progress:', e);
  }
}

/**
 * Save campaign progress to localStorage
 */
function saveCampaignProgress() {
  try {
    // Save normal campaign progress
    const data = {
      unlockedMissions: campaignState.unlockedMissions,
      completedMissions: campaignState.completedMissions
    };
    localStorage.setItem(CAMPAIGN_STORAGE_KEY, JSON.stringify(data));

    // Save Campaign+ progress
    const plusData = {
      unlockedMissions: campaignState.campaignPlusUnlockedMissions,
      completedMissions: campaignState.campaignPlusCompletedMissions
    };
    localStorage.setItem(CAMPAIGN_PLUS_STORAGE_KEY, JSON.stringify(plusData));

    // Save Campaign+ unlock status
    if (campaignState.campaignPlusUnlocked) {
      localStorage.setItem(CAMPAIGN_PLUS_UNLOCKED_KEY, 'true');
    }
  } catch (e) {
    console.error('Failed to save campaign progress:', e);
  }
}

/**
 * Unlock Campaign+ mode (called when Mission 20 is completed)
 * Also marks tutorial as completed since the player has proven they know the game
 */
function unlockCampaignPlus() {
  campaignState.campaignPlusUnlocked = true;
  localStorage.setItem(CAMPAIGN_PLUS_UNLOCKED_KEY, 'true');

  // Mark tutorial as completed - if you beat the campaign, you know how to play
  markTutorialCompleted();
}

/**
 * Check if Campaign+ is unlocked
 */
function isCampaignPlusUnlocked() {
  return campaignState.campaignPlusUnlocked;
}

/**
 * Set the active campaign mode (campaign or campaign_plus)
 */
function setActiveCampaignMode(mode) {
  campaignState.activeCampaignMode = mode;
}

/**
 * Get the active campaign mode
 */
function getActiveCampaignMode() {
  return campaignState.activeCampaignMode;
}

/**
 * Check if tutorial has been completed
 */
function isTutorialCompleted() {
  try {
    return localStorage.getItem(TUTORIAL_COMPLETED_KEY) === 'true';
  } catch (e) {
    return false;
  }
}

/**
 * Mark tutorial as completed
 */
function markTutorialCompleted() {
  try {
    localStorage.setItem(TUTORIAL_COMPLETED_KEY, 'true');
  } catch (e) {
    console.error('Failed to save tutorial state:', e);
  }
}

/**
 * Reset tutorial completion state (for replay)
 */
function resetTutorialCompletion() {
  try {
    localStorage.removeItem(TUTORIAL_COMPLETED_KEY);
  } catch (e) {
    console.error('Failed to reset tutorial state:', e);
  }
}

// ===========================================
// MISSION MANAGEMENT
// ===========================================

/**
 * Get a mission by ID
 */
function getMission(id) {
  return MISSIONS.find(m => m.id === id);
}

/**
 * Check if a mission is unlocked (respects active campaign mode)
 */
function isMissionUnlocked(id, mode = null) {
  const activeMode = mode || campaignState.activeCampaignMode;
  if (activeMode === 'campaign_plus') {
    return campaignState.campaignPlusUnlockedMissions.includes(id);
  }
  return campaignState.unlockedMissions.includes(id);
}

/**
 * Check if a mission is completed (respects active campaign mode)
 */
function isMissionCompleted(id, mode = null) {
  const activeMode = mode || campaignState.activeCampaignMode;
  if (activeMode === 'campaign_plus') {
    return campaignState.campaignPlusCompletedMissions.includes(id);
  }
  return campaignState.completedMissions.includes(id);
}

/**
 * Get current mission progress for display (respects active campaign mode)
 */
function getCampaignProgress(mode = null) {
  const activeMode = mode || campaignState.activeCampaignMode;

  if (activeMode === 'campaign_plus') {
    const completed = campaignState.campaignPlusCompletedMissions.length;
    const total = MISSIONS.length;
    const highestUnlocked = Math.max(...campaignState.campaignPlusUnlockedMissions);
    return {
      completed,
      total,
      highestUnlocked,
      percentage: Math.round((completed / total) * 100),
      mode: 'campaign_plus'
    };
  }

  const completed = campaignState.completedMissions.length;
  const total = MISSIONS.length;
  const highestUnlocked = Math.max(...campaignState.unlockedMissions);
  return {
    completed,
    total,
    highestUnlocked,
    percentage: Math.round((completed / total) * 100),
    mode: 'campaign'
  };
}

/**
 * Start a campaign mission
 */
function startMission(missionId) {
  const mission = getMission(missionId);
  if (!mission) {
    console.error('Mission not found:', missionId);
    return false;
  }

  if (!isMissionUnlocked(missionId)) {
    console.error('Mission not unlocked:', missionId);
    return false;
  }

  campaignState.currentMissionId = missionId;
  campaignState.activeMission = mission;
  campaignState.activeWaveIndex = 0;
  campaignState.missionComplete = false;
  campaignState.missionFailed = false;

  return true;
}

/**
 * Get the wave definition for the current campaign wave
 */
function getCampaignWaveDefinition(waveIndex) {
  const mission = campaignState.activeMission;
  if (!mission || !mission.waveConfig) return null;

  // waveIndex is 1-based in game, convert to 0-based
  const idx = waveIndex - 1;
  if (idx < 0 || idx >= mission.waveConfig.length) return null;

  return mission.waveConfig[idx];
}

/**
 * Check if current wave is the last wave of the mission
 */
function isLastMissionWave(waveIndex) {
  const mission = campaignState.activeMission;
  if (!mission) return false;
  return waveIndex >= mission.waveCount;
}

/**
 * Complete the current mission successfully
 * Returns true if this completion unlocks Campaign+
 */
function completeMission() {
  const mission = campaignState.activeMission;
  if (!mission) return false;

  campaignState.missionComplete = true;
  let justUnlockedCampaignPlus = false;

  // Check if we're in Campaign+ mode
  if (campaignState.activeCampaignMode === 'campaign_plus') {
    // Mark as completed in Campaign+ progress
    if (!campaignState.campaignPlusCompletedMissions.includes(mission.id)) {
      campaignState.campaignPlusCompletedMissions.push(mission.id);
    }

    // Unlock next mission in Campaign+
    const nextMissionId = mission.id + 1;
    if (nextMissionId <= MISSIONS.length && !campaignState.campaignPlusUnlockedMissions.includes(nextMissionId)) {
      campaignState.campaignPlusUnlockedMissions.push(nextMissionId);
    }
  } else {
    // Normal Campaign mode
    // Mark as completed if not already
    if (!campaignState.completedMissions.includes(mission.id)) {
      campaignState.completedMissions.push(mission.id);
    }

    // Unlock next mission
    const nextMissionId = mission.id + 1;
    if (nextMissionId <= MISSIONS.length && !campaignState.unlockedMissions.includes(nextMissionId)) {
      campaignState.unlockedMissions.push(nextMissionId);
    }

    // Check if this unlocks Campaign+ (Mission 20 completed in normal campaign)
    if (mission.id === 20 && !campaignState.campaignPlusUnlocked) {
      unlockCampaignPlus();
      justUnlockedCampaignPlus = true;
    }
  }

  saveCampaignProgress();
  return justUnlockedCampaignPlus;
}

/**
 * Mark mission as failed
 */
function failMission() {
  campaignState.missionFailed = true;
  // Note: We don't reset progress on failure
}

/**
 * Get active mission modifiers
 */
function getActiveMissionModifiers() {
  return campaignState.activeMission?.modifiers || {};
}

/**
 * Apply mission modifiers to CONFIG values
 * Returns an object with the modified values
 * In Campaign+ mode, also applies the global Campaign+ difficulty modifiers
 */
function applyMissionModifiers(baseConfig) {
  const modifiers = getActiveMissionModifiers();
  const modified = { ...baseConfig };

  // =========================================
  // CAMPAIGN+ GLOBAL MODIFIERS (applied first)
  // These stack with mission-specific modifiers
  // =========================================
  if (campaignState.activeCampaignMode === 'campaign_plus') {
    // Sync restore reduced (RAM regen multiplier)
    modified.SYNC_RESTORE = Math.floor(baseConfig.SYNC_RESTORE * CAMPAIGN_PLUS_MODIFIERS.ramRegenMultiplier);

    // Sync cooldown increased
    modified.SYNC_COOLDOWN = baseConfig.SYNC_COOLDOWN * CAMPAIGN_PLUS_MODIFIERS.syncCooldownMultiplier;

    // rm and rm -f cooldowns increased
    modified.RM_COOLDOWN = baseConfig.RM_COOLDOWN * CAMPAIGN_PLUS_MODIFIERS.rmCooldownMultiplier;
    modified.RM_FORCE_COOLDOWN = baseConfig.RM_FORCE_COOLDOWN * CAMPAIGN_PLUS_MODIFIERS.rmCooldownMultiplier;

    // Tower costs increased
    modified.TOWER_BASE_COST = Math.floor(baseConfig.TOWER_BASE_COST * CAMPAIGN_PLUS_MODIFIERS.towerCostMultiplier);

    // Enemy buffs - these make the real difference
    modified.ENEMY_HP_MULTIPLIER = CAMPAIGN_PLUS_MODIFIERS.enemyHpMultiplier;
    modified.ENEMY_SPEED_MULTIPLIER = CAMPAIGN_PLUS_MODIFIERS.enemySpeedMultiplier;

    // Core takes more damage
    modified.CORE_DAMAGE_MULTIPLIER = CAMPAIGN_PLUS_MODIFIERS.coreDamageMultiplier;
  }

  // =========================================
  // MISSION-SPECIFIC MODIFIERS (stacked on top)
  // =========================================

  // RAM modifiers
  if (modifiers.ramMaxMultiplier) {
    modified.RAM_MAX = Math.floor(baseConfig.RAM_MAX * modifiers.ramMaxMultiplier);
  }
  if (modifiers.startRam !== undefined) {
    modified.START_RAM = modifiers.startRam;
  }

  // Sync modifiers (multiplicative with Campaign+ if applicable)
  if (modifiers.syncCooldownMultiplier) {
    const baseCooldown = modified.SYNC_COOLDOWN || baseConfig.SYNC_COOLDOWN;
    modified.SYNC_COOLDOWN = baseCooldown * modifiers.syncCooldownMultiplier;
  }
  if (modifiers.syncRestoreMultiplier) {
    const baseRestore = modified.SYNC_RESTORE || baseConfig.SYNC_RESTORE;
    modified.SYNC_RESTORE = Math.floor(baseRestore * modifiers.syncRestoreMultiplier);
  }
  if (modifiers.disableSync) {
    modified.DISABLE_SYNC = true;
  }

  // Attack modifiers
  if (modifiers.disableForceRm) {
    modified.DISABLE_FORCE_RM = true;
  }
  if (modifiers.rmDamageMultiplier) {
    modified.RM_DAMAGE = Math.floor(baseConfig.RM_DAMAGE * modifiers.rmDamageMultiplier);
  }

  // Tower modifiers (multiplicative with Campaign+ if applicable)
  if (modifiers.towerCostMultiplier) {
    const baseCost = modified.TOWER_BASE_COST || baseConfig.TOWER_BASE_COST;
    modified.TOWER_BASE_COST = Math.floor(baseCost * modifiers.towerCostMultiplier);
  }
  if (modifiers.disableTowers) {
    modified.DISABLE_TOWERS = true;
  }

  // Core modifiers (multiplicative with Campaign+ if applicable)
  if (modifiers.coreHpMultiplier) {
    modified.CORE_HP_MAX = Math.floor(baseConfig.CORE_HP_MAX * modifiers.coreHpMultiplier);
  }
  if (modifiers.coreDamageMultiplier) {
    const baseDmgMult = modified.CORE_DAMAGE_MULTIPLIER || 1;
    modified.CORE_DAMAGE_MULTIPLIER = baseDmgMult * modifiers.coreDamageMultiplier;
  }

  // Money modifiers
  if (modifiers.startMoney !== undefined) {
    modified.START_MONEY = modifiers.startMoney;
  }
  if (modifiers.moneyBonusMultiplier) {
    modified.MONEY_BONUS_MULTIPLIER = modifiers.moneyBonusMultiplier;
  }

  // Wave clear RAM bonus
  if (modifiers.waveClearRamBonus !== undefined) {
    modified.WAVE_CLEAR_RAM_BONUS = modifiers.waveClearRamBonus;
  }

  return modified;
}

/**
 * Reset campaign progress (for testing or user request)
 */
function resetCampaignProgress() {
  campaignState.unlockedMissions = [1];
  campaignState.completedMissions = [];
  campaignState.currentMissionId = null;
  campaignState.activeMission = null;
  campaignState.activeWaveIndex = 0;
  campaignState.missionComplete = false;
  campaignState.missionFailed = false;
  saveCampaignProgress();
}

// ===========================================
// EXPORTS
// ===========================================
window.MISSIONS = MISSIONS;
window.campaignState = campaignState;
window.CAMPAIGN_PLUS_MODIFIERS = CAMPAIGN_PLUS_MODIFIERS;
window.loadCampaignProgress = loadCampaignProgress;
window.saveCampaignProgress = saveCampaignProgress;
window.isTutorialCompleted = isTutorialCompleted;
window.markTutorialCompleted = markTutorialCompleted;
window.resetTutorialCompletion = resetTutorialCompletion;
window.getMission = getMission;
window.isMissionUnlocked = isMissionUnlocked;
window.isMissionCompleted = isMissionCompleted;
window.getCampaignProgress = getCampaignProgress;
window.startMission = startMission;
window.getCampaignWaveDefinition = getCampaignWaveDefinition;
window.isLastMissionWave = isLastMissionWave;
window.completeMission = completeMission;
window.failMission = failMission;
window.getActiveMissionModifiers = getActiveMissionModifiers;
window.applyMissionModifiers = applyMissionModifiers;
window.resetCampaignProgress = resetCampaignProgress;
// Campaign+ exports
window.unlockCampaignPlus = unlockCampaignPlus;
window.isCampaignPlusUnlocked = isCampaignPlusUnlocked;
window.setActiveCampaignMode = setActiveCampaignMode;
window.getActiveCampaignMode = getActiveCampaignMode;
