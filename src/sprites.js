// ═══════════════════════════════════════════════════════════════════
// SPRITE CATALOG — Component-Assembly System (v2)
// Each fighter is built from 7 hardware-driven body parts:
//   HEAD      → CPU family  (Ryzen angular / Intel geometric / Apple smooth)
//   TORSO     → Overall tier (flagship massive / high solid / mid compact / low tiny)
//   SHOULDERS → RAM amount  (massive pauldrons → bare frame)
//   ARM       → GPU model   (THE showpiece — cannon, blade, pod, stub)
//   EMBLEM    → AIB brand   (ROG eye, MSI dragon, EVGA bolt, etc.)
//   ACCESSORY → Spec hash   (antenna, visor, horns, monocle, cables)
//   LEGS      → Storage type (NVMe thrusters / SSD stable / HDD clunky)
// Brand color themes are applied across ALL components.
// ═══════════════════════════════════════════════════════════════════

const { rgb, colors } = require('./palette');

// ─────────────────────────────────────────────
// §1  BRAND COLOR THEMES
// ─────────────────────────────────────────────

function makeTheme(o) {
  return {
    frame:    rgb(150, 158, 185),   frameDk:  rgb(95, 100, 128),
    frameLt:  rgb(185, 192, 215),   accent:   rgb(130, 220, 235),
    accentDk: rgb(80, 160, 180),    core:     rgb(100, 210, 230),
    coreDk:   rgb(55, 140, 165),    coreMed:  rgb(78, 175, 198),
    vent:     rgb(65, 70, 95),      ventLt:   rgb(80, 85, 110),
    eye:      rgb(230, 215, 140),   eyeOff:   rgb(75, 75, 95),
    leg:      rgb(85, 90, 108),     shadow:   rgb(38, 38, 52),
    emblem:   rgb(110, 180, 200),   data:     rgb(60, 100, 120),
    ...o,
  };
}

const THEMES = {
  nvidia_fe: makeTheme({
    frame: rgb(175, 180, 198), frameDk: rgb(120, 125, 145), frameLt: rgb(210, 215, 230),
    accent: rgb(118, 185, 0), accentDk: rgb(76, 135, 0),
    core: rgb(118, 200, 20), coreDk: rgb(70, 140, 10), coreMed: rgb(94, 170, 15),
    eye: rgb(118, 200, 20), emblem: rgb(100, 175, 15), data: rgb(55, 120, 5),
  }),
  asus_rog: makeTheme({
    frame: rgb(65, 65, 82), frameDk: rgb(40, 40, 55), frameLt: rgb(95, 95, 115),
    accent: rgb(220, 45, 45), accentDk: rgb(155, 25, 25),
    core: rgb(235, 55, 55), coreDk: rgb(160, 30, 30), coreMed: rgb(198, 42, 42),
    eye: rgb(235, 55, 55), emblem: rgb(200, 40, 40), data: rgb(130, 20, 20),
  }),
  msi: makeTheme({
    frame: rgb(75, 75, 92), frameDk: rgb(48, 48, 62), frameLt: rgb(108, 108, 125),
    accent: rgb(210, 40, 40), accentDk: rgb(150, 20, 20),
    core: rgb(240, 80, 30), coreDk: rgb(170, 50, 15), coreMed: rgb(205, 65, 22),
    eye: rgb(240, 80, 30), emblem: rgb(210, 60, 20), data: rgb(140, 35, 10),
  }),
  evga: makeTheme({
    frame: rgb(88, 92, 108), frameDk: rgb(58, 62, 78), frameLt: rgb(125, 130, 148),
    accent: rgb(0, 200, 80), accentDk: rgb(0, 140, 55),
    core: rgb(0, 220, 90), coreDk: rgb(0, 150, 60), coreMed: rgb(0, 185, 75),
    eye: rgb(0, 220, 90), emblem: rgb(0, 190, 70), data: rgb(0, 120, 45),
  }),
  gigabyte: makeTheme({
    frame: rgb(55, 65, 105), frameDk: rgb(35, 42, 72), frameLt: rgb(80, 92, 138),
    accent: rgb(240, 150, 30), accentDk: rgb(180, 105, 15),
    core: rgb(245, 160, 40), coreDk: rgb(180, 110, 20), coreMed: rgb(212, 135, 30),
    eye: rgb(245, 160, 40), emblem: rgb(225, 140, 25), data: rgb(150, 90, 10),
  }),
  amd_ref: makeTheme({
    frame: rgb(62, 62, 75), frameDk: rgb(40, 40, 52), frameLt: rgb(90, 90, 108),
    accent: rgb(200, 30, 30), accentDk: rgb(140, 15, 15),
    core: rgb(220, 40, 40), coreDk: rgb(150, 20, 20), coreMed: rgb(185, 30, 30),
    eye: rgb(220, 40, 40), emblem: rgb(190, 25, 25), data: rgb(120, 12, 12),
  }),
  sapphire: makeTheme({
    frame: rgb(70, 100, 168), frameDk: rgb(45, 65, 118), frameLt: rgb(100, 135, 200),
    accent: rgb(80, 145, 230), accentDk: rgb(50, 100, 175),
    core: rgb(90, 160, 245), coreDk: rgb(55, 110, 185), coreMed: rgb(72, 135, 215),
    eye: rgb(90, 160, 245), emblem: rgb(75, 140, 220), data: rgb(40, 90, 160),
  }),
  powercolor: makeTheme({
    frame: rgb(48, 42, 52), frameDk: rgb(30, 25, 35), frameLt: rgb(72, 65, 78),
    accent: rgb(190, 20, 20), accentDk: rgb(130, 10, 10),
    core: rgb(210, 25, 25), coreDk: rgb(140, 12, 12), coreMed: rgb(175, 18, 18),
    eye: rgb(210, 25, 25), emblem: rgb(180, 15, 15), data: rgb(110, 8, 8),
  }),
  intel_arc: makeTheme({
    frame: rgb(50, 95, 185), frameDk: rgb(30, 62, 135), frameLt: rgb(75, 125, 218),
    accent: rgb(220, 225, 240), accentDk: rgb(160, 165, 180),
    core: rgb(60, 140, 245), coreDk: rgb(35, 95, 185), coreMed: rgb(48, 118, 215),
    eye: rgb(60, 140, 245), emblem: rgb(50, 120, 220), data: rgb(25, 75, 150),
  }),
  apple: makeTheme({
    frame: rgb(185, 188, 198), frameDk: rgb(145, 148, 158), frameLt: rgb(215, 218, 228),
    accent: rgb(225, 228, 238), accentDk: rgb(175, 178, 188),
    core: rgb(230, 232, 242), coreDk: rgb(180, 182, 192), coreMed: rgb(205, 207, 217),
    eye: rgb(230, 232, 242), vent: rgb(155, 158, 168), ventLt: rgb(170, 173, 183),
    emblem: rgb(200, 203, 215), data: rgb(140, 143, 155),
  }),
  generic: makeTheme({
    frame: rgb(105, 108, 125), frameDk: rgb(72, 75, 90), frameLt: rgb(138, 142, 158),
    accent: rgb(130, 135, 155), accentDk: rgb(90, 95, 112),
    core: rgb(140, 145, 165), coreDk: rgb(95, 100, 118), coreMed: rgb(118, 122, 142),
    eye: rgb(140, 145, 165), emblem: rgb(115, 120, 140), data: rgb(75, 78, 95),
  }),
};

// ─────────────────────────────────────────────
// §2  HARDWARE DETECTION (expanded)
// ─────────────────────────────────────────────

const GPU_TIERS = {
  flagship: ['5090','4090','3090','titan','7900 xtx','7900xtx','radeon vii','rx 9070 xtx','9070 xtx'],
  high:     ['5080','4080','3080','2080 ti','2080ti','7900 xt','7900xt','7800 xt','7800xt','6900 xt','6900xt','6800 xt','6800xt','rx 9070','arc a770'],
  mid:      ['5070','4070','3070','3060 ti','3060ti','2070','2060','7700 xt','7700xt','7600','6700 xt','6700xt','6600 xt','6600xt','arc a750','arc a580','1080 ti','1080ti','1080'],
};

const BRAND_PATTERNS = [
  { brand: 'asus_rog',   patterns: ['rog','asus','strix','tuf'] },
  { brand: 'msi',        patterns: ['msi','gaming x','gaming z','suprim','ventus'] },
  { brand: 'evga',       patterns: ['evga','ftw','xc3','kingpin'] },
  { brand: 'gigabyte',   patterns: ['gigabyte','aorus','eagle','gaming oc','windforce'] },
  { brand: 'sapphire',   patterns: ['sapphire','pulse','nitro'] },
  { brand: 'powercolor', patterns: ['powercolor','red devil','red dragon','hellhound'] },
];

function classifyGPU(model) {
  const m = model.toLowerCase();
  if (/50[89]0/.test(m) || /4090/.test(m) || /titan/i.test(m))    return 'nvidia_flagship';
  if (/40[78]0|3080|5070 ti/.test(m))                              return 'nvidia_high';
  if (/40[67]0|30[67]0|20[67]0|10[78]0/.test(m))                  return 'nvidia_mid';
  if (/7900\s*xtx|9070\s*xtx/i.test(m))                           return 'amd_flagship';
  if (/7[89]00\s*xt|6[89]00\s*xt|9070(?!\s*xtx)/i.test(m))       return 'amd_high';
  if (/7[67]00|6[67]00/i.test(m))                                  return 'amd_mid';
  if (/arc\s*a[0-9]/i.test(m))                                     return 'intel_arc';
  if (/apple|m[1-4]/i.test(m))                                     return 'apple';
  return 'integrated';
}

function classifyCPU(brand) {
  const b = brand.toLowerCase();
  if (/ryzen\s*(9|7)/i.test(b))                                    return 'ryzen_high';
  if (/ryzen\s*(5|3)/i.test(b))                                    return 'ryzen_mid';
  if (/i[97]-|core.*(i9|i7|ultra\s*9|ultra\s*7)/i.test(b))        return 'intel_high';
  if (/i[53]-|core.*(i5|i3|ultra\s*5)/i.test(b))                  return 'intel_mid';
  if (/m[1-4]\s*(max|ultra|pro)/i.test(b) || /apple/i.test(b))    return 'apple';
  if (/celeron|pentium|atom|n[0-9]{4}/i.test(b))                   return 'celeron';
  return 'generic';
}

