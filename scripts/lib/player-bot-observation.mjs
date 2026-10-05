import { MOVES } from '../../game/src/moves.ts';
// Constrain what the bot sees; the browser still records exact state for later review.
// What a player can perceive of each combat event: the fields the screen or a sound carries, nothing the sim alone knows (damage,
// stamina costs, charge flags on a hit). Charging is represented only when the pinned cue map has a charging sound.
// AttackActive, the opponent's StaminaExhausted, feint/guard/parry presses remain excluded.
// ChargeCue is a simulated semantic sound signal, not decoded audio or genuine AI hearing; assumes cues are available.
const PERCEIVED = {
  AttackStarted: ['move', 'direction'],   // the windup on screen (its side, heavy vs light vs thrust vs kick) + the whoosh
  AttackMissed: ['move'], Hit: ['target', 'move'], GuardBroken: ['target', 'move'], Parried: ['target', 'move'],
  Blocked: ['target', 'move', 'perfect'], // block vs block_perfect are different sounds
  Dodged: ['target'], Staggered: [], Killed: ['target'], PostureBroken: ['target'], WhipRaised: ['target'], Whipped: ['target'],
};
const SEEN_ACTIONS = new Set(['draw', 'roll', 'backstep']);
export function perceivable(events) {
  return events.flatMap(e => {
    // Pinned audio/cues.ts: enemy charge_foe rises from Charging; own charge plays once on Charged.
    // A held light also emits Charging but has no charge cue. Enemy Charged adds no second sound.
    if (e.type === 'Charging') return e.actor === 1 && MOVES[e.move]?.charges
      ? [{ tick: e.tick, type: 'ChargeCue', actor: 1, cue: 'charge_foe' }] : [];
    if (e.type === 'Charged') return e.actor === 0 ? [{ tick: e.tick, type: 'ChargeCue', actor: 0, cue: 'charge' }] : [];
    if (e.type === 'ActionStarted') return SEEN_ACTIONS.has(e.action) ? [{ tick: e.tick, type: e.type, actor: e.actor, action: e.action }] : [];
    const fields = PERCEIVED[e.type];
    if (!fields) return [];
    const seen = { tick: e.tick, type: e.type, actor: e.actor };
    for (const f of fields) if (e[f] !== undefined) seen[f] = e[f];
    return [seen];
  });
}

// Limited observation, the standard run: perceivable events only, all delayed by the reaction time; the opponent is 'attack' from a
// seen swing start until a seen resolution of it (no hidden DOM flag: #combat-status data-threat has no visual since #676); the stamina
// meter; distance rounded to half-metre steps (the camera shows the gap, not a number). Own health, stamina and action phase stay
// current so death and input cancellation are immediate.
const SWING_ENDS = e => (e.type === 'Hit' || e.type === 'GuardBroken' || e.type === 'AttackMissed') && e.actor === 1
  || (e.type === 'Blocked' || e.type === 'Parried' || e.type === 'Dodged') && e.target === 1
  || e.type === 'Staggered' && e.actor === 1 || e.type === 'Killed';
export const SWING_CAP = 150;   // ticks: a seen swing with no seen end is dropped after this (longer than any windup + full charge + active)
export function limitedObservation(raw, memory, delayTicks) {
  memory.snapshots ??= [];
  memory.pendingEvents ??= [];
  memory.snapshots.push({ tick: raw.tick, gap: raw.gap, radius: raw.radius });
  memory.pendingEvents.push(...perceivable(raw.events));
  const cutoff = raw.tick - delayTicks;
  while (memory.snapshots.length > 1 && memory.snapshots[1].tick <= cutoff) memory.snapshots.shift();
  const seen = memory.snapshots[0];
  const gap = Math.round(seen.gap * 2) / 2;
  // Estimate retreat from already-delayed, half-metre observations only. Never use
  // the current exact gap to decide whether an attack can reach.
  memory.spacing ??= [];
  if (memory.spacing.at(-1)?.tick !== seen.tick) memory.spacing.push({ tick: seen.tick, gap });
  while (memory.spacing.length > 1 && memory.spacing[1].tick <= seen.tick - delayTicks) memory.spacing.shift();
  const previous = memory.spacing[0];
  const outwardPerTick = seen.tick > previous.tick ? Math.max(0, (gap - previous.gap) / (seen.tick - previous.tick)) : 0;
  const gapUpper = gap + .25 + outwardPerTick * (raw.tick - seen.tick);
  const events = memory.pendingEvents.filter(e => e.tick <= cutoff);
  memory.pendingEvents = memory.pendingEvents.filter(e => e.tick > cutoff);
  for (const e of events) {
    if (e.type === 'AttackStarted' && e.actor === 1) memory.swing = e.tick;
    else if (SWING_ENDS(e)) memory.swing = null;
  }
  if (memory.swing != null && cutoff - memory.swing > SWING_CAP) memory.swing = null;
  const enemyPhase = memory.swing != null ? 'attack' : 'other';
  return { ...raw, gap, gapUpper, gapObservedTick: seen.tick, radius: Math.round(seen.radius * 2) / 2, stamina: raw.meterStamina ?? raw.stamina, maxStamina: raw.meterMaxStamina ?? raw.maxStamina ?? 100,
    enemyPhase, enemyState: enemyPhase, events };
}
