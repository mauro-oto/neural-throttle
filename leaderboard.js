/* ===========================================
   NEURAL THROTTLE - Leaderboard System
   =========================================== */

// ===========================================
// CONFIGURATION
// ===========================================
const STORAGE_KEY = 'neural_throttle_leaderboard';
const MAX_ENTRIES = 20;

// ===========================================
// STORAGE FUNCTIONS
// ===========================================

/**
 * Load leaderboard from localStorage
 * @returns {Array} Array of score entries
 */
function loadLeaderboard() {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  } catch (e) {
    console.error('Failed to load leaderboard:', e);
    return [];
  }
}

/**
 * Save a new score to the leaderboard
 * @param {Object} entry - Score entry with name, waves, bestWpm, avgWpm, accuracy, time, date
 */
function saveScore(entry) {
  try {
    const board = loadLeaderboard();

    // Add new entry
    board.push({
      name: entry.name || 'anon',
      waves: entry.waves || 0,
      bestWpm: entry.bestWpm || 0,
      avgWpm: entry.avgWpm || 0,
      accuracy: entry.accuracy || 0,
      time: entry.time || 0,
      date: entry.date || new Date().toISOString()
    });

    // Sort by waves (desc), then bestWpm (desc) as tie-breaker
    board.sort((a, b) => {
      if (b.waves !== a.waves) return b.waves - a.waves;
      return b.bestWpm - a.bestWpm;
    });

    // Keep only top entries
    board.splice(MAX_ENTRIES);

    // Save back to storage
    localStorage.setItem(STORAGE_KEY, JSON.stringify(board));

    return true;
  } catch (e) {
    console.error('Failed to save score:', e);
    return false;
  }
}

/**
 * Reset the leaderboard
 */
function resetLeaderboard() {
  try {
    localStorage.removeItem(STORAGE_KEY);
    return true;
  } catch (e) {
    console.error('Failed to reset leaderboard:', e);
    return false;
  }
}

// ===========================================
// UI FUNCTIONS
// ===========================================

/**
 * Show the game over screen with stats
 * @param {Object} stats - Final game stats
 */
function showGameOverScreen(stats) {
  const overlay = document.getElementById('gameOverlay');

  // Update stats display
  document.getElementById('statWaves').textContent = stats.waves;
  document.getElementById('statBestWpm').textContent = stats.bestWpm;
  document.getElementById('statAvgWpm').textContent = stats.avgWpm;
  document.getElementById('statAccuracy').textContent = stats.accuracy + '%';
  document.getElementById('statTime').textContent = formatTimeDisplay(stats.time);
  document.getElementById('statKills').textContent = stats.kills;

  // Reset save button state
  const saveBtn = document.getElementById('btnSaveScore');
  saveBtn.disabled = false;
  saveBtn.textContent = 'SAVE SCORE';

  // Reset name input
  document.getElementById('playerName').value = 'anon';

  // Show overlay
  overlay.classList.remove('hidden');

  // Focus name input
  setTimeout(() => {
    document.getElementById('playerName').focus();
    document.getElementById('playerName').select();
  }, 100);
}

/**
 * Render the leaderboard table
 */
function renderLeaderboard() {
  const tbody = document.getElementById('leaderboardBody');
  const board = loadLeaderboard();

  // Clear existing rows
  tbody.innerHTML = '';

  if (board.length === 0) {
    const row = document.createElement('tr');
    row.innerHTML = '<td colspan="6" class="empty-leaderboard">No scores recorded yet</td>';
    tbody.appendChild(row);
    return;
  }

  // Add rows for each entry
  board.forEach((entry, index) => {
    const row = document.createElement('tr');
    row.innerHTML = `
      <td>${index + 1}</td>
      <td>${escapeHtml(entry.name)}</td>
      <td>${entry.waves}</td>
      <td>${entry.bestWpm}</td>
      <td>${entry.accuracy}%</td>
      <td>${formatTimeDisplay(entry.time)}</td>
    `;
    tbody.appendChild(row);
  });
}

// ===========================================
// UTILITY FUNCTIONS
// ===========================================

/**
 * Format seconds to MM:SS display
 * @param {number} seconds - Time in seconds
 * @returns {string} Formatted time string
 */
function formatTimeDisplay(seconds) {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

/**
 * Escape HTML to prevent XSS
 * @param {string} text - Text to escape
 * @returns {string} Escaped text
 */
function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// ===========================================
// EXPORTS (make functions globally available)
// ===========================================
window.loadLeaderboard = loadLeaderboard;
window.saveScore = saveScore;
window.resetLeaderboard = resetLeaderboard;
window.showGameOverScreen = showGameOverScreen;
window.renderLeaderboard = renderLeaderboard;
