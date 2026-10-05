# Camera follow-up — 5 October 2026

**Keep the current production camera. Do not promote the fixed offset prototype.** It has a useful large-opponent view, but fails a close Goblin exchange and leaves movement tied to the baseline camera. These are isolated lab findings, not changes to frankendom.com.

## Evidence and recommendation

| Case | Matched rendered ticks | Observation | Game-team proposal |
| --- | --- | --- | --- |
| Goblin, L6, seed2026100504 |1081–1500; inspect1407 (5.43s into clip)|Current exposes more of the enemy’s head/upper-body silhouette and arm beside the player; offset substantially obscures the Goblin during a damaging wall exchange; small head/body fragments remain visible.|Evaluate height/side clearance by opponent silhouette and distance. Require the incoming weapon and enemy torso to stay readable at close contact. Do not choose a fixed shoulder angle from a large enemy alone.|
| Executioner, same kit/seed |1081–1500; inspect1219 (2.30s)|Offset gives somewhat better body separation during the successful overhead evade. The long weapon extends beyond the left image edge in both sampled views.|Preserve the benefit as a candidate, but check the wind-up, contact and recovery sequence. A visible enemy centre is not enough to prove weapon readability.|
| Veteran, scripted boundary coverage |231–650; inspect450 (3.65s)|Actual player radius reaches8.55. Both tracked chest/feet points remain inside the frustum; the enemy and player still overlap at contact.|Test close-contact occlusion and camera easing at the edge. The probe does not show a wall clipping defect or prove all geometry is visible.|
| Veteran, earlier matched defence/roll |Prior camera-lab unit, source677d634|Reused unchanged camera geometry/inputs; offset remains a candidate, elevated makes figures smaller.|No new Veteran policy fights or win-rate claim in this unit.|

Fresh live local **keyboard W/D and trusted touch joystick up/right** probes show the optical/movement integration problem. Mean ground-plane direction error relative to the preceding rendered optical axis:

| Input | Current | Offset |
| --- | ---: | ---: |
|W|0.00°|11.41°|
|D|0.53°|11.31°|
|Touch up|1.11°|10.84°|
|Touch right|0.89°|11.51°|

These are held-input, unobstructed movement samples (11–12 per pulse), in sequential changing geometry. They exclude damage, recovery, close collisions and boundary contact. They measure **ground-plane axis alignment**, not screen-pixel drift or human comfort. Trusted touch events plus fighter displacement demonstrate the actual joystick path; this is not a raw accepted-Match-intent audit. Touch-end/key-up delivery is logged and the touch stick UI clears; that is the scope of release evidence.

**Implementation brief for the game team:** integrate the intended camera bearing with the movement basis, including midpoint aim, easing and edge clamp. The orbital target angle is not the optical bearing. Preserve intentional shake as presentation; do not make shake randomly rotate movement inputs. Update culling, projected HUD and impact presentation alongside any adopted camera. Then validate opponent/weapon clearance, rapid side changes and actual phone controls. No reach, damage or roll changes are justified by this experiment.

## What ran

- New unchanged-engine Goblin and Executioner advanced-profile fixtures both ended in engine wins. The boundary fixture is a scripted coverage probe, not a player persona. These are **not new browser policy wins or acceptance batches**.
- Each new case replayed in current and offset views:6fresh Mac AppleM5/Metal captures,420JPEGs each,2520 source hashes checked, maxgap1tick. Per-case tick/fighter-state/event hashes match across views; events and final fighter state match the verified production record. No independent per-tick engine snapshot claim.
- Nine exports fully decoded on VPS and SHA256-verified after recovery; all three comparison videos verified playing1×,readyState4/noerror (7.017s each). Silent simulation-time exports at60ticks/s; no real-time FPS, sound or device-comfort claim. Timestamped paired frames were visually inspected; videos preserve full seven-second exchanges.
-93bot tests PASS on VPS; new optical-axis regressions cover quaternion orientation and unusable vertical direction. CLI syntax/shell gates PASS; bad engine revision/digest manifests are refused before fixture creation. Normal launcher/policy unchanged, so prior policy acceptance is retained, not rerun or expanded.
- Independent peer review caught missing source provenance and insufficient control-sample qualification; both corrected. Final control receipt hashes match delivered probe/module. Guarded fixture generation verifies a manifest prepared from the clean pinned game HEAD and full game/src digest; its outputs match the rendered earlier fixture inputs/config/events/end tick.
- Failed early control probes (draw/incorrect idle-state filter) and the first boundary probe that reached only6.76m are retained and excluded. No results discarded to inflate a win rate.

Game pin/served build: `4056467af826b03166a575002f7a4f4b04f9dfe7`. Raw receipts, frames, failed attempts, final controls and videos: `/Users/domininclynch/Developer/frankendom-test-bot-launcher-20261005/artifacts/combat/camera-followup-20261005/`. Machine receipt: [camera-followup-20261005.json](camera-followup-20261005.json).

## Run the separate lab

Normal bot remains `./run-latest.sh`. Do not select the experiment silently.

1. Prepare fixture provenance locally, in the clean pinned game checkout: `node scripts/camera-fixtures.mjs --prepare-source=engine-source.json`.
2. Stage manifest, bot scripts and matching game/src into the existing VPS runner; execute `node scripts/camera-fixtures.mjs --source=engine-source.json --out=fixtures` there. Recover all fixtures, including failures. Rendering checks the actual local game HEAD and served revision again.
3. On the authorized MacGPU loopback build, run `node scripts/camera-lab.mjs --fight=PATH/goblin.json --to=1500 --presets=current,shoulder --out=NEW_DIRECTORY` (Executioner also1500; boundary650). CPU media export stays on VPS.
4. Probe fresh browser controls with `node scripts/camera-controls.mjs --out=NEW_DIRECTORY`. It is loopback-only, fullChrome headless with a hardware-renderer check, real keyboard/trusted touch; it makes no game edits and does not bridge the experimental movement basis.

Limits from the original camera lab still apply: baseline pre-draw culling and post-draw projected HUD, approximate angular residual, different positional impact offsets. The lab evaluates an optical automatic-tracking prototype; it does not implement a finished production camera/controller. Current and offset each have only one new exchange per selected case. Finishers, specials, landscape, long sessions and real thumb feel remain unassessed.
