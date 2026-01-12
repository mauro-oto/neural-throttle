/* ===========================================
   NEURAL THROTTLE - Command Parser & Handlers
   =========================================== */

// ===========================================
// COMMAND PATTERNS (Regex)
// ===========================================
const COMMAND_PATTERNS = {
  rmWithArgs: /^rm\s+(-r?f\s+)?(\d+)$/i,
  rmAlone: /^rm(\s+-r?f)?$/i,
  buildWithArgs: /^build\s+(cannon)$/i,
  buildAlone: /^build$/i,
  buildInvalidArg: /^build\s+(\S+)$/i,
  upgradeWithArgs: /^upgrade\s+(cannon)$/i,
  upgradeAlone: /^upgrade$/i,
  upgradeInvalidArg: /^upgrade\s+(\S+)$/i,
  sync: /^sync$/i,
  killall: /^killall$/i,
  speedWithArgs: /^speed\s+(\d+)$/i,
  speedAlone: /^speed$/i,
  pause: /^pause$/i,
  targetWithArgs: /^target\s+(\w+)$/i,
  targetAlone: /^target$/i,
  help: /^help(?:\s+(\w+))?$/i,
  clear: /^clear$/i,
  status: /^status$/i
};

// ===========================================
// HELP TEXT
// ===========================================
const HELP_TEXT = {
  general: [
    'Available commands:',
    '  rm <index>       - Attack target (10 MB, 0.5s cd)',
    '  rm -f <index>    - Force attack (32 MB, 1.6s cd)',
    '  build cannon     - Build defense tower (max 6)',
    '  upgrade cannon   - Upgrade all towers (+40% dmg)',
    '  sync             - Restore +70 MB RAM (6s cd)',
    '  killall          - Terminate ALL enemies (40 MB, 75s cd)',
    '  target <mode>    - Set tower targeting (first|strong|weak)',
    '  pause            - Pause the game',
    '  speed <0-3>      - Set speed (0=pause, 1/2/3 = 1x/1.25x/1.5x)',
    '  status           - Show current status',
    '  clear            - Clear terminal',
    '  help [cmd]       - Show help',
    '',
    'Indexes are 0-based (closest enemy = 0)',
    '',
    'PRO TIPS:',
    '  • Type faster for up to 2x damage bonus!',
    '  • Press UP/DOWN arrows to navigate command history',
  ],
  rm: [
    'rm - Remove (attack) a minion process',
    '',
    'Usage:',
    '  rm <index>      Standard attack',
    '  rm -f <index>   Force attack (more damage)',
    '',
    'Index is 0-based (0 = closest to core)',
    '',
    'rm:    10 MB RAM, 38 base dmg, 0.5s cooldown',
    'rm -f: 32 MB RAM, 130 base dmg, 1.6s cooldown',
    '',
    'DAMAGE BONUS: Your typing speed affects damage!',
    '  50 WPM = 1.0x, 90 WPM = 1.5x, 130 WPM = 2.0x',
    '  (Based on your actual typing speed, not wait time)',
    '',
    'Notes:',
    '  - Shielded enemies: 15% resistance to rm',
    '  - Heavy enemies: IMMUNE to towers, must use rm',
  ],
  build: [
    'build - Construct a defense tower',
    '',
    'Usage:',
    '  build cannon    Build auto-firing cannon',
    '',
    'Cost: $80 base (increases 35% per tower)',
    'Max towers: 6',
    'Towers auto-target closest enemy',
    '',
    'Tower effectiveness by enemy type:',
    '  - Grunt (GRT): Full damage',
    '  - Swarm (SWM): Full damage',
    '  - Shielded (SHD): 15% damage',
    '  - Heavy (HVY): IMMUNE',
  ],
  upgrade: [
    'upgrade - Upgrade all existing towers',
    '',
    'Usage:',
    '  upgrade cannon    Upgrade all cannons',
    '',
    'Cost: $50 per tower',
    'Effect: +40% damage per level',
    '',
    'Use this when you have max towers (6)',
  ],
  sync: [
    'sync - Flush RAM caches',
    '',
    'Usage:',
    '  sync            Restore +70 MB RAM instantly',
    '',
    'Cooldown: 6 seconds',
    'Wave clears also restore +40 MB.',
  ],
  killall: [
    'killall - Emergency process termination',
    '',
    'Usage:',
    '  killall         Terminate ALL enemy processes instantly',
    '',
    'Cost: 40 MB RAM',
    'Cooldown: 75 seconds',
    '',
    'This is your PANIC BUTTON. Use it when overwhelmed.',
    'The long cooldown means you can only use it once or',
    'twice per mission - time it wisely!',
    '',
    'All enemies are killed and you receive full rewards.',
  ],
  speed: [
    'speed - Change game speed (true timescale)',
    '',
    'Usage:',
    '  speed 0    Pause the game',
    '  speed 1    Normal speed (1x)',
    '  speed 2    Faster (1.25x)',
    '  speed 3    Fast (1.5x)',
    '',
    'True timescale: ALL systems scale equally.',
    'Cooldowns, spawns, and enemies all speed up.',
    '',
    'TIP: You can also type "pause" to pause.',
  ],
  target: [
    'target - Set tower targeting mode',
    '',
    'Usage:',
    '  target first    Target closest to core',
    '  target strong   Target highest HP enemy',
    '  target weak     Target lowest HP enemy',
    '',
    'All towers use the same targeting mode.',
    'Tie-breaker: closest to core wins.',
    '',
    'Setting persists across sessions.',
  ],
  pause: [
    'pause - Pause the game',
    '',
    'Usage:',
    '  pause       Stop all game action',
    '',
    'Use "speed 1" or "speed 2" to resume.',
    '',
    'This is equivalent to "speed 0".',
  ],
  status: [
    'status - Display current game state',
    '',
    'Shows: RAM, Core HP, Wave, Money, Enemies',
    'Also shows tower count, level, and cooldowns',
  ],
  clear: [
    'clear - Clear terminal scrollback',
    '',
    'Usage:',
    '  clear           Remove all log messages',
  ]
};

