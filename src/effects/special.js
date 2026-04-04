// ═══════════════════════════════════════════════════════════════
// SPECIAL ATTACK EFFECTS — Multi-phase screen-filling animations
// for special bag items (Black Hole, Maelstrom)
// ═══════════════════════════════════════════════════════════════

const { colors, rgb } = require('../palette');

// ─── BLACK HOLE ───
// Phase 1: Particles spiral inward toward target (sucking everything in)
// Phase 2: Singularity collapse — screen inverts, concentric rings implode
// Phase 3: Explosion outward — damage burst

class BlackHoleEffect {
  constructor(cx, cy, screenW, screenH, startFrame) {
    this.cx = cx;
    this.cy = cy;
    this.w = screenW;
    this.h = screenH;
    this.startFrame = startFrame;
    this.duration = 70; // ~3.5s at 20fps
    this.particles = [];
    this.done = false;

    // Spawn spiral particles from edges
    for (let i = 0; i < 60; i++) {
      const angle = (i / 60) * Math.PI * 2 * 3; // 3 full spirals
      const dist = 15 + (i / 60) * 20;
      this.particles.push({
        angle,
        dist,
        origDist: dist,
        char: '●◉◎○◦·★◆▣▓▒░'[i % 13],
        speed: 0.3 + Math.random() * 0.4,
        orbitSpeed: 0.08 + Math.random() * 0.05,
      });
    }
  }

  update(frame) {
    const elapsed = frame - this.startFrame;
    if (elapsed >= this.duration) {
      this.done = true;
      return;
    }

    const t = elapsed / this.duration; // 0..1

    for (const p of this.particles) {
      if (t < 0.55) {
        // Phase 1: Spiral inward
        const pull = t / 0.55;
        p.dist = p.origDist * (1 - pull * 0.95);
        p.angle += p.orbitSpeed * (1 + pull * 4); // spin faster as they get closer
      } else if (t < 0.7) {
        // Phase 2: Collapse — everything at center
        p.dist = Math.max(0.5, p.dist * 0.85);
        p.angle += 0.3;
      } else {
        // Phase 3: Explosion outward
        const boom = (t - 0.7) / 0.3;
        p.dist = boom * p.origDist * 1.8;
        p.angle += 0.05;
      }
    }
  }

