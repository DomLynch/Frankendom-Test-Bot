// Fast production-engine pilot of the same limited-observation persona policy.
// Fixed camera yaw and four-tick input cadence: NOT browser equivalence or visual acceptance.
import { createSparring, eventDamage } from './sim-bot.mjs';
import { limitedObservation } from './player-bot-observation.mjs';
import { BOT_CONFIG, isHeavyMove } from './player-bot-policy.mjs';
import { createPlayerProfile, chooseProfiledAttack, profileReceipt } from './player-profiles.mjs';
import { defenceEarned, summarizeDefences } from './player-bot-review.mjs';
import { accepts } from '../../game/src/combat.ts';
import { LONGSWORD, WEAPONS, RULES } from '../../game/src/moves.ts';
import { idleIntent } from '../../game/src/duel.ts';
import { RADIUS } from '../../game/src/sim.ts';

export function keyboardIntent(decision, previous = []) {
  const keys = new Set(decision.keys), q = keys.has('KeyQ');
  const x = Number(keys.has('KeyD')) - Number(keys.has('KeyA'));
  const z = Number(keys.has('KeyS')) - Number(keys.has('KeyW'));
  const actions = { KeyF: 'light', KeyT: 'thrust', KeyG: 'heavy', KeyC: 'kick', Skill: 'skill' };
  let action = actions[decision.press] ?? null;
  if (decision.press === 'KeyE') action = x || z ? 'dodge' : 'backstep';
  if (!action && keys.has('KeyG') && !previous.includes('KeyG')) action = 'heavy';
  if (!action && q && !previous.includes('KeyQ')) action = 'parry';
  const arrows = { ArrowLeft: 'left', ArrowRight: 'right', ArrowUp: 'overhead', ArrowDown: 'low' };
  return { move: { x, z, yaw: 0, run: false }, action, guard: q,
    guardDirection: q ? Object.entries(arrows).find(([k]) => keys.has(k))?.[1] : undefined,
    held: keys.has('KeyG'), lock: true };
}

export function runProfileFight(search, seed, player, ticks = 5400) {
  if (!Number.isInteger(ticks) || ticks < 1 || ticks > 36000) throw new Error('Ticks must be1–36000');
  const { match, config } = createSparring(search, seed);
  if (config.engineLevel !== 6 || config.weapon !== 'longsword') throw new Error('Profile pilot supports level6 longsword only');
  const profile = createPlayerProfile(player, seed), memory = {}, perception = {};
  const fought = WEAPONS[match.practice.duel.fighters[1].weapon];
  const [range, defense, extra] = BOT_CONFIG[config.opponent];
  const policy = { range, defense, ...extra, windup: Object.fromEntries(Object.entries(fought.moves).map(([id,t]) => [id,t.windup])),
    parryTicks: RULES.parry, thrustRange: LONGSWORD.moves.thrust.reach - .1,
    wallRadius: RADIUS - RULES.wall.loiter.band - .4, heavyBlockCost: fought.moves.heavy_overhead.staminaDamage };
  const decisions = [], track = [], intents = [];
  let cursor = 0, previous = [], intent = idleIntent();
  for (let i = 0; i < ticks; i++) {
    const duel = match.practice.duel, [p,e] = duel.fighters;
    track.push({ tick: duel.tick, gap: Math.hypot(e.body.x-p.body.x,e.body.z-p.body.z), radius: Math.hypot(p.body.x,p.body.z) });
    if (p.phase === 'sheathed') intent = { ...idleIntent(), action: 'light' };
    else if (duel.tick % 4 === 0) {
      const raw = { ...track.at(-1), hp: p.health, enemyHp: e.health, stamina: p.stamina, meterStamina: p.stamina, posture: p.posture,
        phase: p.phase, ownState: p.phase, ownAge: p.age, enemyPhase: e.phase, enemyState: e.phase,
        events: match.fightLog.slice(cursor), ...Object.fromEntries(['heavy','light','thrust','kick','dodge','skill'].map(a => [a,accepts(match.practice,a)])) };
      cursor = match.fightLog.length;
      const seen = limitedObservation(raw, perception, Math.ceil(profile.reactionMs / 1000 * 60));
      const decision = chooseProfiledAttack(seen,memory,profile,policy);
      intent = keyboardIntent(decision,previous); previous = decision.keys;
      decisions.push({ tick: duel.tick, reason: decision.reason, keys: decision.keys, press: decision.press,
        gap: seen.gap, gapUpper: seen.gapUpper, actualGap: raw.gap, stamina: seen.stamina,
        judgement: decision.judgement ?? null, profileAdjustments: decision.profileAdjustments ?? [] });
    }
    intents.push({ tick: duel.tick, ...intent });
    const status = match.step(() => intent);
    intent = { ...intent, action: null }; // edge request once; held levels persist until the next decision
    match.frameEvents = [];
    if (status !== 'stepped') break;
  }
  const events = match.fightLog, finish = match.practice.finish;
  const starts = events.filter(e => e.type === 'AttackStarted' && e.actor === 0), heavies = starts.filter(e => isHeavyMove(e.move)).length;
  const defences = defenceEarned(events,track,Object.fromEntries(Object.entries(fought.moves).map(([id,t]) => [id,t.damage])));
  return { evidenceTier: 'direct-production-engine-no-rendering', observation: 'delayed semantic events and rounded gap; current own bars/action legality; fixed camera yaw0; four-tick cadence',
    temporaryWorkaround: null, seed, config, playerProfile: profileReceipt(profile),
    outcome: !finish ? 'timeout' : finish.draw ? 'draw' : finish.victim === 1 ? 'win' : 'loss',
    endTick: match.practice.duel.tick, finalHealth: match.practice.duel.fighters.map(f => f.health),
    damageTaken: eventDamage(events,0), damageDealt: eventDamage(events,1),
    attackMix: { attacks: starts.length, heavies, heavyPercent: starts.length ? 100*heavies/starts.length : null, passed: starts.length > 0 && 5*heavies <= starts.length },
    emptySwings: events.filter(e => e.type === 'AttackMissed' && e.actor === 0).length,
    blocks: events.filter(e => e.type === 'Blocked' && e.actor === 0).length, parries: events.filter(e => e.type === 'Parried' && e.actor === 0).length,
    exhaustions: events.filter(e => e.type === 'StaminaExhausted' && e.actor === 0).length,
    defences, defenceSummary: summarizeDefences(defences), inputReleaseEvidence: 'not-applicable-direct-engine; no browser keys', events, decisions, track, intents };
}
