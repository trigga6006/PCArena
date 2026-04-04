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

module.exports = { BlackHoleEffect, MaelstromEffect };