  draw(screen, frame) {
    const elapsed = frame - this.startFrame;
    if (elapsed < 0 || this.done) return;
    const t = elapsed / this.duration;

    const { cx, cy, w, h } = this;

    // Phase 1 & 2: Dark vortex at center
    if (t < 0.7) {
      const vortexR = t < 0.55 ? 1 + t * 6 : 4 + (1 - ((t - 0.55) / 0.15)) * 2;
      // Draw concentric void rings
      for (let ring = 0; ring < 3; ring++) {
        const r = vortexR - ring * 1.2;
        if (r <= 0) continue;
        const segments = Math.floor(r * 6) + 12;
        const ringColor = ring === 0 ? rgb(20, 0, 40) : ring === 1 ? rgb(80, 30, 120) : rgb(140, 60, 180);
        const ringChar = ring === 0 ? '█' : ring === 1 ? '▓' : '▒';
        for (let i = 0; i < segments; i++) {
          const a = (i / segments) * Math.PI * 2 + elapsed * 0.15;
          const px = cx + Math.round(Math.cos(a) * r * 2);
          const py = cy + Math.round(Math.sin(a) * r * 0.7);
          if (px >= 0 && px < w && py >= 0 && py < h) {
            screen.set(px, py, ringChar, ringColor);
          }
        }
      }

      // Accretion disk — bright ring at the event horizon edge
      if (t > 0.15) {
        const diskR = vortexR + 1.5;
        const segments = Math.floor(diskR * 8) + 16;
        for (let i = 0; i < segments; i++) {
          const a = (i / segments) * Math.PI * 2 - elapsed * 0.2;
          const px = cx + Math.round(Math.cos(a) * diskR * 2.2);
          const py = cy + Math.round(Math.sin(a) * diskR * 0.8);
          if (px >= 0 && px < w && py >= 0 && py < h) {
            const flicker = Math.sin(a * 3 + elapsed * 0.5) > 0;
            const diskColor = flicker ? rgb(200, 120, 255) : rgb(255, 180, 80);
            screen.set(px, py, flicker ? '◆' : '★', diskColor);
          }
        }
      }
    }

    // Phase 3: Explosion shockwave
    if (t >= 0.65) {
      const boom = (t - 0.65) / 0.35;
      const shockR = boom * 25;
      const segments = Math.floor(shockR * 6) + 20;
      const fade = 1 - boom;

      // Shockwave ring
      for (let i = 0; i < segments; i++) {
        const a = (i / segments) * Math.PI * 2;
        const px = cx + Math.round(Math.cos(a) * shockR * 2);
        const py = cy + Math.round(Math.sin(a) * shockR * 0.7);
        if (px >= 0 && px < w && py >= 0 && py < h) {
          const intensity = Math.sin(a * 5 + elapsed) > 0;
          const blastColor = fade > 0.6
            ? (intensity ? rgb(255, 200, 255) : rgb(200, 100, 255))
            : fade > 0.3
              ? (intensity ? rgb(160, 80, 200) : rgb(120, 50, 160))
              : rgb(60, 30, 80);
          screen.set(px, py, intensity ? '█' : '▓', blastColor);
        }
      }

      // Inner flash on first few frames of explosion
      if (boom < 0.3) {
        const flashR = (1 - boom / 0.3) * 6;
        for (let dy = -Math.floor(flashR); dy <= Math.floor(flashR); dy++) {
          for (let dx = -Math.floor(flashR * 2); dx <= Math.floor(flashR * 2); dx++) {
            const dist = Math.sqrt((dx / 2) ** 2 + dy ** 2);
            if (dist <= flashR) {
              const px = cx + dx;
              const py = cy + dy;
              if (px >= 0 && px < w && py >= 0 && py < h) {
                screen.set(px, py, '█', rgb(255, 220, 255));
              }
            }
          }
        }
      }
    }

    // Draw spiraling particles (all phases)
    for (const p of this.particles) {
      const px = cx + Math.round(Math.cos(p.angle) * p.dist * 2);
      const py = cy + Math.round(Math.sin(p.angle) * p.dist * 0.7);
      if (px >= 0 && px < w && py >= 0 && py < h) {
        const pColor = t < 0.7
          ? (p.dist < 3 ? rgb(200, 120, 255) : rgb(140, 80, 200))
          : rgb(255, 180 + Math.floor(Math.random() * 75), 100);
        screen.set(px, py, p.char, pColor);
      }
    }
  }
}


// ─── MAELSTROM ───
// Phase 1: Whirlpool builds — concentric rings of glitch chars spin outward
// Phase 2: Lightning/data bolts arc across the screen
// Phase 3: Tornado column collapses onto target with scatter debris

const STORM_CHARS = '╬╣╠╩╦┃━╋▀▄▌▐■□▣▤▥▦≡≈~∿∾';
const BOLT_CHARS = '╲╱│─╳╋┃━⚡';

class MaelstromEffect {
  constructor(cx, cy, screenW, screenH, startFrame) {
    this.cx = cx;
    this.cy = cy;
    this.w = screenW;
    this.h = screenH;
    this.startFrame = startFrame;
    this.duration = 75; // ~3.75s at 20fps
    this.done = false;

    // Storm debris particles
    this.debris = [];
    for (let i = 0; i < 80; i++) {
      const angle = Math.random() * Math.PI * 2;
      const layer = Math.floor(i / 20); // 4 layers of debris
      this.debris.push({
        angle,
        layer,
        radius: 3 + layer * 4,
        rotSpeed: (0.06 + Math.random() * 0.08) * (layer % 2 === 0 ? 1 : -1), // alternate rotation
        char: STORM_CHARS[Math.floor(Math.random() * STORM_CHARS.length)],
        phase: Math.random() * Math.PI * 2,
      });
    }

    // Lightning bolts — pre-computed paths
    this.bolts = [];
    for (let i = 0; i < 6; i++) {
      const bolt = [];
      let bx = cx + (Math.random() - 0.5) * screenW * 0.8;
      let by = 0;
      while (by < screenH) {
        bolt.push({ x: Math.round(bx), y: Math.round(by) });
        by += 1 + Math.random();
        bx += (Math.random() - 0.5) * 4;
        // Bias toward target
        bx += (cx - bx) * 0.08;
      }
      this.bolts.push({ path: bolt, triggerFrame: 20 + i * 6, duration: 8 });
    }
  }

