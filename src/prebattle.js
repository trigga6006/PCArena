// ═══════════════════════════════════════════════════════════════
// PRE-BATTLE LOBBY — Configure loadout + review bag before fight
// All arrow-key driven. No typing.
// ═══════════════════════════════════════════════════════════════

const { colors, RESET, rgb } = require('./palette');
const { getOwnedItems, RARITY_COLORS } = require('./items');
const { getAvailableMoves, getEquippedMoves, saveLoadout, MOVE_POOL } = require('./moveset');

const CAT_COLORS = {
  physical: colors.peach,
  magic:    colors.lavender,
  speed:    colors.sky,
  special:  colors.gold,
};

// ─── Main pre-battle menu ───
// Returns the final equipped moves array
async function preBattleLobby(myFighter, opponent, screen) {
  let equippedMoves = getEquippedMoves(myFighter.stats);

  const result = await mainMenu(myFighter, opponent, equippedMoves, screen);
  return result;
}

function mainMenu(myFighter, opponent, equippedMoves, screen) {
  return new Promise((resolve) => {
    let cursor = 0;
    const options = ['READY', 'LOADOUT', 'BAG'];
    const stdin = process.stdin;
    stdin.setRawMode(true);
    stdin.resume();
    stdin.setEncoding('utf8');

    function render() {
      const w = screen.width;
      const h = screen.height;
      screen.clear();

      // Title
      screen.centerText(0, '─'.repeat(w), colors.dimmer);
      screen.centerText(0, ' P R E - B A T T L E ', colors.gold, null, true);

      // Fighter cards side by side
      const leftX = 4;
      const rightX = Math.floor(w / 2) + 2;
      const cardY = 2;

      // Your fighter
      screen.text(leftX, cardY, 'YOUR FIGHTER', colors.p1, null, true);
      screen.text(leftX, cardY + 1, myFighter.name.slice(0, 28), colors.white);
      screen.text(leftX, cardY + 2, `GPU: ${myFighter.gpu.slice(0, 26)}`, colors.dim);
      screen.text(leftX, cardY + 3, `HP:${myFighter.stats.hp} STR:${myFighter.stats.str} MAG:${myFighter.stats.mag} SPD:${myFighter.stats.spd}`, colors.dim);

      // Opponent
      screen.text(rightX, cardY, 'OPPONENT', colors.p2, null, true);
      screen.text(rightX, cardY + 1, (opponent.name || 'Unknown').slice(0, 28), colors.white);
      screen.text(rightX, cardY + 2, `GPU: ${(opponent.gpu || '?').slice(0, 26)}`, colors.dim);
      screen.text(rightX, cardY + 3, `HP:${opponent.stats.hp} STR:${opponent.stats.str} MAG:${opponent.stats.mag} SPD:${opponent.stats.spd}`, colors.dim);

      // Divider
      screen.hline(2, cardY + 5, w - 4, '─', colors.dimmer);

      // Equipped moves preview
      screen.text(leftX, cardY + 6, 'EQUIPPED MOVES:', colors.dim);
      equippedMoves.forEach((m, i) => {
        const catColor = CAT_COLORS[m.cat] || colors.dim;
        screen.text(leftX + 2, cardY + 7 + i, `${i + 1}. ${m.label}`, colors.white);
        screen.text(leftX + 26, cardY + 7 + i, m.cat, catColor);
      });

      // Bag count
      const bagCount = getOwnedItems().reduce((s, i) => s + i.count, 0);
      screen.text(rightX, cardY + 6, `BAG: ${bagCount} items`, colors.dim);

      // Menu options
      const menuY = cardY + 12;
      screen.hline(2, menuY - 1, w - 4, '─', colors.dimmer);

      for (let i = 0; i < options.length; i++) {
        const x = leftX + i * 20;
        const selected = i === cursor;
        const label = `  ${options[i]}  `;

        if (selected) {
          screen.text(x, menuY, '▸', colors.gold, null, true);
          screen.text(x + 2, menuY, label, colors.white, null, true);
        } else {
          screen.text(x + 2, menuY, label, colors.dim);
        }
      }

      screen.text(4, menuY + 2, '← → to navigate, Enter to select', colors.dimmer);
      screen.render();
    }

    function onKey(key) {
      if (key === '\x1b[C' || key === 'l' || key === '\x1b[B') {
        cursor = (cursor + 1) % options.length;
        render();
      } else if (key === '\x1b[D' || key === 'h' || key === '\x1b[A') {
        cursor = (cursor - 1 + options.length) % options.length;
        render();
      } else if (key === '\r' || key === '\n' || key === ' ') {
        const choice = options[cursor];
        if (choice === 'READY') {
          cleanup();
          resolve(equippedMoves);
        } else if (choice === 'LOADOUT') {
          cleanup();
          pickLoadout(myFighter, screen).then((newMoves) => {
            equippedMoves = newMoves;
            // Re-enter main menu
            stdin.setRawMode(true);
            stdin.resume();
            stdin.on('data', onKey);
            render();
          });
        } else if (choice === 'BAG') {
          cleanup();
          viewBag(screen).then(() => {
            stdin.setRawMode(true);
            stdin.resume();
            stdin.on('data', onKey);
            render();
          });
        }
      } else if (key === '\x03') {
        cleanup();
        process.exit(0);
      }
    }

    function cleanup() {
      stdin.removeListener('data', onKey);
      stdin.setRawMode(false);
      stdin.pause();
    }

    stdin.on('data', onKey);
    render();
  });
}

