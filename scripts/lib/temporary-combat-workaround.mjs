// Owner-authorized test-controller workaround. Never edits game rules or counts as acceptance.
import { idleIntent, movesOf } from '../../game/src/duel.ts';
export const WORKAROUND = 'known-combat-bugs';
export function temporaryCombatIntent(duel, config, original) {
  const p = duel.fighters[0], enemy = duel.fighters[1], own = movesOf(p);
  const dx = enemy.body.x - p.body.x, dz = enemy.body.z - p.body.z, gap = Math.hypot(dx, dz);
  const scythe = p.weapon === 'scythe';
  const reaction = config.aiProfile.reaction;
  const cliff = Number.isFinite(reaction) && reaction < own.light_right.windup;
  const result = (intent, reason) => ({ intent, reason });
  if ((!scythe && !cliff) || !['ready', 'guard'].includes(p.phase) || original.action === 'skill') return result(original, null);
  const guarded = { ...idleIntent(), lock: true, guard: true };
  const move = sign => ({ x: sign * dx / (gap || 1), z: sign * dz / (gap || 1), yaw: 0, run: false });
  // Avoid committing cuts already inside the authored dead band; keep pressure otherwise.
  if (scythe && ['light', null].includes(original.action)) {
    const cut = own.light_right, upper = cut.reach - .1;
    const lower = Math.min(upper, (cut.minReach ?? 0) + .15);
    if (gap < lower) return result({ ...guarded, move: move(-1) }, 'temporary scythe standoff');
    if (gap > upper) return result({ ...guarded, move: move(1) }, 'temporary scythe approach');
  }
  // Bypass only a slower cut's read threshold using an existing faster legal move.
  // No edits to opponent reactions, damage, levels, reach or recorded outcomes.
  if (cliff && original.action === 'light' && own.thrust.windup < reaction) {
    if (gap > own.thrust.reach - .1) return result({ ...guarded, move: move(1) }, 'temporary close for faster thrust');
    if (gap >= (own.thrust.minReach ?? 0)) return result({ ...original, action: 'thrust', held: false }, 'temporary faster thrust at reaction threshold');
  }
  return result(original, null);
}