// ===========================================
// COMMAND PARSER
// ===========================================
function parseCommand(input) {
  const trimmed = input.trim().toLowerCase();

  // Check for commands without proper arguments first
  if (COMMAND_PATTERNS.rmAlone.test(trimmed)) {
    return { command: 'rmMissingArgs', args: [trimmed.includes('-f')] };
  }
  if (COMMAND_PATTERNS.buildAlone.test(trimmed)) {
    return { command: 'buildMissingArgs', args: [] };
  }
  if (COMMAND_PATTERNS.upgradeAlone.test(trimmed)) {
    return { command: 'upgradeMissingArgs', args: [] };
  }
  if (COMMAND_PATTERNS.speedAlone.test(trimmed)) {
    return { command: 'speedMissingArgs', args: [] };
  }
  if (COMMAND_PATTERNS.targetAlone.test(trimmed)) {
    return { command: 'targetMissingArgs', args: [] };
  }

  // Check rm with proper args
  const rmMatch = trimmed.match(COMMAND_PATTERNS.rmWithArgs);
  if (rmMatch) {
    return {
      command: 'rm',
      args: rmMatch.slice(1).filter(arg => arg !== undefined)
    };
  }

  // Check other commands with args
  const commandsWithArgs = ['buildWithArgs', 'upgradeWithArgs', 'speedWithArgs', 'targetWithArgs', 'pause', 'help', 'sync', 'killall', 'clear', 'status'];
  const commandNames = {
    buildWithArgs: 'build',
    upgradeWithArgs: 'upgrade',
    speedWithArgs: 'speed',
    targetWithArgs: 'target',
    pause: 'pause',
    help: 'help',
    sync: 'sync',
    killall: 'killall',
    clear: 'clear',
    status: 'status'
  };

  for (const patternName of commandsWithArgs) {
    const match = trimmed.match(COMMAND_PATTERNS[patternName]);
    if (match) {
      return {
        command: commandNames[patternName],
        args: match.slice(1).filter(arg => arg !== undefined)
      };
    }
  }

  // Check for known commands with invalid arguments (after valid checks)
  const buildInvalidMatch = trimmed.match(COMMAND_PATTERNS.buildInvalidArg);
  if (buildInvalidMatch) {
    return { command: 'buildInvalidArg', args: [buildInvalidMatch[1]] };
  }
  const upgradeInvalidMatch = trimmed.match(COMMAND_PATTERNS.upgradeInvalidArg);
  if (upgradeInvalidMatch) {
    return { command: 'upgradeInvalidArg', args: [upgradeInvalidMatch[1]] };
  }

  return null;
}

