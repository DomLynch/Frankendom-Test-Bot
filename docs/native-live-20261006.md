# Real-time keyboard AV and move lessons — 6 October 2026

**The bot now records actual live keyboard fights with game video and audio together.** This opt-in research path does not install Playwright's controlled clock and does not replay engine-authored inputs. Headless Mac Metal rendering and a zero-gain speaker sink keep it quiet. The existing fast controlled/silent path stays available.

```sh
node scripts/player-bot.mjs --research --native-av --strategy=tactical --observation=limited --player=advanced --opponent=veteran --fights=1 --seed=2026100631 --url=http://127.0.0.1:8791 --out=artifacts/combat/NEW-UNIQUE-FOLDER
```

Use the existing prepared capture checkout and frozen loopback server; the normal launcher remains `./run-latest.sh`. Native AV requires one bounded fight, video and research mode; paused JPEG frame/clip capture is incompatible. First use of the game still needs its normal setup. Output includes the raw fight, summary, `<opponent>-<seed>-av/fight-av.webm`, real audio/frame/event receipt, contact JPEGs and measurements. Canvas AV omits DOM HUD. Poll delay is64ms plus automation overhead, not verified human reaction time. Limited observation is semantic telemetry, not model vision/hearing.

## First three actual native fights

Frozen game6fb21b3, botb00b251, EasyL6/longsword/no specials. Root independently checked real input starts, per-fight<=20%heavy, release/errors, Metal, all media/contact hashes and recorded event coverage.

| Case | Result | Raw damage taken | Events matched |
|---|---|---|---|
| Advanced Veteran631 | Win,76HP | 74 | 103 |
| Beginner Veteran632 | Loss, enemy44HP | 161 | 128 |
| Advanced Executioner633 | Win,64HP | 86 | 113 |

Raw damage can exceed remaining HP through overkill. All three contain non-silent actual final game audio and one48kHz Opus audio track; metadata inspection also confirms VP9 video. Full decode, hearing quality, perceptual synchronization and human comfort remain unassessed. Original clips are retained locally and available in the quiet local viewer.

The same initial Veteran631 under controlled timing won with125HP/25damage, versus76HP/74damage in native mode. Timing, polling and trajectories differ; one pair does not isolate a clock-caused damage penalty. **Do not pool native and controlled outcomes or call either a validated human profile.** Beginner632 lost with eight recorded misses and three interruptions but no exhaustion; novice failure has several causes. Native Executioner ordinary block389 led to thrust405 and useful hit421,0.533s later—ordinary blocks can preserve pressure, refining earlier retreat-heavy examples.

A small recording-boundary defect was caught:1–4 render metadata samples could arrive after MediaRecorder stop while its promise resolved. Their presence cannot prove video coverage. Fix86fa975 bounds frame evidence to actual begin/end timestamps, with a regression that failed before the fix. All three earlier whole fights remain covered by their five-second tails; original receipts were preserved and retrospective analysis excludes post-stop samples. **122/122 tests pass**, job[6ac5254d404719ba37661cc1](https://huggingface.co/jobs/Domlynch/6ac5254d404719ba37661cc1), COMPLETED; source86fa975f2805a6da42d7ad16cce9a3badafd1897, logSHA9023ed50aa1f86845c1ff03f2e2d7a8d71ebe1e3cfe55681079ebb3000a29be0.

## Nine fresh move cases: useful negative evidence

Five baseline/probe cases and four matched feint-repeat cases on source967051e:8wins/1loss, all raw/source/cap/release/error/video checks pass. Existing probes remain experiments, not promoted tactics.

- **Kick:** two accepted starts, zero hits. One missed; one was stagger-interrupted. Fix the probe's situational/range selection before judging kick strength.
- **Short step:** all three accepted backsteps were hit by Executioner's heavy. Starts were around0.85m; last pre-hit samples0.97–1.07m, against nominal2.3m scythe reach. `RULES.backstep` is12ticks,10stamina, nominal0.6m displacement. It has no invulnerability; only roll has the authored safe interval. This is an unsuitable escape choice, not a missing-iFrame game defect. Teach positional step versus committed roll; test steps where separation can actually clear the weapon.
- **Feint:** seed621 accepted a feint and the run took36 damage versus110 baseline. Seed624 accepted one but took135 versus69. Seed625 never selected/executed a feint and cannot support a feint-effect claim. Do not promote from one winning example; investigate openings and opponent reactions.
- **Defence follow-through:** perfect Executioner block178 reached useful hit210,0.533s later. Ordinary block392 was followed by roll402 and hit819,7.117s later. These are measured sequences, not counterfactual proof a roll caused all delay.

## Visual observations and next proposals

Fresh native Veteran contact133 shows the shield and player body overlapping the short weapon at contact; parry184 and riposte977 show the head clearly. These static images justify selecting normal-speed pre-contact review windows, not declaring the camera unreadable or reverting it. Review the weapon/body silhouette and large translucent trail shapes independently from blood. Earlier red-mask metrics remain confounded by clothes/background and cannot score blood or visibility.

Pitborn guard634 initially failed before fighting: frozen mirror returned502 for uncached models/portraits/look after live moved. This is a setup failure, not a combat loss. Root repaired only assets referenced by frozen6fb: compiled GLB content-hash filenames reproduced with installed Rolldown, exact pinned Git public blobs for unhashed assets, fullSHA256-verified external textures. No latest JS/HTML or game edits. Supplement provenance is retained; a fresh unique retry validates the repaired setup and corrected recording bounds.

Keep the candidate experimental in PR12 until its own full-roster acceptance. Preserve all losses and failed attempts. Next useful work is range-aware step/kick coverage and native input/event timing, not automatic win tuning or new game buttons.


Latest validation: repaired Pitborn guard634 retry won with82HP,18actualstarts/1heavy,136matched events,4parries/2blocks. New122 recording bounds passed with zero post-stop frame entries. First parry produced no immediate attack; later parries reached useful damage in0.417–0.800s. Successful defence and exploiting the opening remain separate skills. The recorded enemy Charging was light_right, so this case does not validate enemy-heavy charge cue readability. Failed original634 retained. Native retry adds a fourth fresh AV fight; continuation now has33completed fights across distinct scopes, plus one preserved setup failure. [Raw-count/coverage and move audit](evidence/native-live-20261006/).
