// Perfect-state diagnostic matrix. This does not replace rendered browser acceptance.
import fs from 'node:fs';
import { createHash } from 'node:crypto';
import { gzipSync } from 'node:zlib';
import { runFight, playableOpponents } from './lib/sim-bot.mjs';
import { defaultSparringSpecial } from '../game/src/sparring-specials.ts';
const seeds = [918273645, 274629183, 3901284756];
const out = 'artifacts/engine-evaluation';
fs.mkdirSync(out, { recursive: true });
const source = { engineRevision: fs.readFileSync('current-game.sha','utf8').trim(),
  controllerSha256: createHash('sha256').update(fs.readFileSync('scripts/lib/sim-bot.mjs')).update(fs.readFileSync('scripts/lib/probe-strategies.ts')).digest('hex') };
const rows = [];
for (const level of [1, 6, 11, 12, 46]) for (const opponent of playableOpponents)
  for (const strategy of ['light spam','charged heavy only','skill then light']) for (const seed of seeds) {
    const special = defaultSparringSpecial(opponent, level);
    if (strategy === 'skill then light' && !special) { rows.push({level,opponent,strategy,seed,status:'not available: no registered special in this band'}); continue; }
    const params = new URLSearchParams({spar:'1',opponent,difficulty:String(level),weapon:'longsword',skill:'none',
      special:special ?? 'none',yourSpecial:strategy === 'skill then light' ? special : 'none'});
    const f = runFight('/?'+params,seed,strategy,7200);
    const id=`${opponent}-L${level}-${strategy.replaceAll(' ','-')}-${seed}`;
    fs.writeFileSync(`${out}/${id}.json.gz`,gzipSync(JSON.stringify({...f,source})));
    const {intents,events,...metrics}=f;
    rows.push({...metrics,level,opponent,artifact:id+'.json.gz'});
  }
const summary={evidenceTier:'direct-engine-no-browser',observation:'perfect-state single-tactic diagnostics',source,seeds,
  notes:['No heavy cap for exploit probes','Standard longsword kit, not a geared human progression test','Specials match authored level bands','Unavailable registered specials are explicitly skipped'],rows};
fs.writeFileSync(`${out}/summary.json`,JSON.stringify(summary,null,2));
console.log(JSON.stringify({cases:rows.length,fights:rows.filter(x=>x.outcome).length,unavailable:rows.filter(x=>x.status).length,
  wins:rows.filter(x=>x.outcome==='win').length,losses:rows.filter(x=>x.outcome==='loss').length,timeouts:rows.filter(x=>x.outcome==='timeout').length}));
