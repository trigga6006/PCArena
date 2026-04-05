// ═══════════════════════════════════════════════════════════════
// TURN-BASED BATTLE ENGINE
// Processes one turn at a time given both players' move choices.
// Returns events for that turn (damage, effects, etc.)
// Now with archetype passives and underdog balancing.
// ═══════════════════════════════════════════════════════════════

const { createRNG } = require('./rng');
const { getCombatModifiers, effectiveStat } = require('./balance');
const { normalizeBenchmarkProfile } = require('./benchmark');

function cloneStateSlice(value) {
  return value ? JSON.parse(JSON.stringify(value)) : value;
}

function createBattleState(fighterA, fighterB, seed) {
  const rng = createRNG(seed);
  return {
    rng,
    a: {
      ...fighterA.stats, hp: fighterA.stats.hp, maxHp: fighterA.stats.maxHp,
      stunned: false, debuffed: false,
      hardened: 0,       // turns of harden remaining
      dot: null,         // { damage, turns } damage-over-time
      cooldowns: {},     // { MOVE_NAME: turnsRemaining }
      archetype: fighterA.archetype?.name || 'DAEMON',
      benchmark: normalizeBenchmarkProfile(fighterA.benchmark),
      consecutiveAttacks: 0,
    },
    b: {
      ...fighterB.stats, hp: fighterB.stats.hp, maxHp: fighterB.stats.maxHp,
      stunned: false, debuffed: false,
      hardened: 0,
      dot: null,
      cooldowns: {},
      archetype: fighterB.archetype?.name || 'DAEMON',
      benchmark: normalizeBenchmarkProfile(fighterB.benchmark),
      consecutiveAttacks: 0,
    },
    turn: 0,
  };
}