  update(frame) {
    const elapsed = frame - this.startFrame;
    if (elapsed >= this.duration) {
      this.done = true;
      return;
    }

    const t = elapsed / this.duration;
    for (const d of this.debris) {
      d.angle += d.rotSpeed * (1 + t * 3); // accelerate rotation over time
      if (t > 0.65) {
        // Phase 3: Collapse inward
        d.radius = Math.max(0.5, d.radius * 0.94);
      }
    }
  }

  draw(screen, frame) {
    const elapsed = frame - this.startFrame;
    if (elapsed < 0 || this.done) return;
    const t = elapsed / this.duration;

    const { cx, cy, w, h } = this;

    // Phase 1 & 2: Spinning vortex rings
    if (t < 0.85) {
      const intensity = Math.min(1, t / 0.3); // ramp up
      const numRings = Math.floor(3 + intensity * 5);

      for (let ring = 0; ring < numRings; ring++) {
        const r = 2 + ring * 3;
        const segments = Math.floor(r * 4) + 10;
        const rotDir = ring % 2 === 0 ? 1 : -1;
        const rotOffset = elapsed * 0.12 * rotDir * (1 + ring * 0.3);

        for (let i = 0; i < segments; i++) {
          const a = (i / segments) * Math.PI * 2 + rotOffset;
          const wobble = Math.sin(a * 3 + elapsed * 0.2) * 0.5;
          const px = cx + Math.round(Math.cos(a) * (r + wobble) * 2);
          const py = cy + Math.round(Math.sin(a) * (r + wobble) * 0.7);

          if (px >= 0 && px < w && py >= 0 && py < h) {
            // Color layers: inner = bright teal, outer = deep blue-purple
            const layerT = ring / numRings;
            const stormColor = layerT < 0.3
              ? rgb(100, 240, 255)
              : layerT < 0.6
                ? rgb(80, 180, 240)
                : rgb(120, 100, 220);
            const ch = STORM_CHARS[(i + elapsed) % STORM_CHARS.length];
            screen.set(px, py, ch, stormColor);
          }
        }
      }
    }

    // Debris particles
    for (const d of this.debris) {
      const px = cx + Math.round(Math.cos(d.angle) * d.radius * 2);
      const py = cy + Math.round(Math.sin(d.angle) * d.radius * 0.7);
      if (px >= 0 && px < w && py >= 0 && py < h) {
        const flicker = Math.sin(d.phase + elapsed * 0.3) > -0.3;
        if (!flicker) continue;
        const dColor = d.layer < 2
          ? rgb(140, 220, 255)
          : rgb(180, 140, 255);
        screen.set(px, py, d.char, dColor);
      }
    }

    // Lightning bolts (Phase 2+)
    for (const bolt of this.bolts) {
      const bElapsed = elapsed - bolt.triggerFrame;
      if (bElapsed < 0 || bElapsed >= bolt.duration) continue;

      const bT = bElapsed / bolt.duration;
      const visible = Math.floor(bolt.path.length * Math.min(1, bT * 3)); // fast strike
      const fade = bT > 0.5 ? 1 - (bT - 0.5) / 0.5 : 1;

      for (let i = 0; i < visible; i++) {
        const { x, y } = bolt.path[i];
        if (x >= 0 && x < w && y >= 0 && y < h) {
          const boltColor = fade > 0.7
            ? rgb(255, 255, 255)
            : fade > 0.4
              ? rgb(180, 220, 255)
              : rgb(80, 120, 180);
          const ch = BOLT_CHARS[Math.floor(Math.random() * BOLT_CHARS.length)];
          screen.set(x, y, ch, boltColor);

          // Glow around bolt
          for (const [gx, gy] of [[x - 1, y], [x + 1, y]]) {
            if (gx >= 0 && gx < w && gy >= 0 && gy < h && fade > 0.5) {
              screen.set(gx, gy, '░', rgb(100, 160, 255));
            }
          }
        }
      }
    }

    // Phase 3: Collapse flash at center
    if (t > 0.7) {
      const collapse = (t - 0.7) / 0.3;

      // Contracting bright ring
      const collapseR = (1 - collapse) * 12;
      if (collapseR > 0.5) {
        const segments = Math.floor(collapseR * 6) + 12;
        for (let i = 0; i < segments; i++) {
          const a = (i / segments) * Math.PI * 2 + elapsed * 0.3;
          const px = cx + Math.round(Math.cos(a) * collapseR * 2);
          const py = cy + Math.round(Math.sin(a) * collapseR * 0.7);
          if (px >= 0 && px < w && py >= 0 && py < h) {
            screen.set(px, py, '█', rgb(200, 240, 255));
          }
        }
      }

      // Central impact flash
      if (collapse > 0.7) {
        const flashIntensity = (collapse - 0.7) / 0.3;
        const flashR = flashIntensity * 5;
        for (let dy = -Math.floor(flashR); dy <= Math.floor(flashR); dy++) {
          for (let dx = -Math.floor(flashR * 2); dx <= Math.floor(flashR * 2); dx++) {
            const dist = Math.sqrt((dx / 2) ** 2 + dy ** 2);
            if (dist <= flashR) {
              const px = cx + dx;
              const py = cy + dy;
              if (px >= 0 && px < w && py >= 0 && py < h) {
                const fc = dist < flashR * 0.5
                  ? rgb(255, 255, 255)
                  : rgb(140, 220, 255);
                screen.set(px, py, '█', fc);
              }
            }
          }
        }
      }
    }

    // Eye of the storm — center marker
    if (t < 0.85) {
      const eyeChars = ['◎', '●', '◉', '○'];
      const eyeChar = eyeChars[elapsed % eyeChars.length];
      screen.set(cx, cy, eyeChar, rgb(255, 255, 255), null, true);
    }
  }
}

