// ═══════════════════════════════════════════════════════════════
// MOVE SELECTION UI — 2-column layout with cooldown indicators
// Arrow keys to navigate, Enter to confirm. BAG on bottom row.
// Supports background animation via onTick callback
// ═══════════════════════════════════════════════════════════════

const { colors, rgb, RESET, ESC } = require('./palette');
const { getOwnedItems, useItem, ITEMS, RARITY_COLORS } = require('./items');
const { SIGNATURE_COLOR, SIGNATURE_ACCENT, SIGNATURE_ICON } = require('./signature');
const { drawArt, getItemArt, ART_H } = require('./itemart');

const CAT_COLORS = {
  physical: colors.peach,
  magic:    colors.lavender,
  speed:    colors.sky,
  special:  colors.gold,
};

const CAT_ICONS = {
  physical: '⚔',
  magic:    '◆',
  speed:    '»',
  special:  '★',
};

// Main move selection — returns { type: 'move', move } or { type: 'item', item }
// onTick: optional callback called at ~20fps to animate background scene.
function selectMove(moves, screen, logX, logY, logW, logH, onTick) {
  return new Promise((resolve) => {
    let cursorRow = 0;  // 0-2 = move rows, 3 = BAG
    let cursorCol = 0;  // 0 = left, 1 = right
    let mode = 'moves';   // 'moves' or 'bag'
    let bagItems = [];
    let bagCursor = 0;
    let done = false;

    function getCursorIndex() { return cursorRow * 2 + cursorCol; }

    const stdin = process.stdin;
    stdin.setRawMode(true);
    stdin.resume();
    stdin.setEncoding('utf8');

    function drawMoveUI() {
      // Clear the log area
      for (let row = 0; row < logH; row++) {
        for (let x = logX; x < logX + logW; x++) {
          screen.set(x, logY + row, ' ');
        }
      }

      if (mode === 'moves') {
        screen.text(logX + 1, logY, '╸ SELECT YOUR MOVE ╺', colors.gold, null, true);

        const colW = Math.floor((logW - 2) / 2);
        const rightColX = logX + colW + 2;

        // 2-column: left col = indices 0,2,4  right col = 1,3,5
        for (let row = 0; row < 3; row++) {
          const y = logY + 1 + row;
          for (let col = 0; col < 2; col++) {
            const idx = row * 2 + col;
            if (idx >= moves.length) continue;
            const m = moves[idx];
            const x = col === 0 ? logX : rightColX;
            const selected = cursorRow === row && cursorCol === col;
            const isSig = m.signature;
            const icon = isSig ? SIGNATURE_ICON : (CAT_ICONS[m.cat] || '·');
            const baseColor = isSig ? SIGNATURE_COLOR : (CAT_COLORS[m.cat] || colors.dim);
            const dimColor = isSig ? SIGNATURE_ACCENT : colors.dimmer;
            const labelW = colW - 6;

            if (selected) {
              screen.text(x + 1, y, '▸', colors.white, null, true);
              screen.text(x + 3, y, icon, baseColor, null, true);
              screen.text(x + 5, y, m.label.slice(0, labelW).padEnd(labelW), colors.white, null, true);
            } else {
              screen.text(x + 3, y, icon, dimColor);
              screen.text(x + 5, y, m.label.slice(0, labelW).padEnd(labelW), isSig ? SIGNATURE_ACCENT : colors.dim);
            }
          }
        }

        // BAG row
        const bagY = logY + 4;
        const bagSelected = cursorRow === 3;
        const ownedCount = getOwnedItems().reduce((s, i) => s + i.count, 0);
        if (bagSelected) {
          screen.text(logX + 1, bagY, '▸', colors.white, null, true);
          screen.text(logX + 3, bagY, '◰', colors.mint, null, true);
          screen.text(logX + 5, bagY, 'BAG'.padEnd(20), colors.white, null, true);
          screen.text(logX + 26, bagY, `${ownedCount} items`, colors.mint);
        } else {
          screen.text(logX + 3, bagY, '◰', colors.dimmer);
          screen.text(logX + 5, bagY, 'BAG'.padEnd(20), colors.dim);
          screen.text(logX + 26, bagY, `${ownedCount} items`, colors.dimmer);
        }

      } else if (mode === 'bag') {
        screen.text(logX + 1, logY, '╸ USE AN ITEM ╺  (Esc to go back)', colors.mint, null, true);

        if (bagItems.length === 0) {
          screen.text(logX + 3, logY + 1, 'Bag is empty! Win battles to earn items.', colors.dim);
        } else {
          const ITEM_HEIGHT = ART_H + 1;
          const maxVisible = Math.max(1, Math.floor((logH - 1) / ITEM_HEIGHT));
          let scrollStart = 0;
          if (bagCursor >= scrollStart + maxVisible) scrollStart = bagCursor - maxVisible + 1;
          if (bagCursor < scrollStart) scrollStart = bagCursor;
          const endIdx = Math.min(bagItems.length, scrollStart + maxVisible);

          for (let i = scrollStart; i < endIdx; i++) {
            const item = bagItems[i];
            const slot = i - scrollStart;
            const baseY = logY + 1 + slot * ITEM_HEIGHT;
            const selected = i === bagCursor;
            const rc = RARITY_COLORS[item.rarity] || colors.dim;
            const art = getItemArt(item.id);

            if (art) {
              const artColor = selected ? art.colors : [colors.dimmer, colors.dimmer, colors.dimmer];
              drawArt(screen, logX + 3, baseY, art.lines, artColor);
            }

            const infoX = logX + 11;
            if (selected) {
              screen.text(logX + 1, baseY, '▸', colors.white, null, true);
              screen.text(infoX, baseY, item.name, colors.white, null, true);
              screen.text(infoX, baseY + 1, item.desc.slice(0, logW - 15), rc);
              screen.text(infoX, baseY + 2, `x${item.count}  (${item.rarity})`, colors.dim);
            } else {
              screen.text(infoX, baseY, item.name, colors.dim);
              screen.text(infoX, baseY + 1, item.desc.slice(0, logW - 15), colors.dimmer);
              screen.text(infoX, baseY + 2, `x${item.count}`, colors.dimmer);
            }
          }

          if (scrollStart > 0) screen.text(logX + logW - 3, logY, '▲', colors.dim);
          if (endIdx < bagItems.length) screen.text(logX + logW - 3, logY + logH - 1, '▼', colors.dim);
        }
      }
    }

    // Background animation loop
    let animTimer = null;
    function startAnim() {
      if (!onTick) return;
      const TICK = 50;
      function tick() {
        if (done) return;
        const tickStart = Date.now();
        onTick();
        drawMoveUI();
        screen.render();
        const elapsed = Date.now() - tickStart;
        animTimer = setTimeout(tick, Math.max(0, TICK - elapsed));
      }
      animTimer = setTimeout(tick, TICK);
    }

    function stopAnim() {
      if (animTimer) { clearTimeout(animTimer); animTimer = null; }
    }

    function onKey(key) {
      if (done) return;

      if (mode === 'moves') {
        const numMoves = moves.length;
        if (key === '\x1b[A' || key === 'k') {
          if (cursorRow > 0) cursorRow--;
          if (cursorRow < 3 && getCursorIndex() >= numMoves) cursorCol = 0;
        } else if (key === '\x1b[B' || key === 'j') {
          if (cursorRow < 3) cursorRow++;
          if (cursorRow < 3 && getCursorIndex() >= numMoves) cursorCol = 0;
        } else if (key === '\x1b[C' || key === 'l') {
          if (cursorRow < 3) {
            if (cursorCol === 0 && cursorRow * 2 + 1 < numMoves) cursorCol = 1;
          } else {
            bagItems = getOwnedItems();
            mode = 'bag';
            bagCursor = 0;
          }
        } else if (key === '\x1b[D' || key === 'h') {
          if (cursorRow < 3) cursorCol = 0;
        } else if (key === '\r' || key === '\n' || key === ' ') {
          if (cursorRow === 3) {
            bagItems = getOwnedItems();
            mode = 'bag';
            bagCursor = 0;
          } else {
            const idx = getCursorIndex();
            if (idx < numMoves) {
              done = true;
              stopAnim();
              cleanup();
              resolve({ type: 'move', move: moves[idx] });
              return;
            }
          }
        } else if (key === '\x03') {
          done = true;
          stopAnim();
          cleanup();
          process.exit(0);
        }
      } else if (mode === 'bag') {
        if (key === '\x1b[A' || key === 'k') {
          if (bagItems.length > 0) bagCursor = (bagCursor - 1 + bagItems.length) % bagItems.length;
        } else if (key === '\x1b[B' || key === 'j') {
          if (bagItems.length > 0) bagCursor = (bagCursor + 1) % bagItems.length;
        } else if (key === '\r' || key === '\n' || key === ' ') {
          if (bagItems.length > 0 && bagCursor < bagItems.length) {
            done = true;
            stopAnim();
            cleanup();
            resolve({ type: 'item', item: bagItems[bagCursor] });
            return;
          }
        } else if (key === '\x1b' || key === 'q' || key === '\x1b[D' || key === 'h') {
          mode = 'moves';
          cursorRow = 3;
          cursorCol = 0;
        } else if (key === '\x03') {
          done = true;
          stopAnim();
          cleanup();
          process.exit(0);
        }
      }

      if (!onTick) {
        drawMoveUI();
        screen.render();
      }
    }

    function cleanup() {
      stdin.removeListener('data', onKey);
      stdin.setRawMode(false);
      stdin.pause();
    }

    stdin.on('data', onKey);

    if (onTick) {
      onTick();
      drawMoveUI();
      screen.render();
      startAnim();
    } else {
      drawMoveUI();
      screen.render();
    }
  });
}

module.exports = { selectMove, CAT_COLORS, CAT_ICONS };