// ===========================================
// COMMAND EXECUTION
// ===========================================
function executeCommand(input) {
  // Log the input
  GameAPI.log(`$ ${input}`, 'input');

  // Increment command count
  if (typeof gameState !== 'undefined') {
    gameState.metrics.commandsSubmitted++;
  }

  const parsed = parseCommand(input);

  if (!parsed) {
    const cmd = input.split(' ')[0];
    GameAPI.log(`command not found: ${cmd}`, 'error');
    GameAPI.log('Type "help" for available commands.', 'info');
    if (typeof playSound === 'function') playSound('cmd.error');
    return false;
  }

  const handlers = {
    rm: handleRm,
    rmMissingArgs: handleRmMissingArgs,
    build: handleBuild,
    buildMissingArgs: handleBuildMissingArgs,
    buildInvalidArg: handleBuildInvalidArg,
    upgrade: handleUpgrade,
    upgradeMissingArgs: handleUpgradeMissingArgs,
    upgradeInvalidArg: handleUpgradeInvalidArg,
    sync: handleSync,
    killall: handleKillall,
    speed: handleSpeed,
    speedMissingArgs: handleSpeedMissingArgs,
    target: handleTarget,
    targetMissingArgs: handleTargetMissingArgs,
    pause: handlePause,
    help: handleHelp,
    clear: handleClear,
    status: handleStatus
  };

  const success = handlers[parsed.command](parsed.args);

  if (success && typeof gameState !== 'undefined') {
    gameState.metrics.correctCommands++;
  }

  return success;
}

// ===========================================
// COMMAND HANDLERS
// ===========================================

function handleRmMissingArgs(args) {
  const hasForce = args[0];
  if (hasForce) {
    GameAPI.log('rm -f: missing operand (index)', 'error');
    GameAPI.log('Usage: rm -f <index>', 'info');
  } else {
    GameAPI.log('rm: missing operand (index)', 'error');
    GameAPI.log('Usage: rm <index> or rm -f <index>', 'info');
  }
  if (typeof playSound === 'function') playSound('cmd.error');
  return false;
}

function handleBuildMissingArgs(args) {
  GameAPI.log('build: missing operand (structure type)', 'error');
  GameAPI.log('Usage: build cannon', 'info');
  if (typeof playSound === 'function') playSound('cmd.error');
  return false;
}

function handleBuildInvalidArg(args) {
  GameAPI.log(`build: unknown structure "${args[0]?.toLowerCase()}"`, 'error');
  GameAPI.log('Available: cannon', 'info');
  if (typeof playSound === 'function') playSound('cmd.error');
  return false;
}

function handleUpgradeMissingArgs(args) {
  GameAPI.log('upgrade: missing operand (structure type)', 'error');
  GameAPI.log('Usage: upgrade cannon', 'info');
  if (typeof playSound === 'function') playSound('cmd.error');
  return false;
}

function handleUpgradeInvalidArg(args) {
  GameAPI.log(`upgrade: unknown structure "${args[0]?.toLowerCase()}"`, 'error');
  GameAPI.log('Available: cannon', 'info');
  if (typeof playSound === 'function') playSound('cmd.error');
  return false;
}

function handleSpeedMissingArgs(args) {
  GameAPI.log('speed: missing operand (level)', 'error');
  GameAPI.log('Usage: speed <0|1|2|3> (0=pause)', 'info');
  if (typeof playSound === 'function') playSound('cmd.error');
  return false;
}

