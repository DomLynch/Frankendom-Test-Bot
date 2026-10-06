# Fresh combat and AV learning — 6 October 2026

**Nine new rendered fights: seven wins, two losses. Five native audio/video captures verified.** This is a bounded research study of frozen game `6fb21b3437a6e794e47dc5a91141b67df7d69162`, not full-roster acceptance or an assessment of later live `1f414227670a3d734b6586187009e6da3d4fe1af`.

Root owns bot engineering; Bot Combat ran the tested commands. No game source, balance, graphics or deployment was changed. The candidate remains experimental until its own roster acceptance. Main's prior game pin is4056467.

## Fresh player-profile evidence

Actual headless Chromium keyboard fights used Apple M5 Metal,390×844,DPR1, limited semantic observation, L6 longsword, no equipped special, seed2026100507 and64ms controlled input cadence. These synthetic profiles are test conditions, not validated human populations. Public served assets were mirrored and hashed locally; this was not an independent rebuild.

| Profile | Goblin | Veteran | Executioner |
|---|---|---|---|
| Advanced | Win,23.48s,113HP | Win,21.60s,110HP | Win,20.53s,139HP |
| Intermediate | Win,29.78s,68HP | **Loss,37.95s; enemy6HP** | Win,22.20s,110HP |
| Beginner | Win,31.53s,36HP | **Loss,16.98s; enemy104HP** | Win,72.22s,36HP |

[Independent raw recount](evidence/live-retest-20261006/fight-recount.json):151 actual attack starts,2heavy starts total; each fight meets<=20%. All nine retained full silent WebMs, released inputs and had no runner errors. Every raw/video hash was checked. Only one seed per cell: neither per-opponent2/3 acceptance nor a difficulty curve is established.

## Useful player-experience findings and proposals

1. **Pressure deserves a targeted beginner review.** Both weaker personas lost Veteran. Beginner spent8.27s near the boundary, intermediate4.10s, advanced0. The smaller Veteran arena radius is3.787, versus8.55 for the other tested enemies. Inspect recovery/escape choices in these losses; this does not isolate arena size or prove unfairness. No wall lashes occurred in these nine fights.
2. **An unlanded attack can mean interruption.** Beginner Veteran starts325/675/830/1011 were followed by enemy hits328/683/841/1019. Do not classify every unsuccessful attack as a range miss or buff reach to compensate. Review commitment and interruption feedback.
3. **Winning hides ineffective exchanges.** Beginner Executioner needed37 attack starts,10 empty swings and72.22s; advanced needed11 starts,0 empty swings and20.53s. Teach and test range, approach and recovery rather than only reaction speed.
4. **Defence is not automatically converted into pressure.** Advanced Executioner parry185 was followed by a roll195 with no attack in flight, and next useful hit292,1.783s after parry. The roll enlarged separation. This is a useful bot decision-review case and practice-content proposal, not proof the roll caused all delay.
5. **Head-hit blood can hide a face in a sampled frame.** [Goblin finishing hit](evidence/live-retest-20261006/goblin-finishing-hit.png) shows an opaque saturated red head burst over the opponent's face. Review head-hit burst material/shape/scale at normal speed. Do not globally weaken hit feedback from one frame.
6. **Torso effects behave differently.** Executioner contact1025 shows the new chest burst in high mode; the hood/face stays visible in both high and off. The scythe shaft and bodies overlap in both. Review weapon silhouette and foreground framing before changing all blood effects.
7. **Roll tilt is measurable, comfort is not established.** This replay's roll829 peaks around7.27degrees; sampled horizon stays within1degree again at856–857, roughly0.45–0.47sim seconds after action start. High/low/off barely change this existing roll tilt. These are sampled camera measurements, not enemy reacquisition or nausea ratings.
8. **Audio capture is real; sound taste is still open.** Native recordings contain final game audio, not synthetic cue replacements. Event-local200ms windows now show mix levels before/after contact. Other sounds remain in the mix: these numbers cannot establish cue audibility, quality or phone-speaker timing.
9. **A colour proxy failed its own comparison.** Approximate impact red coverage was7.619% high and8.380% off, despite the visible extra chest burst in high. Clothing/background/pose confound the red threshold. Keep these numbers diagnostic only; never use them as blood, occlusion or readability acceptance.
10. **Freeze source before interpreting improvements.** The website moved to1f4142 during the batch, adding experimental arena backgrounds/picker work. Those visuals were not assessed here. Game UI still exposes levels1–46; intended50 remains a game-team discrepancy. Specials must stay within authored level bands.