// ─── ION CANNON ───
// Phase 1: Targeting reticle locks onto target, crosshairs narrow
// Phase 2: Massive vertical beam slams down from top of screen
// Phase 3: Impact crater — rings of energy radiate out from target

class IonCannonEffect {
  constructor(cx, cy, screenW, screenH, startFrame) {
    this.cx = cx;
    this.cy = cy;
    this.w = screenW;
    this.h = screenH;
    this.startFrame = startFrame;
    this.duration = 60; // 3s
    this.done = false;
  }

  update(frame) {
    if (frame - this.startFrame >= this.duration) this.done = true;
  }

  draw(screen, frame) {
    const elapsed = frame - this.startFrame;
    if (elapsed < 0 || this.done) return;
    const t = elapsed / this.duration;
    const { cx, cy, w, h } = this;

    // Phase 1: Targeting reticle (0-35%)
    if (t < 0.35) {
      const lock = t / 0.35;
      const reticleR = 12 - lock * 9; // shrinks from 12 to 3

      // Crosshair lines
      const lineLen = Math.floor(reticleR * 2);
      for (let i = -lineLen; i <= lineLen; i++) {
        const px = cx + i;
        if (px >= 0 && px < w) {
          const ch = i === 0 ? '┼' : '─';
          screen.set(px, cy, ch, rgb(255, 80, 80));
        }
      }
      for (let i = -Math.floor(reticleR); i <= Math.floor(reticleR); i++) {
        const py = cy + i;
        if (py >= 0 && py < h) {
          const ch = i === 0 ? '┼' : '│';
          screen.set(cx, py, ch, rgb(255, 80, 80));
        }
      }

      // Rotating corner brackets
      const corners = [[-1, -1], [1, -1], [-1, 1], [1, 1]];
      for (const [sx, sy] of corners) {
        const bx = cx + Math.round(sx * reticleR * 1.5);
        const by = cy + Math.round(sy * reticleR * 0.5);
        if (bx >= 0 && bx < w && by >= 0 && by < h) {
          const ch = sx < 0 ? (sy < 0 ? '┌' : '└') : (sy < 0 ? '┐' : '┘');
          screen.set(bx, by, ch, rgb(255, 120, 120));
        }
      }

      // "LOCKED" text once close
      if (lock > 0.7) {
        const label = 'TARGET LOCKED';
        const lx = cx - Math.floor(label.length / 2);
        for (let i = 0; i < label.length; i++) {
          if (lx + i >= 0 && lx + i < w && cy - 3 >= 0) {
            screen.set(lx + i, cy - 3, label[i], rgb(255, 60, 60), null, true);
          }
        }
      }
    }

    // Phase 2: Beam strike (30-70%)
    if (t >= 0.30 && t < 0.70) {
      const beamT = (t - 0.30) / 0.40;
      const beamBottom = Math.floor(beamT * cy * 3); // beam descends fast

      // Main beam column — 5 chars wide
      for (let dy = 0; dy < Math.min(beamBottom, h); dy++) {
        const py = dy;
        const distFromCenter = Math.abs(py - cy);
        for (let dx = -2; dx <= 2; dx++) {
          const px = cx + dx;
          if (px < 0 || px >= w || py < 0 || py >= h) continue;
          const edgeDist = Math.abs(dx);
          const beamColor = edgeDist === 0
            ? rgb(255, 255, 255)
            : edgeDist === 1
              ? rgb(200, 230, 255)
              : rgb(120, 180, 255);
          const ch = edgeDist === 0 ? '█' : edgeDist === 1 ? '▓' : '░';
          screen.set(px, py, ch, beamColor);
        }
      }

      // Beam glow — wider, dimmer columns on either side
      for (let dy = 0; dy < Math.min(beamBottom, h); dy++) {
        for (const dx of [-3, 3]) {
          const px = cx + dx;
          if (px >= 0 && px < w && dy >= 0 && dy < h) {
            screen.set(px, dy, '░', rgb(60, 100, 200));
          }
        }
      }

      // Impact sparks at beam contact point
      if (beamT > 0.3) {
        const sparkCount = Math.floor(beamT * 12);
        for (let i = 0; i < sparkCount; i++) {
          const angle = (i / sparkCount) * Math.PI * 2 + elapsed * 0.5;
          const r = 2 + beamT * 5;
          const px = cx + Math.round(Math.cos(angle) * r * 1.5);
          const py = cy + Math.round(Math.sin(angle) * r * 0.5);
          if (px >= 0 && px < w && py >= 0 && py < h) {
            screen.set(px, py, '✦', rgb(200, 220, 255));
          }
        }
      }
    }

    // Phase 3: Impact crater (65-100%)
    if (t >= 0.65) {
      const impact = (t - 0.65) / 0.35;
      const fade = 1 - impact;

      // Expanding shockwave rings
      for (let ring = 0; ring < 3; ring++) {
        const r = impact * (8 + ring * 6);
        const segments = Math.floor(r * 5) + 12;
        const ringFade = Math.max(0, fade - ring * 0.15);
        if (ringFade <= 0) continue;

        for (let i = 0; i < segments; i++) {
          const a = (i / segments) * Math.PI * 2;
          const px = cx + Math.round(Math.cos(a) * r * 2);
          const py = cy + Math.round(Math.sin(a) * r * 0.6);
          if (px >= 0 && px < w && py >= 0 && py < h) {
            const rc = ringFade > 0.6
              ? rgb(200, 230, 255)
              : ringFade > 0.3
                ? rgb(120, 160, 220)
                : rgb(60, 80, 140);
            screen.set(px, py, ring === 0 ? '█' : '▒', rc);
          }
        }
      }

      // Lingering beam core flicker
      if (impact < 0.5) {
        for (let dy = 0; dy < cy; dy++) {
          if ((elapsed + dy) % 3 === 0) {
            screen.set(cx, dy, '│', rgb(100, 150, 255));
          }
        }
      }
    }
  }
}


