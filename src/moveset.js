// ═══════════════════════════════════════════════════════════════
// MOVESET — Three-tier move pool with hardware gating, cooldowns,
// and brand-specific identity. Loadout persistence for 6 moves.
// ═══════════════════════════════════════════════════════════════

const fs = require('node:fs');
const path = require('node:path');
const { getCpuBrand, getGpuBrand, getStorageType, getRamTier } = require('./hwutil');

const WSO_DIR = path.join(__dirname, '..', '.kernelmon');
const LOADOUT_FILE = path.join(WSO_DIR, 'loadout.json');

const MOVESET_SLOTS = 6;

// ═══════════════════════════════════════════════════════════════
// TIER 1: UNIVERSAL MOVES — Always available, no gates, no cooldowns
// ═══════════════════════════════════════════════════════════════

const UNIVERSAL_MOVES = {
  PING_STRIKE:    { cat: 'physical', base: 'str', mult: 0.7,  tier: 'universal', cooldown: 0, label: 'Ping Strike',    desc: 'ping -f target',       flavor: 'A rapid ICMP barrage' },
  BYTE_SLASH:     { cat: 'physical', base: 'str', mult: 0.8,  tier: 'universal', cooldown: 0, label: 'Byte Slash',     desc: 'dd if=/dev/urandom',   flavor: 'Raw byte manipulation attack' },
  STATIC_SHOCK:   { cat: 'magic',    base: 'mag', mult: 0.7,  tier: 'universal', cooldown: 0, label: 'Static Shock',   desc: 'esd.discharge()',      flavor: 'Electrostatic discharge pulse' },
  RENDER_FLICKER: { cat: 'magic',    base: 'mag', mult: 0.8,  tier: 'universal', cooldown: 0, label: 'Render Flicker', desc: 'gl.drawFrame()',       flavor: 'Brief GPU flare burst' },
  QUICK_BOOT:     { cat: 'speed',    base: 'spd', mult: 0.7,  tier: 'universal', cooldown: 0, label: 'Quick Boot',     desc: 'init 6 && init 1',     flavor: 'Fast startup strike' },
  PACKET_TOSS:    { cat: 'speed',    base: 'spd', mult: 0.8,  tier: 'universal', cooldown: 0, label: 'Packet Toss',    desc: 'udp.send(payload)',    flavor: 'Lob a data packet at the target' },
  MALLOC_PATCH:   { cat: 'special',  base: 'vit', mult: 0.5,  tier: 'universal', cooldown: 0, label: 'Malloc Patch',   desc: 'malloc(HP)',           flavor: 'Allocate fresh memory to recover', special: 'heal' },
  FIREWALL_TAP:   { cat: 'special',  base: 'vit', mult: 0.3,  tier: 'universal', cooldown: 0, label: 'Firewall Tap',   desc: 'iptables -A INPUT',    flavor: 'Raise a quick firewall barrier', special: 'harden' },
  BITFLIP:        { cat: 'special',  base: 'spd', mult: 0.9,  tier: 'universal', cooldown: 0, label: 'Bitflip',        desc: 'mem[rand()]^=1',       flavor: 'Corrupt a random bit in memory' },
  ERROR_LOG:      { cat: 'special',  base: 'str', mult: 0.3,  tier: 'universal', cooldown: 0, label: 'Error Log',      desc: 'stderr.flood()',       flavor: 'Flood with error messages', special: 'debuff' },
};

// ═══════════════════════════════════════════════════════════════
// TIER 2: COMPONENT MOVES — Gated by hardware brand/component
// gate: { type, brand?, kind?, minCores?, minSpeed? }
// ═══════════════════════════════════════════════════════════════