function handleRm(args) {
  // Check if game is running
  if (!gameState.running) {
    GameAPI.log('rm: no active session', 'error');
    if (typeof playSound === 'function') playSound('cmd.error');
    return false;
  }

  // Check if game is paused
  if (gameState.paused && !tutorial.paused) {
    GameAPI.log('rm: game is paused (use "speed 1" to resume)', 'error');
    if (typeof playSound === 'function') playSound('cmd.error');
    return false;
  }

  // Parse force flag and index
  let force = false;
  let indexStr;

  if (args[0] && args[0].trim().toLowerCase() === '-f') {
    force = true;
    indexStr = args[1];
  } else {
    indexStr = args[0] || args[1];
  }

  const index = parseInt(indexStr, 10);

  if (isNaN(index) || index < 0) {
    GameAPI.log('rm: invalid index (must be >= 0)', 'error');
    if (typeof playSound === 'function') playSound('cmd.error');
    return false;
  }

  const success = GameAPI.attack(index, force);

  // Play appropriate sound on success (error sounds handled in GameAPI.attack)
  if (success && typeof playSound === 'function') {
    playSound(force ? 'cmd.rmForce' : 'cmd.rm');
  }

  return success;
}

function handleBuild(args) {
  // Check if game is running
  if (!gameState.running) {
    GameAPI.log('build: no active session', 'error');
    if (typeof playSound === 'function') playSound('cmd.error');
    return false;
  }

  // Check if game is paused
  if (gameState.paused && !tutorial.paused) {
    GameAPI.log('build: game is paused (use "speed 1" to resume)', 'error');
    if (typeof playSound === 'function') playSound('cmd.error');
    return false;
  }

  const type = args[0]?.toLowerCase();

  if (type !== 'cannon') {
    GameAPI.log(`build: unknown structure "${type}"`, 'error');
    GameAPI.log('Available: cannon', 'info');
    if (typeof playSound === 'function') playSound('cmd.error');
    return false;
  }

  // Note: tower.place sound is played in GameAPI.buildTower on success
  return GameAPI.buildTower(type);
}

function handleUpgrade(args) {
  // Check if game is running
  if (!gameState.running) {
    GameAPI.log('upgrade: no active session', 'error');
    if (typeof playSound === 'function') playSound('cmd.error');
    return false;
  }

  // Check if game is paused
  if (gameState.paused && !tutorial.paused) {
    GameAPI.log('upgrade: game is paused (use "speed 1" to resume)', 'error');
    if (typeof playSound === 'function') playSound('cmd.error');
    return false;
  }

  const type = args[0]?.toLowerCase();

  if (type !== 'cannon') {
    GameAPI.log(`upgrade: unknown structure "${type}"`, 'error');
    GameAPI.log('Available: cannon', 'info');
    if (typeof playSound === 'function') playSound('cmd.error');
    return false;
  }

  const success = GameAPI.upgradeTowers();
  if (success && typeof playSound === 'function') {
    playSound('tower.place'); // Reuse tower build sound for upgrade
  }
  return success;
}

function handleSync(args) {
  // Check if game is running
  if (!gameState.running) {
    GameAPI.log('sync: no active session', 'error');
    if (typeof playSound === 'function') playSound('cmd.error');
    return false;
  }

  // Check if game is paused
  if (gameState.paused && !tutorial.paused) {
    GameAPI.log('sync: game is paused (use "speed 1" to resume)', 'error');
    if (typeof playSound === 'function') playSound('cmd.error');
    return false;
  }

  const success = GameAPI.syncRam();
  if (success && typeof playSound === 'function') {
    playSound('cmd.sync');
  }
  return success;
}

function handleKillall(args) {
  // Check if game is running
  if (!gameState.running) {
    GameAPI.log('killall: no active session', 'error');
    if (typeof playSound === 'function') playSound('cmd.error');
    return false;
  }

  // Check if game is paused
  if (gameState.paused && !tutorial.paused) {
    GameAPI.log('killall: game is paused (use "speed 1" to resume)', 'error');
    if (typeof playSound === 'function') playSound('cmd.error');
    return false;
  }

  // Check if this is a tutorial free use
  const freeUse = tutorial.paused && tutorial.currentStep === 'killallIntro';

  const success = GameAPI.killAll(freeUse);
  if (success && typeof playSound === 'function') {
    playSound('cmd.killall');
  }
  return success;
}

