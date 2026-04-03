// Flicker-free terminal screen buffer with row-level diff rendering
// Skips entirely unchanged rows; redraws changed rows in full for correct color state

const { ESC, RESET } = require('./palette');

const ALT_SCREEN_ON = `${ESC}?1049h`;
const ALT_SCREEN_OFF = `${ESC}?1049l`;
const CURSOR_HIDE = `${ESC}?25l`;
const CURSOR_SHOW = `${ESC}?25h`;
const CLEAR_SCREEN = `${ESC}2J`;

class Screen {
  constructor() {
    this.width = Math.min(process.stdout.columns || 120, 200);
    this.height = Math.min(process.stdout.rows || 30, 50);
    if (this.width < 60) this.width = 60;
    if (this.height < 20) this.height = 20;

    this.buffer = this._createBuffer();
    // Snapshot of previous frame for row-level diffing
    this.prev = this._createBuffer();
    this.active = false;
    this._firstRender = true;
    this._writePending = false;
  }

  _createBuffer() {
    const buf = [];
    for (let y = 0; y < this.height; y++) {
      const row = [];
      for (let x = 0; x < this.width; x++) {
        row.push({ char: ' ', fg: null, bg: null, bold: false });
      }
      buf.push(row);
    }
    return buf;
  }

  enter() {
    this.active = true;
    this._firstRender = true;
    process.stdout.write(ALT_SCREEN_ON + CURSOR_HIDE + CLEAR_SCREEN);
    const cleanup = () => this.exit();
    process.on('SIGINT', cleanup);
    process.on('SIGTERM', cleanup);
    this._cleanup = cleanup;
  }

  exit() {
    if (!this.active) return;
    this.active = false;
    process.stdout.write(CURSOR_SHOW + ALT_SCREEN_OFF + RESET);
    if (this._cleanup) {
      process.removeListener('SIGINT', this._cleanup);
      process.removeListener('SIGTERM', this._cleanup);
    }
  }

  clear() {
    for (let y = 0; y < this.height; y++) {
      const row = this.buffer[y];
      for (let x = 0; x < this.width; x++) {
        const c = row[x];
        c.char = ' '; c.fg = null; c.bg = null; c.bold = false;
      }
    }
  }

  // Force next render() to redraw every row (clears diff state)
  resetDiff() {
    this._firstRender = true;
    for (let y = 0; y < this.height; y++) {
      const prow = this.prev[y];
      for (let x = 0; x < this.width; x++) {
        const p = prow[x];
        // Set to sentinel that won't match any real content
        p.char = '\x00'; p.fg = '\x00'; p.bg = null; p.bold = false;
      }
    }
  }

  set(x, y, char, fg, bg, bold) {
    x = Math.floor(x);
    y = Math.floor(y);
    if (x < 0 || x >= this.width || y < 0 || y >= this.height) return;
    const c = this.buffer[y][x];
    c.char = char;
    c.fg = fg || null;
    c.bg = bg || null;
    c.bold = bold || false;
  }

  text(x, y, str, fg, bg, bold) {
    for (let i = 0; i < str.length; i++) {
      this.set(x + i, y, str[i], fg, bg, bold);
    }
  }

  centerText(y, str, fg, bg, bold) {
    const x = Math.floor((this.width - str.length) / 2);
    this.text(x, y, str, fg, bg, bold);
  }

  box(x, y, w, h, fg, bg) {
    this.set(x, y, '╭', fg, bg);
    this.set(x + w - 1, y, '╮', fg, bg);
    this.set(x, y + h - 1, '╰', fg, bg);
    this.set(x + w - 1, y + h - 1, '╯', fg, bg);
    for (let i = 1; i < w - 1; i++) {
      this.set(x + i, y, '─', fg, bg);
      this.set(x + i, y + h - 1, '─', fg, bg);
    }
    for (let i = 1; i < h - 1; i++) {
      this.set(x, y + i, '│', fg, bg);
      this.set(x + w - 1, y + i, '│', fg, bg);
    }
  }

  hline(x, y, length, char, fg) {
    for (let i = 0; i < length; i++) {
      this.set(x + i, y, char || '─', fg);
    }
  }

  bar(x, y, width, ratio, fgFull, fgEmpty) {
    const filled = Math.round(width * Math.max(0, Math.min(1, ratio)));
    for (let i = 0; i < width; i++) {
      if (i < filled) {
        this.set(x + i, y, '█', fgFull);
      } else {
        this.set(x + i, y, '░', fgEmpty || fgFull);
      }
    }
  }

  // Row-level diff render: skip unchanged rows, redraw changed rows in full
  render() {
    // Skip entire frame if stdout hasn't drained — avoids buffer buildup
    if (this._writePending) return;

    const parts = [];
    const full = this._firstRender;

    for (let y = 0; y < this.height; y++) {
      const row = this.buffer[y];
      const prow = this.prev[y];

      // Quick check: did any cell in this row change?
      if (!full) {
        let changed = false;
        for (let x = 0; x < this.width; x++) {
          const c = row[x]; const p = prow[x];
          if (c.char !== p.char || c.fg !== p.fg || c.bg !== p.bg || c.bold !== p.bold) {
            changed = true;
            break;
          }
        }
        if (!changed) continue; // skip this row entirely
      }

      // Render the full row (correct color state guaranteed)
      parts.push(`${ESC}${y + 1};1H`);
      let lastFg = null;
      let lastBg = null;
      let lastBold = false;

      for (let x = 0; x < this.width; x++) {
        const c = row[x];
        const needFg = c.fg !== lastFg;
        const needBg = c.bg !== lastBg;
        const needBold = c.bold !== lastBold;

        if (needFg || needBg || needBold) {
          parts.push(RESET);
          if (c.bg) parts.push(c.bg);
          if (c.fg) parts.push(c.fg);
          if (c.bold) parts.push(`${ESC}1m`);
          lastFg = c.fg;
          lastBg = c.bg;
          lastBold = c.bold;
        }
        parts.push(c.char);
      }
      parts.push(RESET);

      // Snapshot this row into prev
      for (let x = 0; x < this.width; x++) {
        const c = row[x]; const p = prow[x];
        p.char = c.char; p.fg = c.fg; p.bg = c.bg; p.bold = c.bold;
      }
    }

    if (parts.length > 0) {
      const ok = process.stdout.write(parts.join(''));
      if (!ok) {
        this._writePending = true;
        process.stdout.once('drain', () => { this._writePending = false; });
      }
    }

    this._firstRender = false;
  }
}

module.exports = { Screen };
