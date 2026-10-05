import { parseArgs } from 'node:util';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { runProfileFight } from './lib/profile-fight.mjs';
import { fightSeeds } from './lib/player-bot-policy.mjs';
import { PLAYER_PROFILES } from './lib/player-profiles.mjs';
const { values } = parseArgs({ options: {
  opponents: { type:'string', default:'pitborn,veteran' }, players:{ type:'string', default:'beginner,intermediate,advanced' },
  fights:{type:'string',default:'3'}, seed:{type:'string',default:'2026100501'}, out:{type:'string'},
} });
const out = values.out ?? 'artifacts/combat/profile-pilot/' + new Date().toISOString().replaceAll(':','-');
const opponents = values.opponents.split(','), players = values.players.split(','), count = Number(values.fights), seed = Number(values.seed);
if (!Number.isInteger(count) || count < 1 || count > 100 || !Number.isInteger(seed) || seed < 0 || seed > 0xffffffff) throw new Error('Invalid fights/seed');
if (!players.every(p => Object.hasOwn(PLAYER_PROFILES,p))) throw new Error('Unknown player profile');
if (!opponents.every(p => ['pitborn','veteran'].includes(p))) throw new Error('Pilot is limited to Pitborn/Veteran');
if (new Set(opponents).size !== opponents.length || new Set(players).size !== players.length) throw new Error('Duplicate opponent/player');
if (existsSync(`${out}/summary.json`)) throw new Error('Output already contains a run; choose a new --out directory to retain every result');
mkdirSync(out,{recursive:true});
const files = ['scripts/lib/profile-fight.mjs','scripts/lib/player-profiles.mjs','scripts/lib/player-bot-policy.mjs','scripts/lib/player-bot-observation.mjs','scripts/lib/player-bot-review.mjs'];
const source = { engineRevision:readFileSync('current-game.sha','utf8').trim(), controllerSha256:createHash('sha256').update(files.map(f => f+'\0'+readFileSync(f,'utf8')).join('\0')).digest('hex') };
const rows = [], seeds = fightSeeds(seed,count);
for (const opponent of opponents) for (const player of players) for (const seed of seeds) {
  const search = '/?'+new URLSearchParams({spar:'1',opponent,difficulty:'6',weapon:'longsword',skill:'none',special:'none',yourSpecial:'none'});
  const fight = runProfileFight(search,seed,player), artifact = `${opponent}-${player}-${seed}.json`;
  writeFileSync(`${out}/${artifact}`,JSON.stringify({...fight,source},null,2),{flag:'wx'});
  const { events,decisions,track,intents,config,defences,...row } = fight;
  rows.push({...row,opponent,artifact});
  console.log(JSON.stringify({player,opponent,seed,outcome:fight.outcome,hp:fight.finalHealth,heavy:fight.attackMix,blocks:fight.blocks,parries:fight.parries}));
}
writeFileSync(`${out}/summary.json`,JSON.stringify({source,seeds,settings:'L6 longsword; no equipped specials; workarounds OFF',
  assessment:'synthetic player-experience pilot; engine results do not establish browser win rate or human skill',rows},null,2));
