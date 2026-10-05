// Browser-only tap of the real final WebAudio output. No synthetic sounds or game-state writes.
export function installAudioReview() {
  const lab = globalThis.__audioReview = { contexts: [], starts: [], stops: [], frames: [], events: [], levels: [], decoded: [], active: false, combatTick: -1 };
  const combat = e => { lab.combatTick = e.detail.events.at(-1)?.tick ?? lab.combatTick;lab.events.push(...structuredClone(e.detail.events)); };
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
  AudioNode.prototype.connect = function(destination, ...args) {
    if (!(destination instanceof AudioDestinationNode)) return connect.call(this, destination, ...args);
    const context = this.context;
    if (lab.contexts.some(x => x.context === context)) throw new Error('Multiple final outputs require an explicit mixer');
    const tap = context.createMediaStreamDestination(), analyser = context.createAnalyser(), mute = context.createGain();
    analyser.fftSize = 2048; mute.gain.value = 0;
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
    let optical=null;
    view.renderer.render=function(scene,camera){
      const [x,y,z,w]=camera.quaternion.toArray();
      optical={position:camera.position.toArray(),quaternion:[x,y,z,w],rigYaw:view.yaw,
        horizonTiltDeg:Math.asin(Math.max(-1,Math.min(1,2*(x*y+w*z))))*180/Math.PI};
      return draw.call(this,scene,camera);
    };
    view.render = function(state, locked, dt, practice, ...rest) {
      const result = render.call(this, state, locked, dt, practice, ...rest);
      const audio = lab.contexts[0];
      if (audio) {
        lab.frames.push({...stamp(audio.context), tick: practice.duel.tick,camera:optical,
          fighters: structuredClone(practice.duel.fighters), events: structuredClone(practice.events)});
        if (lab.active) {
          const data = new Float32Array(audio.analyser.fftSize); audio.analyser.getFloatTimeDomainData(data);
          lab.levels.push({...stamp(audio.context), rms: Math.sqrt(data.reduce((n,x)=>n+x*x,0)/data.length), peak: Math.max(...data.map(Math.abs))});
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
        frames:lab.frames.filter(f=>f.performanceMs>=lab.beginStamp.performanceMs),events:lab.events,
        levels:lab.levels,decoded:lab.decoded,sampleRate:context.sampleRate,audioTracks:stream.getAudioTracks().length,
        method:'native canvas captureStream plus actual final game WebAudio bus in one MediaRecorder; native clocks; silent speaker sink'};
    };
  };
  lab.uninstall = () => {lab.restoreView?.();window.removeEventListener('frankendom:combat',combat);
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