// Process a single turn: both players chose a move
function processTurn(state, moveA, moveB) {
  const { rng } = state;
  state.turn++;
  const events = [];

  // ── Tick cooldowns for both fighters ──
  for (const fighter of [state.a, state.b]) {
    for (const name of Object.keys(fighter.cooldowns)) {
      fighter.cooldowns[name]--;
      if (fighter.cooldowns[name] <= 0) delete fighter.cooldowns[name];
    }
  }

  // ── Apply DoT (damage over time) to both fighters ──
  for (const [who, fighter] of [['a', state.a], ['b', state.b]]) {
    if (fighter.dot && fighter.dot.turns > 0) {
      const dotDmg = fighter.dot.damage;
      fighter.hp = Math.max(1, fighter.hp - dotDmg);
      fighter.dot.turns--;
      if (fighter.dot.turns <= 0) fighter.dot = null;
      events.push({
        type: 'dot', who, turn: state.turn,
        damage: dotDmg, hpA: state.a.hp, hpB: state.b.hp,
      });
    }
    // Tick harden duration
    if (fighter.hardened > 0) fighter.hardened--;
  }

  // Determine attack order by SPD (with archetype modifiers)
  const modsA = getCombatModifiers({
    atkArchetype: state.a.archetype, defArchetype: state.b.archetype,
    atk: state.a, def: state.b, rng, turn: state.turn,
    consecutiveAttacks: state.a.consecutiveAttacks, move: moveA,
  });
  const modsB = getCombatModifiers({
    atkArchetype: state.b.archetype, defArchetype: state.a.archetype,
    atk: state.b, def: state.a, rng, turn: state.turn,
    consecutiveAttacks: state.b.consecutiveAttacks, move: moveB,
  });

  const spdA = state.a.spd + (modsA.initiativeBonus || 0) - (modsA.spdPenalty || 0) + rng.int(-5, 5);
  const spdB = state.b.spd + (modsB.initiativeBonus || 0) - (modsB.spdPenalty || 0) + rng.int(-5, 5);
  const order = spdA >= spdB
    ? [{ who: 'a', move: moveA, atk: state.a, def: state.b, mods: modsA, defMods: modsB }]
    : [{ who: 'b', move: moveB, atk: state.b, def: state.a, mods: modsB, defMods: modsA }];
  // Second attacker
  order.push(order[0].who === 'a'
    ? { who: 'b', move: moveB, atk: state.b, def: state.a, mods: modsB, defMods: modsA }
    : { who: 'a', move: moveA, atk: state.a, def: state.b, mods: modsA, defMods: modsB }
  );

  for (const turn of order) {
    const { who, move, atk, def, mods, defMods } = turn;
    const defender = who === 'a' ? 'b' : 'a';

    if (def.hp <= 0) break;

    // Forfeited turn (null move) — skip entirely
    if (!move) continue;

    // Archetype skip chance (Overheat stall)
    if (mods.skipChance > 0 && rng.chance(mods.skipChance)) {
      events.push({ type: 'stall', who, turn: state.turn, passive: atk.archetype });
      atk.consecutiveAttacks = 0;
      continue;
    }

    // Stunned — skip turn
    if (atk.stunned) {
      events.push({ type: 'stunned', who, turn: state.turn });
      atk.stunned = false;
      atk.consecutiveAttacks = 0;
      continue;
    }

    // Heal move
    if (move.special === 'heal') {
      const healAmt = Math.round((atk[move.base] || atk.vit) * move.mult * rng.float(0.8, 1.2));
      atk.hp = Math.min(atk.maxHp, atk.hp + healAmt);
      atk.consecutiveAttacks = 0;
      // Set cooldown BEFORE continuing (otherwise heal moves skip it)
      if (move.cooldown && move.cooldown > 0) {
        atk.cooldowns[move.name] = move.cooldown;
      }
      events.push({
        type: 'heal', who, turn: state.turn,
        move: move.name, label: move.label, flavor: move.desc,
        amount: healAmt,
        hpA: state.a.hp, hpB: state.b.hp,
      });
      continue;
    }

    // Damage calculation with balance modifiers
    let baseStat = effectiveStat(atk[move.base] || atk.str);
    if (move.altBase && atk[move.altBase]) {
      baseStat = Math.round(baseStat + effectiveStat(atk[move.altBase]) * 0.3);
    }

    // Variance (Sentinel overrides to tight range)
    const variance = mods.varianceOverride || [0.7, 1.3];
    let damage = Math.round(baseStat * move.mult * rng.float(variance[0], variance[1]));

    // Apply archetype damage multiplier + underdog flat damage
    damage = Math.round(damage * mods.damageMult) + (mods.flatDamage || 0);

    // Apply category effectiveness (physical/magic/speed vs defender archetype)
    const categoryMult = mods.categoryMult || 1.0;
    damage = Math.round(damage * categoryMult);

    // Defense reduction (with defender's passive defense bonus + harden)
    const defValue = effectiveStat(def.def);
    const hardenMult = def.hardened > 0 ? 1.4 : 1.0;
    const defReduction = defValue * rng.float(0.15, 0.35) * (defMods.defMult || 1) * hardenMult;
    damage = Math.max(1, Math.round(damage - defReduction));

    if (atk.debuffed) {
      damage = Math.round(damage * 0.6);
      atk.debuffed = false;
    }

    // Crit (with archetype crit bonus)
    const critChance = Math.max(0, 0.05 + (atk.spd / 1000) + (mods.critBonus || 0));
    const isCrit = rng.chance(critChance);
    if (isCrit) {
      const critMultiplier = mods.critMult || 1.8;
      damage = Math.round(damage * critMultiplier);
    }

    // Dodge (with defender's archetype dodge bonus)
    const dodgeChance = Math.min(0.35, 0.03 + (def.spd / 1500) + (defMods.dodgeBonus || 0));
    const isDodge = rng.chance(dodgeChance);

    if (isDodge) {
      atk.consecutiveAttacks++;
      // Set cooldown even on dodge — the move was committed
      if (move.cooldown && move.cooldown > 0) {
        atk.cooldowns[move.name] = move.cooldown;
      }
      events.push({
        type: 'dodge', who: defender, attacker: who, turn: state.turn,
        move: move.name, label: move.label, flavor: move.desc,
        hpA: state.a.hp, hpB: state.b.hp,
      });
      continue;
    }

    // Apply damage
    def.hp = Math.max(0, def.hp - damage);
    atk.consecutiveAttacks++;

    // Self-damage on crit (Berserker instability)
    let selfDmg = 0;
    if (isCrit && mods.selfDamageOnCrit > 0 && rng.chance(mods.selfDamageOnCrit)) {
      selfDmg = Math.round(atk.maxHp * mods.selfDamageAmount);
      atk.hp = Math.max(1, atk.hp - selfDmg);
    }

    // Special effects
    let specialEffect = null;
    let resisted = false;
    if (move.special === 'stun' && rng.chance(0.6)) {
      def.stunned = true;
      specialEffect = 'stun';
    } else if (move.special === 'debuff') {
      const applyChance = Math.max(0.18, 1 - (defMods.statusResist || 0));
      if (rng.chance(applyChance)) {
        def.debuffed = true;
        specialEffect = 'debuff';
      } else {
        resisted = true;
      }
    } else if (move.special === 'pierce') {
      specialEffect = 'pierce';
    } else if (move.special === 'dot') {
      def.dot = { damage: Math.round(damage * 0.2), turns: 3 };
      specialEffect = 'dot';
    } else if (move.special === 'harden') {
      atk.hardened = 2;
      specialEffect = 'harden';
    }

    // Signature self-damage (Overclock Omega, VRAM Supernova, etc.)
    if (move.selfDamage && move.selfDamage > 0) {
      const sigSelfDmg = Math.round(atk.maxHp * move.selfDamage);
      atk.hp = Math.max(1, atk.hp - sigSelfDmg);
      selfDmg += sigSelfDmg;
    }

    // Set cooldown for the move if it has one
    if (move.cooldown && move.cooldown > 0) {
      atk.cooldowns[move.name] = move.cooldown;
    }

    // Determine category effectiveness label for UI
    let categoryEffect = null;
    if (categoryMult > 1.0) categoryEffect = 'super_effective';
    else if (categoryMult < 1.0) categoryEffect = 'not_effective';

    const attackEvent = {
      type: 'attack', who, target: defender, turn: state.turn,
      move: move.name, label: move.label, flavor: move.desc,
      category: move.cat, damage, isCrit, specialEffect, categoryEffect,
      hpA: state.a.hp, hpB: state.b.hp,
      maxHpA: state.a.maxHp, maxHpB: state.b.maxHp,
    };
    if (mods.fizzle) attackEvent.fizzle = true;
    if (resisted) attackEvent.resisted = true;
    if (selfDmg > 0) attackEvent.selfDamage = selfDmg;

    events.push(attackEvent);

    if (def.hp <= 0) {
      events.push({
        type: 'ko', winner: who, loser: defender,
        finalHpA: state.a.hp, finalHpB: state.b.hp,
      });
      break;
    }
  }

  return events;
}

// Check if battle is over
function isOver(state) {
  return state.a.hp <= 0 || state.b.hp <= 0;
}

function getWinner(state) {
  if (state.a.hp <= 0 && state.b.hp <= 0) return 'draw';
  if (state.a.hp <= 0) return 'b';
  if (state.b.hp <= 0) return 'a';
  return null;
}

function serializeBattleState(state) {
  return {
    turn: state.turn,
    rngState: typeof state.rng?.getState === 'function' ? state.rng.getState() : 0,
    a: cloneStateSlice(state.a),
    b: cloneStateSlice(state.b),
  };
}

function applyBattleStateSnapshot(state, snapshot) {
  if (!snapshot) return state;

  state.rng = createRNG(snapshot.rngState || 0);
  state.turn = snapshot.turn || 0;
  state.a = cloneStateSlice(snapshot.a) || state.a;
  state.b = cloneStateSlice(snapshot.b) || state.b;
  return state;
}

module.exports = {
  createBattleState,
  processTurn,
  isOver,
  getWinner,
  serializeBattleState,
  applyBattleStateSnapshot,
};
