// Opt-in, local renderer experiment. Never changes game inputs, rig yaw or simulation.
export const CAMERA_PRESETS = {
  current: { label: 'Current production lock', offset: 0, height: 0, back: 0 },
  elevated: { label: 'EXPERIMENT elevated tracking', offset: 0, height: 4.6, back: 5.8 },
  shoulder: { label: 'EXPERIMENT offset tracking', offset: 0.28, height: 3.15, back: 4.8 },
};

// Optical axes, not the orbital target angle. Pitch, residual shake and arena clamp matter.
export function horizontalBasis([x,y,z,w]) {
  const unit=(a,b)=>{const n=Math.hypot(a,b);return n>1e-8?[a/n,b/n]:null;};
  return {forward:unit(-2*(x*z+w*y),-1+2*(x*x+y*y)),
    right:unit(1-2*(y*y+z*z),2*(x*z-w*y))};
}

export function cameraTarget(p, e, preset, previous = null, dt = 1 / 60) {
  const settings = CAMERA_PRESETS[preset];
  if (!settings || preset === 'current') throw new Error('Choose an experimental camera');
  if (![p.x,p.z,e.x,e.z,dt].every(Number.isFinite) || dt < 0 || dt > 0.1) throw new Error('Invalid camera input');
  const gap = Math.hypot(p.x - e.x, p.z - e.z);
  const wrap = a => Math.atan2(Math.sin(a), Math.cos(a));
  const wanted = gap > 0.15 ? Math.atan2(p.x - e.x, p.z - e.z) + settings.offset : previous?.yaw ?? settings.offset;
  const delta = previous ? wrap(wanted - previous.yaw) : 0;
  // No sudden side switch: shortest arc, maximum120 degrees/s, eased target.
  const turn = Math.max(-2.1 * dt, Math.min(2.1 * dt, delta * (1 - Math.exp(-8 * dt))));
  const yaw = previous ? previous.yaw + turn : wanted;
  const back = Math.max(settings.back, gap * 0.75 + 3);
  let x = p.x + Math.sin(yaw) * back, z = p.z + Math.cos(yaw) * back;
  const radius = Math.hypot(x,z);
  if (radius > 11.5) { x *= 11.5 / radius; z *= 11.5 / radius; }
  const desired = { x, y: Math.max(settings.height, gap * 1.05), z };
  const k = 1 - Math.exp(-8 * dt);
  if (previous) for (const key of ['x','y','z']) desired[key] = previous[key] + (desired[key] - previous[key]) * k;
  return { ...desired, yaw, lookX: (p.x + e.x) / 2, lookY: 0.8, lookZ: (p.z + e.z) / 2 };
}

export function installCameraLab(preset) {
  if (location.hostname !== '127.0.0.1' || !new URLSearchParams(location.search).has('debug')) throw new Error('Camera lab is loopback/debug only');
  if (!Object.hasOwn(CAMERA_PRESETS,preset)) throw new Error('Unknown camera preset');
  const view = globalThis.__view;
  if (!view || globalThis.__cameraLab) throw new Error('Missing debug view or lab already installed');
  const render = view.render, draw = view.renderer.render;
  const lab = globalThis.__cameraLab = { preset, label: CAMERA_PRESETS[preset].label, frames: [], state: null, pose: null };
  view.render = function(state, locked, dt, practice, ...rest) {
    lab.state = { state, locked, dt, practice };
    return render.call(this,state,locked,dt,practice,...rest);
  };
  view.renderer.render = function(scene, camera) {
    const state = lab.state;
    if (!state) return draw.call(this,scene,camera);
    const { practice, dt } = state, [p,e] = practice.duel.fighters;
    const before = { position: camera.position.clone(), quaternion: camera.quaternion.clone(), up: camera.up.clone() };
    try {
      if (preset !== 'current') {
        lab.pose = cameraTarget(p.body,e.body,preset,lab.pose,Math.min(0.1,Math.max(0,dt)));
        // Carry the production camera's angular residual (including roll tilt) into the new aim.
        // Positional impact offsets/lag are NOT claimed equivalent in this prototype.
        const baseAim = camera.clone();
        baseAim.lookAt((p.body.x+e.body.x)/2,0.8,(p.body.z+e.body.z)/2);
        const residual = baseAim.quaternion.clone().invert().multiply(before.quaternion);
        camera.position.set(lab.pose.x,lab.pose.y,lab.pose.z);
        camera.lookAt(lab.pose.lookX,lab.pose.lookY,lab.pose.lookZ);
        camera.quaternion.multiply(residual);
        camera.updateMatrixWorld(true);
      }
      const project = (body,y) => {
        const point = camera.position.clone().set(body.x,y,body.z).project(camera);
        return { x:(point.x+1)/2, y:(1-point.y)/2, inFrustum:point.z>=-1&&point.z<=1&&Math.abs(point.x)<=1&&Math.abs(point.y)<=1 };
      };
      const sample = { tick: practice.duel.tick, eye:camera.position.toArray(), quaternion:camera.quaternion.toArray(),
        yaw:lab.pose?.yaw ?? view.yaw, rigYaw:view.yaw, opticalBasis:horizontalBasis(camera.quaternion.toArray()),
        playerFeet:project(p.body,0), opponentFeet:project(e.body,0),
        playerChest:project(p.body,1), opponentChest:project(e.body,1),
        fighters:structuredClone(practice.duel.fighters), events:structuredClone(practice.events) };
      const result = draw.call(this,scene,camera);
      lab.frames.push(sample);
      return result;
    } finally {
      camera.position.copy(before.position); camera.quaternion.copy(before.quaternion); camera.up.copy(before.up); camera.updateMatrixWorld(true);
    }
  };
  lab.uninstall = () => { view.render=render; view.renderer.render=draw; delete globalThis.__cameraLab; };
  return { preset, label:lab.label };
}
if (typeof window !== 'undefined') globalThis.__installCameraLab = installCameraLab;
