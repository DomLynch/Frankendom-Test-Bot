import fs from 'node:fs/promises';
import { createHash } from 'node:crypto';
// Paused clock + screenshot of the actual rendered page. Never infer frame ticks from wall time.
export async function reviewFrameCapture(page, directory, identity) {
  await fs.mkdir(directory, {recursive:true});
  const frames=[];
  const capture=async()=>{
    const tick=await page.evaluate(()=>Number(document.querySelector('#debug').dataset.tick));
    if (frames.at(-1)?.tick === tick) return;
    await page.evaluate(({tick,identity})=>{ const label=document.querySelector('#bot-receipt');
      if(label) label.textContent=`${identity} · rendered tick ${tick}`; },{tick,identity});
    const data=await page.screenshot({type:'jpeg',quality:90});
    const after=await page.evaluate(()=>Number(document.querySelector('#debug').dataset.tick));
    if(after!==tick) throw new Error(`Review frame clock advanced during capture: ${tick}→${after}`);
    const file=`frame-${String(frames.length).padStart(6,'0')}.jpg`;
    await fs.writeFile(`${directory}/${file}`,data,{flag:'wx'});
    frames.push({file,tick,sha256:createHash('sha256').update(data).digest('hex')});
  };
  return {frames,capture,finish:async(meta)=>{
    const receipt=frameReceipt(frames);
    await fs.writeFile(`${directory}/frames.json`,JSON.stringify({...meta,...receipt,frames},null,2),{flag:'wx'});
    return {directory,...receipt};
  }};
}
export function frameReceipt(frames) {
  const gaps=frames.slice(1).map((f,i)=>f.tick-frames[i].tick);
  const maxGapTicks=gaps.length ? Math.max(...gaps) : null;
  return {basis:'actual paused rendered JPEGs; tick read before and after screenshot',
    frameCount:frames.length,firstTick:frames[0]?.tick ?? null,lastTick:frames.at(-1)?.tick ?? null,maxGapTicks,
    aligned:frames.length>1 && gaps.every(g=>g>0 && g<=2),
    playback:'simulation time at 60 ticks/sec; not measured realtime/game FPS',audio:false};
}