// Deterministic hash from string → 0..max
function specHashOf(str, max) {
  let h = 0;
  for (let i = 0; i < str.length; i++) h = ((h << 5) - h + str.charCodeAt(i)) | 0;
  return ((h % max) + max) % max;
}

function identifyHardware(specs) {
  const model = (specs.gpu?.model || '').toLowerCase();
  const vendor = (specs.gpu?.vendor || '').toLowerCase();
  const vram = specs.gpu?.vramMB || 0;

  let tier = 'low';
  for (const [t, keywords] of Object.entries(GPU_TIERS)) {
    if (keywords.some(kw => model.includes(kw))) { tier = t; break; }
  }
  if (tier === 'low' && vram > 0) {
    if (vram >= 16000) tier = 'flagship';
    else if (vram >= 8000) tier = 'high';
    else if (vram >= 4000) tier = 'mid';
  }

  let brand = 'generic';
  if (model.includes('apple') || model.includes('m1') || model.includes('m2') || model.includes('m3') || model.includes('m4') || vendor.includes('apple')) {
    brand = 'apple';
  } else if ((model.includes('uhd') || model.includes('iris') || model.includes('hd graphics')) && !model.includes('arc')) {
    brand = 'generic'; tier = 'low';
  } else if (model.includes('arc') && (vendor.includes('intel') || model.includes('intel'))) {
    brand = 'intel_arc';
  } else {
    let foundAIB = false;
    for (const { brand: b, patterns } of BRAND_PATTERNS) {
      if (patterns.some(p => model.includes(p))) { brand = b; foundAIB = true; break; }
    }
    if (!foundAIB) {
      if (vendor.includes('nvidia') || model.includes('nvidia') || model.includes('geforce') || model.includes('rtx') || model.includes('gtx')) brand = 'nvidia_fe';
      else if (vendor.includes('amd') || vendor.includes('advanced micro') || model.includes('radeon') || model.includes('amd')) brand = 'amd_ref';
    }
  }

  const gpuFamily = classifyGPU(specs.gpu?.model || '');
  const cpuFamily = classifyCPU(specs.cpu?.brand || '');
  const storage = specs.storage?.type || 'SSD';

  // New fields for variety
  const ramGB = specs.ram?.totalGB || 0;
  const ram = ramGB >= 64 ? 'massive' : ramGB >= 32 ? 'heavy' : ramGB >= 16 ? 'light' : 'minimal';

  const cores = specs.cpu?.cores || 4;
  const coreClass = cores >= 12 ? 'many' : cores >= 4 ? 'quad' : 'few';

  const isLaptop = !!specs.isLaptop;

  // Deterministic hash from combined model+cpu string for accessory selection
  const hashStr = (specs.gpu?.model || '') + ':' + (specs.cpu?.brand || '') + ':' + storage;
  const specHash = specHashOf(hashStr, 6);

  return { tier, brand, gpuFamily, cpuFamily, storage, ram, coreClass, isLaptop, specHash };
}

// ─────────────────────────────────────────────
// §2.5  ANIMATION HELPERS
// ─────────────────────────────────────────────

// Multi-state cycle: returns index 0..states-1
function cycle(frame, period, states) {
  return Math.floor((frame % period) / (period / states));
}

// Vent breathing characters (4-state shimmer)
const VENT_CHARS = ['░', '▒', '▓', '▒'];
function ventChar(frame, period, offset) {
  return VENT_CHARS[cycle(frame + (offset || 0), period, 4)];
}

// Fan spin characters (4-state rotation)
const FAN_CHARS = ['◎', '◉', '●', '◉'];
function fanChar(frame, period, offset) {
  return FAN_CHARS[cycle(frame + (offset || 0), period, 4)];
}

// Core glow color: 4-state pulse dim→med→bright→med
function coreGlow(frame, period, t) {
  return [t.coreDk, t.coreMed, t.core, t.coreMed][cycle(frame, period, 4)];
}

// Eye expression state for front views
function eyeState(frame, period) {
  const p = period || 130;
  const f = frame % p;
  if (f < 55) return 'center';
  if (f < 65) return 'left';
  if (f < 82) return 'center';
  if (f < 92) return 'right';
  if (f < 120) return 'center';
  return 'blink';
}

// Eye character based on expression state + eye style
function eyeChar(frame, period, style) {
  const st = eyeState(frame, period);
  if (st === 'blink') return '─';
  if (style === 'diamond') return st === 'left' ? '◇' : st === 'right' ? '◈' : '◆';
  if (style === 'round')   return st === 'left' ? '◔' : st === 'right' ? '◕' : '●';
  if (style === 'dot')     return st === 'left' ? '·' : st === 'right' ? '·' : '·';
  if (style === 'sharp')   return st === 'left' ? '◁' : st === 'right' ? '▷' : '◈';
  return st === 'left' ? '◁' : st === 'right' ? '▷' : '◈'; // default sharp
}

// Data stream particle: returns char or null for occasional drift-up particles
function dataParticle(frame, x, baseY, tier) {
  if (tier !== 'flagship' && tier !== 'high') return null;
  const period = tier === 'flagship' ? 40 : 60;
  const f = (frame + x * 7) % period;
  if (f > 4) return null;
  return { char: f < 2 ? '·' : '°', y: baseY - f };
}


// ═══════════════════════════════════════════════════════════════
// §3  BACK VIEW COMPONENTS (player — bottom-left, larger)
// ═══════════════════════════════════════════════════════════════
// Coordinate system: ox,oy is top-left of bounding box.
// Torso occupies cols 2-11, rows 2-8.
// GPU arm extends RIGHT from col 12+.
// Head occupies cols 3-10, rows 0-1.
// Legs occupy cols 3-10, rows 9-10.

// ─── CPU HEADS (back view — seen from behind) ───

function headBack_ryzenHigh(s, ox, oy, t, frame, hw) {
  // Wide angular head with exposed pin array — aggressive, multi-core
  const p = cycle(frame, 32, 4);
  const pinA = p < 2 ? '░' : '▒';
  const pinB = p >= 1 && p <= 2 ? '░' : '▒';
  s.set(ox+3, oy, '╔', t.accent);
  s.set(ox+4, oy, '▄', t.frameLt);
  s.set(ox+5, oy, '█', t.frame);
  s.set(ox+6, oy, '▄', t.accent); s.set(ox+7, oy, '▄', t.accent);
  s.set(ox+8, oy, '█', t.frame);
  s.set(ox+9, oy, '▄', t.frameDk);
  s.set(ox+10, oy, '╗', t.accentDk);
  // Row 1: head body with animated pin grid (more pins for more cores)
  s.set(ox+2, oy+1, '█', t.frameLt);
  const many = hw && hw.coreClass === 'many';
  s.set(ox+3, oy+1, many ? '▓' : '█', many ? t.vent : t.frame);
  s.set(ox+4, oy+1, pinA, t.accent);
  s.set(ox+5, oy+1, '▓', t.vent);
  s.set(ox+6, oy+1, pinB, t.accent);
  s.set(ox+7, oy+1, '▓', t.vent);
  s.set(ox+8, oy+1, pinA, t.accent);
  s.set(ox+9, oy+1, many ? '▓' : '█', many ? t.vent : t.frame);
  s.set(ox+10, oy+1, '█', t.frameDk);
  s.set(ox+11, oy+1, '▌', t.shadow);
}

function headBack_ryzenMid(s, ox, oy, t, frame) {
  const p = cycle(frame, 36, 4);
  const pin = p < 2 ? '░' : '▒';
  s.set(ox+4, oy, '▄', t.frameLt);
  s.set(ox+5, oy, '█', t.frame); s.set(ox+6, oy, '▄', t.accent);
  s.set(ox+7, oy, '█', t.frame); s.set(ox+8, oy, '▄', t.frameDk);
  s.set(ox+3, oy+1, '█', t.frameLt);
  s.set(ox+4, oy+1, pin, t.accent);
  s.set(ox+5, oy+1, '▓', t.vent);
  s.set(ox+6, oy+1, pin, t.accent);
  s.set(ox+7, oy+1, '▓', t.vent);
  s.set(ox+8, oy+1, pin, t.accent);
  s.set(ox+9, oy+1, '█', t.frameDk);
}

function headBack_intelHigh(s, ox, oy, t, frame) {
  // Sharp geometric head — clean lines, wide LED strip
  const p = cycle(frame, 28, 4);
  const led = [t.accentDk, t.accent, t.core, t.accent][p];
  s.set(ox+4, oy, '╔', t.frameLt);
  s.set(ox+5, oy, '═', t.frame);  s.set(ox+6, oy, '═', t.frame);
  s.set(ox+7, oy, '═', t.frame);  s.set(ox+8, oy, '╗', t.frameDk);
  s.set(ox+3, oy+1, '█', t.frameLt);
  s.set(ox+4, oy+1, '█', t.frame);
  s.set(ox+5, oy+1, '█', led);
  s.set(ox+6, oy+1, '█', led);
  s.set(ox+7, oy+1, '█', led);
  s.set(ox+8, oy+1, '█', t.frame);
  s.set(ox+9, oy+1, '█', t.frameDk);
}

function headBack_intelMid(s, ox, oy, t, frame) {
  const p = cycle(frame, 36, 4);
  const led = p >= 2 ? t.accent : t.accentDk;
  s.set(ox+4, oy, '▄', t.frameLt);
  s.set(ox+5, oy, '═', t.frame); s.set(ox+6, oy, '═', t.frame);
  s.set(ox+7, oy, '═', t.frame); s.set(ox+8, oy, '▄', t.frameDk);
  s.set(ox+3, oy+1, '█', t.frameLt);
  s.set(ox+4, oy+1, '▓', t.vent);
  s.set(ox+5, oy+1, '█', led);
  s.set(ox+6, oy+1, '▓', t.vent);
  s.set(ox+7, oy+1, '█', led);
  s.set(ox+8, oy+1, '▓', t.vent);
  s.set(ox+9, oy+1, '█', t.frameDk);
}