function handleSpeed(args) {
  const speedStr = args[0];
  const speed = parseInt(speedStr, 10);

  // Valid input levels: 0, 1, 2, 3 (mapped to 0, 1x, 1.25x, 1.5x internally)
  if (isNaN(speed) || ![0, 1, 2, 3].includes(speed)) {
    GameAPI.log('speed: invalid value (use 0, 1, 2, or 3)', 'error');
    if (typeof playSound === 'function') playSound('cmd.error');
    return false;
  }

  const success = GameAPI.setSpeed(speed);
  if (success && typeof playSound === 'function') {
    playSound('ui.menuClick');
  }
  return success;
}

function handleTarget(args) {
  const mode = args[0];
  const success = GameAPI.setTargetMode(mode);
  if (success && typeof playSound === 'function') {
    playSound('ui.menuClick');
  }
  return success;
}

function handleTargetMissingArgs(args) {
  GameAPI.log('target: missing operand (mode)', 'error');
  GameAPI.log('Usage: target <first|strong|weak>', 'info');
  if (typeof playSound === 'function') playSound('cmd.error');
  return false;
}

function handlePause(args) {
  return GameAPI.setSpeed(0);
}

function handleHelp(args) {
  const topic = args[0];

  if (topic && HELP_TEXT[topic]) {
    HELP_TEXT[topic].forEach(line => GameAPI.log(line, 'info'));
  } else if (topic) {
    GameAPI.log(`help: unknown topic "${topic}"`, 'error');
    GameAPI.log('Available topics: rm, build, upgrade, sync, pause, speed, status, clear', 'info');
  } else {
    HELP_TEXT.general.forEach(line => GameAPI.log(line, 'info'));
  }

  return true;
}

function handleClear(args) {
  const scrollback = document.getElementById('scrollback');
  if (scrollback) {
    scrollback.innerHTML = '';
  }
  return true;
}

function handleStatus(args) {
  const status = GameAPI.getStatus();

  GameAPI.log('--- SYSTEM STATUS ---', 'system');

  // Show Campaign+ mode indicator if active
  if (typeof campaignState !== 'undefined' &&
      gameState.gameMode === 'campaign' &&
      campaignState.activeCampaignMode === 'campaign_plus') {
    GameAPI.log('Mode: CAMPAIGN+ (enhanced difficulty)', 'warning');
  }

  GameAPI.log(`RAM: ${Math.floor(status.ram)}/${status.maxRam} MB`, 'info');
  GameAPI.log(`Core: ${Math.floor(status.coreHp)}/${status.maxCoreHp} HP`, 'info');
  GameAPI.log(`Wave: ${status.wave}`, 'info');
  GameAPI.log(`Credits: $${status.money}`, 'info');
  GameAPI.log(`Enemies: ${status.minions}`, 'info');
  GameAPI.log(`Towers: ${status.towers}/${status.towerMax} (Level ${status.towerLevel})`, 'info');
  GameAPI.log(`Speed: ${status.speed}x`, 'info');
  GameAPI.log(`Target: ${gameState.targetMode}`, 'info');

  // Cooldown status
  const cds = [];
  if (status.cooldowns.rm > 0) cds.push(`rm: ${status.cooldowns.rm.toFixed(1)}s`);
  if (status.cooldowns.rmForce > 0) cds.push(`rm -f: ${status.cooldowns.rmForce.toFixed(1)}s`);
  if (status.cooldowns.sync > 0) cds.push(`sync: ${status.cooldowns.sync.toFixed(1)}s`);
  if (status.cooldowns.killall > 0) cds.push(`killall: ${status.cooldowns.killall.toFixed(1)}s`);

  if (cds.length > 0) {
    GameAPI.log(`Cooldowns: ${cds.join(', ')}`, 'warning');
  } else {
    GameAPI.log('Cooldowns: all ready', 'success');
  }

  return true;
}

// Make executeCommand globally available
window.executeCommand = executeCommand;