// ─── QUANTUM RIFT ───
// Phase 1: Glitchy tears/portals rip open across the screen
// Phase 2: Target gets pulled through distortion — screen warps
// Phase 3: Reality snaps back — shatter fragments scatter

const RIFT_CHARS = '╳╬╋┼┃━║═▀▄▌▐█▓▒░';

class QuantumRiftEffect {
  constructor(cx, cy, screenW, screenH, startFrame) {
    this.cx = cx;
    this.cy = cy;
    this.w = screenW;
    this.h = screenH;
    this.startFrame = startFrame;
    this.duration = 65; // 3.25s
    this.done = false;

    // Pre-compute tear positions
    this.tears = [];
    for (let i = 0; i < 8; i++) {
      const tx = Math.floor(Math.random() * screenW);
      const ty = Math.floor(Math.random() * screenH);
      const len = 5 + Math.floor(Math.random() * 15);
      const vertical = Math.random() > 0.5;
      this.tears.push({ x: tx, y: ty, len, vertical, delay: i * 3 });
    }

    // Shatter fragments for phase 3
    this.fragments = [];
    for (let i = 0; i < 40; i++) {
      const angle = Math.random() * Math.PI * 2;
      this.fragments.push({
        angle,
        speed: 0.5 + Math.random() * 1.5,
        dist: 0,
        char: RIFT_CHARS[Math.floor(Math.random() * RIFT_CHARS.length)],
        hue: Math.floor(Math.random() * 3), // 0=magenta, 1=cyan, 2=white
      });
    }
  }