const COMPONENT_MOVES = {
  // ── CPU — AMD ──
  ZEN_MEDITATION:     { cat: 'physical', base: 'str', mult: 1.1,  tier: 'component', cooldown: 0, gate: { type: 'cpu', brand: 'amd' },  label: 'Zen Meditation',     desc: 'zen.focus(IPC)',       flavor: 'Zen architecture deep focus strike' },
  INFINITY_FABRIC:    { cat: 'physical', base: 'str', mult: 1.3,  tier: 'component', cooldown: 2, gate: { type: 'cpu', brand: 'amd' },  label: 'Infinity Fabric',    desc: 'IF.bandwidth(MAX)',    flavor: 'Interconnect smashes through defenses' },
  CHIPLET_BARRAGE:    { cat: 'physical', base: 'str', mult: 1.0,  tier: 'component', cooldown: 0, gate: { type: 'cpu', brand: 'amd' },  label: 'Chiplet Barrage',    desc: 'chiplet.scatter()',    flavor: 'Multi-chiplet simultaneous assault' },
  PRECISION_BOOST:    { cat: 'speed',    base: 'spd', mult: 1.2,  tier: 'component', cooldown: 0, gate: { type: 'cpu', brand: 'amd' },  label: 'Precision Boost',    desc: 'PBO.overdrive()',     flavor: 'AMD precision boost clock surge' },
  THREADRIPPER_SLAM:  { cat: 'physical', base: 'str', mult: 1.4,  tier: 'component', cooldown: 2, gate: { type: 'cpu', brand: 'amd', minCores: 16 }, label: 'Threadripper Slam', desc: 'TR.allCores(FULL)', flavor: 'Massive thread count devastation' },

  // ── CPU — Intel ──
  TURBO_BOOST:        { cat: 'physical', base: 'str', mult: 1.1,  tier: 'component', cooldown: 0, gate: { type: 'cpu', brand: 'intel' }, label: 'Turbo Boost',        desc: 'turbo.boost(MAX)',     flavor: 'Clock frequency pushed past limits' },
  P_CORE_STRIKE:      { cat: 'physical', base: 'str', mult: 1.3,  tier: 'component', cooldown: 2, gate: { type: 'cpu', brand: 'intel' }, label: 'P-Core Strike',      desc: 'pCore.execute()',      flavor: 'Performance core delivers a precision blow' },
  E_CORE_SWARM:       { cat: 'speed',    base: 'spd', mult: 1.0,  tier: 'component', cooldown: 0, gate: { type: 'cpu', brand: 'intel' }, label: 'E-Core Swarm',       desc: 'eCore.dispatch(ALL)', flavor: 'Efficiency cores rush in a swarm' },
  HYPERTHREADING:     { cat: 'physical', base: 'str', mult: 1.2,  tier: 'component', cooldown: 0, gate: { type: 'cpu', brand: 'intel' }, label: 'Hyperthreading',     desc: 'HT.parallel(2x)',     flavor: 'Simultaneous multi-thread execution' },
  RAPTOR_CLAW:        { cat: 'physical', base: 'str', mult: 1.4,  tier: 'component', cooldown: 2, gate: { type: 'cpu', brand: 'intel', minSpeed: 5.0 }, label: 'Raptor Claw', desc: 'raptor.strike(5GHz+)', flavor: 'High-clock monster tears through' },

  // ── CPU — Apple ──
  NEURAL_PULSE:       { cat: 'magic',    base: 'mag', mult: 1.1,  tier: 'component', cooldown: 0, gate: { type: 'cpu', brand: 'apple' }, label: 'Neural Pulse',       desc: 'ANE.inference()',      flavor: 'Neural engine burst computation' },
  UNIFIED_MEMORY:     { cat: 'special',  base: 'vit', mult: 1.0,  tier: 'component', cooldown: 0, gate: { type: 'cpu', brand: 'apple' }, label: 'Unified Memory',     desc: 'UMA.share(ALL)',       flavor: 'Shared memory architecture advantage' },
  SILICON_WAVE:       { cat: 'physical', base: 'str', mult: 1.2,  tier: 'component', cooldown: 0, gate: { type: 'cpu', brand: 'apple' }, label: 'Silicon Wave',       desc: 'apple.perf(MAX)',      flavor: 'Apple silicon efficiency wave' },
  METAL_COMPUTE:      { cat: 'magic',    base: 'mag', mult: 1.3,  tier: 'component', cooldown: 2, gate: { type: 'cpu', brand: 'apple' }, label: 'Metal Compute',      desc: 'MTL.dispatch()',       flavor: 'Metal API compute shader blast' },

  // ── GPU — NVIDIA ──
  CUDA_LANCE:         { cat: 'magic',    base: 'mag', mult: 1.1,  tier: 'component', cooldown: 0, gate: { type: 'gpu', brand: 'nvidia' }, label: 'CUDA Lance',         desc: 'cuda.launch(grid)',    flavor: 'CUDA core precision strike' },
  TENSOR_BARRAGE:     { cat: 'magic',    base: 'mag', mult: 1.3,  tier: 'component', cooldown: 2, gate: { type: 'gpu', brand: 'nvidia' }, label: 'Tensor Barrage',     desc: 'tensor.matmul(∞)',     flavor: 'Tensor core matrix multiplication salvo' },
  RTX_BEAM:           { cat: 'magic',    base: 'mag', mult: 1.4,  tier: 'component', cooldown: 2, gate: { type: 'gpu', brand: 'nvidia' }, label: 'RTX Beam',           desc: 'rt.trace(ALL_RAYS)',   flavor: 'Ray tracing laser pierces through' },
  DLSS_MIRAGE:        { cat: 'special',  base: 'mag', mult: 0.9,  tier: 'component', cooldown: 0, gate: { type: 'gpu', brand: 'nvidia' }, label: 'DLSS Mirage',        desc: 'dlss.upscale(4x)',     flavor: 'AI-upscaled illusion confuses the target', special: 'debuff' },
  NVENC_COMPRESS:     { cat: 'speed',    base: 'spd', mult: 1.0,  tier: 'component', cooldown: 0, gate: { type: 'gpu', brand: 'nvidia' }, label: 'NVENC Compress',     desc: 'nvenc.encode(h265)',   flavor: 'Hardware encoder speed burst' },

  // ── GPU — AMD Radeon ──
  RDNA_SURGE:         { cat: 'magic',    base: 'mag', mult: 1.1,  tier: 'component', cooldown: 0, gate: { type: 'gpu', brand: 'amd' },   label: 'RDNA Surge',         desc: 'rdna.wave(64)',        flavor: 'RDNA architecture wave attack' },
  COMPUTE_UNIT_STORM: { cat: 'magic',    base: 'mag', mult: 1.3,  tier: 'component', cooldown: 2, gate: { type: 'gpu', brand: 'amd' },   label: 'CU Storm',           desc: 'CU.saturate(ALL)',     flavor: 'Compute unit saturation bombardment' },
  FSR_DISTORTION:     { cat: 'special',  base: 'mag', mult: 0.9,  tier: 'component', cooldown: 0, gate: { type: 'gpu', brand: 'amd' },   label: 'FSR Distortion',     desc: 'fsr.upscale()',        flavor: 'FidelityFX upscaling warps perception', special: 'debuff' },
  INFINITY_CACHE_BURST:{ cat: 'magic',   base: 'mag', mult: 1.2,  tier: 'component', cooldown: 0, gate: { type: 'gpu', brand: 'amd' },   label: 'Infinity Cache',     desc: 'IC.burst(128MB)',      flavor: 'Cache-powered magic burst' },
  SAM_LINK:           { cat: 'physical', base: 'str', mult: 1.0,  tier: 'component', cooldown: 0, gate: { type: 'gpu', brand: 'amd' },   label: 'SAM Link',           desc: 'SAM.bridge(CPU+GPU)',  flavor: 'Smart Access Memory bridges CPU and GPU' },

  // ── GPU — Intel Arc ──
  XE_CORE_STRIKE:     { cat: 'magic',    base: 'mag', mult: 1.1,  tier: 'component', cooldown: 0, gate: { type: 'gpu', brand: 'intel' }, label: 'Xe Core Strike',     desc: 'Xe.render()',          flavor: 'Xe architecture magic attack' },
  XMX_MATRIX:         { cat: 'magic',    base: 'mag', mult: 1.3,  tier: 'component', cooldown: 2, gate: { type: 'gpu', brand: 'intel' }, label: 'XMX Matrix',         desc: 'XMX.matmul()',         flavor: 'Matrix engine crush computation' },
  ALCHEMIST_FLAME:    { cat: 'magic',    base: 'mag', mult: 1.2,  tier: 'component', cooldown: 0, gate: { type: 'gpu', brand: 'intel' }, label: 'Alchemist Flame',    desc: 'alchemist.ignite()',   flavor: 'Alchemist GPU blazing fire' },
  HYPER_ENCODE:       { cat: 'speed',    base: 'spd', mult: 1.0,  tier: 'component', cooldown: 0, gate: { type: 'gpu', brand: 'intel' }, label: 'Hyper Encode',       desc: 'AV1.encode(hw)',       flavor: 'AV1 hardware encoder speed burst' },

  // ── Storage — NVMe ──
  NVME_BLITZ:         { cat: 'speed',    base: 'spd', mult: 1.3,  tier: 'component', cooldown: 2, gate: { type: 'storage', kind: 'nvme' }, label: 'NVMe Blitz',       desc: 'pcie.direct(gen5)',    flavor: 'PCIe direct strike at NVMe speeds' },
  QUEUE_FLOOD:        { cat: 'speed',    base: 'spd', mult: 1.1,  tier: 'component', cooldown: 0, gate: { type: 'storage', kind: 'nvme' }, label: 'Queue Flood',      desc: 'nvme.QD(65535)',       flavor: 'NVMe queue depth overflow attack' },
  DIRECT_STORAGE:     { cat: 'speed',    base: 'spd', mult: 1.0,  tier: 'component', cooldown: 0, gate: { type: 'storage', kind: 'nvme' }, label: 'Direct Storage',   desc: 'DS.bypass(CPU)',       flavor: 'Bypass CPU, direct GPU-storage hit' },

  // ── Storage — SSD ──
  SATA_SLASH:         { cat: 'speed',    base: 'spd', mult: 1.0,  tier: 'component', cooldown: 0, gate: { type: 'storage', kind: 'ssd' }, label: 'SATA Slash',        desc: 'sata.cut(600MB/s)',    flavor: 'SATA interface precision cut' },
  TRIM_STRIKE:        { cat: 'speed',    base: 'spd', mult: 1.1,  tier: 'component', cooldown: 0, gate: { type: 'storage', kind: 'ssd' }, label: 'TRIM Strike',       desc: 'trim.gc(blocks)',      flavor: 'Garbage collection attack cleans house' },
  FLASH_BURN:         { cat: 'speed',    base: 'spd', mult: 0.9,  tier: 'component', cooldown: 0, gate: { type: 'storage', kind: 'ssd' }, label: 'Flash Burn',        desc: 'nand.wear(P/E++)',     flavor: 'NAND flash wear damage over time', special: 'dot' },

  // ── Storage — HDD ──
  PLATTER_SPIN:       { cat: 'physical', base: 'str', mult: 1.2,  tier: 'component', cooldown: 0, gate: { type: 'storage', kind: 'hdd' }, label: 'Platter Spin',     desc: 'rpm.max(7200)',        flavor: 'Spinning disk builds devastating momentum' },
  HEAD_CRASH:         { cat: 'physical', base: 'str', mult: 1.5,  tier: 'component', cooldown: 2, gate: { type: 'storage', kind: 'hdd' }, label: 'Head Crash',       desc: 'head.contact(platter)',flavor: 'Read/write head crashes into the platter', special: 'stun' },
  SEEK_GRIND:         { cat: 'special',  base: 'str', mult: 0.8,  tier: 'component', cooldown: 0, gate: { type: 'storage', kind: 'hdd' }, label: 'Seek Grind',       desc: 'seek.random(∞)',       flavor: 'Random seek grinding slows everything', special: 'debuff' },

  // ── RAM — High (≥32GB) ──
  MASSIVE_ALLOC:      { cat: 'special',  base: 'vit', mult: 0.7,  tier: 'component', cooldown: 0, gate: { type: 'ram', tier: 'high' },   label: 'Massive Alloc',     desc: 'alloc(32GB)',          flavor: 'Huge memory pool powers recovery', special: 'heal' },
  DDR5_TORRENT:       { cat: 'magic',    base: 'mag', mult: 1.2,  tier: 'component', cooldown: 0, gate: { type: 'ram', tier: 'high' },   label: 'DDR5 Torrent',      desc: 'ddr5.burst(6400MT/s)', flavor: 'High bandwidth memory flood' },
  ECC_SHIELD:         { cat: 'special',  base: 'vit', mult: 0.4,  tier: 'component', cooldown: 2, gate: { type: 'ram', tier: 'high' },   label: 'ECC Shield',        desc: 'ecc.correct(ALL)',     flavor: 'Error-correcting code impervious defense', special: 'harden' },

  // ── RAM — Mid (16-31GB) ──
  PAGE_SWAP:          { cat: 'speed',    base: 'spd', mult: 1.0,  tier: 'component', cooldown: 0, gate: { type: 'ram', tier: 'mid' },    label: 'Page Swap',         desc: 'vm.swap(pages)',       flavor: 'Virtual memory page swap attack' },
  DUAL_CHANNEL:       { cat: 'physical', base: 'str', mult: 1.1,  tier: 'component', cooldown: 0, gate: { type: 'ram', tier: 'mid' },    label: 'Dual Channel',      desc: 'DDR.dual(interleave)', flavor: 'Dual channel bandwidth double hit' },
  DIMM_SLAM:          { cat: 'physical', base: 'str', mult: 0.9,  tier: 'component', cooldown: 0, gate: { type: 'ram', tier: 'mid' },    label: 'DIMM Slam',         desc: 'dimm.eject(force)',    flavor: 'Memory module impact' },

  // ── RAM — Low (<16GB) ──
  OOM_KILLER:         { cat: 'special',  base: 'str', mult: 1.4,  tier: 'component', cooldown: 2, gate: { type: 'ram', tier: 'low' },    label: 'OOM Killer',        desc: 'oom.kill(-9)',         flavor: 'Out-of-memory desperation strike', special: 'pierce' },
  SWAP_THRASH:        { cat: 'special',  base: 'spd', mult: 0.8,  tier: 'component', cooldown: 0, gate: { type: 'ram', tier: 'low' },    label: 'Swap Thrash',       desc: 'swap.thrash(∞)',       flavor: 'Thrashing slowdown infects the opponent', special: 'debuff' },
  LEAN_STRIKE:        { cat: 'speed',    base: 'spd', mult: 1.0,  tier: 'component', cooldown: 0, gate: { type: 'ram', tier: 'low' },    label: 'Lean Strike',       desc: 'mem.optimize()',       flavor: 'Efficient strike with minimal resources' },
};

