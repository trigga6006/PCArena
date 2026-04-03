// ═══════════════════════════════════════════════════════════════
// TURN-BASED BATTLE RENDERER
// Loop: show move selection → submit → animate turn → repeat
// Reuses existing screen, sprites, effects, and projectile system
// ═══════════════════════════════════════════════════════════════

const { Screen } = require('./screen');
const { colors, hpColor } = require('./palette');
const { MatrixRain } = require('./effects/matrix');
const { GlitchEffect, FloatingText } = require('./effects/glitch');
const { ProjectileManager } = require('./effects/projectile');
const { createRNG } = require('./rng');
const { getSprite } = require('./sprites');
const { selectMove } = require('./moveselect');
const { createBattleState, processTurn, isOver, getWinner } = require('./turnbattle');
const { submitAndWait, endBattle } = require('./turnrelay');
const { useItem, ITEMS } = require('./items');
// ITEMS is an object keyed by item ID — used to look up opponent's item from relay
const { preBattleLobby } = require('./prebattle');

const FPS = 20;
const FRAME_MS = 1000 / FPS;
const TURN_ANIM_MS = 4000;  // 4 seconds to animate each turn's events

// ─── Hacker callsign pool ───
// Deterministic nickname from specHash + tier for each fighter
const CALLSIGNS = {
  flagship: [
    'MAINFRAME', 'ZERO_DAY', 'ROOT_ACCESS', 'KERNEL_PANIC',
    'BLACKHAT', 'APEX_NODE', 'DARK_FIBER', 'OVERCLOCK',
    'TITAN_GATE', 'SYSTEM_SHOCK', 'DEEP_STACK', 'PRIME_ROOT',
  ],
  high: [
    'DARKNET', 'CIPHER_BREAK', 'PROXY_WAR', 'GHOST_SHELL',
    'NETRUNNER', 'SILICON_EDGE', 'DAEMON_CORE', 'FLUX_GATE',
    'RED_THREAD', 'CORE_DUMP', 'VECTOR_9', 'PHASE_SHIFT',
  ],
  mid: [
    'PACKET_STORM', 'HASH_CLASH', 'FIREWALL', 'STACK_TRACE',
    'MEM_LEAK', 'BYTE_FORCE', 'PING_SPIKE', 'CACHE_HIT',
    'BIT_SHIFT', 'RUNTIME', 'HEX_EDIT', 'SUDO',
  ],
  low: [
    'SCRIPT_KIDDIE', 'DIAL_UP', 'BLUESCREEN', 'SEG_FAULT',
    'NULL_PTR', 'BOOT_LOOP', 'BEEP_CODE', 'FLOPPY',
    'DOT_EXE', 'SAFE_MODE', 'BIOS_BEEP', 'TASK_FAIL',
  ],
};

function getCallsign(fighter) {
  const hw = fighter.sprite?.hw;
  if (!hw) return fighter.name;
  const tier = hw.tier || 'mid';
  const pool = CALLSIGNS[tier] || CALLSIGNS.mid;
  const idx = (hw.specHash || 0) % pool.length;
  return pool[idx];
}

