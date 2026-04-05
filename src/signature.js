// ═══════��══════════════════════════════���════════════════════════
// SIGNATURE MOVES — Pool of 50 hardware-derived unique moves
// Each fighter gets 2 deterministically via hardware hash.
// All signatures have cooldown: 3 (use once, wait 3 turns).
// ══════════���════════════════════════════════════════════════════

const { rgb } = require('./palette');
const { getCpuBrand, getGpuBrand } = require('./hwutil');

// ─── Hardware brand fragments for move naming ───

const CPU_NAMES = {
  amd:   ['Ryzen', 'Zen', 'Threadripper'],
  intel: ['Core', 'Raptor', 'Alder'],
  apple: ['Silicon', 'Neural', 'Fusion'],
};

const GPU_NAMES = {
  nvidia: ['CUDA', 'Tensor', 'RTX'],
  amd:    ['Radeon', 'RDNA', 'Navi'],
  intel:  ['Arc', 'Xe', 'Alchemist'],
};

// ═══════��═══════════════════════════════════════════════════════
// ULTIMATE TEMPLATES — 12 per stat (48 total) + keyed by dominant stat
// Each fighter gets 1 ultimate from their dominant stat pool
// ═══════════════════════════���═══════════════════════════════════

const ULTIMATE_TEMPLATES = {
  str: [
    { suffix: 'Annihilator',      desc: 'sys.destroy(ALL)',        flavor: 'Every core fires at maximum — nothing survives the cycle',           special: null,    mult: 1.7 },
    { suffix: 'Meltdown',         desc: 'thermal.critical()',      flavor: 'Pushes past TDP into catastrophic output',                          special: 'stun',  mult: 1.5 },
    { suffix: 'Executioner',      desc: 'kill -9 -1',              flavor: 'Terminates every process — including the opponent',                  special: null,    mult: 1.8 },
    { suffix: 'Core Implosion',   desc: 'core.collapse(ALL)',      flavor: 'All cores implode inward then detonate outward',                    special: null,    mult: 1.6 },
    { suffix: 'Thermal Nuke',     desc: 'TDP.exceed(300%)',        flavor: 'Thermal output so extreme it melts silicon',                        special: 'dot',   mult: 1.5 },
    { suffix: 'Clock Destroyer',  desc: 'clock.shatter()',         flavor: 'Shatters the crystal oscillator — timing is annihilated',           special: 'debuff',mult: 1.5 },
    { suffix: 'Silicon Breaker',  desc: 'die.fracture()',          flavor: 'Cracks the silicon die clean through',                              special: null,    mult: 1.8 },
    { suffix: 'Voltage Spike',    desc: 'VRM.overload()',          flavor: 'VRM delivers a lethal voltage spike',                               special: 'stun',  mult: 1.6 },
    { suffix: 'Die Shot',         desc: 'litho.expose(EUV)',       flavor: 'EUV lithography burns the opponent at nanometer precision',          special: null,    mult: 1.7 },
    { suffix: 'Overclock Omega',  desc: 'OC.beyond(limits)',       flavor: 'Pushes voltage past all safe limits — devastating but reckless',    special: null,    mult: 1.9, selfDamage: 0.10 },
    { suffix: 'Process Kill',     desc: 'sigkill.broadcast()',     flavor: 'SIGKILL broadcast — every process terminated instantly',             special: 'pierce',mult: 1.6 },
    { suffix: 'Instruction Storm',desc: 'IPC.flood(MAX)',          flavor: 'Instructions per cycle pushed to theoretical maximum',              special: null,    mult: 1.5 },
  ],
  mag: [
    { suffix: 'Singularity',      desc: 'vram.collapse(∞)',        flavor: 'Infinite shader cores converge on a single point',                  special: null,    mult: 1.7 },
    { suffix: 'Supernova',         desc: 'render.overload()',       flavor: 'The GPU outputs more frames than reality can hold',                 special: null,    mult: 1.8 },
    { suffix: 'Oblivion',          desc: 'shader.void()',           flavor: 'All pixels collapse into a black hole of compute',                  special: 'stun',  mult: 1.5 },
    { suffix: 'Shader Apocalypse', desc: 'shader.all(DESTROY)',     flavor: 'Every shader unit fires simultaneously — total annihilation',       special: null,    mult: 1.6 },
    { suffix: 'Voxel Collapse',    desc: 'voxel.implode()',         flavor: '3D space itself collapses into compute fragments',                  special: 'dot',   mult: 1.5 },
    { suffix: 'Render Oblivion',   desc: 'pipeline.overflow()',     flavor: 'Render pipeline overwhelmed — frames corrupt reality',              special: 'debuff',mult: 1.5 },
    { suffix: 'Pixel Annihilation',desc: 'px.destroy(ALL)',         flavor: 'Every pixel weaponized into pure destructive energy',               special: null,    mult: 1.8 },
    { suffix: 'Ray Convergence',   desc: 'rt.focus(SINGLE_POINT)', flavor: 'All ray tracing cores converge on one devastating point',           special: 'pierce',mult: 1.6 },
    { suffix: 'Texture Bomb',      desc: 'tex.detonate(4K)',        flavor: 'Texture memory detonates in a cascade of high-res destruction',    special: null,    mult: 1.7 },
    { suffix: 'VRAM Supernova',    desc: 'vram.critical()',         flavor: 'All VRAM reaches critical mass and explodes',                      special: null,    mult: 1.9, selfDamage: 0.10 },
    { suffix: 'Compute Apocalypse',desc: 'compute.max(∞)',          flavor: 'Compute shader count approaches infinity',                         special: null,    mult: 1.6 },
    { suffix: 'Frame Singularity', desc: 'fps.collapse(0)',         flavor: 'Framerate collapses to zero — time stops for the opponent',         special: 'stun',  mult: 1.5 },
  ],
  spd: [
    { suffix: 'Lightspeed',        desc: 'io.warp(c)',              flavor: 'Moves faster than the bus can clock — pure speed',                 special: 'pierce',mult: 1.6 },
    { suffix: 'Blitz Protocol',    desc: 'dma.burst(MAX)',          flavor: 'Bypasses every buffer, every cache — direct hit',                  special: 'pierce',mult: 1.5 },
    { suffix: 'Overclock Zero',    desc: 'clock.infinite()',        flavor: 'Time stops. Only you move.',                                       special: null,    mult: 1.8 },
    { suffix: 'Instant Transfer',  desc: 'dma.zero_copy()',         flavor: 'Zero-copy transfer — damage arrives before the signal',            special: null,    mult: 1.7 },
    { suffix: 'Zero Latency',      desc: 'latency.eliminate()',     flavor: 'All latency removed — attack is instantaneous',                    special: 'stun',  mult: 1.6 },
    { suffix: 'Warp Strike',       desc: 'bus.warp(PCIe)',          flavor: 'Warps through the PCIe bus at impossible speed',                   special: null,    mult: 1.5 },
    { suffix: 'DMA Annihilation',  desc: 'dma.override(ALL)',       flavor: 'Direct memory access overrides all protection',                    special: 'pierce',mult: 1.7 },
    { suffix: 'Queue Infinity',    desc: 'QD.infinite()',           flavor: 'Infinite queue depth — commands arrive before being sent',          special: null,    mult: 1.8 },
    { suffix: 'Bandwidth Tsunami', desc: 'BW.flood(TB/s)',          flavor: 'Terabytes per second of raw bandwidth flood',                      special: null,    mult: 1.6 },
    { suffix: 'Interrupt Cascade', desc: 'IRQ.cascade(ALL)',        flavor: 'Cascading interrupt storm paralyzes all processing',               special: 'stun',  mult: 1.5 },
    { suffix: 'Bus Mastery',       desc: 'bus.master(ALL)',         flavor: 'Takes master control of every bus — total dominance',               special: null,    mult: 1.7 },
    { suffix: 'Nanosecond Kill',   desc: 'time.ns(1).kill()',       flavor: 'Attack completes in a single nanosecond — overkill speed',         special: null,    mult: 1.9, selfDamage: 0.10 },
  ],
  vit: [
    { suffix: 'Fortress Mode',     desc: 'mem.shield(∞)',           flavor: 'Allocates every byte into an impenetrable wall',                   special: 'harden',mult: 0.5 },
    { suffix: 'Endurance',          desc: 'swap.reclaim(ALL)',       flavor: 'Recovers from page faults that would kill lesser rigs',            special: 'heal',  mult: 0.7 },
    { suffix: 'Iron Curtain',       desc: 'firewall.max()',          flavor: 'No packet gets through — total isolation',                         special: 'harden',mult: 0.4 },
    { suffix: 'Memory Bastion',     desc: 'mem.fortify(ALL)',        flavor: 'Every memory address becomes a defensive stronghold',              special: 'heal',  mult: 0.6 },
    { suffix: 'Swap Sanctuary',     desc: 'swap.protect(∞)',         flavor: 'Virtual memory creates an impenetrable sanctuary',                 special: 'heal',  mult: 0.5 },
    { suffix: 'ECC Transcendence',  desc: 'ecc.perfect()',           flavor: 'Error correction reaches perfection — nothing gets through',       special: 'harden',mult: 0.3 },
    { suffix: 'Infinite Allocation',desc: 'alloc(∞)',                flavor: 'Infinite memory allocation powers massive recovery',               special: 'heal',  mult: 0.8 },
    { suffix: 'Page Table Fortress',desc: 'PT.lock(ALL)',            flavor: 'Page tables locked — memory access becomes impenetrable',          special: 'harden',mult: 0.4 },
  ],
};