function headBack_apple(s, ox, oy, t, frame) {
  // Smooth rounded — minimal, clean curves
  const breath = cycle(frame, 80, 4);
  const v = breath === 2 ? t.ventLt : t.vent;
  s.set(ox+4, oy, '╭', t.frameLt);
  s.set(ox+5, oy, '─', t.frame); s.set(ox+6, oy, '─', t.frame);
  s.set(ox+7, oy, '─', t.frame); s.set(ox+8, oy, '╮', t.frameDk);
  s.set(ox+3, oy+1, '│', t.frameLt);
  s.set(ox+4, oy+1, ' ');
  s.set(ox+5, oy+1, '░', v); s.set(ox+6, oy+1, '░', v); s.set(ox+7, oy+1, '░', v);
  s.set(ox+8, oy+1, ' ');
  s.set(ox+9, oy+1, '│', t.frameDk);
}

function headBack_celeron(s, ox, oy, t, frame) {
  // Tiny round blob — the underdog, crooked antenna
  const wobble = cycle(frame, 50, 4);
  s.set(ox+5, oy-1, wobble < 2 ? '╻' : '╹', t.accent); // crooked antenna
  s.set(ox+5, oy, '▄', t.frameLt); s.set(ox+6, oy, '▄', t.frame);
  s.set(ox+7, oy, '▄', t.frameDk);
  s.set(ox+5, oy+1, '█', t.frameLt);
  s.set(ox+6, oy+1, '▓', t.vent);
  s.set(ox+7, oy+1, '█', t.frameDk);
}

function headBack_generic(s, ox, oy, t, frame) {
  headBack_intelMid(s, ox, oy, t, frame);
}

// ─── TORSO (back view) — now with breathing vent animation ───

function torsoBack_flagship(s, ox, oy, t, frame) {
  const r = oy + 2;
  const breath = cycle(frame, 60, 4);
  // Row 2: shoulders — extra wide
  s.set(ox+1, r, '▐', t.frameLt);
  for (let i=2;i<=11;i++) s.set(ox+i, r, '█', t.frame);
  s.set(ox+12, r, '▌', t.frameDk);
  // Row 3-6: body with circuit-trace vent pattern
  for (let row=1;row<=4;row++) {
    s.set(ox+1, r+row, '▐', t.frameLt);
    s.set(ox+2, r+row, '█', t.frame);
    s.set(ox+3, r+row, '█', t.frame);
    // Circuit trace pattern instead of flat ▒
    for (let i=4;i<=9;i++) {
      const isTrace = (row + i) % 3 === 0;
      s.set(ox+i, r+row, isTrace ? '┼' : ventChar(frame, 60, row * 4 + i), isTrace ? t.ventLt : t.vent);
    }
    s.set(ox+10, r+row, '█', t.frame);
    s.set(ox+11, r+row, '█', t.frameDk);
    s.set(ox+12, r+row, '▌', t.shadow);
  }
  // Row 7: waist belt with power connector
  s.set(ox+1, r+5, '▐', t.frameLt);
  s.set(ox+2, r+5, '═', t.accent);
  for (let i=3;i<=10;i++) s.set(ox+i, r+5, '█', t.frame);
  s.set(ox+11, r+5, '═', t.accentDk);
  s.set(ox+12, r+5, '▌', t.shadow);
  // Cascading accent spine — wave pulse down
  const spinePhase = cycle(frame, 40, 4);
  for (let row=1;row<=4;row++) {
    const active = ((spinePhase + row) % 4) < 2;
    s.set(ox+6, r+row, '║', active ? t.accent : t.accentDk);
    s.set(ox+7, r+row, '║', active ? t.accentDk : t.accent);
  }
  // Power connector detail on side
  s.set(ox+12, r+2, '▪', t.accent);
  s.set(ox+12, r+3, '▪', t.core);
  // Data stream particles for flagship
  const dp = dataParticle(frame, ox+6, r, 'flagship');
  if (dp) s.set(ox+6, dp.y, dp.char, t.data);
}

function torsoBack_high(s, ox, oy, t, frame) {
  const r = oy + 2;
  s.set(ox+1, r, '▐', t.frameLt);
  for (let i=2;i<=11;i++) s.set(ox+i, r, '█', t.frame);
  s.set(ox+12, r, '▌', t.frameDk);
  for (let row=1;row<=4;row++) {
    s.set(ox+1, r+row, '▐', t.frameLt);
    s.set(ox+2, r+row, '█', t.frame);
    for (let i=3;i<=10;i++) {
      const isTrace = (row + i) % 4 === 0;
      s.set(ox+i, r+row, isTrace ? '─' : ventChar(frame, 64, row * 3 + i), isTrace ? t.ventLt : t.vent);
    }
    s.set(ox+11, r+row, '█', t.frameDk);
    s.set(ox+12, r+row, '▌', t.shadow);
  }
  s.set(ox+1, r+5, '▐', t.frameLt);
  for (let i=2;i<=11;i++) s.set(ox+i, r+5, '█', t.frame);
  s.set(ox+12, r+5, '▌', t.shadow);
  // Data particles
  const dp = dataParticle(frame, ox+6, r, 'high');
  if (dp) s.set(ox+6, dp.y, dp.char, t.data);
}

function torsoBack_mid(s, ox, oy, t, frame) {
  const r = oy + 2;
  s.set(ox+2, r, '▐', t.frameLt);
  for (let i=3;i<=9;i++) s.set(ox+i, r, '█', t.frame);
  s.set(ox+10, r, '▌', t.frameDk);
  for (let row=1;row<=3;row++) {
    s.set(ox+2, r+row, '▐', t.frameLt);
    s.set(ox+3, r+row, '█', t.frame);
    for (let i=4;i<=8;i++) s.set(ox+i, r+row, ventChar(frame, 68, row * 5 + i), t.vent);
    s.set(ox+9, r+row, '█', t.frameDk);
    s.set(ox+10, r+row, '▌', t.shadow);
  }
  s.set(ox+2, r+4, '▐', t.frameLt);
  for (let i=3;i<=9;i++) s.set(ox+i, r+4, '█', t.frame);
  s.set(ox+10, r+4, '▌', t.shadow);
}

function torsoBack_low(s, ox, oy, t, frame) {
  const r = oy + 2;
  s.set(ox+4, r, '▐', t.frameLt);
  for (let i=5;i<=7;i++) s.set(ox+i, r, '█', t.frame);
  s.set(ox+8, r, '▌', t.frameDk);
  for (let row=1;row<=2;row++) {
    s.set(ox+4, r+row, '▐', t.frameLt);
    s.set(ox+5, r+row, ventChar(frame, 72, row), t.vent);
    s.set(ox+6, r+row, ventChar(frame, 72, row + 3), t.vent);
    s.set(ox+7, r+row, '█', t.frameDk);
    s.set(ox+8, r+row, '▌', t.shadow);
  }
  s.set(ox+4, r+3, '▐', t.frameLt);
  for (let i=5;i<=7;i++) s.set(ox+i, r+3, '█', t.frame);
  s.set(ox+8, r+3, '▌', t.shadow);
}

// ─── SHOULDERS (back view — RAM-based) ───

function shoulderBack_massive(s, ox, oy, t, frame) {
  // Wide pauldrons with data-stream channels
  const r = oy + 2;
  const glow = coreGlow(frame, 36, t);
  // Left pauldron
  s.set(ox, r, '╔', t.accent); s.set(ox, r+1, '║', glow); s.set(ox, r+2, '╚', t.accentDk);
  // Right pauldron
  s.set(ox+13, r, '╗', t.accent); s.set(ox+13, r+1, '║', glow); s.set(ox+13, r+2, '╝', t.accentDk);
  // Data channel marks
  s.set(ox, r+1, '║', glow);
  s.set(ox+13, r+1, '║', glow);
}

function shoulderBack_heavy(s, ox, oy, t, frame) {
  // Angular armor plates
  const r = oy + 2;
  s.set(ox, r, '▐', t.frameLt); s.set(ox, r+1, '▐', t.accent);
  s.set(ox+13, r, '▌', t.frameDk); s.set(ox+13, r+1, '▌', t.accentDk);
}

function shoulderBack_light(s, ox, oy, t) {
  // Minimal clips
  const r = oy + 2;
  s.set(ox+1, r, '▪', t.accent);
  s.set(ox+12, r, '▪', t.accentDk);
}

function shoulderBack_minimal() { /* bare frame — nothing */ }

// ─── CHEST EMBLEM (back view — brand-specific overlay) ───

function emblemBack_asus_rog(s, ox, oy, t, frame) {
  const glow = coreGlow(frame, 30, t);
  s.set(ox+6, oy+5, '◉', glow); s.set(ox+7, oy+5, '═', t.accent);
}

function emblemBack_msi(s, ox, oy, t, frame) {
  const glow = coreGlow(frame, 32, t);
  s.set(ox+6, oy+5, '▼', glow); s.set(ox+7, oy+5, '▼', t.accentDk);
}

function emblemBack_evga(s, ox, oy, t, frame) {
  const glow = coreGlow(frame, 28, t);
  s.set(ox+6, oy+5, '╱', t.accent); s.set(ox+7, oy+5, '╲', glow);
}

function emblemBack_gigabyte(s, ox, oy, t, frame) {
  const glow = coreGlow(frame, 34, t);
  s.set(ox+6, oy+5, '◆', glow); s.set(ox+7, oy+5, '◆', t.accentDk);
}

function emblemBack_sapphire(s, ox, oy, t, frame) {
  const glow = coreGlow(frame, 30, t);
  s.set(ox+6, oy+5, '◇', glow); s.set(ox+7, oy+5, '◆', t.accent);
}

function emblemBack_powercolor(s, ox, oy, t, frame) {
  const glow = coreGlow(frame, 26, t);
  s.set(ox+6, oy+5, '▲', glow); s.set(ox+7, oy+5, '▲', t.accentDk);
}

function emblemBack_nvidia_fe(s, ox, oy, t, frame) {
  const glow = coreGlow(frame, 30, t);
  s.set(ox+6, oy+5, '╲', t.accent); s.set(ox+7, oy+5, '╱', glow);
}