// ═══════════════════════════════════════════════════════════════
// Combined pool (universal + component — signatures added at runtime)
// ═══════════════════════════════════════════════════════════════

const MOVE_POOL = { ...UNIVERSAL_MOVES, ...COMPONENT_MOVES };

// ─── Hardware gate check ───
function passesGate(gate, specs) {
  if (!gate) return true;
  if (!specs) return false; // no specs = universal only

  if (gate.type === 'cpu') {
    if (gate.brand && getCpuBrand(specs) !== gate.brand) return false;
    if (gate.minCores && (specs.cpu?.cores || 0) < gate.minCores) return false;
    if (gate.minSpeed && (specs.cpu?.speedMax || 0) < gate.minSpeed) return false;
    return true;
  }
  if (gate.type === 'gpu') {
    if (gate.brand && getGpuBrand(specs) !== gate.brand) return false;
    return true;
  }
  if (gate.type === 'storage') {
    if (gate.kind && getStorageType(specs) !== gate.kind) return false;
    return true;
  }
  if (gate.type === 'ram') {
    if (gate.tier && getRamTier(specs) !== gate.tier) return false;
    return true;
  }
  return true;
}

// Get all moves a fighter's hardware qualifies for.
// If specs + archetype provided, signature moves are included at the front.
function getAvailableMoves(stats, specs, archetype) {
  const pool = Object.entries(MOVE_POOL)
    .filter(([, move]) => passesGate(move.gate, specs))
    .map(([name, move]) => ({ name, ...move }));

  if (specs && archetype) {
    const { generateSignatureMoves } = require('./signature');
    const sig = generateSignatureMoves(stats, specs, archetype);
    return [...sig, ...pool];
  }

  return pool;
}

