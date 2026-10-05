import test from 'node:test';
import assert from 'node:assert/strict';
import {identifySpriteCue,chargeObservationAudit} from '../scripts/lib/audio-review.mjs';
import {MANIFEST} from '../game/src/audio/manifest.ts';
import {cuesFor} from '../game/src/audio/cues.ts';
import {perceivable} from '../scripts/lib/player-bot-observation.mjs';
test('native sprite source offset identifies enemy charge without confusing short other banks',()=>{
 const offset=MANIFEST.charge_foe[0][0];
 assert.equal(identifySpriteCue({bufferSeconds:46,offset},MANIFEST),'charge_foe');
 assert.equal(identifySpriteCue({bufferSeconds:1,offset:0},MANIFEST),null);
 assert.equal(identifySpriteCue({bufferSeconds:46,offset:offset+.1},MANIFEST),null);
});
test('actual pinned cue map has enemy-specific onset absent in current observation proxy',()=>{
 const event={tick:1165,type:'Charging',actor:1,move:'heavy_overhead'};
 assert.ok(cuesFor([event]).some(c=>c.name==='charge_foe'&&c.hold>0));
 const rows=chargeObservationAudit([event],[{id:3,tick:1165,bufferSeconds:46,offset:MANIFEST.charge_foe[0][0],scheduledSeconds:2}],perceivable([event]),MANIFEST);
 assert.equal(rows.length,1);assert.equal(rows[0].exposedAtStart,false);
 assert.equal(chargeObservationAudit([event],[],[],MANIFEST).length,0,'do not infer playback from simulation alone');
 assert.ok(!cuesFor([{...event,move:'light_right'}]).some(c=>c.name==='charge_foe'));
 assert.ok(!cuesFor([{...event,actor:0}]).some(c=>c.name==='charge_foe'));
});
