# Isolated camera comparison — 5 October 2026

Purpose: compare readable combat framing and prototype automatic tracking without changing the game, its normal bot policy, or production. This is an opt-in runtime override in a separate local browser session, not a new game camera release.

## How to run

Use the prepared pinned game checkout and matching loopback build (`/.bot-revision` must match `current-game.sha`). From the test-bot root:

```sh
node scripts/camera-lab.mjs --fight=/absolute/path/to/retained-engine-fight.json --to=1050 --url=http://127.0.0.1:8781 --out=artifacts/combat/camera-lab/new-case
```

The input is a full profile-pilot engine receipt with its recorded intents and source identity, not a video or browser-key log. Choose an end tick greater than420 and before that fight ends. The game replays the preceding seven seconds. Existing output folders are refused. `--presets=current,elevated,shoulder` is the default; subsets are explicit. The regular `./run-latest.sh` remains unchanged. No packages, game builds, game files, live deployment, account login or timers are added/changed by the lab.

The existing local debug view provides the renderer hook. For each draw the harness saves camera position/quaternion/up, applies a temporary optical pose, draws, then restores everything in `finally`. It never writes fighter state, controls, recorded inputs or rig yaw. Closing the browser removes the experiment; explicit uninstall also restores original methods.

## Cameras tested

| Camera | Settings | Behaviour |
| --- | --- | --- |
| Current | Unmodified production locked camera | Baseline |
| Elevated | Minimum eye height4.6m; back5.8m; same51°FOV | Eased opponent tracking, midpoint aim, arena clamp |
| Offset shoulder | Minimum eye height3.15m; back4.8m; yaw offset0.28rad (~16°); same51°FOV | Eased opponent tracking, midpoint aim, arena clamp |

Distance still scales framing. The experiments use the shortest angular arc, roughly120°/s maximum turn,8/s easing and the existing11.5m arena camera radius. At near-coincident fighter positions, yaw is held instead of flipping. This implements test-only automatic tracking, not merely a stationary screenshot angle.

## Evidence

Game `4056467af826b03166a575002f7a4f4b04f9dfe7`, clean and matching the served loopback build. Six actual AppleM5Metal captures at390×844: three cameras × two retained L6 longsword Veteran exchanges, no specials. Source inputs came from the prior engine pilot; these are fresh rendered replays, not six newly played browser fights or a new win-rate measurement.

- Defence case: seed2026100504, ticks631–1050,420JPEGs per view;32 retained events per view. Includes parry841 and its follow-up.
- Roll case: seed2096410118, ticks1131–1550,420JPEGs per view;23 retained events per view. Includes accepted roll1265 and parry1429.
- Each replay matches its retained raw event list and independently verified record's final fighter state. Cross-view tick/fighter-state/event hashes match. This establishes camera-independent captured combat; it does not independently compare every intermediate fighter state with an engine snapshot.
- All91 bot tests pass on the VPS, including five camera regressions: shortest-arc/speed, coincident-target stability, arena clamp/nonmutation, invalid input rejection, and restore-on-draw-error/uninstall. Shell quality gates and independent source/receipt review passed. Existing normal-launcher/policy evidence is reused because those inputs are unchanged; this is not a new normal-policy win-rate run.
- The initial default headless-shell capture selected SwiftShader and is explicitly excluded from visual evidence. Its receipts remain retained. The runner now uses the tested full Chrome executable and refuses software/unavailable GPU renderers before capturing.

Actual paused-frame hashes/ticks are exported with the existing VPS CPU tool. Normal simulation speed means60ticks/sec; these silent clips do not measure real-time game FPS, sound, phone controls or human comfort. Each side-by-side comparison keeps all three390×844views at original resolution, ordered current / elevated / offset.

Eight exports (six individual, two comparisons) passed full decode on the VPS and recovered SHA256 checks. Both comparisons played at1× in the local viewer, duration7.017s, readyState4/no video error. While its server runs, open `http://127.0.0.1:8775/`; recordings are explicitly labelled, not live gameplay. Raw receipts/frames/videos and validation are retained under `artifacts/combat/camera-lab-20261005/` in the operator checkout.

## Provisional design recommendation

Keep **current and offset** as the two main candidates; keep elevated as a spacing/review candidate. This is a bounded visual judgement, not an optimal-camera or human-preference result.

- At tick831, the current close-range scene overlaps the player's torso/raised arm with the opponent. Elevated shows more ground and feet, but reduces fighter/weapon screen size. Offset changes lateral separation while retaining a larger duel presentation; it still needs weapon/arm-overlap checks across poses.
- At roll tick1281, the opponent remains in frame in all three samples. Current gives the largest rolling body; elevated shows more ground; offset retains a large body while moving the enemy toward the opposite side. No camera revert or roll-shake reduction is justified by these samples alone.
- Projected chest/feet centres remain inside the viewport for both captured exchanges, all views. That is a frustum check, NOT proof of visible silhouettes, unobstructed blades or freedom from HUD coverage.

## What remains for the game developers

The renderer override happens at the final draw. Earlier arena culling/presentation and later world-projected HUD labels still use the baseline camera. Angular motion from the original camera is carried over only approximately; its midpoint reference is not a true decomposition of production shake, and positional impact offsets differ. Therefore these clips compare framing/tracking candidates, not final effect/HUD integration fidelity.

Recorded combat yaw is deliberately held unchanged. This cannot validate how changed camera yaw would feel with live movement/aim inputs. Neither case covers short opponents, different weapons, arena-edge/collision stress, finishers, landscape or phone comfort. Game-team integration must unify camera/input yaw, culling, HUD projection and impact offsets, then compare the candidates on these cases plus small/large opponents, boundary movement and live controls. No automatic production promotion.