  update(frame) {
    const elapsed = frame - this.startFrame;
    if (elapsed >= this.duration) { this.done = true; return; }
    const t = elapsed / this.duration;

    // Phase 3: fragments fly outward
    if (t > 0.7) {
      for (const f of this.fragments) {
        f.dist += f.speed;
      }
    }
  }

  draw(screen, frame) {
    const elapsed = frame - this.startFrame;
    if (elapsed < 0 || this.done) return;
    const t = elapsed / this.duration;
    const { cx, cy, w, h } = this;

    // Phase 1: Tears rip open (0-50%)
    if (t < 0.65) {
      const tearIntensity = Math.min(1, t / 0.3);

      for (const tear of this.tears) {
        if (elapsed < tear.delay) continue;
        const tearAge = elapsed - tear.delay;
        const tearLen = Math.min(tear.len, Math.floor(tearAge * 1.5));

        for (let i = 0; i < tearLen; i++) {
          const px = tear.vertical ? tear.x : tear.x + i;
          const py = tear.vertical ? tear.y + i : tear.y;
          if (px < 0 || px >= w || py < 0 || py >= h) continue;

          // Glitchy edge — alternate colors rapidly
          const glitchCycle = (elapsed + i) % 4;
          const tearColor = glitchCycle === 0
            ? rgb(255, 80, 255)   // magenta
            : glitchCycle === 1
              ? rgb(80, 255, 255)   // cyan
              : glitchCycle === 2
                ? rgb(255, 255, 255) // white
                : rgb(180, 80, 255); // purple
          const ch = RIFT_CHARS[(elapsed + i) % RIFT_CHARS.length];
          screen.set(px, py, ch, tearColor);

          // Distortion glow around tears
          for (const [gx, gy] of [[px - 1, py], [px + 1, py], [px, py - 1], [px, py + 1]]) {
            if (gx >= 0 && gx < w && gy >= 0 && gy < h && (elapsed + i) % 3 === 0) {
              screen.set(gx, gy, '░', rgb(120, 60, 180));
            }
          }
        }
      }
    }

    // Phase 2: Target distortion (30-75%) — warping rings around target
    if (t >= 0.25 && t < 0.75) {
      const warpT = (t - 0.25) / 0.50;
      const numRings = Math.floor(2 + warpT * 4);

      for (let ring = 0; ring < numRings; ring++) {
        const r = 2 + ring * 2.5;
        const segments = Math.floor(r * 5) + 10;
        // Each ring rotates opposite direction and at different speed
        const rotDir = ring % 2 === 0 ? 1 : -1;
        const rotSpeed = 0.15 + ring * 0.05;

        for (let i = 0; i < segments; i++) {
          const a = (i / segments) * Math.PI * 2 + elapsed * rotSpeed * rotDir;
          // Wobble the ring shape — not a clean circle
          const wobble = Math.sin(a * 4 + elapsed * 0.3) * 0.8;
          const px = cx + Math.round(Math.cos(a) * (r + wobble) * 2);
          const py = cy + Math.round(Math.sin(a) * (r + wobble) * 0.6);

          if (px >= 0 && px < w && py >= 0 && py < h) {
            const cycle = (i + elapsed) % 3;
            const warpColor = cycle === 0
              ? rgb(255, 100, 255)
              : cycle === 1
                ? rgb(100, 255, 255)
                : rgb(200, 150, 255);
            screen.set(px, py, '◈', warpColor);
          }
        }
      }

      // Central portal — pulsing
      const pulseR = 1.5 + Math.sin(elapsed * 0.4) * 0.5;
      for (let dy = -Math.floor(pulseR); dy <= Math.floor(pulseR); dy++) {
        for (let dx = -Math.floor(pulseR * 2); dx <= Math.floor(pulseR * 2); dx++) {
          const dist = Math.sqrt((dx / 2) ** 2 + dy ** 2);
          if (dist <= pulseR) {
            const px = cx + dx;
            const py = cy + dy;
            if (px >= 0 && px < w && py >= 0 && py < h) {
              screen.set(px, py, '█', rgb(40, 0, 60));
            }
          }
        }
      }
    }

    // Phase 3: Reality snap-back (70-100%) — fragments scatter
    if (t >= 0.7) {
      const snapT = (t - 0.7) / 0.3;

      // Flash on first few frames
      if (snapT < 0.15) {
        const flashR = (1 - snapT / 0.15) * 8;
        for (let dy = -Math.floor(flashR); dy <= Math.floor(flashR); dy++) {
          for (let dx = -Math.floor(flashR * 2); dx <= Math.floor(flashR * 2); dx++) {
            if (Math.sqrt((dx / 2) ** 2 + dy ** 2) <= flashR) {
              const px = cx + dx;
              const py = cy + dy;
              if (px >= 0 && px < w && py >= 0 && py < h) {
                screen.set(px, py, '█', rgb(255, 200, 255));
              }
            }
          }
        }
      }

      // Scattered fragments
      for (const f of this.fragments) {
        const px = cx + Math.round(Math.cos(f.angle) * f.dist * 2);
        const py = cy + Math.round(Math.sin(f.angle) * f.dist * 0.6);
        if (px >= 0 && px < w && py >= 0 && py < h) {
          const fade = Math.max(0, 1 - snapT);
          if (fade <= 0) continue;
          const fc = f.hue === 0
            ? rgb(Math.floor(255 * fade), 0, Math.floor(255 * fade))
            : f.hue === 1
              ? rgb(0, Math.floor(255 * fade), Math.floor(255 * fade))
              : rgb(Math.floor(255 * fade), Math.floor(255 * fade), Math.floor(255 * fade));
          screen.set(px, py, f.char, fc);
        }
      }
    }
  }
}