function emblemBack_amd_ref(s, ox, oy, t, frame) {
  const glow = coreGlow(frame, 28, t);
  s.set(ox+6, oy+5, '∞', glow);
}

function emblemBack_intel_arc(s, ox, oy, t, frame) {
  const glow = coreGlow(frame, 26, t);
  s.set(ox+6, oy+5, '◈', glow); s.set(ox+7, oy+5, '╬', t.accent);
}

function emblemBack_apple(s, ox, oy, t) {
  s.set(ox+6, oy+5, '●', t.accent);
}

function emblemBack_generic(s, ox, oy, t, frame) {
  const glow = coreGlow(frame, 40, t);
  s.set(ox+6, oy+5, '╬', glow);
}

// ─── ACCESSORY (back view — specHash-based) ───

function accessoryBack_0() { /* none */ }

function accessoryBack_1(s, ox, oy, t, frame) {
  // Antenna array
  const pulse = cycle(frame, 40, 2);
  s.set(ox+6, oy-1, '┃', t.frameLt);
  s.set(ox+6, oy-2, pulse ? '◦' : '·', t.accent);
}

function accessoryBack_2(s, ox, oy, t) {
  // Scanner visor bar across back of head
  s.set(ox+4, oy, '▬', t.accent); s.set(ox+5, oy, '▬', t.accent);
  s.set(ox+8, oy, '▬', t.accentDk); s.set(ox+9, oy, '▬', t.accentDk);
}

function accessoryBack_3(s, ox, oy, t) {
  // Data horns
  s.set(ox+3, oy-1, '╱', t.accent); s.set(ox+10, oy-1, '╲', t.accentDk);
}

function accessoryBack_4(s, ox, oy, t, frame) {
  // Holo disc (back view: small emitter on head)
  const glow = coreGlow(frame, 24, t);
  s.set(ox+10, oy, '◦', glow);
}

function accessoryBack_5(s, ox, oy, t) {
  // Cable tuft trailing from side
  s.set(ox+11, oy+1, '≈', t.vent); s.set(ox+12, oy+1, '~', t.vent);
}

// ─── GPU ARM/WEAPON (back view — extends RIGHT from torso) ───

function gpuBack_nvidiaFlagship(s, ox, oy, t, frame) {
  // MASSIVE triple-fan cannon with NVLink bridge detail
  const r = oy + 3;  const c = ox + 12;
  const fg = coreGlow(frame, 24, t);
  // NVLink bridge on top
  s.set(c+1, r-1, '═', t.accent); s.set(c+2, r-1, '▪', fg); s.set(c+3, r-1, '═', t.accent);
  // Barrel housing
  s.set(c, r, '╠', t.frameLt);
  s.set(c+1,r, '═', t.frame); s.set(c+2,r, '═', t.frame);
  s.set(c+3,r, '═', t.frame); s.set(c+4,r, '═', t.frame);
  s.set(c+5,r, '═', t.frame); s.set(c+6,r, '╗', t.frameDk);
  // Fan row 1 — 4-state spin with phase offsets
  s.set(c, r+1, '║', t.frameLt);
  s.set(c+1,r+1, fanChar(frame, 24, 0), fg);
  s.set(c+2,r+1, '▓', t.vent);
  s.set(c+3,r+1, fanChar(frame, 24, 6), fg);
  s.set(c+4,r+1, '▓', t.vent);
  s.set(c+5,r+1, fanChar(frame, 24, 12), fg);
  s.set(c+6,r+1, '║', t.frameDk);
  s.set(c+7,r+1, '▌', t.shadow);
  // Barrel mid
  s.set(c, r+2, '║', t.frameLt);
  s.set(c+1,r+2, '▓', t.vent);
  s.set(c+2,r+2, '█', t.frame);
  s.set(c+3,r+2, '█', fg);
  s.set(c+4,r+2, '█', t.frame);
  s.set(c+5,r+2, '▓', t.vent);
  s.set(c+6,r+2, '║', t.frameDk);
  s.set(c+7,r+2, '►', fg); // muzzle
  // Fan row 2 — reversed phase
  s.set(c, r+3, '║', t.frameLt);
  s.set(c+1,r+3, fanChar(frame, 24, 12), coreGlow(frame+12, 24, t));
  s.set(c+2,r+3, '▓', t.vent);
  s.set(c+3,r+3, fanChar(frame, 24, 18), coreGlow(frame+12, 24, t));
  s.set(c+4,r+3, '▓', t.vent);
  s.set(c+5,r+3, fanChar(frame, 24, 0), coreGlow(frame+12, 24, t));
  s.set(c+6,r+3, '║', t.frameDk);
  s.set(c+7,r+3, '▌', t.shadow);
  // Bottom housing
  s.set(c, r+4, '╚', t.frameLt);
  for (let i=1;i<=5;i++) s.set(c+i, r+4, '═', t.frame);
  s.set(c+6, r+4, '╝', t.frameDk);
  // Exhaust vents
  s.set(c+2,r+5, ventChar(frame, 20, 0), t.vent);
  s.set(c+3,r+5, ventChar(frame, 20, 5), t.vent);
  s.set(c+4,r+5, ventChar(frame, 20, 10), t.vent);
}

function gpuBack_nvidiaHigh(s, ox, oy, t, frame) {
  // Dual-fan rifle arm
  const r = oy + 3;  const c = ox + 12;
  const fg = coreGlow(frame, 28, t);
  s.set(c, r, '╠', t.frameLt);
  s.set(c+1,r, '═', t.frame); s.set(c+2,r, '═', t.frame);
  s.set(c+3,r, '═', t.frame); s.set(c+4,r, '╗', t.frameDk);
  s.set(c, r+1, '║', t.frameLt);
  s.set(c+1,r+1, fanChar(frame, 28, 0), fg);
  s.set(c+2,r+1, '▓', t.vent);
  s.set(c+3,r+1, fanChar(frame, 28, 7), fg);
  s.set(c+4,r+1, '║', t.frameDk);
  s.set(c+5,r+1, '▌', t.shadow);
  s.set(c, r+2, '║', t.frameLt);
  s.set(c+1,r+2, '█', t.frame);
  s.set(c+2,r+2, '█', fg);
  s.set(c+3,r+2, '█', t.frame);
  s.set(c+4,r+2, '║', t.frameDk);
  s.set(c+5,r+2, '►', fg);
  s.set(c, r+3, '║', t.frameLt);
  s.set(c+1,r+3, fanChar(frame, 28, 14), coreGlow(frame+14, 28, t));
  s.set(c+2,r+3, '▓', t.vent);
  s.set(c+3,r+3, fanChar(frame, 28, 21), coreGlow(frame+14, 28, t));
  s.set(c+4,r+3, '║', t.frameDk);
  s.set(c+5,r+3, '▌', t.shadow);
  s.set(c, r+4, '╚', t.frameLt);
  for (let i=1;i<=3;i++) s.set(c+i, r+4, '═', t.frame);
  s.set(c+4, r+4, '╝', t.frameDk);
}

function gpuBack_nvidiaMid(s, ox, oy, t, frame) {
  // Compact sidearm
  const r = oy + 4;  const c = ox + 10;
  const fg = coreGlow(frame, 32, t);
  s.set(c, r, '╠', t.frameLt);
  s.set(c+1,r, '═', t.frame); s.set(c+2,r, '╗', t.frameDk);
  s.set(c, r+1, '║', t.frameLt);
  s.set(c+1,r+1, fanChar(frame, 32, 0), fg);
  s.set(c+2,r+1, '║', t.frameDk);
  s.set(c+3,r+1, '►', t.accent);
  s.set(c, r+2, '╚', t.frameLt);
  s.set(c+1,r+2, '═', t.frame); s.set(c+2,r+2, '╝', t.frameDk);
}

function gpuBack_amdFlagship(s, ox, oy, t, frame) {
  // Angular blade weapon with exposed heat pipes — sharper edge
  const r = oy + 2;  const c = ox + 12;
  const fg = coreGlow(frame, 26, t);
  // Blade tip — sharper
  s.set(c+4, r, '╱', t.accent); s.set(c+5, r, '▄', t.accent); s.set(c+6, r, '▄', t.accentDk);
  // Upper blade
  s.set(c, r+1, '╠', t.frameLt);
  s.set(c+1,r+1, '▓', t.vent); s.set(c+2,r+1, '─', t.vent);
  s.set(c+3,r+1, '═', t.accent); s.set(c+4,r+1, '═', t.accent);
  s.set(c+5,r+1, '█', t.accent); s.set(c+6,r+1, '▌', t.shadow);
  // Core blade rows with heat pipe curves
  for (let row=2;row<=4;row++) {
    s.set(c, r+row, '║', t.frameLt);
    s.set(c+1,r+row, row===3?'█':'▒', row===3?fg:t.vent);
    s.set(c+2,r+row, row===3?'█':row===2?'╮':'╯', row===3?fg:t.vent);
    s.set(c+3,r+row, '█', t.accent);
    s.set(c+4,r+row, '█', row===3?fg:t.accent);
    s.set(c+5,r+row, '█', t.accentDk);
    s.set(c+6,r+row, '▌', t.shadow);
  }
  // Heat pipes
  s.set(c, r+5, '║', t.frameLt);
  s.set(c+1,r+5, '─', t.vent); s.set(c+2,r+5, '─', t.vent);
  s.set(c+3,r+5, '─', t.vent); s.set(c+4,r+5, '═', t.accent);
  s.set(c+5,r+5, '▀', t.accentDk);
  // Lower blade taper
  s.set(c, r+6, '╚', t.frameLt);
  s.set(c+1,r+6, '═', t.frame);
  s.set(c+2,r+6, '═', t.accent);
  s.set(c+3,r+6, '▀', t.accentDk);
}

