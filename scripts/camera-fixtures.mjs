// Bounded optical QA fixtures. No policy tuning, game changes or win-rate claim.
import fs from 'node:fs/promises';
import assert from 'node:assert/strict';
import { parseArgs } from 'node:util';
import { createHash } from 'node:crypto';
import {execFileSync} from 'node:child_process';
import { runProfileFight } from './lib/profile-fight.mjs';
import { createSparring } from './lib/sim-bot.mjs';
import { idleIntent } from '../game/src/duel.ts';
const {values}=parseArgs({options:{out:{type:'string'},source:{type:'string'},'prepare-source':{type:'string'}}});
const hash=x=>createHash('sha256').update(x).digest('hex');
async function engineDigest(dir='game/src'){
  const entries=await fs.readdir(dir,{withFileTypes:true}),files=[];
  for(const entry of entries.sort((a,b)=>a.name.localeCompare(b.name))){
    const path=`${dir}/${entry.name}`;
    if(entry.isDirectory())files.push(...await engineDigest(path));
    else if(entry.isFile())files.push([path,hash(await fs.readFile(path))]);
  }
  return files;
}
const files=await engineDigest(),engineSourceSha256=hash(JSON.stringify(files));
if(values['prepare-source']){
  const engineRevision=execFileSync('git',['rev-parse','HEAD'],{cwd:'game',encoding:'utf8'}).trim();
  assert.equal(execFileSync('git',['status','--porcelain'],{cwd:'game',encoding:'utf8'}).trim(),'','Engine must be clean');
  assert.equal(engineRevision,(await fs.readFile('current-game.sha','utf8')).trim());
  await fs.writeFile(values['prepare-source'],JSON.stringify({engineRevision,engineSourceSha256,files}),{flag:'wx'});
  console.log('Clean pinned engine source manifest saved');
  process.exit(0);
}
assert.ok(values.out,'Provide a fresh --out directory');
assert.ok(values.source,'Prepare --source manifest in the clean local game checkout before staging');
const manifest=JSON.parse(await fs.readFile(values.source));
assert.equal(manifest.engineRevision,(await fs.readFile('current-game.sha','utf8')).trim());
assert.equal(manifest.engineSourceSha256,engineSourceSha256,'Staged engine differs from clean source manifest');
await fs.mkdir(values.out,{recursive:false});
const source={engineRevision:manifest.engineRevision,engineSourceSha256,
  fixtureAuthorSha256:createHash('sha256').update(await fs.readFile('scripts/camera-fixtures.mjs')).digest('hex')};
const search=opponent=>'/?'+new URLSearchParams({spar:'1',opponent,difficulty:'6',weapon:'longsword',skill:'none',special:'none',yourSpecial:'none'});
const rows=[];
for(const opponent of ['goblin','executioner']){
  const fight=runProfileFight(search(opponent),2026100504,'advanced');
  const file=`${opponent}.json`;
  await fs.writeFile(`${values.out}/${file}`,JSON.stringify({...fight,source}),{flag:'wx'});
  rows.push({file,opponent,endTick:fight.endTick,outcome:fight.outcome,events:fight.events.filter(e=>['Dodged','Parried','Blocked','Hit'].includes(e.type))});
}
// Purpose-built boundary probe: draw, walk backwards to the edge, strafe then return.
// Inputs use the real Match/quantization; no teleport, health editing or direct damage.
const {match,config}=createSparring(search('veteran'),2026100504),intents=[],track=[];
for(let i=0;i<1000;i++){
  const duel=match.practice.duel,[p,e]=duel.fighters;
  track.push({tick:duel.tick,radius:Math.hypot(p.body.x,p.body.z),gap:Math.hypot(p.body.x-e.body.x,p.body.z-e.body.z)});
  const intent={...idleIntent(),move:{x:i>=400&&i<650?.6:0,z:i<400?1:i>=650?-.7:0,yaw:0,run:false},guard:true};
  if(p.phase==='sheathed')intent.action='light';
  intents.push({tick:duel.tick,...intent});
  const status=match.step(()=>intent);match.frameEvents=[];
  if(status!=='stepped')break;
}
const edge={source,seed:2026100504,config,intents,track,events:match.fightLog,endTick:match.practice.duel.tick,
  evidenceTier:'direct-engine scripted boundary coverage probe; not a player profile or win-rate test'};
await fs.writeFile(`${values.out}/boundary.json`,JSON.stringify(edge),{flag:'wx'});
rows.push({file:'boundary.json',opponent:'veteran',endTick:edge.endTick,maxRadius:Math.max(...track.map(t=>t.radius)),events:edge.events});
await fs.writeFile(`${values.out}/summary.json`,JSON.stringify({source,rows},null,2),{flag:'wx'});
console.log(JSON.stringify(rows.map(({events,...row})=>row)));
