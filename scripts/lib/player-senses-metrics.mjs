// Offline evidence only. Never feeds exact retrospective state into player decisions.
export function visualPixelStats(rgba, width, height, regions = {}, stride = 4) {
  if (!Number.isInteger(width) || !Number.isInteger(height) || width < 1 || height < 1 || rgba.length !== width * height * 4 || !Number.isInteger(stride) || stride < 1) throw new Error('Invalid RGBA frame');
  const bins = Object.fromEntries(Object.keys(regions).map(k => [k, { samples: 0, red: 0 }]));
  let samples = 0, red = 0, luma = 0;
  // readPixels is bottom-up; ROI bounds are normalized screen coordinates, top-down.
  for (let y = 0; y < height; y += stride) for (let x = 0; x < width; x += stride) {
    const i = (y * width + x) * 4, r = rgba[i], g = rgba[i + 1], b = rgba[i + 2];
    const marked = r >= 90 && g < r * .45 && b < r * .45;
    samples++; red += Number(marked); luma += .2126 * r + .7152 * g + .0722 * b;
    for (const [key, roi] of Object.entries(regions)) if (roi && (x + .5) / width >= roi.left && (x + .5) / width <= roi.right && 1 - (y + .5) / height >= roi.top && 1 - (y + .5) / height <= roi.bottom) {
      bins[key].samples++; bins[key].red += Number(marked);
    }
  }
  return { samples, redDominantFraction: red / samples, meanLumaByte: luma / samples,
    regions: Object.fromEntries(Object.entries(bins).map(([k, v]) => [k, { samples: v.samples, redDominantFraction: v.samples ? v.red / v.samples : null }])),
    method: 'strided rendered RGBA; saturated red threshold, not blood segmentation or visibility recognition; approximate ROIs may include clothing/background' };
}