// ════════════════════════���══════════════════════════════════════
// SYNERGY TEMPLATES — Based on top 2 stat combination
// Each fighter gets 1 synergy move from their top-2 stat combo
// ��═══════════════════════════════════════════════════════��══════

const SYNERGY_TEMPLATES = {
  'str+mag': [
    { name: 'Hybrid Compute',       desc: 'cpu+gpu.fuse()',          flavor: 'CPU and GPU merge into a single devastating pipeline',            cat: 'special',  base: 'str', altBase: 'mag', mult: 1.4, special: null },
    { name: 'Heterogeneous Nuke',   desc: 'hsa.launch()',            flavor: 'Unified compute obliterates all defenses',                       cat: 'special',  base: 'mag', altBase: 'str', mult: 1.3, special: 'debuff' },
  ],
  'str+spd': [
    { name: 'Turbo Execute',        desc: 'boost.max(ALL)',          flavor: 'Max clock speed meets max core count — instant annihilation',     cat: 'physical', base: 'str', altBase: 'spd', mult: 1.5, special: null },
    { name: 'Speculative Strike',   desc: 'spec.exec(branch)',       flavor: 'Attacks before the opponent even decides to defend',              cat: 'speed',    base: 'spd', altBase: 'str', mult: 1.4, special: 'pierce' },
  ],
  'str+vit': [
    { name: 'Brute Force',          desc: 'while(1)smash()',         flavor: 'Raw power backed by endless endurance',                          cat: 'physical', base: 'str', altBase: 'vit', mult: 1.3, special: null },
    { name: 'Workstation Crush',    desc: 'pro.render(FORCE)',       flavor: 'Server-grade hardware hammers with infinite stamina',             cat: 'physical', base: 'str', altBase: 'vit', mult: 1.2, special: 'debuff' },
  ],
  'mag+spd': [
    { name: 'Render Rush',          desc: 'gpu.stream(WARP)',        flavor: 'Frames render so fast they warp spacetime',                      cat: 'magic',    base: 'mag', altBase: 'spd', mult: 1.5, special: null },
    { name: 'Async Shaders',        desc: 'async.dispatch()',        flavor: 'Shader waves overlap — damage stacks before you blink',           cat: 'magic',    base: 'mag', altBase: 'spd', mult: 1.3, special: 'dot' },
  ],
  'mag+vit': [
    { name: 'Deep Learning',        desc: 'nn.train(epochs=∞)',      flavor: 'Neural network backed by infinite memory depth',                 cat: 'magic',    base: 'mag', altBase: 'vit', mult: 1.3, special: 'debuff' },
    { name: 'VRAM Fortress',        desc: 'gpu.mem.lock()',          flavor: 'Massive VRAM pool absorbs everything thrown at it',               cat: 'special',  base: 'vit', altBase: 'mag', mult: 0.5, special: 'heal' },
  ],
  'spd+vit': [
    { name: 'Cache Coherence',      desc: 'cache.sync(ALL)',         flavor: 'Every byte in the right place at the right time',                cat: 'speed',    base: 'spd', altBase: 'vit', mult: 1.3, special: null },
    { name: 'Hot Standby',          desc: 'raid.rebuild(live)',      flavor: 'Rebuilds while fighting — never goes down',                      cat: 'special',  base: 'vit', altBase: 'spd', mult: 0.6, special: 'heal' },
  ],
};

