// Bounded experimental situations. These are coverage probes, never the canonical win policy.
import { chooseTacticalAttack } from './player-bot-policy.mjs';
export const probeNames = ['guard', 'parry', 'roll', 'shortstep', 'kick', 'feint', 'special'];
const mirror = { right: 'ArrowLeft', left: 'ArrowRight', overhead: 'ArrowUp', low: 'ArrowDown' };
export function chooseProbe(obs, state, reaction, config, mode) {
  const base = chooseTacticalAttack(obs, state, reaction, config);
  const choice = (keys, press, reason) => ({ keys, press, reason, eligible: base.eligible ?? [] });
  const own = obs.ownState ?? obs.phase;
  const tell = state.tell, age = tell ? obs.tick - tell.tick : -1;
  state.probes ??= 0;
  if (mode === 'guard' && own === 'guard' && state.lastProbeOwn !== 'guard') state.probes++;
  state.lastProbeOwn = own;
  if (!obs.hp || !obs.enemyHp || state.probes >= 3) return base;
  if (mode === 'feint' && obs.phase === 'attack' && state.enemyBlock && obs.tick - state.enemyBlock <= 240
      && /^(light_|heavy_overhead$)/.test(own) && obs.ownAge >= 2 && obs.ownAge <= 8 && state.feintedStart !== obs.tick - obs.ownAge) {
    state.feintedStart = obs.tick - obs.ownAge; state.probes++;
    return choice(['KeyQ'], null, 'EXPERIMENT feint the committed attack after observed guard');
  }
  if (!['ready', 'guard'].includes(own) || obs.phase === 'attack') return base;
  if (mode === 'kick' && state.enemyBlock && obs.tick - state.enemyBlock <= 100 && obs.gap > 1.25 && obs.gap <= 1.8
      && obs.enemyPhase !== 'attack' && obs.stamina >= 50 && state.kickedBlock !== state.enemyBlock)
    return choice(['KeyW', 'KeyQ'], null, 'EXPERIMENT close under guard for a reachable kick');
  if (mode === 'kick' && state.enemyBlock && obs.tick - state.enemyBlock <= 100 && obs.gap <= 1.25
      && obs.kick && obs.stamina >= 50 && state.kickedBlock !== state.enemyBlock) {
    state.kickedBlock = state.enemyBlock; state.probes++;
    return choice([], 'KeyC', 'EXPERIMENT kick a confirmed close guard');
  }
  if (mode === 'special' && obs.skill && obs.enemyPhase !== 'attack' && obs.gap <= 1.5 && obs.stamina >= 50) {
    state.probes++;
    return choice([], 'Skill', 'EXPERIMENT level-matched special at close range');
  }
  if (['guard', 'parry', 'roll', 'shortstep'].includes(mode) && tell && obs.enemyPhase === 'attack'
      && age >= reaction && obs.gap <= 2.6 && !state.chargedThreat && obs.stamina >= 35) {
    const side = mirror[tell.direction], keys = ['KeyQ', ...(side ? [side] : [])];
    if (mode === 'guard') return choice(keys, null, 'EXPERIMENT hold matching guard then punish');
    const due = (config.windup[tell.move] ?? 20) - (mode === 'parry' ? config.parryTicks - 2 : 10);
    if (age < due) return choice([], null, 'EXPERIMENT wait for observed contact timing');
    if (state.probedTell === tell.tick) return base;
    state.probedTell = tell.tick; state.probes++;
    return mode === 'parry' ? choice(keys, null, 'EXPERIMENT timed directional parry')
      : choice(mode === 'roll' ? ['KeyA'] : [], 'KeyE', `EXPERIMENT ${mode} before observed contact`);
  }
  // Let the opponent initiate, without inventing empty swings or adding attack-count padding.
  if (['guard', 'parry', 'roll', 'shortstep'].includes(mode) && obs.enemyPhase !== 'attack'
      && !(state.defence && obs.tick <= state.defence.until) && !(state.miss && obs.tick <= state.miss.until))
    return choice(obs.gap > 1.8 ? ['KeyW'] : [], null, 'EXPERIMENT invite a defendable exchange');
  return base;
}
