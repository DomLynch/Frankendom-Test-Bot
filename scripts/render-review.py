#!/usr/bin/env python3
"""CPU export (run on the VPS): tick-aligned rendered frames, not wall-time interpolation."""
import hashlib,json,pathlib,subprocess,sys
root=pathlib.Path(sys.argv[1]).resolve()
manifest=json.loads((root/'frames.json').read_text())
frames=manifest['frames']
ticks=[f['tick'] for f in frames]
gaps=[b-a for a,b in zip(ticks,ticks[1:])]
if (not manifest['aligned'] or len(ticks)<2 or any(type(t) is not int or t<0 for t in ticks)
    or any(g<=0 or g>2 for g in gaps) or manifest['frameCount']!=len(frames)
    or manifest['firstTick']!=ticks[0] or manifest['lastTick']!=ticks[-1]
    or manifest['maxGapTicks']!=max(gaps)):
    raise SystemExit('Unusable frame continuity: refusing visual evidence export')
for f in frames:
    p=root/f['file']
    if p.parent!=root or hashlib.sha256(p.read_bytes()).hexdigest()!=f['sha256']: raise SystemExit('Frame identity mismatch')
def export(name,start,end,clean=False):
    rows=[f for f in frames if start<=f['tick']<=end]
    if len(rows)<2: return {'name':name,'status':'insufficient frames','fromTick':start,'toTick':end}
    # File names are authored by capture; reject quotes instead of shell interpolation.
    if any("'" in f['file'] or '/' in f['file'] for f in rows): raise SystemExit('Invalid frame name')
    playlist=root/(name+'.ffconcat')
    lines=['ffconcat version 1.0']
    for i,f in enumerate(rows):
        duration=(rows[i+1]['tick']-f['tick'])/60 if i+1<len(rows) else 1/60
        lines += ["file '"+f['file']+"'",f'option framerate 60',f'duration {duration:.9f}']
    lines += ["file '"+rows[-1]['file']+"'",'option framerate 60']
    playlist.write_text('\n'.join(lines)+'\n')
    video=root/(name+'.mp4')
    filters=('drawbox=x=0:y=0:w=iw:h=24:color=black:t=fill,' if clean else '')+'fps=60'
    subprocess.run(['ffmpeg','-y','-hide_banner','-loglevel','error','-threads','5','-safe','0','-f','concat','-i',str(playlist),
      '-vf',filters,'-an','-c:v','libx264','-threads','5','-preset','veryfast','-crf','20','-pix_fmt','yuv420p',str(video)],check=True)
    subprocess.run(['ffmpeg','-v','error','-threads','5','-i',str(video),'-f','null','-'],check=True)
    return {'name':name,'status':'exported/decode passed','video':video.name,'fromTick':rows[0]['tick'],'toTick':rows[-1]['tick'],
      'sourceFrames':len(rows),'requestedFromTick':start,'requestedToTick':end,
      'coverage':'complete within2-tick sampling' if rows[0]['tick']-start<=2 and end-rows[-1]['tick']<=2 else 'partial - requested boundary not captured','sha256':hashlib.sha256(video.read_bytes()).hexdigest(),'clean':clean,
      'alignmentBasis':'every source JPEG has paused before/after tick receipt and hash','playback':'simulation time; no frame synthesis beyond repeat at tick cadence','audio':False}
end=min(manifest.get('endTick') or frames[-1]['tick'],frames[-1]['tick'])
outputs=[export('full-review',frames[0]['tick'],end)]
for i,case in enumerate(manifest['cases']):
    outputs.append({**case,'endClamped':case['toTick']>end,**export(f'case-{i+1}-proof',case['fromTick'],min(end,case['toTick']))})
    outputs.append({**case,'endClamped':case['toTick']>end,**export(f'case-{i+1}-clean',case['fromTick'],min(end,case['toTick']),True)})
(root/'review-export.json').write_text(json.dumps({'sourceManifestSha256':hashlib.sha256((root/'frames.json').read_bytes()).hexdigest(),
  'botRevision':manifest.get('botRevision'),'botContentSha256':manifest.get('botContentSha256'),'revision':manifest['revision'],
  'outputs':outputs},indent=2))
print(json.dumps({'outputs':len(outputs),'root':str(root)}))