const median = list => { const a = [...list].sort((a,b) => a-b); return a.length ? (a[Math.floor((a.length-1)/2)] + a[Math.ceil((a.length-1)/2)]) / 2 : null; };
const db = value => value > 0 ? 20 * Math.log10(value) : null;
export function audioSpectrumStats(bins, sampleRate) {
  if (!bins.length || !Number.isFinite(sampleRate) || sampleRate <= 0) throw new Error('Invalid spectrum');
  let power=0, weighted=0, treble=0;
  for(let i=0;i<bins.length;i++)if(Number.isFinite(bins[i])){
    const p=10**(bins[i]/10),hz=i*sampleRate/(2*bins.length);power+=p;weighted+=p*hz;if(hz>=4000)treble+=p;
  }
  return { spectralCentroidHz:power?weighted/power:null,treblePowerFraction:power?treble/power:null };
}
export function approximateImpact(event, fighters) {
  if (!['Hit','GuardBroken'].includes(event?.type) || ![0,1].includes(event.target) || !fighters[event.actor] || !fighters[event.target]) return null;
  const from=fighters[event.actor].body,to=fighters[event.target].body,scale=fighters[event.target].scale;
  const gap=Math.hypot(to.x-from.x,to.z-from.z),k=gap>.0001?.3/gap:0;
  // Approximation follows the reviewed scene's burst anchor, not an observed pixel segmentation.
  const y=(event.location==='head'?1.5:event.location==='legs'?.55:1.15)*scale;
  return {x:to.x-(to.x-from.x)*k,z:to.z-(to.z-from.z)*k,y,radius:.35*scale,eventTick:event.tick,
    location:event.location??'unknown',note:'approximate reviewed-game effect anchor; not rig/collision truth'};
}
export function sensesMetrics(receipt) {
  const frames = receipt.frames ?? [], levels = receipt.levels ?? [], pixels = receipt.visualSamples ?? [], starts = receipt.starts ?? [];
  const finite = (list, key) => list.map(x => x[key]).filter(Number.isFinite);
  const peaks = finite(levels,'peak'), rms = finite(levels,'rms');
  const headRed = pixels.map(p=>p.regions?.enemyHeadApprox?.redDominantFraction).filter(Number.isFinite);
  const impactRed = pixels.map(p=>p.regions?.impactApprox?.redDominantFraction).filter(Number.isFinite);
  const gaps = frames.slice(1).map((f,i) => f.performanceMs-frames[i].performanceMs).filter(x => x>0);
  const audioWindow = (from,to) => {
    const selected=levels.filter(s=>s.performanceMs>=from&&s.performanceMs<to),p=finite(selected,'peak');
    return {samples:selected.length,medianRmsDbfs:db(median(finite(selected,'rms'))),maxPeak:p.length?Math.max(...p):null,
      medianSpectralCentroidHz:median(finite(selected,'spectralCentroidHz'))};
  };
  const windows = (receipt.events ?? []).filter(e => ['Hit','Blocked','Parried','GuardBroken','Charging','ActionStarted'].includes(e.type))
    .filter(e => e.type !== 'ActionStarted' || ['roll','backstep'].includes(e.action)).map(e => {
      const frame = frames.find(f => f.tick >= e.tick && f.tick-e.tick <= 4);
      const sources = starts.filter(s => s.tick === e.tick);
      return { tick:e.tick, type:e.type, actor:e.actor, move:e.move ?? null, action:e.action ?? null,
        renderedTick:frame?.tick ?? null, renderPerformanceMs:frame?.performanceMs ?? null,
        audioBefore:frame?audioWindow(frame.performanceMs-200,frame.performanceMs):null,
        audioAfter:frame?audioWindow(frame.performanceMs,frame.performanceMs+200):null,
        soundSources:sources.map(s => ({id:s.id,cue:s.cue ?? null,
          sourceScheduledAfterFrameMs:frame && Number.isFinite(s.audioSeconds) && Number.isFinite(s.performanceMs)
            ? s.performanceMs + Math.max(0,(s.scheduledSeconds ?? 0)-s.audioSeconds)*1000-frame.performanceMs : null})),
        sourceNote:'decoded source scheduling vs nearest rendered tick; event-local levels include other sounds, not isolated cue audibility or acoustic-device latency' };
    });
  const rolls = (receipt.events ?? []).filter(e => e.type==='ActionStarted' && e.actor===0 && e.action==='roll').map(e => {
    const before = frames.filter(f => f.tick<e.tick && f.tick>=e.tick-12);
    const baseline = median(before.map(f=>f.camera?.horizonTiltDeg).filter(Number.isFinite));
    const after = frames.filter(f=>f.tick>=e.tick && f.tick<=e.tick+60 && Number.isFinite(f.camera?.horizonTiltDeg));
    const changes = after.map(f=>({tick:f.tick,delta:Math.abs(f.camera.horizonTiltDeg-(baseline ?? 0))}));
    const peak = changes.reduce((a,b)=>b.delta>a.delta?b:a,{tick:e.tick,delta:0});
    const settles = changes.filter(f=>f.tick>peak.tick);
    const settle = settles.find((f,i)=>f.delta<=1 && settles.slice(i,i+3).length===3 && settles.slice(i,i+3).every(x=>x.delta<=1));
    return { tick:e.tick, baselineTiltDeg:baseline, sampledPeakDeltaDeg:baseline===null?null:peak.delta,
      firstSustainedWithinOneDegreeTick:baseline===null?null:settle?.tick ?? null,
      note:'sampled horizon only; not enemy reacquisition, continuous vision or human comfort' };
  });
  return { schemaVersion:1, audio:{ available:levels.length>0, samples:levels.length,
      maxPeak:peaks.length?Math.max(...peaks):null, medianRmsDbfs:db(median(rms)),
      nearFullScaleSampleFraction:peaks.length?peaks.filter(x=>x>=.999).length/peaks.length:null,
      nearSilentSampleFraction:rms.length?rms.filter(x=>x<.00001).length/rms.length:null,
      medianSpectralCentroidHz:median(finite(levels,'spectralCentroidHz')),
      medianTreblePowerFraction:median(finite(levels,'treblePowerFraction')),
      unclassifiedSources:starts.filter(s=>!s.cue).length,
      note:'sampled analyser waveform; downmixed levels, not LUFS, guaranteed clipping, hearing or sound taste' },
    visual:{ available:pixels.length>0, samples:pixels.length,
      maxRedDominantFraction:pixels.length?Math.max(...pixels.map(p=>p.redDominantFraction)):null,
      maxApproxEnemyHeadRedFraction:headRed.length?Math.max(...headRed):null,
      maxApproxImpactRedFraction:impactRed.length?Math.max(...impactRed):null,
      sampleCostMedianMs:median(finite(pixels,'sampleCostMs')),
      note:'rendered pixels, not an engine blood flag; approximate ROI/red mask cannot establish weapon occlusion' },
    capture:{ medianFrameGapMs:median(gaps), maxFrameGapMs:gaps.length?Math.max(...gaps):null,
      note:'instrumented native capture cadence, not uninstrumented gameplay performance' }, rolls, eventWindows:windows,
    limits:['No overall combat/fun score','No AI hearing or human motion-comfort claim','No causal attribution from one matched seed'] };
}