async function renderTurnBattle(fighterA, fighterB, movesetA, movesetB, options = {}) {
  const { role, roomCode, relayUrl, seed } = options;
  const isOnline = !!roomCode;
  const isHost = role === 'host' || !isOnline;

  // Role-to-display mapping:
  // state.a = ALWAYS host's fighter, state.b = ALWAYS joiner's fighter
  // display: fighterA = me (bottom), fighterB = opponent (top)
  // Host: state.a = me → meSlot='a'. Joiner: state.b = me → meSlot='b'
  const meSlot = isHost ? 'a' : 'b';
  const oppSlot = isHost ? 'b' : 'a';

  // Map a state slot ('a'/'b') to display slot ('a' = me/bottom, 'b' = opponent/top)
  function toDisplay(stateSlot) {
    if (isHost) return stateSlot;
    return stateSlot === 'a' ? 'b' : 'a';
  }

  // Ensure sprites
  for (const f of [fighterA, fighterB]) {
    if (!f.sprite || typeof f.sprite.back?.draw !== 'function') {
      f.sprite = f.specs ? getSprite(f.specs) : getSprite({ gpu: { model: '', vramMB: 0, vendor: '' }, cpu: { brand: '' }, storage: { type: 'SSD' } });
    }
  }

  const screen = new Screen();
  const rng = createRNG(99);
  const matrix = new MatrixRain(screen.width, screen.height, rng);
  const glitch = new GlitchEffect(rng);
  const floats = new FloatingText();
  const projectiles = new ProjectileManager(rng, screen.width, screen.height);

  const w = screen.width;
  const h = screen.height;

  // Layout (same as auto battle)
  const oppX = Math.floor(w * 0.62);
  const oppY = 2;
  const oppCenterX = oppX + 5;
  const oppCenterY = oppY + 4;
  const plyX = Math.floor(w * 0.08);
  const plyY = h - 22;
  const plyCenterX = plyX + 7;
  const plyCenterY = plyY + 5;
  // HP bars — halfway between sprite and center so they don't overlap characters
  const barW = Math.min(24, Math.floor(w * 0.2));
  const oppBarX = Math.floor(w * 0.33);   // between far-left (old) and sprite edge
  const plyBarX = Math.floor(w * 0.28);   // between sprite edge and far-right (old)
  const plyBarY = plyY + 8;
  const logY = h - 7;
  const logHeight = 5;
  const logX = 3;
  const logW = w - 6;

  // Battle state: state.a = host's fighter, state.b = joiner's fighter (ALWAYS)
  // This ensures both players run identical processTurn() calls
  const battleState = createBattleState(
    isHost ? fighterA : fighterB,   // host's fighter → state.a
    isHost ? fighterB : fighterA,   // joiner's fighter → state.b
    seed || 42
  );
  let hpA = fighterA.stats.maxHp;
  let hpB = fighterB.stats.maxHp;
  let targetHpA = hpA;
  let targetHpB = hpB;
  const battleLog = [];
  let p1HitFrames = 0;
  let p2HitFrames = 0;
  let p1KO = false;
  let p2KO = false;
  let frameCount = 0;
  let battleStartTime = Date.now();
  let turnNum = 0;

  function addLog(text, color) {
    battleLog.push({ text, color });
    if (battleLog.length > logHeight) battleLog.shift();
  }

  // ─── Item effect application ───
  // `who` is the STATE slot ('a' or 'b') — maps to display via toDisplay()
  function applyItemEffect(item, state, who) {
    const fighter = state[who];
    const opponent = state[who === 'a' ? 'b' : 'a'];
    const dWho = toDisplay(who);        // display slot for item user
    const dOpp = toDisplay(who === 'a' ? 'b' : 'a'); // display slot for opponent

    // Display positions: 'a' display = me (bottom), 'b' display = opponent (top)
    const userCX = dWho === 'a' ? plyCenterX : oppCenterX;
    const userCY = dWho === 'a' ? plyCenterY : oppCenterY;
    const oppCX = dOpp === 'a' ? plyCenterX : oppCenterX;
    const oppCY = dOpp === 'a' ? plyCenterY : oppCenterY;

    switch (item.effect) {
      case 'heal': {
        const healAmt = Math.round(fighter.maxHp * item.value);
        fighter.hp = Math.min(fighter.maxHp, fighter.hp + healAmt);
        if (dWho === 'a') targetHpA = fighter.hp;
        else targetHpB = fighter.hp;
        addLog(`  +${healAmt} HP restored`, colors.mint);
        floats.add(userCX, userCY - 3, `+${healAmt}`, colors.mint, 14);
        break;
      }
      case 'boost_str': {
        const boost = Math.round(fighter.str * item.value);
        fighter.str += boost;
        fighter._boosts = fighter._boosts || [];
        fighter._boosts.push({ stat: 'str', amount: boost, turns: item.duration });
        addLog(`  STR +${boost} for ${item.duration} turns`, colors.peach);
        break;
      }
      case 'boost_def': {
        const boost = Math.round(fighter.def * item.value);
        fighter.def += boost;
        fighter._boosts = fighter._boosts || [];
        fighter._boosts.push({ stat: 'def', amount: boost, turns: item.duration });
        addLog(`  DEF +${boost} for ${item.duration} turns`, colors.sky);
        break;
      }
      case 'boost_spd': {
        const boost = Math.round(fighter.spd * item.value);
        fighter.spd += boost;
        fighter._boosts = fighter._boosts || [];
        fighter._boosts.push({ stat: 'spd', amount: boost, turns: item.duration });
        addLog(`  SPD +${boost} for ${item.duration} turns`, colors.sky);
        break;
      }
      case 'boost_mag': {
        const boost = Math.round(fighter.mag * item.value);
        fighter.mag += boost;
        fighter._boosts = fighter._boosts || [];
        fighter._boosts.push({ stat: 'mag', amount: boost, turns: item.duration });
        addLog(`  MAG +${boost} for ${item.duration} turns`, colors.lavender);
        break;
      }
      case 'shield': {
        fighter._shield = true;
        addLog(`  Firewall active — next hit blocked`, colors.sky);
        break;
      }
      case 'cleanse': {
        fighter.stunned = false;
        fighter.debuffed = false;
        addLog(`  Status effects cleared`, colors.mint);
        break;
      }
      case 'reflect': {
        fighter._reflect = item.value;
        addLog(`  Reflect active — 50% damage returned`, colors.lavender);
        break;
      }
      case 'direct_damage': {
        const dmg = Math.round(opponent.maxHp * item.value);
        opponent.hp = Math.max(0, opponent.hp - dmg);
        if (dOpp === 'a') targetHpA = opponent.hp;
        else targetHpB = opponent.hp;
        addLog(`  Dealt ${dmg} direct damage`, colors.peach);
        floats.add(oppCX, oppCY - 3, `${dmg}`, colors.damage, 14);
        glitch.burst(oppCX, oppCY, 5, 5);
        break;
      }
      case 'stun': {
        opponent.stunned = true;
        addLog(`  Opponent stunned for 1 turn`, colors.rose);
        break;
      }
      case 'nuke': {
        const dmg = Math.round(opponent.maxHp * item.value);
        opponent.hp = Math.max(0, opponent.hp - dmg);
        opponent.stunned = true;
        if (dOpp === 'a') targetHpA = opponent.hp;
        else targetHpB = opponent.hp;
        addLog(`  NUKE! ${dmg} damage + stun`, colors.gold);
        glitch.screenTear(w, 6);
        glitch.scatter(w / 2, h / 2, w, h, 20, 8);
        break;
      }
    }
  }

  // ─── Tick down temporary boosts at end of each turn ───
  function tickBoosts(state) {
    for (const who of ['a', 'b']) {
      const fighter = state[who];
      if (!fighter._boosts) continue;
      fighter._boosts = fighter._boosts.filter(b => {
        b.turns--;
        if (b.turns <= 0) {
          fighter[b.stat] -= b.amount;
          return false;
        }
        return true;
      });
    }
    // Tick shield/reflect (they last 1 hit, handled in battle engine)
  }

  // Fighter callsigns
  const nameA = getCallsign(fighterA);
  const nameB = getCallsign(fighterB);

  screen.enter();

  // ─── Pre-battle lobby: pick loadout + review bag ───
  try {
    const finalMoves = await preBattleLobby(fighterA, fighterB, screen);
    movesetA = finalMoves;
  } catch (e) {
    // If pre-battle fails (e.g. non-interactive), keep default moveset
  }

  // ─── Battle intro sequence ───
  screen.resetDiff(); // flush pre-battle ghost content
  await battleIntro(screen, matrix, nameA, nameB, fighterA, fighterB, w, h);

  // Reset diff again so first battle frame is pristine
  screen.resetDiff();
  battleStartTime = Date.now();

  // ─── Main battle loop ───
  try {
    while (!isOver(battleState)) {
      turnNum++;
      addLog(`═══ Turn ${turnNum} ═══`, colors.gold);

      // ── Player selects move or item ──
      // Clear stale effects so they don't overlay the move UI
      glitch.active = [];
      floats.items = [];

      // Set exclusion zones so rain/effects skip the log/UI area
      const uiZone = { x: logX, y: logY - 1, w: logW, h: logHeight + 2 };
      matrix.exclusionZone = uiZone;
      glitch.exclusionZone = uiZone;
      floats.exclusionZone = uiZone;

      // Pass drawSceneBase as onTick so matrix rain + effects animate during selection
      const choice = await selectMove(movesetA, screen, logX, logY, logW, logHeight, drawSceneBase);

      // Clear exclusion zones after selection
      matrix.exclusionZone = null;
      glitch.exclusionZone = null;
      floats.exclusionZone = null;

      let myMove = null;
      let myItem = null;

      if (choice.type === 'item') {
        // ── ITEM USAGE — consume from inventory, defer application until synced ──
        const item = choice.item;
        const consumed = useItem(item.id);
        if (consumed) {
          myItem = item;
          addLog(`Used: ${item.name}`, colors.mint);
        }
        // After item, auto-pick first move (items don't replace your attack)
        myMove = movesetA[0];
        addLog(`Auto-attack: ${myMove.label}`, colors.p1);
      } else {
        myMove = choice.move;
        addLog(`You chose: ${myMove.label}`, colors.p1);
      }

      let opponentMove;
      let oppItem = null;
      if (isOnline) {
        addLog('Waiting for opponent...', colors.dim);

        // Animate while waiting for opponent's move
        let waitDone = false;
        const waitTimer = setInterval(() => {
          if (waitDone) return;
          drawSceneBase();
          // Show waiting message in log area
          screen.text(logX, logY, '› Waiting for opponent...', colors.dim);
          const dots = '.'.repeat(Math.floor(Date.now() / 400) % 4);
          screen.text(logX, logY + 1, `  ${dots}`, colors.dimmer);
          screen.render();
        }, FRAME_MS);

        // Send move + item through relay; wait for opponent's move + item
        const result = await submitAndWait(relayUrl, roomCode, role, myMove.name, turnNum - 1, myItem?.id);
        waitDone = true;
        clearInterval(waitTimer);
        const oppMoveName = role === 'host' ? result.joinerMove : result.hostMove;
        opponentMove = movesetB.find(m => m.name === oppMoveName) || movesetB[0];

        // Get opponent's item (if any)
        const oppItemId = role === 'host' ? result.joinerItem : result.hostItem;
        if (oppItemId) oppItem = ITEMS[oppItemId] || null;
      } else {
        opponentMove = movesetB[battleState.rng.int(0, movesetB.length - 1)];
      }

      addLog(`Opponent chose: ${opponentMove.label}`, colors.p2);

      // ── Apply items in deterministic order: host first, then joiner ──
      // Both clients apply the SAME items to the SAME state slots
      const hostItem = isHost ? myItem : oppItem;
      const joinerItem = isHost ? oppItem : myItem;

      if (hostItem) {
        applyItemEffect(hostItem, battleState, 'a');   // host is always state.a
        await animateIdle(400);
        drawScene();
      }
      if (joinerItem) {
        applyItemEffect(joinerItem, battleState, 'b'); // joiner is always state.b
        await animateIdle(400);
        drawScene();
      }

      // ── Process turn ──
      // moveA = host's move (for state.a), moveB = joiner's move (for state.b)
      const hostMove = isHost ? myMove : opponentMove;
      const joinerMove = isHost ? opponentMove : myMove;
      const events = processTurn(battleState, hostMove, joinerMove);

      // ── Animate the turn events ──
      await animateTurnEvents(events);

      // Update HP targets from final event state
      // event.hpA = state.a HP (host), event.hpB = state.b HP (joiner)
      // targetHpA = display "me" HP, targetHpB = display "opponent" HP
      const lastHpEvent = [...events].reverse().find(e => e.hpA !== undefined);
      if (lastHpEvent) {
        targetHpA = isHost ? lastHpEvent.hpA : lastHpEvent.hpB;   // my HP
        targetHpB = isHost ? lastHpEvent.hpB : lastHpEvent.hpA;   // opponent HP
      }

      // Tick down temporary boosts
      tickBoosts(battleState);

      // Small pause between turns
      await animateIdle(500);
    }

    // ── Victory ──
    const stateWinner = getWinner(battleState);
    // Convert state winner to display/caller perspective
    // state.a = host, state.b = joiner; caller expects 'a' = fighterA (me), 'b' = fighterB (opponent)
    const displayWinner = toDisplay(stateWinner);
    const winnerName = displayWinner === 'a' ? nameA : displayWinner === 'b' ? nameB : 'DRAW';
    addLog('', null);
    addLog(`═══ ${winnerName} WINS! ═══`, colors.gold);
    glitch.screenTear(w, 8);
    glitch.scatter(w / 2, h / 2, w, h, 25, 10);

    // Show victory for 5 seconds
    await animateIdle(5000);

    if (isOnline) endBattle(relayUrl, roomCode);

    screen.exit();
    return displayWinner;

  } catch (err) {
    screen.exit();
    throw err;
  }

  // ─── Drawing helpers ───

  // Draw the full scene WITHOUT the log area and without calling render().
  // Used as the onTick callback during move selection so rain/effects animate.
  function drawSceneBase() {
    screen.clear();
    frameCount = Math.floor((Date.now() - battleStartTime) / FRAME_MS);
    matrix.update();
    matrix.draw(screen);
    glitch.update();
    floats.update();
    projectiles.update();
    if (p1HitFrames > 0) p1HitFrames--;
    if (p2HitFrames > 0) p2HitFrames--;

    // Smooth HP
    targetHpA = Math.max(0, Math.min(targetHpA, fighterA.stats.maxHp));
    targetHpB = Math.max(0, Math.min(targetHpB, fighterB.stats.maxHp));
    hpA += (targetHpA - hpA) * 0.18;
    hpB += (targetHpB - hpB) * 0.18;
    if (Math.abs(hpA - targetHpA) < 2) hpA = targetHpA;
    if (Math.abs(hpB - targetHpB) < 2) hpB = targetHpB;
    hpA = Math.max(0, Math.min(hpA, fighterA.stats.maxHp));
    hpB = Math.max(0, Math.min(hpB, fighterB.stats.maxHp));

    // Title
    screen.centerText(0, '─'.repeat(w), colors.dimmer);
    screen.centerText(0, ' W O R K S T A T I O N   O F F ', colors.cyan, null, true);
    screen.text(w - 12, 0, `Turn ${turnNum}`, colors.dim);

    // Ground
    const groundY = plyY + 11;
    if (groundY < h - 8) screen.hline(0, groundY, w, '·', colors.ghost);

    // Fighters
    const sprA = fighterA.sprite;
    const sprB = fighterB.sprite;
    if (p1KO) sprA?.drawBackKO(screen, plyX, plyY);
    else if (p1HitFrames > 0) sprA?.drawBackHit(screen, plyX, plyY, frameCount);
    else sprA?.back.draw(screen, plyX, plyY, null, frameCount);

    if (p2KO) sprB?.drawFrontKO(screen, oppX, oppY);
    else if (p2HitFrames > 0) sprB?.drawFrontHit(screen, oppX, oppY, frameCount);
    else sprB?.front.draw(screen, oppX, oppY, null, frameCount);

    // Effects (drawn after sprites, before HP bars so bars stay clean)
    projectiles.draw(screen);
    glitch.draw(screen);
    floats.draw(screen);

    // Opponent info (drawn LAST so effects can't overwrite bars)
    screen.text(oppBarX, 2, nameB, colors.p2, null, true);
    const clampedHpB = Math.max(0, Math.min(hpB, fighterB.stats.maxHp));
    const ratioB = clampedHpB / fighterB.stats.maxHp;
    screen.bar(oppBarX, 3, barW, ratioB, hpColor(ratioB), colors.dimmer);
    screen.text(oppBarX + barW, 3, ` ${Math.round(clampedHpB)}/${fighterB.stats.maxHp}`, hpColor(ratioB));

    // Player info
    screen.text(plyBarX, plyBarY, nameA, colors.p1, null, true);
    const clampedHpA = Math.max(0, Math.min(hpA, fighterA.stats.maxHp));
    const ratioA = clampedHpA / fighterA.stats.maxHp;
    screen.bar(plyBarX, plyBarY + 1, barW, ratioA, hpColor(ratioA), colors.dimmer);
    screen.text(plyBarX + barW, plyBarY + 1, ` ${Math.round(clampedHpA)}/${fighterA.stats.maxHp}`, hpColor(ratioA));

    // Log divider (always visible)
    screen.hline(1, logY - 1, w - 2, '─', colors.dimmer);
    screen.text(3, logY - 1, ' BATTLE LOG ', colors.dim);
  }

  // Full scene draw including battle log + render
  function drawScene() {
    drawSceneBase();

    // Log entries
    for (let i = 0; i < battleLog.length && i < logHeight; i++) {
      const entry = battleLog[i];
      const prefix = entry.text.startsWith('  ') ? '  ' : '› ';
      screen.text(logX, logY + i, prefix + entry.text.slice(0, logW - 4), entry.color || colors.dim);
    }

    screen.render();
  }

  // Animate a set of turn events over TURN_ANIM_MS — delta-time aware
  // All per-frame updates (matrix, effects, HP smooth) are handled by drawSceneBase
  function animateTurnEvents(events) {
    return new Promise((resolve) => {
      const eventSpacing = TURN_ANIM_MS / (events.length || 1);
      let eventIdx = 0;
      let elapsed = 0;
      let lastTime = Date.now();

      const tick = () => {
        const now = Date.now();
        const dt = now - lastTime;
        lastTime = now;
        elapsed += dt;

        // Fire events on schedule
        while (eventIdx < events.length && eventIdx * eventSpacing <= elapsed) {
          processAnimEvent(events[eventIdx]);
          eventIdx++;
        }

        // drawScene handles all updates (matrix, effects, HP, hitFrames, frameCount)
        drawScene();

        if (elapsed >= TURN_ANIM_MS) {
          resolve();
        } else {
          setTimeout(tick, FRAME_MS);
        }
      };
      setTimeout(tick, FRAME_MS);
    });
  }

  function processAnimEvent(event) {
    if (event.type === 'attack') {
      // Map state slots to display positions
      const dWho = toDisplay(event.who);       // display slot of attacker
      const dTarget = toDisplay(event.target); // display slot of defender
      const isMe = dWho === 'a';               // 'a' display = me (bottom)

      const fromX = isMe ? plyCenterX + 6 : oppCenterX - 2;
      const fromY = isMe ? plyCenterY - 2 : oppCenterY + 2;
      const toX = isMe ? oppCenterX : plyCenterX + 2;
      const toY = isMe ? oppCenterY : plyCenterY;
      projectiles.fire(fromX, fromY, toX, toY, event.move);

      // Delayed damage — use display-mapped HP
      setTimeout(() => {
        if (dTarget === 'a') { targetHpA = isHost ? event.hpA : event.hpB; p1HitFrames = 6; }
        else { targetHpB = isHost ? event.hpB : event.hpA; p2HitFrames = 6; }
        const hitCX = dTarget === 'a' ? plyCenterX : oppCenterX;
        const hitCY = dTarget === 'a' ? plyCenterY : oppCenterY;
        glitch.burst(hitCX, hitCY, 6, 6);
        floats.add(
          hitCX - 2, hitCY - 3,
          event.isCrit ? `★${event.damage}` : `${event.damage}`,
          event.isCrit ? colors.crit : colors.damage, 14
        );
        if (event.isCrit) glitch.screenTear(w, 4);
      }, 800);

      const whoLabel = isMe ? nameA : nameB;
      let logLine = `${whoLabel.slice(0, 14)} → ${event.label}`;
      if (event.isCrit) logLine += ' ★CRIT';
      logLine += ` [${event.damage}]`;
      addLog(logLine, event.isCrit ? colors.crit : (isMe ? colors.p1 : colors.p2));
      addLog(`  ${event.flavor}`, colors.dimmer);

    } else if (event.type === 'dodge') {
      const dWho = toDisplay(event.who);
      const whoLabel = dWho === 'a' ? nameA : nameB;
      addLog(`${whoLabel.slice(0, 14)} dodged ${event.label}!`, colors.sky);
      const cx = dWho === 'a' ? plyCenterX : oppCenterX;
      const cy = dWho === 'a' ? plyCenterY - 3 : oppCenterY - 2;
      floats.add(cx, cy, 'DODGE', colors.sky, 12);

    } else if (event.type === 'heal') {
      const dWho = toDisplay(event.who);
      const whoLabel = dWho === 'a' ? nameA : nameB;
      if (dWho === 'a') targetHpA = isHost ? event.hpA : event.hpB;
      else targetHpB = isHost ? event.hpB : event.hpA;
      addLog(`${whoLabel.slice(0, 14)} → ${event.label} [+${event.amount}]`, colors.mint);
      const cx = dWho === 'a' ? plyCenterX : oppCenterX;
      const cy = dWho === 'a' ? plyCenterY - 3 : oppCenterY - 2;
      floats.add(cx, cy, `+${event.amount}`, colors.mint, 14);

    } else if (event.type === 'stunned') {
      const dWho = toDisplay(event.who);
      const whoLabel = dWho === 'a' ? nameA : nameB;
      addLog(`${whoLabel.slice(0, 14)} is STUNNED`, colors.rose);

    } else if (event.type === 'ko') {
      const dLoser = toDisplay(event.loser);
      if (dLoser === 'a') p1KO = true;
      else p2KO = true;
      glitch.screenTear(w, 5);
      glitch.scatter(w / 2, h / 2, w, h, 10, 6);
    }
  }

  // Run the render loop for a duration (idle animation) — delta-time aware
  // All per-frame updates handled by drawSceneBase via drawScene
  function animateIdle(durationMs) {
    return new Promise((resolve) => {
      let elapsed = 0;
      let lastTime = Date.now();

      const tick = () => {
        const now = Date.now();
        const dt = now - lastTime;
        lastTime = now;
        elapsed += dt;

        drawScene();

        if (elapsed >= durationMs) resolve();
        else setTimeout(tick, FRAME_MS);
      };
      setTimeout(tick, FRAME_MS);
    });
  }
}

