// Seeded test personas, not measured human populations. Only transform already-limited observations/inputs.
import { chooseTacticalAttack } from './player-bot-policy.mjs';
export const PLAYER_PROFILES = {
  advanced: { reactionMs: 180, jitterMs: 0, gapBias: 0, staminaBias: 0, wrongGuard: 0, missedCounter: 0, slashPreference: 0 },
  intermediate: { reactionMs: 280, jitterMs: 40, gapBias: -.1, staminaBias: 5, wrongGuard: .08, missedCounter: .2, slashPreference: .2 },
  beginner: { reactionMs: 450, jitterMs: 50, gapBias: -.25, staminaBias: 20, wrongGuard: .28, missedCounter: .65, slashPreference: .7 },
};
function random(seed, key) {
  let n = seed >>> 0;
  for (const c of key) n = Math.imul(n ^ c.charCodeAt(0), 16777619) >>> 0;
  n = Math.imul(n ^ n >>> 16, 0x85ebca6b) >>> 0;
  n = Math.imul(n ^ n >>> 13, 0xc2b2ae35) >>> 0;
  return ((n ^ n >>> 16) >>> 0) / 4294967296;
}
export function createPlayerProfile(name, seed, reactionOverride) {
  if (!Object.hasOwn(PLAYER_PROFILES, name)) throw new Error('Player must be beginner, intermediate or advanced');
  if (!Number.isInteger(seed) || seed < 0 || seed > 0xffffffff) throw new Error('Profile seed must be unsigned32');
  const settings = PLAYER_PROFILES[name];
  const reactionMs = reactionOverride ?? settings.reactionMs + (Math.floor(random(seed, name + '/reaction') * 3) - 1) * settings.jitterMs;
  if (!Number.isFinite(reactionMs) || reactionMs < 100 || reactionMs > 700) throw new Error('Reaction must be100–700ms');
  return { name, seed, reactionMs, settings: { ...settings }, interventions: {}, credited: new Set() };
}
export function profileReceipt(profile) {
  return { name: profile.name, seed: profile.seed, reactionMs: profile.reactionMs, settings: profile.settings,
    interventions: profile.interventions, model: 'seeded synthetic persona; not a validated human skill distribution',
    mistakesUse: 'already-limited observations; no future state; each credited intervention is a unique decision situation' };
}
export function chooseProfiledAttack(seen, state, profile, config) {
  const s = profile.settings;
  // Bias represents judgement of the visible gap/bar, not changes to the recorded true state or game values.
  const judged = profile.name === 'advanced' ? seen : { ...seen, gap: Math.max(0, seen.gap + s.gapBias),
    gapUpper: Math.max(0, (seen.gapUpper ?? seen.gap) + s.gapBias), stamina: Math.min(100, seen.stamina + s.staminaBias) };
  const base = chooseTacticalAttack(judged, state, Math.ceil(profile.reactionMs / 1000 * 60), config);
  if (profile.name === 'advanced' || !seen.hp || !seen.enemyHp || seen.phase === 'attack') return base;
  const adjustments = [];
  const defenceId = String(state.tell?.tick ?? 'none');
  let decision = base;
  if (base.keys.includes('KeyQ') && seen.enemyPhase === 'attack' && random(profile.seed, profile.name + '/guard/' + defenceId) < s.wrongGuard) {
    const arrows = { ArrowLeft: 'ArrowRight', ArrowRight: 'ArrowLeft', ArrowUp: 'ArrowDown', ArrowDown: 'ArrowUp' };
    decision = { ...decision, keys: base.keys.map(k => arrows[k] ?? k) };
    if (!base.keys.some(k => k.startsWith('Arrow'))) decision.keys = [...decision.keys, 'ArrowUp'];
    adjustments.push(['wrong directional guard', defenceId]);
  }
  const counter = base.eligible?.find(e => ['guard counter', 'quick punish'].includes(e.kind));
  if (counter && base.press && random(profile.seed, profile.name + '/counter/' + counter.tick) < s.missedCounter) {
    decision = { ...decision, press: null, keys: decision.keys.filter(k => k !== 'KeyG') };
    adjustments.push(['missed punish opportunity', String(counter.tick)]);
  }
  if (decision.press === 'KeyT' && judged.gap <= 1.65 && seen.light && random(profile.seed, profile.name + '/attack/' + state.attacks) < s.slashPreference) {
    decision = { ...decision, press: 'KeyF' };
    adjustments.push(['prefers simple slash', String(state.attacks)]);
  }
  // Count unique judgement situations, not repeated requests or accepted actions. Actual events remain the latter's proof.
  if (profile.name !== 'advanced' && base.press && (s.staminaBias || s.gapBias)) adjustments.push(['optimistic range/stamina judgement', String(state.attacks)]);
  for (const [name, id] of adjustments) {
    const key = name + '/' + id;
    if (!profile.credited.has(key)) { profile.credited.add(key); profile.interventions[name] = (profile.interventions[name] ?? 0) + 1; }
  }
  return adjustments.length ? { ...decision, reason: `${base.reason} [${profile.name}: ${adjustments.map(a => a[0]).join('; ')}]`,
    judgement: { gap: judged.gap, gapUpper: judged.gapUpper, stamina: judged.stamina }, profileAdjustments: adjustments.map(a => a[0]) } : decision;
}
