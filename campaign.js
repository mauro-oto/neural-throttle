/* ===========================================
   NEURAL THROTTLE - Campaign Mode System
   =========================================== */

// ===========================================
// CAMPAIGN STORAGE KEYS
// ===========================================
const CAMPAIGN_STORAGE_KEY = 'neural_throttle_campaign';
const TUTORIAL_COMPLETED_KEY = 'neural_throttle_tutorial_done';

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
      syncCooldownMultiplier: 1.4,  // 8.4 seconds instead of 6 (was 1.5)
      startMoney: 90
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
      ramMaxMultiplier: 0.8,  // 102 MB instead of 128 (was 0.75)
      syncRestoreMultiplier: 0.85,  // 60 MB instead of 70 (was 0.8)
      startMoney: 85
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
      syncCooldownMultiplier: 1.4,
      ramMaxMultiplier: 0.8,
      startMoney: 110  // Extra starting money for towers
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
      towerCostMultiplier: 1.3,  // Towers cost 30% more (was 50%)
      startMoney: 70  // More starting money (was 50)
    }
  },
  {
    id: 14,
    title: "MANUAL OVERRIDE",
    description: "Tower grid offline. Rely on manual commands.",
    waveCount: 5,
    waveConfig: [
      { count: 5, interval: 1900, weights: { grunt: 0.5, swarm: 0.35, shielded: 0.1, heavy: 0.05 }, speedScale: 0.95 },
      { count: 6, interval: 1800, weights: { grunt: 0.45, swarm: 0.35, shielded: 0.15, heavy: 0.05 }, speedScale: 1.0 },
      { count: 7, interval: 1700, weights: { grunt: 0.4, swarm: 0.35, shielded: 0.15, heavy: 0.1 }, speedScale: 1.05 },
      { count: 8, interval: 1600, weights: { grunt: 0.35, swarm: 0.35, shielded: 0.2, heavy: 0.1 }, speedScale: 1.1 },
      { count: 9, interval: 1550, weights: { grunt: 0.35, swarm: 0.35, shielded: 0.2, heavy: 0.1 }, speedScale: 1.12 }
    ],
    modifiers: {
      disableTowers: true,
      startRam: 128  // Full RAM since no towers to help
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
      towerCostMultiplier: 1.2,
      moneyBonusMultiplier: 0.85,  // 15% less money (was 25%)
      startMoney: 80
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
      { count: 5, interval: 1900, weights: { grunt: 0.5, swarm: 0.35, shielded: 0.1, heavy: 0.05 }, speedScale: 0.95 },
      { count: 6, interval: 1800, weights: { grunt: 0.45, swarm: 0.35, shielded: 0.15, heavy: 0.05 }, speedScale: 1.0 },
      { count: 7, interval: 1700, weights: { grunt: 0.4, swarm: 0.35, shielded: 0.15, heavy: 0.1 }, speedScale: 1.05 },
      { count: 8, interval: 1600, weights: { grunt: 0.35, swarm: 0.35, shielded: 0.2, heavy: 0.1 }, speedScale: 1.1 },
      { count: 9, interval: 1550, weights: { grunt: 0.35, swarm: 0.35, shielded: 0.2, heavy: 0.1 }, speedScale: 1.12 }
    ],
    modifiers: {
      disableSync: true,
      startRam: 128,  // Full RAM to start
      waveClearRamBonus: 60,  // More RAM on wave clear (was 50)
      startMoney: 90  // Help get towers faster
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
      rmDamageMultiplier: 1.4,  // Better buff (was 1.25)
      startMoney: 90
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
      coreHpMultiplier: 0.7,  // 84 HP (was 0.6 = 72 HP)
      startMoney: 95
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
      { count: 8, interval: 1700, weights: { grunt: 0.35, swarm: 0.35, shielded: 0.2, heavy: 0.1 }, speedScale: 1.05 },
      { count: 9, interval: 1600, weights: { grunt: 0.3, swarm: 0.35, shielded: 0.2, heavy: 0.15 }, speedScale: 1.1 },
      { count: 10, interval: 1550, weights: { grunt: 0.3, swarm: 0.35, shielded: 0.2, heavy: 0.15 }, speedScale: 1.12 },
      { count: 11, interval: 1500, weights: { grunt: 0.25, swarm: 0.35, shielded: 0.25, heavy: 0.15 }, speedScale: 1.15 },
      { count: 12, interval: 1450, weights: { grunt: 0.25, swarm: 0.35, shielded: 0.25, heavy: 0.15 }, speedScale: 1.18 },
      { count: 13, interval: 1400, weights: { grunt: 0.2, swarm: 0.35, shielded: 0.25, heavy: 0.2 }, speedScale: 1.2 },
      { count: 14, interval: 1350, weights: { grunt: 0.2, swarm: 0.35, shielded: 0.25, heavy: 0.2 }, speedScale: 1.22 }
    ],
    modifiers: {
      startMoney: 95,
      startRam: 128
    }
  },
  {
    id: 20,
    title: "NEURAL CORE",
    description: "Final defense. The system depends on you.",
    waveCount: 8,
    waveConfig: [
      { count: 9, interval: 1600, weights: { grunt: 0.3, swarm: 0.35, shielded: 0.2, heavy: 0.15 }, speedScale: 1.1 },
      { count: 10, interval: 1550, weights: { grunt: 0.3, swarm: 0.35, shielded: 0.2, heavy: 0.15 }, speedScale: 1.12 },
      { count: 11, interval: 1500, weights: { grunt: 0.25, swarm: 0.35, shielded: 0.25, heavy: 0.15 }, speedScale: 1.15 },
      { count: 12, interval: 1450, weights: { grunt: 0.25, swarm: 0.35, shielded: 0.25, heavy: 0.15 }, speedScale: 1.18 },
      { count: 13, interval: 1400, weights: { grunt: 0.2, swarm: 0.35, shielded: 0.25, heavy: 0.2 }, speedScale: 1.2 },
      { count: 14, interval: 1350, weights: { grunt: 0.2, swarm: 0.35, shielded: 0.25, heavy: 0.2 }, speedScale: 1.22 },
      { count: 14, interval: 1350, weights: { grunt: 0.2, swarm: 0.35, shielded: 0.25, heavy: 0.2 }, speedScale: 1.24 },
      { count: 15, interval: 1300, weights: { grunt: 0.2, swarm: 0.35, shielded: 0.25, heavy: 0.2 }, speedScale: 1.25 }
    ],
    modifiers: {
      startMoney: 100,
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
  missionFailed: false
};

// ===========================================
// CAMPAIGN PERSISTENCE
// ===========================================

/**
 * Load campaign progress from localStorage
 */
function loadCampaignProgress() {
  try {
    const data = localStorage.getItem(CAMPAIGN_STORAGE_KEY);
    if (data) {
      const saved = JSON.parse(data);
      campaignState.unlockedMissions = saved.unlockedMissions || [1];
      campaignState.completedMissions = saved.completedMissions || [];
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
    const data = {
      unlockedMissions: campaignState.unlockedMissions,
      completedMissions: campaignState.completedMissions
    };
    localStorage.setItem(CAMPAIGN_STORAGE_KEY, JSON.stringify(data));
  } catch (e) {
    console.error('Failed to save campaign progress:', e);
  }
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
 * Check if a mission is unlocked
 */
function isMissionUnlocked(id) {
  return campaignState.unlockedMissions.includes(id);
}

/**
 * Check if a mission is completed
 */
function isMissionCompleted(id) {
  return campaignState.completedMissions.includes(id);
}

/**
 * Get current mission progress for display
 */
function getCampaignProgress() {
  const completed = campaignState.completedMissions.length;
  const total = MISSIONS.length;
  const highestUnlocked = Math.max(...campaignState.unlockedMissions);
  return {
    completed,
    total,
    highestUnlocked,
    percentage: Math.round((completed / total) * 100)
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
 */
function completeMission() {
  const mission = campaignState.activeMission;
  if (!mission) return;
  
  campaignState.missionComplete = true;
  
  // Mark as completed if not already
  if (!campaignState.completedMissions.includes(mission.id)) {
    campaignState.completedMissions.push(mission.id);
  }
  
  // Unlock next mission
  const nextMissionId = mission.id + 1;
  if (nextMissionId <= MISSIONS.length && !campaignState.unlockedMissions.includes(nextMissionId)) {
    campaignState.unlockedMissions.push(nextMissionId);
  }
  
  saveCampaignProgress();
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
 */
function applyMissionModifiers(baseConfig) {
  const modifiers = getActiveMissionModifiers();
  const modified = { ...baseConfig };
  
  // RAM modifiers
  if (modifiers.ramMaxMultiplier) {
    modified.RAM_MAX = Math.floor(baseConfig.RAM_MAX * modifiers.ramMaxMultiplier);
  }
  if (modifiers.startRam !== undefined) {
    modified.START_RAM = modifiers.startRam;
  }
  
  // Sync modifiers
  if (modifiers.syncCooldownMultiplier) {
    modified.SYNC_COOLDOWN = baseConfig.SYNC_COOLDOWN * modifiers.syncCooldownMultiplier;
  }
  if (modifiers.syncRestoreMultiplier) {
    modified.SYNC_RESTORE = Math.floor(baseConfig.SYNC_RESTORE * modifiers.syncRestoreMultiplier);
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
  
  // Tower modifiers
  if (modifiers.towerCostMultiplier) {
    modified.TOWER_BASE_COST = Math.floor(baseConfig.TOWER_BASE_COST * modifiers.towerCostMultiplier);
  }
  if (modifiers.disableTowers) {
    modified.DISABLE_TOWERS = true;
  }
  
  // Core modifiers
  if (modifiers.coreHpMultiplier) {
    modified.CORE_HP_MAX = Math.floor(baseConfig.CORE_HP_MAX * modifiers.coreHpMultiplier);
  }
  if (modifiers.coreDamageMultiplier) {
    modified.CORE_DAMAGE_MULTIPLIER = modifiers.coreDamageMultiplier;
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
