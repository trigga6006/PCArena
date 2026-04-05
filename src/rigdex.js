// ═══════════════════════════════════════════════════════════════
// RIG DEX — Hardware Pokedex. Logs every unique rig you battle.
// ═══════════════════════════════════════════════════════════════

const fs = require('node:fs');
const path = require('node:path');

const WSO_DIR = path.join(__dirname, '..', '.kernelmon');
const DEX_FILE = path.join(WSO_DIR, 'rigdex.json');

// ─── Persistence ───

function ensureDir() {
  if (!fs.existsSync(WSO_DIR)) fs.mkdirSync(WSO_DIR, { recursive: true });
}

function loadDex() {
  try {
    if (!fs.existsSync(DEX_FILE)) return {};
    return JSON.parse(fs.readFileSync(DEX_FILE, 'utf8'));
  } catch { return {}; }
}

function saveDex(data) {
  ensureDir();
  fs.writeFileSync(DEX_FILE, JSON.stringify(data, null, 2));
}

// ─── Scan a rig after battle ───
// Returns { isNew, entry } — isNew = true if this is a first encounter

function scanRig(opponent) {
  const dex = loadDex();
  const key = opponent.id || opponent.name;
  const isNew = !dex[key];

  if (isNew) {
    dex[key] = {
      name: opponent.name,
      gpu: opponent.gpu || '?',
      archetype: opponent.archetype?.name || '?',
      stats: {
        str: opponent.stats.str,
        mag: opponent.stats.mag,
        spd: opponent.stats.spd,
        def: opponent.stats.def,
        vit: opponent.stats.vit,
        hp: opponent.stats.maxHp || opponent.stats.hp,
      },
      specs: {
        cpu: opponent.specs?.cpu?.brand || '?',
        gpu: opponent.specs?.gpu?.model || '?',
        ram: opponent.specs?.ram?.totalGB ? `${opponent.specs.ram.totalGB}GB` : '?',
        storage: opponent.specs?.storage?.type || '?',
      },
      firstSeen: new Date().toISOString(),
      encounters: 0,
      wins: 0,
      losses: 0,
    };
  }

  dex[key].encounters++;
  saveDex(dex);

  return { isNew, entry: dex[key] };
}

// Record win/loss for a scanned rig
function recordResult(opponent, won) {
  const dex = loadDex();
  const key = opponent.id || opponent.name;
  if (!dex[key]) return;
  if (won) dex[key].wins++;
  else dex[key].losses++;
  saveDex(dex);
}

// ─── Query API ───

function getDexEntries() {
  const dex = loadDex();
  return Object.entries(dex).map(([id, entry]) => ({ id, ...entry }));
}

function getDexCount() {
  return Object.keys(loadDex()).length;
}

module.exports = {
  scanRig,
  recordResult,
  getDexEntries,
  getDexCount,
};