// Score and auto-assign best 6 moves (2 signature + 4 from regular pool)
function assignMoveset(stats, specs, archetype) {
  // Get signature moves if possible
  let sigMoves = [];
  if (specs && archetype) {
    const { generateSignatureMoves } = require('./signature');
    sigMoves = generateSignatureMoves(stats, specs, archetype);
  }

  // Get regular pool (universal + qualified component moves)
  const regularPool = Object.entries(MOVE_POOL)
    .filter(([, move]) => passesGate(move.gate, specs))
    .map(([name, move]) => ({ name, ...move }));

  const scored = regularPool.map(move => {
    const statVal = stats[move.base] || 0;
    return { ...move, score: statVal * move.mult };
  });
  scored.sort((a, b) => b.score - a.score);

  // Pick best per category from regular pool, then fill
  const selected = [];
  const usedNames = new Set(sigMoves.map(m => m.name));

  for (const cat of ['physical', 'magic', 'speed', 'special']) {
    const best = scored.find(s => s.cat === cat && !usedNames.has(s.name));
    if (best) { selected.push(best); usedNames.add(best.name); }
  }

  // Fill remaining slots from top scorers
  const regularSlots = MOVESET_SLOTS - sigMoves.length;
  for (const s of scored) {
    if (selected.length >= regularSlots) break;
    if (!usedNames.has(s.name)) { selected.push(s); usedNames.add(s.name); }
  }

  return [...sigMoves, ...selected.slice(0, regularSlots)];
}