function gpuBack_amdHigh(s, ox, oy, t, frame) {
  // Triple-fan backplate arm — staggered spin animation
  const r = oy + 2;  const c = ox + 12;
  const fg = coreGlow(frame, 26, t);
  // Top housing with accent
  s.set(c, r, '╠', t.frameLt);
  s.set(c+1,r, '═', t.accent); s.set(c+2,r, '═', t.frame);
  s.set(c+3,r, '═', t.frame); s.set(c+4,r, '═', t.frame);
  s.set(c+5,r, '═', t.accent); s.set(c+6,r, '╗', t.frameDk);
  // Fan row 1 — triple fans, staggered phase
  s.set(c, r+1, '║', t.frameLt);
  s.set(c+1,r+1, fanChar(frame, 20, 0), fg);
  s.set(c+2,r+1, '▓', t.vent);
  s.set(c+3,r+1, fanChar(frame, 20, 5), fg);
  s.set(c+4,r+1, '▓', t.vent);
  s.set(c+5,r+1, fanChar(frame, 20, 10), fg);
  s.set(c+6,r+1, '║', t.frameDk);
  s.set(c+7,r+1, '▌', t.shadow);
  // Backplate with heat pipes
  s.set(c, r+2, '║', t.frameLt);
  s.set(c+1,r+2, '─', t.vent); s.set(c+2,r+2, '█', t.accent);
  s.set(c+3,r+2, '█', fg);
  s.set(c+4,r+2, '█', t.accent); s.set(c+5,r+2, '─', t.vent);
  s.set(c+6,r+2, '║', t.frameDk);
  s.set(c+7,r+2, '▌', t.shadow);
  // Middle accent stripe
  s.set(c, r+3, '║', t.frameLt);
  s.set(c+1,r+3, '▓', t.vent);
  s.set(c+2,r+3, '═', t.accent); s.set(c+3,r+3, '═', t.accent);
  s.set(c+4,r+3, '═', t.accent); s.set(c+5,r+3, '▓', t.vent);
  s.set(c+6,r+3, '║', t.frameDk);
  s.set(c+7,r+3, '►', fg);
  // Fan row 2 — reversed phase
  s.set(c, r+4, '║', t.frameLt);
  s.set(c+1,r+4, fanChar(frame, 20, 10), coreGlow(frame+10, 26, t));
  s.set(c+2,r+4, '▓', t.vent);
  s.set(c+3,r+4, fanChar(frame, 20, 15), coreGlow(frame+10, 26, t));
  s.set(c+4,r+4, '▓', t.vent);
  s.set(c+5,r+4, fanChar(frame, 20, 0), coreGlow(frame+10, 26, t));
  s.set(c+6,r+4, '║', t.frameDk);
  s.set(c+7,r+4, '▌', t.shadow);
  // Bottom housing
  s.set(c, r+5, '╚', t.frameLt);
  for (let i=1;i<=5;i++) s.set(c+i, r+5, '═', t.frame);
  s.set(c+6, r+5, '╝', t.frameDk);
  // Exhaust
  s.set(c+2,r+6, ventChar(frame, 18, 0), t.vent);
  s.set(c+3,r+6, ventChar(frame, 18, 4), t.vent);
  s.set(c+4,r+6, ventChar(frame, 18, 9), t.vent);
}

function gpuBack_amdMid(s, ox, oy, t, frame) {
  // Small blade stub
  const r = oy + 4;  const c = ox + 10;
  const fg = coreGlow(frame, 34, t);
  s.set(c, r, '╠', t.frameLt);
  s.set(c+1,r, '═', t.accent); s.set(c+2,r, '▄', t.accentDk);
  s.set(c, r+1, '║', t.frameLt);
  s.set(c+1,r+1, '█', fg); s.set(c+2,r+1, '█', t.accent);
  s.set(c, r+2, '╚', t.frameLt); s.set(c+1,r+2, '═', t.frame); s.set(c+2,r+2, '▀', t.accent);
}

function gpuBack_intelArc(s, ox, oy, t, frame) {
  // Crystalline geometric arm — more faceted
  const r = oy + 3;  const c = ox + 12;
  const fg = coreGlow(frame, 22, t);
  s.set(c, r, '╠', t.frameLt);
  s.set(c+1,r, '▄', t.accent); s.set(c+2,r, '△', t.accent); s.set(c+3,r, '▄', t.accentDk);
  s.set(c, r+1, '║', t.frameLt);
  s.set(c+1,r+1, '◇', fg);
  s.set(c+2,r+1, '█', t.accent);
  s.set(c+3,r+1, '◇', coreGlow(frame+11, 22, t));
  s.set(c+4,r+1, '▌', t.shadow);
  s.set(c, r+2, '║', t.frameLt);
  s.set(c+1,r+2, '█', t.accent);
  s.set(c+2,r+2, '◆', fg);
  s.set(c+3,r+2, '█', t.accentDk);
  s.set(c+4,r+2, '▌', t.shadow);
  s.set(c, r+3, '║', t.frameLt);
  s.set(c+1,r+3, '◇', coreGlow(frame+11, 22, t));
  s.set(c+2,r+3, '█', t.accent);
  s.set(c+3,r+3, '◇', fg);
  s.set(c, r+4, '╚', t.frameLt);
  s.set(c+1,r+4, '▀', t.accent); s.set(c+2,r+4, '▽', t.accent); s.set(c+3,r+4, '▀', t.accentDk);
}

function gpuBack_apple(s, ox, oy, t, frame) {
  // Smooth minimal pod
  const r = oy + 4;  const c = ox + 10;
  const glow = coreGlow(frame, 40, t);
  s.set(c, r, '╭', t.frameLt); s.set(c+1,r, '─', t.frame); s.set(c+2,r, '╮', t.frameDk);
  s.set(c, r+1, '│', t.frameLt); s.set(c+1,r+1, '○', glow); s.set(c+2,r+1, '│', t.frameDk);
  s.set(c, r+2, '╰', t.frameLt); s.set(c+1,r+2, '─', t.frame); s.set(c+2,r+2, '╯', t.frameDk);
}

function gpuBack_integrated(s, ox, oy, t) {
  // Tiny stub
  const r = oy + 5;  const c = ox + 8;
  s.set(c, r, '▪', t.vent);
}

// ─── LEGS (back view) — with animation ───

function legsBack_nvme(s, ox, oy, t, frame) {
  // Thruster-style angular legs with animated exhaust
  const r = oy + 8;
  s.set(ox+3, r, '▀', t.frame); s.set(ox+4, r, '█', t.leg);
  s.set(ox+5, r, '▀', t.accent);
  s.set(ox+8, r, '▀', t.accent);
  s.set(ox+9, r, '█', t.leg); s.set(ox+10, r, '▀', t.frame);
  // Animated thruster exhaust
  s.set(ox+4, r+1, ventChar(frame, 16, 0), t.accent);
  s.set(ox+5, r+1, ventChar(frame, 16, 4), t.accentDk);
  s.set(ox+8, r+1, ventChar(frame, 16, 8), t.accentDk);
  s.set(ox+9, r+1, ventChar(frame, 16, 12), t.accent);
  s.set(ox+4, r+2, '▀', t.leg); s.set(ox+9, r+2, '▀', t.leg);
}

function legsBack_ssd(s, ox, oy, t, frame) {
  // Solid stable legs with LED indicator
  const r = oy + 8;
  const ledOn = cycle(frame, 80, 4) === 0;
  s.set(ox+3, r, '▀', t.frame); s.set(ox+4, r, '█', t.leg); s.set(ox+5, r, '▀', t.frame);
  s.set(ox+8, r, '▀', t.frame); s.set(ox+9, r, '█', t.leg); s.set(ox+10, r, '▀', t.frame);
  s.set(ox+4, r+1, '█', t.leg); s.set(ox+9, r+1, '█', t.leg);
  s.set(ox+4, r+2, '▀', t.leg); s.set(ox+9, r+2, '▀', t.leg);
  // Tiny LED
  s.set(ox+5, r+1, '·', ledOn ? t.accent : t.vent);
}

function legsBack_hdd(s, ox, oy, t, frame) {
  // Chunky heavy legs with spinning platter
  const r = oy + 8;
  const platter = cycle(frame, 30, 3);
  const pc = ['°', '·', '○'][platter];
  s.set(ox+2, r, '▀', t.frame); s.set(ox+3, r, '█', t.leg);
  s.set(ox+4, r, '█', t.leg); s.set(ox+5, r, '▀', t.frame);
  s.set(ox+8, r, '▀', t.frame); s.set(ox+9, r, '█', t.leg);
  s.set(ox+10, r, '█', t.leg); s.set(ox+11, r, '▀', t.frame);
  s.set(ox+3, r+1, '█', t.leg); s.set(ox+4, r+1, '█', t.leg);
  s.set(ox+9, r+1, '█', t.leg); s.set(ox+10, r+1, '█', t.leg);
  s.set(ox+3, r+2, '▀', t.leg); s.set(ox+4, r+2, '▀', t.leg);
  s.set(ox+9, r+2, '▀', t.leg); s.set(ox+10, r+2, '▀', t.leg);
  // Platter spin
  s.set(ox+3, r+1, pc, t.vent);
}


// ═══════════════════════════════════════════════════════════════
// §4  FRONT VIEW COMPONENTS (opponent — top-right, smaller)
// ═══════════════════════════════════════════════════════════════

// ─── CPU HEADS (front view) — with eye expression system ───

function headFront_ryzenHigh(s, ox, oy, t, frame) {
  const ec = eyeChar(frame, 130, 'sharp');
  const eblink = eyeState(frame, 130) === 'blink';
  s.set(ox+2, oy, '▄', t.accent); s.set(ox+3, oy, '▄', t.frameLt);
  for (let i=4;i<=7;i++) s.set(ox+i, oy, '▄', t.frame);
  s.set(ox+8, oy, '▄', t.frameDk); s.set(ox+9, oy, '▄', t.accentDk);
  s.set(ox+1, oy+1, '█', t.frameLt); s.set(ox+2, oy+1, '█', t.frame);
  s.set(ox+3, oy+1, ec, eblink ? t.frame : t.eye);
  s.set(ox+4, oy+1, '▒', t.accent); s.set(ox+5, oy+1, '▒', t.accent);
  s.set(ox+6, oy+1, '▒', t.accent); s.set(ox+7, oy+1, '▒', t.accent);
  s.set(ox+8, oy+1, ec, eblink ? t.frame : t.eye);
  s.set(ox+9, oy+1, '█', t.frame); s.set(ox+10, oy+1, '█', t.frameDk);
}