## Actual AV evidence

Five captures replay one new engine-authored fixture through identical verified inputs: high/low/off, then high/off with approximate impact ROI. They are **replays, not five extra bot wins**. All match32 combat events, final fighter state and record hash; each has one real audio track, Metal rendering, non-silent samples and no capture/page errors. [Capture audit](evidence/live-retest-20261006/capture-audit.json).

- [High native AV](evidence/live-retest-20261006/senses-high-impact.webm), [off native AV](evidence/live-retest-20261006/senses-off-impact.webm).
- [High contact1025](evidence/live-retest-20261006/senses-high-impact-contact-0-1025.jpg), [off contact1025](evidence/live-retest-20261006/senses-off-impact-contact-0-1025.jpg). Native draw pose differs despite the same event tick; this is not an exact pixel A/B.
- [High event-local measurements](evidence/live-retest-20261006/senses-high-impact-metrics.json), [off measurements](evidence/live-retest-20261006/senses-off-impact-metrics.json), and their retained full audio receipts.

High/off sampled peaks0.1335/0.1276; neither has near-full-scale analyser samples. Median instrumented frame gap16.6ms; sampling costs5.35/6.30ms median. These do not prove absence of clipping, uninstrumented FPS or perceptual synchronization. Native AV records canvas only: DOM HUD is absent. `feel=off` disables the new armfeel layer, not every old effect. The segment's Charging786 is a light attack, so absent enemy-heavy cue there is expected.

[Media metadata](evidence/live-retest-20261006/media-metadata.json) verifies one VP9 video and one 48kHz Opus audio stream in each file; this is metadata inspection, not full decoding or perceptual sync acceptance.

All full originals and nine fight videos remain under the capture checkout's `artifacts/combat/live-retest-20261006/`. The local viewer is `http://127.0.0.1:8792/`, with playback paused/muted until requested. Original source receipts were preserved; derived event-local metrics record both their input hash and analysis revision/module hash. [Shareable evidence manifest](evidence/live-retest-20261006/manifest.json).

## Bot changes, verification and next bounded scope

- Correct browser arena geometry from the pinned game's per-opponent scale, preserving caller globals. No tactic or game rule change.
- Capture actual rendered RGBA samples, approximate head/impact regions and contact JPEGs. Keep the failed colour proxy explicitly limited.
- Measure final audio RMS/peak/spectrum, event-local mix windows and source scheduling against rendered anchors. No AI hearing.
- Measure sampled roll horizon peak/settling and capture overhead. No overall fun score.
- **112/112 tests pass**, Node22 remote job[6ac51250404719ba37661317](https://huggingface.co/jobs/Domlynch/6ac51250404719ba37661317), terminalCOMPLETED. Tested bot source0536608a4491b4885cda9f0fde53f92c07c7fc49, game6fb21b3; test-log SHA2565d7dc4bb985e3d0b1bfbcff1518ac712c61ecfa789679dbfef8bab1fcfe82768. Subsequent changes are evidence/docs only.

Next: a small unseen-seed Veteran pressure/defence-conversion study, plus contact clips that separate head versus torso and genuinely charged attacks. Do not promote the changed game pin until full normal-kit roster acceptance (>=2/3 per enemy, <=20% heavy each fight). Keep sound judgment, continuous cue recognition and physical-phone comfort unproven.

## Open-source reuse decision

Use existing native WebAudio and FFmpeg first; no new framework/package/model installed. [PyAV](https://github.com/PyAV-Org/PyAV) is an optional BSD3 path for precise media frames/PTS if command-line decoding becomes insufficient. [librosa](https://github.com/librosa/librosa) is an optional ISC audio-feature library; current lightweight metrics suffice for this study. [CoTracker3](https://github.com/facebookresearch/co-tracker) offers point tracking, but its[CC BY-NC4.0 licence](https://github.com/facebookresearch/co-tracker/blob/main/LICENSE.md) and compute fit need resolving before commercial-tool reuse. Video compression metrics are not combat-quality scores.