// ─── Loadout picker — toggle moves on/off, exactly 4 ───
function pickLoadout(fighter, screen) {
  return new Promise((resolve) => {
    const available = getAvailableMoves(fighter.stats);
    const currentEquipped = getEquippedMoves(fighter.stats);
    const selected = new Set(currentEquipped.map(m => m.name));
    let cursor = 0;
    const pageSize = screen.height - 8;

    const stdin = process.stdin;
    stdin.setRawMode(true);
    stdin.resume();
    stdin.setEncoding('utf8');

    function render() {
      const w = screen.width;
      screen.clear();

      screen.centerText(0, '─'.repeat(w), colors.dimmer);
      screen.centerText(0, ' C H O O S E   M O V E S ', colors.lavender, null, true);
      screen.text(4, 1, `Selected: ${selected.size}/4`, selected.size === 4 ? colors.mint : colors.rose, null, true);
      screen.text(w - 30, 1, 'SPACE=toggle  ENTER=confirm', colors.dimmer);

      const startIdx = Math.max(0, cursor - pageSize + 3);
      const endIdx = Math.min(available.length, startIdx + pageSize);

      for (let i = startIdx; i < endIdx; i++) {
        const m = available[i];
        const y = 3 + (i - startIdx);
        const isCursor = i === cursor;
        const isSelected = selected.has(m.name);
        const catColor = CAT_COLORS[m.cat] || colors.dim;
        const marker = isSelected ? '★' : '·';
        const markerColor = isSelected ? colors.gold : colors.dimmer;

        if (isCursor) {
          screen.text(3, y, '▸', colors.white, null, true);
          screen.text(5, y, marker, markerColor, null, true);
          screen.text(7, y, m.label.padEnd(22), colors.white, null, true);
          screen.text(30, y, m.cat.padEnd(10), catColor, null, true);
          screen.text(41, y, m.desc.slice(0, 20), catColor);
          // Show flavor on the right
          screen.text(63, y, `${m.base.toUpperCase()} x${m.mult}`, colors.dim);
        } else {
          screen.text(5, y, marker, markerColor);
          screen.text(7, y, m.label.padEnd(22), isSelected ? colors.white : colors.dim);
          screen.text(30, y, m.cat.padEnd(10), isSelected ? catColor : colors.dimmer);
          screen.text(41, y, m.desc.slice(0, 20), colors.dimmer);
        }
      }

      screen.render();
    }

    function onKey(key) {
      if (key === '\x1b[A' || key === 'k') {
        cursor = (cursor - 1 + available.length) % available.length;
        render();
      } else if (key === '\x1b[B' || key === 'j') {
        cursor = (cursor + 1) % available.length;
        render();
      } else if (key === ' ') {
        // Toggle selection
        const m = available[cursor];
        if (selected.has(m.name)) {
          selected.delete(m.name);
        } else if (selected.size < 4) {
          selected.add(m.name);
        }
        render();
      } else if (key === '\r' || key === '\n') {
        if (selected.size === 4) {
          const names = [...selected];
          saveLoadout(names);
          cleanup();
          const moves = names.map(n => ({ name: n, ...MOVE_POOL[n] }));
          resolve(moves);
        }
        // If not 4 selected, do nothing (can't confirm)
      } else if (key === '\x1b' || key === 'q') {
        // Cancel — return current equipped unchanged
        cleanup();
        resolve(getEquippedMoves(fighter.stats));
      } else if (key === '\x03') {
        cleanup();
        process.exit(0);
      }
    }

    function cleanup() {
      stdin.removeListener('data', onKey);
      stdin.setRawMode(false);
      stdin.pause();
    }

    stdin.on('data', onKey);
    render();
  });
}

