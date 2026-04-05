#!/usr/bin/env node
// ═══════════════════════════════════════════════════════════════
// DEMO BATTLE — Fully automated turn-based showcase for recording
// Run: node bin/demo-battle.js
// Ctrl+C to quit at any time
// ═══════════════════════════════════════════════════════════════

const { Screen } = require('../src/screen');
const { getSprite } = require('../src/sprites');
const { classifyArchetype, buildStats } = require('../src/profiler');
const { assignMoveset } = require('../src/moveset');
const { addItem } = require('../src/items');
const { renderTurnBattle } = require('../src/turnrenderer');
const { ESC, colors, rgb, RESET, BOLD } = require('../src/palette');

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

// ─── Music player (shared mode, won't block audio capture) ───
const MUSIC_FILE = process.argv[2] || null;

function startMusic() {
  if (!MUSIC_FILE) return;
  const { spawn } = require('node:child_process');
  // Use 'start' to open with default media player — simple and reliable
  spawn('cmd', ['/c', 'start', '', MUSIC_FILE], {
    detached: true,
    stdio: 'ignore',
    windowsHide: true,
  }).unref();
}

// ─── Two impressive fighters (low HP for fast KO) ───

const fighterASpecs = {
  cpu: { brand: 'AMD Ryzen 9 7950X', manufacturer: 'AMD', cores: 16, threads: 32, speed: 4.5, speedMax: 5.7 },
  ram: { totalGB: 64 },
  gpu: { model: 'NVIDIA GeForce RTX 4090', vramMB: 24576, vendor: 'NVIDIA' },
  storage: { type: 'NVMe', sizeGB: 2000, name: 'Samsung 990 PRO' },
};
const fighterAStats = buildStats(fighterASpecs);
// Boost offense, cut HP so fights end in ~5 turns
fighterAStats.str = Math.round(fighterAStats.str * 1.8);
fighterAStats.mag = Math.round(fighterAStats.mag * 1.8);
fighterAStats.spd = Math.round(fighterAStats.spd * 1.5);
fighterAStats.hp = Math.round(fighterAStats.hp * 0.45);
fighterAStats.maxHp = fighterAStats.hp;

const fighterA = {
  id: 'demo-fighter-a',
  name: 'Ryzen 9 7950X',
  gpu: 'RTX 4090',
  stats: { ...fighterAStats },
  specs: fighterASpecs,
  sprite: getSprite(fighterASpecs),
  archetype: classifyArchetype(fighterAStats, fighterASpecs),
};

const fighterBSpecs = {
  cpu: { brand: 'Intel Core i9-14900K', manufacturer: 'Intel', cores: 24, threads: 32, speed: 3.2, speedMax: 6.0 },
  ram: { totalGB: 32 },
  gpu: { model: 'AMD Radeon RX 7900 XTX', vramMB: 24576, vendor: 'AMD' },
  storage: { type: 'NVMe', sizeGB: 4000, name: 'WD Black SN850X' },
};
const fighterBStats = buildStats(fighterBSpecs);
fighterBStats.str = Math.round(fighterBStats.str * 1.8);
fighterBStats.mag = Math.round(fighterBStats.mag * 1.8);
fighterBStats.spd = Math.round(fighterBStats.spd * 1.5);
fighterBStats.hp = Math.round(fighterBStats.hp * 0.45);
fighterBStats.maxHp = fighterBStats.hp;

const fighterB = {
  id: 'demo-fighter-b',
  name: 'i9-14900K',
  gpu: 'RX 7900 XTX',
  stats: { ...fighterBStats },
  specs: fighterBSpecs,
  sprite: getSprite(fighterBSpecs),
  archetype: classifyArchetype(fighterBStats, fighterBSpecs),
};

// ─── Seed inventory with showcase items ───

const DEMO_ITEMS = [
  'overclock_kit',
  'darknet_collapse',
  'reactor_overflow',
  'arctic_silver',
  'zero_day_exploit',
];

const fs = require('node:fs');
const path = require('node:path');
const INV_FILE = path.join(__dirname, '..', '.kernelmon', 'inventory.json');

let savedInventory = null;
try { savedInventory = fs.readFileSync(INV_FILE, 'utf8'); } catch {}

for (const id of DEMO_ITEMS) addItem(id, 2);

