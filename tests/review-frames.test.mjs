import test from 'node:test';
import assert from 'node:assert/strict';
import { frameReceipt } from '../scripts/lib/review-frames.mjs';
test('visual evidence fails closed on missing/non-monotonic frames, not interpolated wall times',()=>{
  assert.equal(frameReceipt([{tick:100},{tick:101},{tick:103}]).aligned,true);
  for(const rows of [[],[{tick:100}],[{tick:100},{tick:160}],[{tick:100},{tick:100}],[{tick:100},{tick:99}]]) assert.equal(frameReceipt(rows).aligned,false);
});

test('exporter independently rejects a forged continuity flag before ffmpeg processing',async()=>{
  const {mkdtemp,writeFile,rm}=await import('node:fs/promises');
  const {tmpdir}=await import('node:os');
  const {join}=await import('node:path');
  const {spawnSync}=await import('node:child_process');
  const dir=await mkdtemp(join(tmpdir(),'bot-frame-invalid-'));
  try {
    for(const ticks of [[100,100],[101,100],[100,160]]) {
      const frames=ticks.map(tick=>({tick,file:'unused.jpg',sha256:'unused'}));
      await writeFile(join(dir,'frames.json'),JSON.stringify({aligned:true,frameCount:2,firstTick:ticks[0],lastTick:ticks[1],maxGapTicks:ticks[1]-ticks[0],frames}));
      const r=spawnSync('python3',['scripts/render-review.py',dir],{encoding:'utf8'});
      assert.notEqual(r.status,0);assert.match(r.stderr,/Unusable frame continuity/);
    }
  }finally{await rm(dir,{recursive:true});}
});