// ─── Loadout persistence ───

function ensureDir() {
  if (!fs.existsSync(WSO_DIR)) fs.mkdirSync(WSO_DIR, { recursive: true });
}

function loadLoadout() {
  try {
    if (!fs.existsSync(LOADOUT_FILE)) return null;
    return JSON.parse(fs.readFileSync(LOADOUT_FILE, 'utf8'));
  } catch { return null; }
}

function saveLoadout(moveNames) {
  ensureDir();
  fs.writeFileSync(LOADOUT_FILE, JSON.stringify(moveNames, null, 2));
}

function resolveMoveNames(moveNames, stats, specs, archetype) {
  if (!Array.isArray(moveNames) || moveNames.length === 0) return [];

  let sigLookup = {};
  if (specs && archetype) {
    const { generateSignatureMoves } = require('./signature');
    const sig = generateSignatureMoves(stats, specs, archetype);
    sigLookup = Object.fromEntries(sig.map(m => [m.name, m]));
  }

  return moveNames
    .map(name => {
      if (sigLookup[name]) return sigLookup[name];
      const move = MOVE_POOL[name];
      if (!move) return null;
      if (!passesGate(move.gate, specs)) return null;
      return { name, ...move };
    })
    .filter(Boolean);
}

// Get equipped moves — either from saved loadout or auto-assigned.
// Supports migration from old 4-move loadouts to 6-move loadouts.
function getEquippedMoves(stats, specs, archetype) {
  const saved = loadLoadout();
  if (saved && Array.isArray(saved) && saved.length >= 4) {
    const equipped = resolveMoveNames(saved, stats, specs, archetype);
    if (equipped.length >= MOVESET_SLOTS) return equipped.slice(0, MOVESET_SLOTS);

    // Migration: old 4-move loadout — auto-fill remaining slots
    if (equipped.length >= 4 && equipped.length < MOVESET_SLOTS) {
      const full = assignMoveset(stats, specs, archetype);
      const usedNames = new Set(equipped.map(m => m.name));
      for (const m of full) {
        if (equipped.length >= MOVESET_SLOTS) break;
        if (!usedNames.has(m.name)) { equipped.push(m); usedNames.add(m.name); }
      }
      return equipped.slice(0, MOVESET_SLOTS);
    }
  }
  // Fallback to auto-assignment
  return assignMoveset(stats, specs, archetype);
}

module.exports = {
  MOVE_POOL, UNIVERSAL_MOVES, COMPONENT_MOVES, MOVESET_SLOTS,
  getAvailableMoves, assignMoveset, passesGate,
  loadLoadout, saveLoadout, resolveMoveNames, getEquippedMoves,
};