// ─── Auto-play turn plan (dense action for short battle) ───
const autoPlayConfig = {
  turns: [
    { type: 'move', moveIndex: 0 },                          // Turn 1
    { type: 'move', moveIndex: 1 },                          // Turn 2 (QTE → streak 1)
    { type: 'item', itemId: 'overclock_kit' },                // Turn 3: STR boost
    { type: 'move', moveIndex: 2 },                          // Turn 4 (QTE → streak 2)
    { type: 'item', itemId: 'darknet_collapse' },             // Turn 5 (QTE → EVOLUTION)
    { type: 'move', moveIndex: 3 },                          // Turn 6
    { type: 'item', itemId: 'reactor_overflow' },             // Turn 7
    { type: 'move', moveIndex: 0 },                          // Turn 8+
  ],
};

// ─── Logo (multicolored) ───

const LOGO = [
  '██╗  ██╗███████╗██████╗ ███╗   ██╗███████╗██╗     ███╗   ███╗ ██████╗ ███╗   ██╗',
  '██║ ██╔╝██╔════╝██╔══██╗████╗  ██║██╔════╝██║     ████╗ ████║██╔═══██╗████╗  ██║',
  '█████╔╝ █████╗  ██████╔╝██╔██╗ ██║█████╗  ██║     ██╔████╔██║██║   ██║██╔██╗ ██║',
  '██╔═██╗ ██╔══╝  ██╔══██╗██║╚██╗██║██╔══╝  ██║     ██║╚██╔╝██║██║   ██║██║╚██╗██║',
  '██║  ██╗███████╗██║  ██║██║ ╚████║███████╗███████╗██║ ╚═╝ ██║╚██████╔╝██║ ╚████║',
  '╚═╝  ╚═╝╚══════╝╚═╝  ╚═╝╚═╝  ╚═══╝╚══════╝╚══════╝╚═╝     ╚═╝ ╚═════╝ ╚═╝  ╚═══╝',
];

const SUBTITLE = '◄ YOUR KERNEL. YOUR FIGHTER. ►';

const LOGO_COLORS = [
  [255, 100, 100],   // red
  [255, 180, 80],    // orange
  [255, 220, 100],   // gold
  [100, 230, 150],   // green
  [100, 180, 255],   // blue
  [200, 130, 255],   // purple
];

function lerpColor(a, b, t) {
  return [
    Math.round(a[0] + (b[0] - a[0]) * t),
    Math.round(a[1] + (b[1] - a[1]) * t),
    Math.round(a[2] + (b[2] - a[2]) * t),
  ];
}

function getLogoColor(x, totalW, frame) {
  const offset = (frame * 0.03) % 1;
  const t = ((x / totalW) + offset) % 1;
  const segCount = LOGO_COLORS.length;
  const seg = t * segCount;
  const idx = Math.floor(seg) % segCount;
  const next = (idx + 1) % segCount;
  const frac = seg - Math.floor(seg);
  return lerpColor(LOGO_COLORS[idx], LOGO_COLORS[next], frac);
}

// ─── Logo reveal with fade-in ───