// ─── Battle intro sequence ───
async function battleIntro(screen, matrix, nameA, nameB, fighterA, fighterB, w, h) {
  const cx = Math.floor(w / 2);
  const cy = Math.floor(h / 2);

  // Phase 1: Matrix rain fills in (~0.75s)
  for (let i = 0; i < 15; i++) {
    screen.clear();
    matrix.update();
    matrix.draw(screen);
    // Dim bar expanding from center
    const spread = Math.floor((i / 15) * (w / 2));
    for (let x = cx - spread; x <= cx + spread; x++) {
      if (x >= 0 && x < w) screen.set(x, cy, '─', colors.dimmer);
    }
    screen.render();
    await sleep(FRAME_MS);
  }

  // Phase 2: VS screen with callsigns (~1.25s)
  const phases = 25;
  for (let i = 0; i < phases; i++) {
    screen.clear();
    matrix.update();
    matrix.draw(screen);

    // Horizontal divider
    screen.hline(4, cy, w - 8, '═', colors.dimmer);

    // VS badge
    const vsGlow = i % 10 < 5 ? colors.gold : colors.peach;
    screen.text(cx - 2, cy, ' VS ', vsGlow, null, true);

    // Player A name — slide in from left (faster: i*3 instead of i*2)
    const slideA = Math.min(i * 3, cx - 14);
    screen.text(Math.max(2, slideA), cy - 2, nameA, colors.p1, null, true);
    // Subtitle
    if (i > 6) {
      screen.text(Math.max(2, slideA), cy - 1, fighterA.gpu?.slice(0, 28) || '', colors.dim);
    }

    // Player B name — slide in from right
    const slideB = Math.min(i * 3, cx - 14);
    const bx = Math.max(cx + 2, w - 2 - slideB - nameB.length);
    screen.text(bx, cy + 2, nameB, colors.p2, null, true);
    if (i > 6) {
      screen.text(bx, cy + 3, fighterB.gpu?.slice(0, 28) || '', colors.dim);
    }

    // Decorative corners
    if (i > 10) {
      screen.text(2, cy - 3, '╔══', colors.p1);
      screen.text(w - 5, cy + 4, '══╝', colors.p2);
    }

    // "INITIALIZING" flicker
    if (i > 16) {
      const dots = '.'.repeat((i % 4));
      screen.centerText(h - 3, `INITIALIZING BATTLE${dots}`, i % 6 < 3 ? colors.dim : colors.dimmer);
    }

    screen.render();
    await sleep(FRAME_MS);
  }

  // Phase 3: Flash and clear (0.5s)
  for (let i = 0; i < 10; i++) {
    screen.clear();
    if (i < 3) {
      // Brief white flash effect
      for (let y = cy - 1; y <= cy + 1; y++) {
        screen.hline(0, y, w, '█', i === 0 ? colors.white : colors.dim);
      }
    } else {
      matrix.update();
      matrix.draw(screen);
    }
    screen.render();
    await sleep(FRAME_MS);
  }
}

function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

module.exports = { renderTurnBattle };