// ─── Deterministic hash from hardware ID for consistent selection ───
function simpleHash(str) {
  let h = 0;
  for (let i = 0; i < str.length; i++) {
    h = ((h << 5) - h + str.charCodeAt(i)) | 0;
  }
  return Math.abs(h);
}

// ─── Get the top 2 stats ───
function getTopStats(stats) {
  const ranked = [
    { key: 'str', val: stats.str },
    { key: 'mag', val: stats.mag },
    { key: 'spd', val: stats.spd },
    { key: 'vit', val: stats.vit || Math.round((stats.hp - 400) / 12) },
  ].sort((a, b) => b.val - a.val);

  return { first: ranked[0], second: ranked[1] };
}

// ─── Generate the two signature moves ���──
function generateSignatureMoves(stats, specs, archetype) {
  const hash = simpleHash(specs.id || 'default');
  const cpuBrand = getCpuBrand(specs);
  const gpuBrand = getGpuBrand(specs);
  const { first, second } = getTopStats(stats);

  // ── Move 1: Ultimate — based on highest stat ──
  const ultTemplates = ULTIMATE_TEMPLATES[first.key];
  const ultTemplate = ultTemplates[hash % ultTemplates.length];

  // Build the name from hardware brand + template suffix
  const brandNames = first.key === 'mag'
    ? GPU_NAMES[gpuBrand] || GPU_NAMES.nvidia
    : CPU_NAMES[cpuBrand] || CPU_NAMES.intel;
  const brandWord = brandNames[hash % brandNames.length];

  const ultCat = first.key === 'mag' ? 'magic'
    : first.key === 'spd' ? 'speed'
    : first.key === 'vit' ? 'special'
    : 'physical';

  const ultName = `${brandWord.toUpperCase()}_${ultTemplate.suffix.toUpperCase().replace(/\s+/g, '_')}`;

  const ultimateMove = {
    name: ultName,
    cat: ultCat,
    base: first.key === 'vit' ? 'vit' : first.key,
    mult: ultTemplate.mult,
    req: first.key === 'mag' ? 'gpu' : first.key === 'spd' ? 'spd' : first.key === 'vit' ? 'vit' : 'cpu',
    minStat: 0,
    label: `${brandWord} ${ultTemplate.suffix}`,
    desc: ultTemplate.desc,
    flavor: ultTemplate.flavor,
    special: ultTemplate.special,
    signature: true,
    tier: 'signature',
    cooldown: 3,
  };
  if (ultTemplate.selfDamage) {
    ultimateMove.selfDamage = ultTemplate.selfDamage;
  }

  // ── Move 2: Synergy — based on top 2 stat combo ──
  const comboKey = [first.key, second.key].sort().join('+');
  const synTemplates = SYNERGY_TEMPLATES[comboKey] || SYNERGY_TEMPLATES['str+mag'];
  const synTemplate = synTemplates[(hash >> 4) % synTemplates.length];

  const synName = synTemplate.name.toUpperCase().replace(/\s+/g, '_');

  const synergyMove = {
    name: synName,
    cat: synTemplate.cat,
    base: synTemplate.base,
    mult: synTemplate.mult,
    req: synTemplate.base === 'mag' ? 'gpu' : synTemplate.base === 'spd' ? 'spd' : synTemplate.base === 'vit' ? 'vit' : 'cpu',
    minStat: 0,
    label: synTemplate.name,
    desc: synTemplate.desc,
    flavor: synTemplate.flavor,
    special: synTemplate.special,
    signature: true,
    tier: 'signature',
    cooldown: 3,
    altBase: synTemplate.altBase,
  };

  return [ultimateMove, synergyMove];
}

// ─── Signature move color (distinct from regular categories) ───
const SIGNATURE_COLOR = rgb(255, 215, 0);       // bright gold
const SIGNATURE_ACCENT = rgb(255, 170, 50);      // warm amber
const SIGNATURE_ICON = '✦';

module.exports = {
  generateSignatureMoves,
  SIGNATURE_COLOR,
  SIGNATURE_ACCENT,
  SIGNATURE_ICON,
};