async function logoReveal() {
  process.stdout.write(`${ESC}?1049h${ESC}?25l${ESC}2J`);

  const W = process.stdout.columns || 120;
  const H = process.stdout.rows || 30;
  const cx = Math.floor(W / 2);
  const cy = Math.floor(H / 2);
  const logoW = LOGO[0].length;
  const logoStartX = cx - Math.floor(logoW / 2);
  const logoStartY = cy - Math.floor(LOGO.length / 2) - 1;

  const TOTAL_FRAMES = 80; // 4 seconds at 20fps

  const stdin = process.stdin;
  try { stdin.setRawMode(true); } catch {}
  stdin.resume();
  stdin.setEncoding('utf8');
  const onKey = (key) => { if (key === '\x03') process.exit(0); };
  stdin.on('data', onKey);

  for (let frame = 0; frame < TOTAL_FRAMES; frame++) {
    // Fade: 0 → 1 over first 30 frames, hold after
    const fade = Math.min(1, frame / 30);
    // Scale: slight zoom-in feel, 0.8 → 1.0
    const revealProgress = Math.min(1, frame / 40);

    let out = `${ESC}2J`;

    // Draw logo lines
    for (let row = 0; row < LOGO.length; row++) {
      const line = LOGO[row];
      const y = logoStartY + row;
      if (y < 0 || y >= H) continue;

      // Reveal from center outward
      const halfW = Math.floor(line.length / 2);
      const revealed = Math.floor(halfW * revealProgress);

      for (let col = halfW - revealed; col <= halfW + revealed; col++) {
        if (col < 0 || col >= line.length) continue;
        const ch = line[col];
        if (ch === ' ') continue;
        const x = logoStartX + col;
        if (x < 0 || x >= W) continue;

        const [r, g, b] = getLogoColor(col, line.length, frame);
        const fr = Math.round(r * fade);
        const fg = Math.round(g * fade);
        const fb = Math.round(b * fade);
        out += `${ESC}${y + 1};${x + 1}H\x1b[38;2;${fr};${fg};${fb}m${ch}`;
      }
    }

    // Subtitle (fade in after logo)
    if (frame > 35) {
      const subFade = Math.min(1, (frame - 35) / 20);
      const sy = logoStartY + LOGO.length + 2;
      const sx = cx - Math.floor(SUBTITLE.length / 2);
      const brightness = Math.round(220 * subFade);
      out += `${ESC}${sy + 1};${sx + 1}H\x1b[38;2;${brightness};${Math.round(brightness * 0.85)};${Math.round(brightness * 0.6)}m${SUBTITLE}`;
    }

    // URL at bottom (fade in late)
    if (frame > 50) {
      const urlFade = Math.min(1, (frame - 50) / 20);
      const url = 'github.com/trigga6006/Kernelmon';
      const uy = logoStartY + LOGO.length + 4;
      const ux = cx - Math.floor(url.length / 2);
      const ub = Math.round(140 * urlFade);
      out += `${ESC}${uy + 1};${ux + 1}H\x1b[38;2;${ub};${ub};${Math.round(ub * 1.2)}m${url}`;
    }

    out += RESET;
    process.stdout.write(out);
    await sleep(FRAME_MS);
  }

  // Hold the final frame
  await sleep(3000);

  stdin.removeListener('data', onKey);
  try { stdin.setRawMode(false); } catch {}
  stdin.pause();
  process.stdout.write(`${ESC}?25h${ESC}?1049l${RESET}`);
}

const FRAME_MS = 50;

// ─── Countdown ───

async function countdown() {
  const stdin = process.stdin;
  try { stdin.setRawMode(true); } catch {}
  stdin.resume();
  stdin.setEncoding('utf8');

  const onKey = (key) => { if (key === '\x03') process.exit(0); };
  stdin.on('data', onKey);

  process.stdout.write(`${ESC}?1049h${ESC}?25l${ESC}2J`);

  const W = process.stdout.columns || 120;
  const H = process.stdout.rows || 30;
  const cx = Math.floor(W / 2);
  const cy = Math.floor(H / 2);

  for (let i = 10; i >= 1; i--) {
    process.stdout.write(`${ESC}2J`);
    const label = `  DEMO BATTLE STARTING IN ${i}  `;
    process.stdout.write(`${ESC}${cy - 1};${cx - Math.floor(label.length / 2)}H`);
    process.stdout.write(`${rgb(130, 220, 235)}${label}${RESET}`);

    const sub = i <= 3 ? '  Get your screen recorder ready!  ' : '';
    if (sub) {
      process.stdout.write(`${ESC}${cy + 1};${cx - Math.floor(sub.length / 2)}H`);
      process.stdout.write(`${rgb(200, 170, 240)}${sub}${RESET}`);
    }
    await sleep(1000);
  }

  process.stdout.write(`${ESC}?25h${ESC}?1049l${RESET}`);
  stdin.removeListener('data', onKey);
  try { stdin.setRawMode(false); } catch {}
  stdin.pause();
}

// ─── Restore inventory helper ───

function restoreInventory() {
  try {
    if (savedInventory) {
      fs.writeFileSync(INV_FILE, savedInventory);
    } else {
      const inv = JSON.parse(fs.readFileSync(INV_FILE, 'utf8'));
      for (const id of DEMO_ITEMS) {
        if (inv[id]) inv[id] = Math.max(0, inv[id] - 2);
        if (inv[id] <= 0) delete inv[id];
      }
      fs.writeFileSync(INV_FILE, JSON.stringify(inv, null, 2));
    }
  } catch {}
}

// ─── Main ───

async function main() {
  await countdown();
  startMusic();

  const movesA = assignMoveset(fighterA.stats, fighterA.specs, fighterA.archetype);
  const movesB = assignMoveset(fighterB.stats, fighterB.specs, fighterB.archetype);

  const seed = 7777;

  const winner = await renderTurnBattle(fighterA, fighterB, movesA, movesB, {
    role: 'host',
    seed,
    autoPlay: autoPlayConfig,
  });

  restoreInventory();

  // Logo reveal after battle
  await logoReveal();

  process.exit(0);
}

main().catch(err => {
  restoreInventory();
  console.error(err);
  process.exit(1);
});