// ─── SUPERNOVA ───
// Phase 1: Core ignition — small bright point grows, pulsing
// Phase 2: Expanding fireball — rings of orange/white/yellow fill the screen
// Phase 3: Aftermath — embers drift down, screen goes hot-white then fades

class SupernovaEffect {
  constructor(cx, cy, screenW, screenH, startFrame) {
    this.cx = cx;
    this.cy = cy;
    this.w = screenW;
    this.h = screenH;
    this.startFrame = startFrame;
    this.duration = 80; // 4s — the big one
    this.done = false;

    // Embers for phase 3
    this.embers = [];
    for (let i = 0; i < 50; i++) {
      this.embers.push({
        x: cx + (Math.random() - 0.5) * screenW * 0.9,
        y: cy + (Math.random() - 0.5) * screenH * 0.6,
        vy: 0.1 + Math.random() * 0.3,
        vx: (Math.random() - 0.5) * 0.4,
        char: '●◆★·◦✦*'[Math.floor(Math.random() * 8)],
        brightness: 0.5 + Math.random() * 0.5,
      });
    }
  }

  update(frame) {
    const elapsed = frame - this.startFrame;
    if (elapsed >= this.duration) { this.done = true; return; }
    const t = elapsed / this.duration;

    // Phase 3: embers drift
    if (t > 0.6) {
      for (const e of this.embers) {
        e.y += e.vy;
        e.x += e.vx;
        e.brightness *= 0.98;
      }
    }
  }

