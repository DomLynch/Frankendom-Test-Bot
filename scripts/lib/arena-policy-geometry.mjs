// Read the pinned game's public arena geometry without changing its active fight.
import { underPlayScale, RADIUS } from '../../game/src/play-radius.ts';
import { RULES } from '../../game/src/moves.ts';

export function arenaPolicyGeometry(opponent) {
  return underPlayScale(opponent, Infinity, () => ({
    arenaRadius: RADIUS,
    wallRadius: RADIUS - RULES.wall.loiter.band - .4,
  }));
}