function headFront_ryzenMid(s, ox, oy, t, frame) {
  const ec = eyeChar(frame, 135, 'sharp');
  const eblink = eyeState(frame, 135) === 'blink';
  s.set(ox+3, oy, '▄', t.frameLt);
  for (let i=4;i<=7;i++) s.set(ox+i, oy, '▄', t.frame);
  s.set(ox+8, oy, '▄', t.frameDk);
  s.set(ox+2, oy+1, '█', t.frameLt);
  s.set(ox+3, oy+1, ec, eblink ? t.frame : t.eye);
  for (let i=4;i<=7;i++) s.set(ox+i, oy+1, '▒', t.accent);
  s.set(ox+8, oy+1, ec, eblink ? t.frame : t.eye);
  s.set(ox+9, oy+1, '█', t.frameDk);
}

function headFront_intelHigh(s, ox, oy, t, frame) {
  const ec = eyeChar(frame, 125, 'diamond');
  const eblink = eyeState(frame, 125) === 'blink';
  s.set(ox+3, oy, '╔', t.frameLt);
  for (let i=4;i<=7;i++) s.set(ox+i, oy, '═', t.frame);
  s.set(ox+8, oy, '╗', t.frameDk);
  s.set(ox+2, oy+1, '█', t.frameLt);
  s.set(ox+3, oy+1, ec, eblink ? t.frame : t.eye);
  s.set(ox+4, oy+1, '█', t.accent); s.set(ox+5, oy+1, '█', t.accent);
  s.set(ox+6, oy+1, '█', t.accent); s.set(ox+7, oy+1, '█', t.accent);
  s.set(ox+8, oy+1, ec, eblink ? t.frame : t.eye);
  s.set(ox+9, oy+1, '█', t.frameDk);
}

function headFront_intelMid(s, ox, oy, t, frame) {
  const ec = eyeChar(frame, 140, 'diamond');
  const eblink = eyeState(frame, 140) === 'blink';
  s.set(ox+3, oy, '▄', t.frameLt);
  for (let i=4;i<=7;i++) s.set(ox+i, oy, '▄', t.frame);
  s.set(ox+8, oy, '▄', t.frameDk);
  s.set(ox+2, oy+1, '█', t.frameLt);
  s.set(ox+3, oy+1, ec, eblink ? t.frame : t.eye);
  for (let i=4;i<=7;i++) s.set(ox+i, oy+1, '▓', t.vent);
  s.set(ox+8, oy+1, ec, eblink ? t.frame : t.eye);
  s.set(ox+9, oy+1, '█', t.frameDk);
}

function headFront_apple(s, ox, oy, t, frame) {
  const ec = eyeChar(frame, 150, 'round');
  const eblink = eyeState(frame, 150) === 'blink';
  s.set(ox+3, oy, '╭', t.frameLt);
  for (let i=4;i<=7;i++) s.set(ox+i, oy, '─', t.frame);
  s.set(ox+8, oy, '╮', t.frameDk);
  s.set(ox+2, oy+1, '│', t.frameLt);
  s.set(ox+3, oy+1, ' ');
  s.set(ox+4, oy+1, ec, eblink ? t.frame : t.eye);
  s.set(ox+5, oy+1, ' '); s.set(ox+6, oy+1, ' ');
  s.set(ox+7, oy+1, ec, eblink ? t.frame : t.eye);
  s.set(ox+8, oy+1, ' ');
  s.set(ox+9, oy+1, '│', t.frameDk);
}

function headFront_celeron(s, ox, oy, t, frame) {
  // Tiny underdog — one eye slightly off-center
  const ec = eyeChar(frame, 160, 'dot');
  const eblink = eyeState(frame, 160) === 'blink';
  const wobble = cycle(frame, 50, 4);
  s.set(ox+5, oy-1, wobble < 2 ? '╻' : '╹', t.accent); // crooked antenna
  s.set(ox+4, oy, '▄', t.frameLt); s.set(ox+5, oy, '▄', t.frame);
  s.set(ox+6, oy, '▄', t.frame); s.set(ox+7, oy, '▄', t.frameDk);
  s.set(ox+4, oy+1, '█', t.frameLt);
  s.set(ox+5, oy+1, ec, eblink ? t.frame : t.eye);
  s.set(ox+6, oy+1, ec, eblink ? t.frame : t.eye);
  s.set(ox+7, oy+1, '█', t.frameDk);
}

function headFront_generic(s, ox, oy, t, frame) {
  headFront_intelMid(s, ox, oy, t, frame);
}

// ─── TORSO FRONT — with breathing ───

function torsoFront_flagship(s, ox, oy, t, frame) {
  const r = oy + 2;
  s.set(ox+1, r, '▐', t.frameLt);
  for (let i=2;i<=9;i++) s.set(ox+i, r, '═', t.frame);
  s.set(ox+10, r, '▌', t.frameDk);
  for (let row=1;row<=3;row++) {
    s.set(ox+1, r+row, '▐', t.frameLt);
    s.set(ox+2, r+row, '█', t.frame);
    for (let i=3;i<=8;i++) {
      const isTrace = (row + i) % 3 === 0;
      s.set(ox+i, r+row, isTrace ? '┼' : ventChar(frame, 60, row * 4 + i), isTrace ? t.ventLt : t.vent);
    }
    s.set(ox+9, r+row, '█', t.frame);
    s.set(ox+10, r+row, '▌', t.frameDk);
  }
  // Accent spine
  const sp = cycle(frame, 36, 4);
  s.set(ox+5, r+1, '║', ((sp+1)%4)<2?t.accent:t.accentDk);
  s.set(ox+6, r+1, '║', ((sp+1)%4)<2?t.accentDk:t.accent);
  s.set(ox+5, r+2, '║', ((sp+2)%4)<2?t.accent:t.accentDk);
  s.set(ox+6, r+2, '║', ((sp+2)%4)<2?t.accentDk:t.accent);
  // Belt
  s.set(ox+1, r+4, '▐', t.frameLt);
  for (let i=2;i<=9;i++) s.set(ox+i, r+4, '█', t.frame);
  s.set(ox+10, r+4, '▌', t.frameDk);
}

function torsoFront_high(s, ox, oy, t, frame) {
  const r = oy + 2;
  s.set(ox+1, r, '▐', t.frameLt);
  for (let i=2;i<=9;i++) s.set(ox+i, r, '═', t.frame);
  s.set(ox+10, r, '▌', t.frameDk);
  for (let row=1;row<=3;row++) {
    s.set(ox+1, r+row, '▐', t.frameLt);
    s.set(ox+2, r+row, '█', t.frame);
    for (let i=3;i<=8;i++) {
      const isTrace = (row + i) % 4 === 0;
      s.set(ox+i, r+row, isTrace ? '─' : ventChar(frame, 64, row * 3 + i), isTrace ? t.ventLt : t.vent);
    }
    s.set(ox+9, r+row, '█', t.frameDk);
    s.set(ox+10, r+row, '▌', t.shadow);
  }
  s.set(ox+1, r+4, '▐', t.frameLt);
  for (let i=2;i<=9;i++) s.set(ox+i, r+4, '█', t.frame);
  s.set(ox+10, r+4, '▌', t.shadow);
}

function torsoFront_mid(s, ox, oy, t, frame) {
  const r = oy + 2;
  s.set(ox+2, r, '▐', t.frameLt);
  for (let i=3;i<=8;i++) s.set(ox+i, r, '═', t.frame);
  s.set(ox+9, r, '▌', t.frameDk);
  for (let row=1;row<=2;row++) {
    s.set(ox+2, r+row, '▐', t.frameLt);
    s.set(ox+3, r+row, '█', t.frame);
    for (let i=4;i<=7;i++) s.set(ox+i, r+row, ventChar(frame, 68, row * 5 + i), t.vent);
    s.set(ox+8, r+row, '█', t.frameDk);
    s.set(ox+9, r+row, '▌', t.shadow);
  }
  s.set(ox+2, r+3, '▐', t.frameLt);
  for (let i=3;i<=8;i++) s.set(ox+i, r+3, '█', t.frame);
  s.set(ox+9, r+3, '▌', t.shadow);
}

function torsoFront_low(s, ox, oy, t, frame) {
  const r = oy + 2;
  s.set(ox+4, r, '▐', t.frameLt);
  s.set(ox+5, r, '═', t.frame); s.set(ox+6, r, '═', t.frame);
  s.set(ox+7, r, '▌', t.frameDk);
  s.set(ox+4, r+1, '▐', t.frameLt);
  s.set(ox+5, r+1, ventChar(frame, 72, 0), t.vent);
  s.set(ox+6, r+1, ventChar(frame, 72, 3), t.vent);
  s.set(ox+7, r+1, '▌', t.frameDk);
  s.set(ox+4, r+2, '▐', t.frameLt);
  s.set(ox+5, r+2, '█', t.frame); s.set(ox+6, r+2, '█', t.frame);
  s.set(ox+7, r+2, '▌', t.shadow);
}

// ─── SHOULDERS FRONT ───

function shoulderFront_massive(s, ox, oy, t, frame) {
  const r = oy + 2;
  const glow = coreGlow(frame, 36, t);
  s.set(ox, r, '╔', t.accent); s.set(ox, r+1, '║', glow);
  s.set(ox+11, r, '╗', t.accent); s.set(ox+11, r+1, '║', glow);
}

function shoulderFront_heavy(s, ox, oy, t) {
  const r = oy + 2;
  s.set(ox, r, '▐', t.accent); s.set(ox+11, r, '▌', t.accentDk);
}

function shoulderFront_light(s, ox, oy, t) {
  s.set(ox+1, oy+2, '▪', t.accent); s.set(ox+10, oy+2, '▪', t.accentDk);
}

function shoulderFront_minimal() { }

// ─── CHEST EMBLEM FRONT ───

function emblemFront_asus_rog(s, ox, oy, t, frame) {
  const glow = coreGlow(frame, 30, t);
  s.set(ox+5, oy+4, '◉', glow); s.set(ox+6, oy+4, '═', t.accent);
}

