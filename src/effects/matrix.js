// Matrix rain background effect — subtle, dimmed, pastel-tinted
const { colors } = require('../palette');

// Katakana + digits + symbols for that authentic matrix feel
const MATRIX_CHARS = 'ァアィイゥウェエォオカキクケコサシスセソタチツテトナニヌネノハヒフヘホマミムメモヤユヨラリルレロワヲン0123456789ABCDEFabcdef{}[]<>|/\\~!@#$%^&*';

class MatrixRain {
  constructor(width, height, rng) {
    this.width = width;
    this.height = height;
    this.rng = rng;
    this.columns = [];
    this.exclusionZone = null; // { x, y, w, h } — skip drawing in this rect

    for (let x = 0; x < width; x++) {
      this.columns.push({
        y: rng.int(-height, 0),         // start position (negative = delayed)
        speed: rng.float(0.5, 1.3),      // cells per frame — faster min for smoother motion
        length: rng.int(4, 14),           // trail length
        accumulator: 0,                   // sub-frame accumulation
        active: rng.chance(0.75),         // 75% active for denser rain
        chars: [],                        // pre-generated characters
      });

      // Pre-fill character buffer
      for (let i = 0; i < height + 20; i++) {
        this.columns[x].chars.push(MATRIX_CHARS[Math.floor(rng.next() * MATRIX_CHARS.length)]);
      }
    }

    // Pre-warm: advance all columns so rain is visible from frame 1
    // Simulate ~30 frames of advancement
    for (let f = 0; f < 30; f++) {
      for (const col of this.columns) {
        if (!col.active) continue;
        col.accumulator += col.speed;
        while (col.accumulator >= 1) {
          col.y++;
          col.accumulator -= 1;
        }
        if (col.y - col.length > this.height) {
          col.y = this.rng.int(-3, -1);
          col.speed = this.rng.float(0.5, 1.3);
          col.length = this.rng.int(4, 14);
          col.active = this.rng.chance(0.75);
        }
      }
    }
  }

  update() {
    for (const col of this.columns) {
      if (!col.active) continue;
      col.accumulator += col.speed;
      while (col.accumulator >= 1) {
        col.y++;
        col.accumulator -= 1;
      }
      // Reset column when it falls off screen
      if (col.y - col.length > this.height) {
        col.y = this.rng.int(-3, -1);       // shorter delay before re-entering
        col.speed = this.rng.float(0.5, 1.3);
        col.length = this.rng.int(4, 14);
        col.active = this.rng.chance(0.75);  // higher re-activation rate
      }
    }
  }

  // Render to screen buffer — draws BEHIND everything else
  // Called right after screen.clear(), so all cells are empty — no need to check cell state
  draw(screen) {
    const ez = this.exclusionZone;
    const sh = screen.height;
    const sw = screen.width;

    for (let x = 0; x < this.width && x < sw; x++) {
      const col = this.columns[x];
      if (!col.active) continue;

      const colY = Math.floor(col.y);
      const len = col.length;
      const chars = col.chars;

      for (let i = 0; i < len; i++) {
        const y = colY - i;
        if (y < 0 || y >= sh) continue;

        // Skip exclusion zone (log/UI area during move selection)
        if (ez && x >= ez.x && x < ez.x + ez.w && y >= ez.y && y < ez.y + ez.h) continue;

        const charIdx = (y + 100) % chars.length;
        const brightness = i === 0 ? 1.0 : 1.0 - (i / len);

        let fg;
        if (brightness > 0.9) {
          fg = colors.matrixBright;   // leading character is bright
        } else if (brightness > 0.4) {
          fg = colors.matrix;          // mid-trail
        } else {
          fg = colors.ghost;           // tail fades out
        }

        screen.set(x, y, chars[charIdx], fg);
      }
    }
  }
}

module.exports = { MatrixRain };
