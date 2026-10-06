// Browser-only tap of the real final WebAudio output. No synthetic sounds or game-state writes.
export function installAudioReview() {
  const lab = globalThis.__audioReview = { contexts: [], starts: [], stops: [], frames: [], events: [], eventTimeline: [], keyboard: [], levels: [], decoded: [], visualSamples: [], visualErrors: [], frameProofs: [], active: false, combatTick: -1 };
  const combat = e => { lab.combatTick = e.detail.events.at(-1)?.tick ?? lab.combatTick;lab.events.push(...structuredClone(e.detail.events));
    if(lab.active){const time=performance.now();lab.eventTimeline.push(...e.detail.events.map(event=>({event:structuredClone(event),dispatchPerformanceMs:time})));} };
  window.addEventListener('frankendom:combat', combat);
  const decode = BaseAudioContext.prototype.decodeAudioData;
  BaseAudioContext.prototype.decodeAudioData = function(...args) {
    const result = decode.apply(this, args);
    result.then(buffer => lab.decoded.push({seconds:buffer.duration, performanceMs:performance.now()}),()=>{});
    return result;
  };
  const connect = AudioNode.prototype.connect;
  const start = AudioBufferSourceNode.prototype.start, stop = AudioBufferSourceNode.prototype.stop;
  const stamp = context => ({ performanceMs: performance.now(), audioSeconds: context.currentTime,
    tick: lab.combatTick, lastDrawnTick: Number(document.querySelector('#debug')?.dataset.tick ?? -1) });
  const keyboard = e => {if(lab.active)lab.keyboard.push({...stamp(lab.contexts[0].context),type:e.type,code:e.code,repeat:e.repeat,isTrusted:e.isTrusted});};
  window.addEventListener('keydown',keyboard,true);window.addEventListener('keyup',keyboard,true);
  AudioNode.prototype.connect = function(destination, ...args) {
    if (!(destination instanceof AudioDestinationNode)) return connect.call(this, destination, ...args);
    const context = this.context;
    if (lab.contexts.some(x => x.context === context)) throw new Error('Multiple final outputs require an explicit mixer');
    const tap = context.createMediaStreamDestination(), analyser = context.createAnalyser(), mute = context.createGain();
    analyser.fftSize = 2048; analyser.smoothingTimeConstant = 0; mute.gain.value = 0;
    connect.call(this, tap); connect.call(this, analyser); connect.call(this, mute);
    connect.call(mute, destination); // Keep the original audio clock live; speakers are silent, recorded bus is untouched.
    lab.contexts.push({context, tap, analyser, source:this, mute, destination});
    return destination;
  };
  AudioBufferSourceNode.prototype.start = function(...args) {
    const result = start.apply(this, args);
    const id = lab.starts.length; this.__audioReviewId = id;
    lab.starts.push({id, ...stamp(this.context), scheduledSeconds: args[0] ?? 0, offset: args[1] ?? 0,
      duration: args[2] ?? null, bufferSeconds: this.buffer?.duration ?? null, loop: this.loop});
    return result;
  };
  AudioBufferSourceNode.prototype.stop = function(...args) {
    const result = stop.apply(this, args);
    lab.stops.push({id: this.__audioReviewId ?? null, ...stamp(this.context), scheduledSeconds: args[0] ?? 0});
    return result;
  };
  lab.attachView = () => {
    const view = globalThis.__view, render = view.render,draw=view.renderer.render;
    let optical=null, practiceNow=null, nextVisualMs=0, lastVisualContact=-1, pixels=null, impact=null;
    view.renderer.render=function(scene,camera){
      const [x,y,z,w]=camera.quaternion.toArray();
      optical={position:camera.position.toArray(),quaternion:[x,y,z,w],rigYaw:view.yaw,
        horizonTiltDeg:Math.asin(Math.max(-1,Math.min(1,2*(x*y+w*z))))*180/Math.PI};
      const result=draw.call(this,scene,camera);
      if(lab.active&&practiceNow&&globalThis.__visualPixelStats){
        const contact=practiceNow.events.findLast(e=>['Hit','GuardBroken','Blocked','Parried'].includes(e.type));
        const newContact=contact&&contact.tick!==lastVisualContact;
        if(newContact)impact=globalThis.__approximateImpact?.(contact,practiceNow.duel.fighters)??null;
        if(performance.now()>=nextVisualMs||newContact)try{
          const began=performance.now(),gl=view.renderer.getContext(),canvas=view.renderer.domElement,w=canvas.width,h=canvas.height;
          if(gl.getParameter(gl.FRAMEBUFFER_BINDING)===null){
            if(!pixels||pixels.length!==w*h*4)pixels=new Uint8Array(w*h*4);
            gl.readPixels(0,0,w,h,gl.RGBA,gl.UNSIGNED_BYTE,pixels);
            const foe=practiceNow.duel.fighters[1],body=foe.body,scale=foe.scale;
            const right=camera.position.clone().setFromMatrixColumn(camera.matrixWorld,0);
            const project=(height,side)=>camera.position.clone().set(body.x+right.x*side,height,body.z+right.z*side).project(camera);
            const a=project(1.8*scale,-.28*scale),b=project(1.35*scale,.28*scale);
            const roi={left:(Math.min(a.x,b.x)+1)/2,right:(Math.max(a.x,b.x)+1)/2,top:(1-Math.max(a.y,b.y))/2,bottom:(1-Math.min(a.y,b.y))/2};
            const regions={enemyHeadApprox:roi};
            if(impact&&practiceNow.duel.tick-impact.eventTick<=12){
              const projected=(dy,side)=>camera.position.clone().set(impact.x+right.x*side,impact.y+dy,impact.z+right.z*side).project(camera);
              const c=projected(impact.radius,-impact.radius),d=projected(-impact.radius,impact.radius);
              regions.impactApprox={left:(Math.min(c.x,d.x)+1)/2,right:(Math.max(c.x,d.x)+1)/2,top:(1-Math.max(c.y,d.y))/2,bottom:(1-Math.min(c.y,d.y))/2};
            }
            const stats=globalThis.__visualPixelStats(pixels,w,h,regions);
            lab.visualSamples.push({...stamp(lab.contexts[0].context),tick:practiceNow.duel.tick,...stats,approxHeadRoi:roi,impactApprox:impact,sampleCostMs:performance.now()-began});
            if(newContact&&lab.frameProofs.length<24)lab.frameProofs.push({tick:practiceNow.duel.tick,eventTick:contact.tick,performanceMs:performance.now(),jpeg:canvas.toDataURL('image/jpeg',.85).split(',')[1]});
            if(newContact)lastVisualContact=contact.tick;
          }
          nextVisualMs=performance.now()+100;
        }catch(error){lab.visualErrors.push(String(error));nextVisualMs=performance.now()+100;}
      }
      return result;
    };
    view.render = function(state, locked, dt, practice, ...rest) {
      practiceNow=practice;
      const result = render.call(this, state, locked, dt, practice, ...rest);
      const audio = lab.contexts[0];
      if (audio) {
        lab.frames.push({...stamp(audio.context), tick: practice.duel.tick,camera:optical,
          fighters: structuredClone(practice.duel.fighters), events: structuredClone(practice.events)});
        if (lab.active) {
          const data = new Float32Array(audio.analyser.fftSize); audio.analyser.getFloatTimeDomainData(data);
          const bins=new Float32Array(audio.analyser.frequencyBinCount);audio.analyser.getFloatFrequencyData(bins);
          const spectrum=globalThis.__audioSpectrumStats?.(bins,audio.context.sampleRate)??{};
          lab.levels.push({...stamp(audio.context), rms: Math.sqrt(data.reduce((n,x)=>n+x*x,0)/data.length), peak: Math.max(...data.map(Math.abs)),...spectrum});
        }
      }
      return result;
    };
    lab.restoreView = () => { view.render = render;view.renderer.render=draw; };
  };
  lab.begin = () => {
    if (lab.contexts.length !== 1 || lab.contexts[0].context.state !== 'running') throw new Error('One running real audio context required');
    const {context,tap} = lab.contexts[0], canvas = globalThis.__view.renderer.domElement;
    const stream = canvas.captureStream(60);
    for (const track of tap.stream.getAudioTracks()) stream.addTrack(track);
    if (stream.getVideoTracks().length !== 1 || stream.getAudioTracks().length !== 1) throw new Error('Missing AV track');
    const type = ['video/webm;codecs=vp9,opus','video/webm;codecs=vp8,opus'].find(t=>MediaRecorder.isTypeSupported(t));
    if (!type) throw new Error('No native WebM/Opus recording');
    const chunks=[], recorder = new MediaRecorder(stream,{mimeType:type,videoBitsPerSecond:4000000});
    let failure=null; recorder.onerror=e=>{failure=String(e.error ?? e);};
    recorder.ondataavailable=e=>{if(e.data.size)chunks.push(e.data);};
    lab.beginStamp=stamp(context); lab.active=true; recorder.start(100);
    lab.finish = async () => {
      lab.endStamp=stamp(context);lab.active=false;
      await new Promise(resolve=>{recorder.onstop=resolve;recorder.stop();});
      for(const track of stream.getVideoTracks())track.stop();
      if(failure)throw new Error(failure);
      const data=new Uint8Array(await new Blob(chunks,{type}).arrayBuffer());
      let binary='';for(let n=0;n<data.length;n+=32768)binary+=String.fromCharCode(...data.subarray(n,n+32768));
      return {base64:btoa(binary),type,begin:lab.beginStamp,end:lab.endStamp,starts:lab.starts,stops:lab.stops,
        frames:lab.frames.filter(f=>f.performanceMs>=lab.beginStamp.performanceMs&&f.performanceMs<=lab.endStamp.performanceMs),events:lab.events,
        levels:lab.levels,decoded:lab.decoded,keyboard:lab.keyboard,eventTimeline:lab.eventTimeline,visualSamples:lab.visualSamples,visualErrors:lab.visualErrors,frameProofs:lab.frameProofs,sampleRate:context.sampleRate,audioTracks:stream.getAudioTracks().length,
        method:'native canvas captureStream plus actual final game WebAudio bus in one MediaRecorder; native clocks; silent speaker sink'};
    };
  };
  lab.uninstall = () => {lab.restoreView?.();window.removeEventListener('frankendom:combat',combat);
    window.removeEventListener('keydown',keyboard,true);window.removeEventListener('keyup',keyboard,true);
    BaseAudioContext.prototype.decodeAudioData=decode;
    for(const {source,tap,analyser,mute,destination} of lab.contexts){source.disconnect(tap);source.disconnect(analyser);source.disconnect(mute);mute.disconnect();connect.call(source,destination);}
    AudioNode.prototype.connect=connect;
    AudioBufferSourceNode.prototype.start=start;AudioBufferSourceNode.prototype.stop=stop;};
}

export function identifySpriteCue(source, manifest) {
  const end=Math.max(...Object.values(manifest).flat().map(([offset,duration])=>offset+duration));
  if (!(source.bufferSeconds >= end)) return null;
  for(const [name,regions] of Object.entries(manifest))
    if(regions.some(([offset])=>Math.abs(offset-source.offset)<0.001))return name;
  return null;
}
export function chargeObservationAudit(events, starts, perceived, manifest) {
  const rows=[];
  for(const event of events.filter(e=>e.type==='Charging'&&e.actor===1)) {
    const sound=starts.find(s=>s.tick===event.tick&&identifySpriteCue(s,manifest)==='charge_foe');
    if(!sound)continue; // A source event alone does not establish actual cue playback.
    rows.push({event,sourceId:sound.id,heardCue:'charge_foe',scheduledSeconds:sound.scheduledSeconds,
      exposedAtStart:perceived.some(e=>e.tick===event.tick&&e.type==='ChargeCue'),
      limitation:'decoded source scheduled on real game output; not human recognition or a listening policy'});
  }
  return rows;
}