function emblemFront_msi(s, ox, oy, t, frame) {
  const glow = coreGlow(frame, 32, t);
  s.set(ox+5, oy+4, '▼', glow);
}

function emblemFront_evga(s, ox, oy, t, frame) {
  const glow = coreGlow(frame, 28, t);
  s.set(ox+5, oy+4, '⚡', glow);
}

function emblemFront_gigabyte(s, ox, oy, t, frame) {
  const glow = coreGlow(frame, 34, t);
  s.set(ox+5, oy+4, '◆', glow);
}

function emblemFront_sapphire(s, ox, oy, t, frame) {
  const glow = coreGlow(frame, 30, t);
  s.set(ox+5, oy+4, '◇', glow); s.set(ox+6, oy+4, '◆', t.accent);
}

function emblemFront_powercolor(s, ox, oy, t, frame) {
  const glow = coreGlow(frame, 26, t);
  s.set(ox+5, oy+4, '▲', glow);
}

function emblemFront_nvidia_fe(s, ox, oy, t, frame) {
  const glow = coreGlow(frame, 30, t);
  s.set(ox+5, oy+4, '╲', t.accent); s.set(ox+6, oy+4, '╱', glow);
}

function emblemFront_amd_ref(s, ox, oy, t, frame) {
  const glow = coreGlow(frame, 28, t);
  s.set(ox+5, oy+4, '∞', glow);
}

function emblemFront_intel_arc(s, ox, oy, t, frame) {
  const glow = coreGlow(frame, 26, t);
  s.set(ox+5, oy+4, '◈', glow);
}

function emblemFront_apple(s, ox, oy, t) {
  s.set(ox+5, oy+4, '●', t.accent);
}

function emblemFront_generic(s, ox, oy, t, frame) {
  const glow = coreGlow(frame, 40, t);
  s.set(ox+5, oy+4, '╬', glow);
}

// ─── ACCESSORY FRONT ───

function accessoryFront_0() { }

function accessoryFront_1(s, ox, oy, t, frame) {
  // Antenna
  const pulse = cycle(frame, 40, 2);
  s.set(ox+6, oy-1, '┃', t.frameLt);
  s.set(ox+6, oy-2, pulse ? '◦' : '·', t.accent);
}

function accessoryFront_2(s, ox, oy, t, frame) {
  // Scanner visor across eyes
  const sweep = cycle(frame, 60, 6);
  s.set(ox+3 + sweep, oy+1, '▬', t.accent);
}

function accessoryFront_3(s, ox, oy, t) {
  // Data horns
  s.set(ox+2, oy-1, '╱', t.accent); s.set(ox+9, oy-1, '╲', t.accentDk);
}

function accessoryFront_4(s, ox, oy, t, frame) {
  // Holo monocle on right eye
  const glow = coreGlow(frame, 24, t);
  s.set(ox+8, oy, '◎', glow);
}

function accessoryFront_5(s, ox, oy, t) {
  // Cable tuft
  s.set(ox+1, oy+1, '≈', t.vent);
}

// ─── GPU ARM FRONT VIEW ───

function gpuFront_nvidiaFlagship(s, ox, oy, t, frame) {
  const r = oy + 3;  const c = ox - 1;
  const fg = coreGlow(frame, 24, t);
  s.set(c-2, r, '◄', fg);
  s.set(c-1, r, '█', t.frame); s.set(c, r, '█', t.frame); s.set(c+1, r, '╣', t.frameDk);
  s.set(c-2, r+1, '▌', t.shadow);
  s.set(c-1, r+1, fanChar(frame, 24, 0), fg);
  s.set(c, r+1, '▓', t.vent); s.set(c+1, r+1, '║', t.frameDk);
  s.set(c-2, r+2, '◄', fg);
  s.set(c-1, r+2, '█', fg);
  s.set(c, r+2, '█', t.frame); s.set(c+1, r+2, '╣', t.frameDk);
  s.set(c-2, r+3, '▌', t.shadow);
  s.set(c-1, r+3, fanChar(frame, 24, 12), coreGlow(frame+12, 24, t));
  s.set(c, r+3, '▓', t.vent); s.set(c+1, r+3, '║', t.frameDk);
  s.set(c-1, r+4, '▀', t.frame); s.set(c, r+4, '▀', t.frame); s.set(c+1, r+4, '╝', t.frameDk);
}

function gpuFront_nvidiaHigh(s, ox, oy, t, frame) {
  const r = oy + 3;  const c = ox;
  const fg = coreGlow(frame, 28, t);
  s.set(c-1, r, '█', t.frame); s.set(c, r, '╣', t.frameDk);
  s.set(c-1, r+1, fanChar(frame, 28, 0), fg); s.set(c, r+1, '║', t.frameDk);
  s.set(c-2, r+2, '►', fg);
  s.set(c-1, r+2, '█', t.frame); s.set(c, r+2, '╣', t.frameDk);
  s.set(c-1, r+3, fanChar(frame, 28, 14), coreGlow(frame+14, 28, t));
  s.set(c, r+3, '║', t.frameDk);
  s.set(c-1, r+4, '▀', t.frame); s.set(c, r+4, '╝', t.frameDk);
}

function gpuFront_nvidiaMid(s, ox, oy, t, frame) {
  const r = oy + 4;  const c = ox + 1;
  const fg = coreGlow(frame, 32, t);
  s.set(c, r, '╣', t.frameDk);
  s.set(c-1, r, fanChar(frame, 32, 0), fg);
  s.set(c, r+1, '╣', t.frameDk);
  s.set(c-1, r+1, '▀', t.frame);
}

function gpuFront_amdFlagship(s, ox, oy, t, frame) {
  const r = oy + 2;  const c = ox;
  const fg = coreGlow(frame, 26, t);
  s.set(c-2, r, '▄', t.accent); s.set(c-1, r, '╲', t.accent);
  s.set(c-2, r+1, '█', t.accent); s.set(c-1, r+1, '█', t.accent); s.set(c, r+1, '╣', t.frameDk);
  s.set(c-2, r+2, '█', t.accentDk);
  s.set(c-1, r+2, '█', fg); s.set(c, r+2, '║', t.frameDk);
  s.set(c-2, r+3, '█', t.accent); s.set(c-1, r+3, '█', t.accent); s.set(c, r+3, '╣', t.frameDk);
  s.set(c-2, r+4, '─', t.vent); s.set(c-1, r+4, '═', t.accent); s.set(c, r+4, '║', t.frameDk);
  s.set(c-1, r+5, '▀', t.accentDk); s.set(c, r+5, '╝', t.frameDk);
}

function gpuFront_amdHigh(s, ox, oy, t, frame) {
  const r = oy + 2;  const c = ox;
  const fg = coreGlow(frame, 26, t);
  s.set(c-2, r, '▄', t.accent); s.set(c-1, r, '═', t.frame); s.set(c, r, '╗', t.frameDk);
  s.set(c-2, r+1, '█', t.accent);
  s.set(c-1, r+1, fanChar(frame, 20, 0), fg);
  s.set(c, r+1, '║', t.frameDk);
  s.set(c-2, r+2, '█', t.accent);
  s.set(c-1, r+2, '█', fg);
  s.set(c, r+2, '║', t.frameDk);
  s.set(c+1, r+2, '►', fg);
  s.set(c-2, r+3, '█', t.accentDk);
  s.set(c-1, r+3, fanChar(frame, 20, 10), coreGlow(frame+10, 26, t));
  s.set(c, r+3, '║', t.frameDk);
  s.set(c-2, r+4, '▀', t.accent); s.set(c-1, r+4, '═', t.frame); s.set(c, r+4, '╝', t.frameDk);
}

function gpuFront_amdMid(s, ox, oy, t, frame) {
  const r = oy + 4;  const c = ox + 1;
  const fg = coreGlow(frame, 34, t);
  s.set(c-1, r, '█', fg); s.set(c, r, '╣', t.frameDk);
  s.set(c-1, r+1, '▀', t.accent);
}

function gpuFront_intelArc(s, ox, oy, t, frame) {
  const r = oy + 3;  const c = ox;
  const fg = coreGlow(frame, 22, t);
  s.set(c-1, r, '◇', fg); s.set(c, r, '╣', t.frameDk);
  s.set(c-1, r+1, '◆', coreGlow(frame+11, 22, t)); s.set(c, r+1, '║', t.frameDk);
  s.set(c-1, r+2, '◇', fg); s.set(c, r+2, '╣', t.frameDk);
  s.set(c-1, r+3, '▀', t.accent);
}

function gpuFront_apple(s, ox, oy, t, frame) {
  const r = oy + 4;  const c = ox + 1;
  const glow = coreGlow(frame, 40, t);
  s.set(c-1, r, '○', glow); s.set(c, r, '│', t.frameDk);
}

function gpuFront_integrated() { }

// ─── LEGS FRONT ───

function legsFront_nvme(s, ox, oy, t, frame) {
  const r = oy + 7;
  s.set(ox+3, r, '▀', t.frame); s.set(ox+4, r, '█', t.leg);
  s.set(ox+7, r, '█', t.leg); s.set(ox+8, r, '▀', t.frame);
  s.set(ox+4, r+1, ventChar(frame, 16, 0), t.accent);
  s.set(ox+7, r+1, ventChar(frame, 16, 8), t.accent);
}

function legsFront_ssd(s, ox, oy, t, frame) {
  const r = oy + 7;
  const ledOn = cycle(frame, 80, 4) === 0;
  s.set(ox+3, r, '▀', t.frame); s.set(ox+4, r, '█', t.leg);
  s.set(ox+7, r, '█', t.leg); s.set(ox+8, r, '▀', t.frame);
  s.set(ox+4, r+1, '▀', t.leg); s.set(ox+7, r+1, '▀', t.leg);
  s.set(ox+5, r, '·', ledOn ? t.accent : t.vent);
}