// ─── Bag viewer (read-only in pre-battle) ───
function viewBag(screen) {
  return new Promise((resolve) => {
    const items = getOwnedItems();
    let cursor = 0;

    const stdin = process.stdin;
    stdin.setRawMode(true);
    stdin.resume();
    stdin.setEncoding('utf8');

    function render() {
      const w = screen.width;
      screen.clear();

      screen.centerText(0, '─'.repeat(w), colors.dimmer);
      screen.centerText(0, ' B A G ', colors.mint, null, true);
      screen.text(w - 22, 1, 'Esc to go back', colors.dimmer);

      if (items.length === 0) {
        screen.text(4, 3, 'Bag is empty. Win battles to earn items!', colors.dim);
      } else {
        screen.text(4, 2, `${items.reduce((s, i) => s + i.count, 0)} items total`, colors.dim);

        for (let i = 0; i < items.length; i++) {
          const item = items[i];
          const y = 4 + i;
          const isCursor = i === cursor;
          const rc = RARITY_COLORS[item.rarity] || colors.dim;

          if (isCursor) {
            screen.text(3, y, '▸', colors.white, null, true);
            screen.text(5, y, item.icon, rc, null, true);
            screen.text(7, y, `${item.name} x${item.count}`.padEnd(26), colors.white, null, true);
            screen.text(34, y, item.desc, rc);
            screen.text(60, y, `(${item.rarity})`, colors.dim);
          } else {
            screen.text(5, y, item.icon, colors.dimmer);
            screen.text(7, y, `${item.name} x${item.count}`.padEnd(26), colors.dim);
            screen.text(34, y, item.desc.slice(0, 24), colors.dimmer);
          }
        }
      }

      screen.render();
    }

    function onKey(key) {
      if (key === '\x1b[A' || key === 'k') {
        if (items.length) cursor = (cursor - 1 + items.length) % items.length;
        render();
      } else if (key === '\x1b[B' || key === 'j') {
        if (items.length) cursor = (cursor + 1) % items.length;
        render();
      } else if (key === '\x1b' || key === 'q' || key === '\r' || key === '\n') {
        cleanup();
        resolve();
      } else if (key === '\x03') {
        cleanup();
        process.exit(0);
      }
    }

    function cleanup() {
      stdin.removeListener('data', onKey);
      stdin.setRawMode(false);
      stdin.pause();
    }

    stdin.on('data', onKey);
    render();
  });
}

module.exports = { preBattleLobby };