  draw(screen, frame) {
    const elapsed = frame - this.startFrame;
    if (elapsed < 0 || this.done) return;
    const t = elapsed / this.duration;
    const { cx, cy, w, h } = this;

    // Phase 1: Core ignition (0-30%) — pulsing bright core
    if (t < 0.35) {
      const ignite = t / 0.35;
      const coreR = 1 + ignite * 3;
      const pulse = Math.sin(elapsed * 0.6) * 0.3 + 0.7;

      for (let dy = -Math.floor(coreR); dy <= Math.floor(coreR); dy++) {
        for (let dx = -Math.floor(coreR * 2); dx <= Math.floor(coreR * 2); dx++) {
          const dist = Math.sqrt((dx / 2) ** 2 + dy ** 2);
          if (dist > coreR) continue;
          const px = cx + dx;
          const py = cy + dy;
          if (px < 0 || px >= w || py < 0 || py >= h) continue;

          const bright = (1 - dist / coreR) * pulse;
          const coreColor = bright > 0.7
            ? rgb(255, 255, 240)
            : bright > 0.4
              ? rgb(255, 220, 140)
              : rgb(255, 160, 60);
          screen.set(px, py, bright > 0.5 ? '█' : '▓', coreColor);
        }
      }

      // Corona rays
      if (ignite > 0.4) {
        const rayCount = 8;
        const rayLen = ignite * 8;
        for (let r = 0; r < rayCount; r++) {
          const a = (r / rayCount) * Math.PI * 2 + elapsed * 0.1;
          for (let d = coreR; d < coreR + rayLen; d += 0.8) {
            const px = cx + Math.round(Math.cos(a) * d * 2);
            const py = cy + Math.round(Math.sin(a) * d * 0.6);
            if (px >= 0 && px < w && py >= 0 && py < h) {
              const rayFade = 1 - (d - coreR) / rayLen;
              const rayColor = rayFade > 0.6
                ? rgb(255, 240, 180)
                : rgb(255, 180, 80);
              screen.set(px, py, rayFade > 0.5 ? '·' : '·', rayColor);
            }
          }
        }
      }
    }

    // Phase 2: Expanding fireball (25-65%)
    if (t >= 0.25 && t < 0.65) {
      const fireT = (t - 0.25) / 0.40;
      const maxR = 20;
      const fireR = fireT * maxR;

      // Fill the fireball area with layered color
      for (let dy = -Math.floor(fireR); dy <= Math.floor(fireR); dy++) {
        for (let dx = -Math.floor(fireR * 2); dx <= Math.floor(fireR * 2); dx++) {
          const dist = Math.sqrt((dx / 2) ** 2 + dy ** 2);
          if (dist > fireR) continue;
          const px = cx + dx;
          const py = cy + dy;
          if (px < 0 || px >= w || py < 0 || py >= h) continue;

          const band = dist / fireR;
          let fireColor, ch;
          if (band < 0.2) {
            // White-hot core
            fireColor = rgb(255, 255, 255);
            ch = '█';
          } else if (band < 0.45) {
            // Yellow
            fireColor = rgb(255, 240, 120);
            ch = '▓';
          } else if (band < 0.7) {
            // Orange
            const flicker = Math.sin(dx + elapsed * 0.4) > 0;
            fireColor = flicker ? rgb(255, 180, 60) : rgb(255, 140, 40);
            ch = flicker ? '▓' : '▒';
          } else {
            // Red edge
            const flicker = Math.sin(dy * 2 + elapsed * 0.3) > 0;
            fireColor = flicker ? rgb(240, 80, 40) : rgb(200, 50, 30);
            ch = '░';
          }
          screen.set(px, py, ch, fireColor);
        }
      }

      // Outer shockwave ring
      if (fireT > 0.3) {
        const shockR = fireR + 3;
        const segments = Math.floor(shockR * 5) + 16;
        for (let i = 0; i < segments; i++) {
          const a = (i / segments) * Math.PI * 2;
          const px = cx + Math.round(Math.cos(a) * shockR * 2.2);
          const py = cy + Math.round(Math.sin(a) * shockR * 0.7);
          if (px >= 0 && px < w && py >= 0 && py < h) {
            screen.set(px, py, '█', rgb(255, 200, 100));
          }
        }
      }
    }

    // Phase 3: Aftermath (60-100%) — fireball fades, embers drift
    if (t >= 0.60) {
      const aftermath = (t - 0.60) / 0.40;

      // Fading center glow
      if (aftermath < 0.5) {
        const glowR = (1 - aftermath * 2) * 10;
        for (let dy = -Math.floor(glowR); dy <= Math.floor(glowR); dy++) {
          for (let dx = -Math.floor(glowR * 2); dx <= Math.floor(glowR * 2); dx++) {
            const dist = Math.sqrt((dx / 2) ** 2 + dy ** 2);
            if (dist > glowR) continue;
            const px = cx + dx;
            const py = cy + dy;
            if (px < 0 || px >= w || py < 0 || py >= h) continue;
            const fade = (1 - aftermath * 2) * (1 - dist / glowR);
            const gc = rgb(
              Math.floor(255 * fade),
              Math.floor(160 * fade),
              Math.floor(40 * fade),
            );
            screen.set(px, py, '▒', gc);
          }
        }
      }

      // Drifting embers
      for (const e of this.embers) {
        const px = Math.round(e.x);
        const py = Math.round(e.y);
        if (px < 0 || px >= w || py < 0 || py >= h) continue;
        if (e.brightness < 0.1) continue;
        const ec = rgb(
          Math.floor(255 * e.brightness),
          Math.floor(140 * e.brightness),
          Math.floor(40 * e.brightness),
        );
        screen.set(px, py, e.char, ec);
      }
    }
  }
}

module.exports = { BlackHoleEffect, MaelstromEffect, IonCannonEffect, QuantumRiftEffect, SupernovaEffect };