function legsFront_hdd(s, ox, oy, t, frame) {
  const r = oy + 7;
  const platter = cycle(frame, 30, 3);
  const pc = ['°', '·', '○'][platter];
  s.set(ox+2, r, '▀', t.frame); s.set(ox+3, r, '█', t.leg); s.set(ox+4, r, '█', t.leg);
  s.set(ox+7, r, '█', t.leg); s.set(ox+8, r, '█', t.leg); s.set(ox+9, r, '▀', t.frame);
  s.set(ox+3, r+1, '▀', t.leg); s.set(ox+4, r+1, '▀', t.leg);
  s.set(ox+7, r+1, '▀', t.leg); s.set(ox+8, r+1, '▀', t.leg);
  s.set(ox+3, r, pc, t.vent);
}


// ═══════════════════════════════════════════════════════════════
// §5  DISPATCH TABLES
// ═══════════════════════════════════════════════════════════════

const HEAD_BACK   = { ryzen_high: headBack_ryzenHigh, ryzen_mid: headBack_ryzenMid, intel_high: headBack_intelHigh, intel_mid: headBack_intelMid, apple: headBack_apple, celeron: headBack_celeron, generic: headBack_generic };
const HEAD_FRONT  = { ryzen_high: headFront_ryzenHigh, ryzen_mid: headFront_ryzenMid, intel_high: headFront_intelHigh, intel_mid: headFront_intelMid, apple: headFront_apple, celeron: headFront_celeron, generic: headFront_generic };
const TORSO_BACK  = { flagship: torsoBack_flagship, high: torsoBack_high, mid: torsoBack_mid, low: torsoBack_low };
const TORSO_FRONT = { flagship: torsoFront_flagship, high: torsoFront_high, mid: torsoFront_mid, low: torsoFront_low };
const GPU_BACK    = { nvidia_flagship: gpuBack_nvidiaFlagship, nvidia_high: gpuBack_nvidiaHigh, nvidia_mid: gpuBack_nvidiaMid, amd_flagship: gpuBack_amdFlagship, amd_high: gpuBack_amdHigh, amd_mid: gpuBack_amdMid, intel_arc: gpuBack_intelArc, apple: gpuBack_apple, integrated: gpuBack_integrated };
const GPU_FRONT   = { nvidia_flagship: gpuFront_nvidiaFlagship, nvidia_high: gpuFront_nvidiaHigh, nvidia_mid: gpuFront_nvidiaMid, amd_flagship: gpuFront_amdFlagship, amd_high: gpuFront_amdHigh, amd_mid: gpuFront_amdMid, intel_arc: gpuFront_intelArc, apple: gpuFront_apple, integrated: gpuFront_integrated };
const LEGS_BACK   = { NVMe: legsBack_nvme, SSD: legsBack_ssd, HDD: legsBack_hdd, eMMC: legsBack_hdd };
const LEGS_FRONT  = { NVMe: legsFront_nvme, SSD: legsFront_ssd, HDD: legsFront_hdd, eMMC: legsFront_hdd };

const SHOULDER_BACK  = { massive: shoulderBack_massive, heavy: shoulderBack_heavy, light: shoulderBack_light, minimal: shoulderBack_minimal };
const SHOULDER_FRONT = { massive: shoulderFront_massive, heavy: shoulderFront_heavy, light: shoulderFront_light, minimal: shoulderFront_minimal };

const EMBLEM_BACK = {
  asus_rog: emblemBack_asus_rog, msi: emblemBack_msi, evga: emblemBack_evga,
  gigabyte: emblemBack_gigabyte, sapphire: emblemBack_sapphire, powercolor: emblemBack_powercolor,
  nvidia_fe: emblemBack_nvidia_fe, amd_ref: emblemBack_amd_ref, intel_arc: emblemBack_intel_arc,
  apple: emblemBack_apple, generic: emblemBack_generic,
};
const EMBLEM_FRONT = {
  asus_rog: emblemFront_asus_rog, msi: emblemFront_msi, evga: emblemFront_evga,
  gigabyte: emblemFront_gigabyte, sapphire: emblemFront_sapphire, powercolor: emblemFront_powercolor,
  nvidia_fe: emblemFront_nvidia_fe, amd_ref: emblemFront_amd_ref, intel_arc: emblemFront_intel_arc,
  apple: emblemFront_apple, generic: emblemFront_generic,
};

const ACCESSORY_BACK  = [accessoryBack_0, accessoryBack_1, accessoryBack_2, accessoryBack_3, accessoryBack_4, accessoryBack_5];
const ACCESSORY_FRONT = [accessoryFront_0, accessoryFront_1, accessoryFront_2, accessoryFront_3, accessoryFront_4, accessoryFront_5];


// ═══════════════════════════════════════════════════════════════
// §6  HIT / KO HELPERS — tier-aware
// ═══════════════════════════════════════════════════════════════

const GLITCH_CHARS = '╳╬▓░▒█';

function drawHit(compositeDraw, screen, ox, oy, frame) {
  const shakeX = (frame % 2 === 0) ? 1 : -1;
  compositeDraw(screen, ox + shakeX, oy, null, frame);
  for (let i = 0; i < 5; i++) {
    const gx = ox + 2 + Math.floor(Math.random() * 10);
    const gy = oy + 1 + Math.floor(Math.random() * 7);
    screen.set(gx, gy, GLITCH_CHARS[Math.floor(Math.random() * GLITCH_CHARS.length)], colors.rose);
  }
}

function drawKO(screen, ox, oy, isBack, tier) {
  const d = colors.dim;
  const by = isBack ? oy + 6 : oy + 4;

  if (tier === 'flagship') {
    // Dramatic explosion debris with sparks
    screen.text(ox + 1, by, '░▒▓█▓▒░▒▓░', d);
    screen.text(ox + 2, by + 1, '▓░░▒▓░░▓', d);
    screen.text(ox + 1, by + 2, '▀▀░▀▀░▀▀▀▀', d);
    screen.text(ox + 3, by - 1, '✦     ✦', colors.dimmer);
    screen.set(ox + 6, by - 2, '✦', colors.ghost);
  } else if (tier === 'high') {
    // Collapse with rising smoke
    screen.text(ox + 2, by, '▄▄▄▄▄▄▄▄▄', d);
    screen.text(ox + 2, by + 1, '░░▒░░▒░░░', d);
    screen.text(ox + 2, by + 2, '▀▀▀▀▀▀▀▀▀', d);
    screen.text(ox + 4, by - 1, '░   ░', colors.dimmer);
  } else if (tier === 'low') {
    // Sad deflate — smaller pile
    screen.text(ox + 4, by + 1, '▄▄▄', d);
    screen.text(ox + 4, by + 2, '▀▀▀', d);
    screen.text(ox + 4, by, '· ·', colors.dimmer);
  } else {
    // Mid — simple topple
    screen.text(ox + 2, by, '▄▄▄▄▄▄▄▄▄', d);
    screen.text(ox + 2, by + 1, '░░░░░░░░░', d);
    screen.text(ox + 2, by + 2, '▀▀▀▀▀▀▀▀▀', d);
    screen.text(ox + 3, by - 1, 'x     x', colors.dimmer);
  }
}


// ═══════════════════════════════════════════════════════════════
// §7  PUBLIC API — Assembles components into composite sprites
// ═══════════════════════════════════════════════════════════════

function getSprite(specs) {
  const hw = identifyHardware(specs);
  const theme = THEMES[hw.brand] || THEMES.generic;

  const headB  = HEAD_BACK[hw.cpuFamily]   || HEAD_BACK.generic;
  const headF  = HEAD_FRONT[hw.cpuFamily]  || HEAD_FRONT.generic;
  const bodyB  = TORSO_BACK[hw.tier]       || TORSO_BACK.mid;
  const bodyF  = TORSO_FRONT[hw.tier]      || TORSO_FRONT.mid;
  const gpuB   = GPU_BACK[hw.gpuFamily]    || GPU_BACK.integrated;
  const gpuF   = GPU_FRONT[hw.gpuFamily]   || GPU_FRONT.integrated;
  const legB   = LEGS_BACK[hw.storage]     || LEGS_BACK.SSD;
  const legF   = LEGS_FRONT[hw.storage]    || LEGS_FRONT.SSD;

  // New components
  const shoulderB = SHOULDER_BACK[hw.ram]    || shoulderBack_minimal;
  const shoulderF = SHOULDER_FRONT[hw.ram]   || shoulderFront_minimal;
  const emblemB   = EMBLEM_BACK[hw.brand]    || emblemBack_generic;
  const emblemF   = EMBLEM_FRONT[hw.brand]   || emblemFront_generic;
  const accB      = ACCESSORY_BACK[hw.specHash]  || accessoryBack_0;
  const accF      = ACCESSORY_FRONT[hw.specHash] || accessoryFront_0;

  // Composite draw: assemble all 7 layers
  function drawBack(screen, ox, oy, _tint, frame) {
    bodyB(screen, ox, oy, theme, frame);          // torso (background)
    emblemB(screen, ox, oy, theme, frame);        // brand emblem on torso
    shoulderB(screen, ox, oy, theme, frame);      // RAM-based shoulders
    gpuB(screen, ox, oy, theme, frame);           // GPU arm (overlays torso edge)
    headB(screen, ox, oy, theme, frame, hw);      // head (on top)
    accB(screen, ox, oy, theme, frame);           // accessory (on/above head)
    legB(screen, ox, oy, theme, frame);           // legs (bottom)
  }

  function drawFront(screen, ox, oy, _tint, frame) {
    bodyF(screen, ox, oy, theme, frame);
    emblemF(screen, ox, oy, theme, frame);
    shoulderF(screen, ox, oy, theme, frame);
    gpuF(screen, ox, oy, theme, frame);
    headF(screen, ox, oy, theme, frame, hw);
    accF(screen, ox, oy, theme, frame);
    legF(screen, ox, oy, theme, frame);
  }

  return {
    back:  { draw: drawBack },
    front: { draw: drawFront },
    drawBackHit(screen, ox, oy, frame)  { drawHit(drawBack, screen, ox, oy, frame); },
    drawFrontHit(screen, ox, oy, frame) { drawHit(drawFront, screen, ox, oy, frame); },
    drawBackKO(screen, ox, oy)  { drawKO(screen, ox, oy, true, hw.tier); },
    drawFrontKO(screen, ox, oy) { drawKO(screen, ox, oy, false, hw.tier); },
    theme,
    hw,
  };
}

module.exports = { getSprite, identifyHardware, THEMES };
