# Combat learning handoff — 6 October 2026

**Purpose: improve Frankendom's player experience, not sell a winning bot.** These100 points combine findings, observations, proposals and remaining unknowns; they are not100 confirmed game bugs.

Snapshot:54 real browser fights across today's separate studies, plus five fixture replay captures and one retained pre-fight loading failure. Includes the latest Executioner641 pair. Frozen game6fb21b3437a6e794e47dc5a91141b67df7d69162; latest tested bot7009a205f58ebd6ffa966a5da7e71e97febcebd0.131/131 tests pass. Later live visuals and full candidate roster acceptance remain unassessed. No game code, balance or deployment changed.

Key: **M** measured; **V** sampled visual observation; **C** source-code fact; **P** proposed test/change; **U** unproven. Sources: **R** [initial rendered/visual study](live-retest-20261006.md); **D** [pressure/defence study](pressure-unseen-20261006.md); **N** [native AV and move study](native-live-20261006.md); **I** [input/state study](input-action-20261006.md); **G** frozen game code listed below.

1. **M:** Winning can hide poor exchanges: ten advanced wins still contained17 stagger-interrupted attacks. (D)
2. **P:** Make unavailable input, missed attack and interrupted attack recognisably different experiences. (I)
3. **P:** Teach defence followed by a useful punish in the first practice exchange. (D,I)
4. **P:** Make wounded stamina capacity understandable alongside current stamina. (D,I)
5. **P:** Review when hurt/recovery prevents action; test whether the normal HUD communicates that state. (I)
6. **P:** Preserve commitment costs; interruptions do not justify universally faster attacks. (D,N)
7. **C:** A plain charged-heavy guard-break explanation already exists; verify its visibility before adding duplicate UI. (G)
8. **P:** Improve charge anticipation through motion and sound before adding warning banners. (R,N)
9. **P:** Review weapon visibility before increasing reach to compensate for unsuccessful attacks. (R,N)
10. **P:** Keep Easy unchanged until targeted evidence supports a difficulty adjustment. (D,N)
11. **M:** Advanced Veteran639 converted parries into30-damage hits in0.600s and0.633s. (I)
12. **M:** Native Executioner633 converted an ordinary block into a17-damage thrust in0.533s. (N)
13. **M:** Pitborn634 retry produced four parries and two blocks; useful follow-through still varied. (N)
14. **M:** Later Pitborn634 parries reached useful damage in0.417–0.800s. (N)
15. **M:** Its first parry earned no immediate attack; the next useful hit was about4.12s later. (N)
16. **M:** One Executioner perfect block reached useful damage0.533s later. (N)
17. **M:** Latest Executioner641 chip block preceded useful damage by4.433s, with48 damage received first. (I)
18. **M:** Initial advanced Executioner parry→roll→next-hit took1.783s. (R)
19. **M:** Beginner640 parry→roll→next-hit took2.533s, with no intervening damage. (I)
20. **P:** Teach both defence rewards: immediate damage and a safer positional reset. (D,I)
21. **M:** Beginner640 rolled despite no attack being in flight; avoid crediting it as an attack dodge. (I)
22. **M:** That roll increased sampled separation to3.3m. (I)
23. **P:** Teach where a roll should finish, not only when to press it. (R,D,I)
24. **P:** Compare attack readiness after defence with the next enemy threat. (D)
25. **P:** Measure damage received before the next useful hit, alongside successful-defence counts. (D)
26. **P:** Review whether parry animations clearly expose the earned opening. (R,N)
27. **P:** Distinguish ordinary block, perfect block and parry through recognisable feedback. (G,N)
28. **C:** The event line already reports block stamina cost and chip damage; review actual HUD legibility. (G)
29. **M:** Beginner603 reached82HP versus19 enemyHP while its stamina was zero. (D)
30. **M:** Its wounded stamina ceiling later fell76→44; the bot kept acting, so no new recovery deadlock was established. (D)
31. **M:** The opponent survived on5HP, blocked later attacks and eventually won. (D)
32. **P:** Teach finishing an opponent without abandoning resource and spacing discipline. (D)
33. **M:** Veteran's tested arena radius was3.787; Goblin/Executioner were8.55. (R)
34. **U:** These cases do not isolate whether smaller arena size caused the Veteran losses. (R)
35. **M:** Initial beginner Veteran spent8.27s near the boundary; advanced spent none. (R)
36. **M:** Another intermediate won after17.5s near the boundary; a beginner lost after12.4s. (D)
37. **P:** Judge boundary pressure with health, resources and decisions, not boundary duration alone. (D)
38. **M:** The initial nine and19-fight pressure studies had no wall lashes. (R,D)
39. **U:** Those batches therefore do not validate wall-warning readability. (D)
40. **P:** Select deliberate boundary-threat clips before proposing stronger warnings. (D)
41. **M:** Initial beginner Executioner needed37 attack starts and72.22s, including ten empty swings. (R)
42. **M:** Advanced Executioner needed11 starts and20.53s with zero empty swings in that fixture. (R)
43. **M:** Native beginner638 had nine recorded misses; beginner640 had ten. (I)
44. **P:** Review distance and commitment at attack start and contact before altering weapon reach. (N,I)
45. **M:** Two kick-probe attacks were accepted; neither landed. (N)
46. **M:** One kick missed and one was stagger-interrupted. (N)
47. **P:** Improve the kick experiment's opportunity/range selection before judging kick strength. (N)
48. **M:** All three short-step probes were hit by Executioner's heavy. (N)
49. **M:** They started around0.85m, against nominal2.3m scythe reach. (N)
50. **C:** Backstep is positional footwork with nominal0.6m travel and no invulnerability. (G,N)
51. **C:** Roll has an authored safe interval; it is mechanically different from a short step. (G)
52. **P:** Test short steps where movement can clear reach; do not add immunity to rescue point-blank probes. (N)
53. **M:** Feint seed621 took36 damage versus110 baseline. (N)
54. **M:** Feint seed624 took135 damage versus69 baseline. (N)
55. **M:** Seed625 never executed a feint, so it cannot establish a feint effect. (N)
56. **P:** Measure feint→opponent reaction→opening→useful hit, rather than feint count alone. (N)
57. **P:** Do not rotate moves randomly just to make the bot look varied. (N)
58. **P:** Do not inflate the attack denominator with intentional empty swings to satisfy the heavy cap. (N,I)
59. **P:** Keep varied-player testing separate from intentional exploit/spam probes. (N)
60. **P:** Evaluate movement by the opportunities it creates, not metres travelled alone. (D,N)
61. **V:** One Goblin head-hit frame shows opaque saturated red covering the face. (R)
62. **P:** Review head-burst shape, opacity and duration at normal speed before changing all blood. (R)
63. **V:** Executioner's torso burst left its hood/face visible in the inspected high/off frames. (R)
64. **P:** Treat head and torso effects as separate visual review cases. (R)
65. **V:** Weapon shaft/body overlap remained present with effects high and off. (R)
66. **P:** Review framing and weapon silhouette separately from blood volume. (R,N)
67. **V:** Native Veteran contact133 showed shield/body overlap around a short weapon. (N)
68. **P:** Check pre-contact blade visibility, contact confirmation and the next readable tell in one sequence. (R,N)
69. **M:** Sampled roll829 peaked around7.27° horizon tilt. (R)
70. **M:** Its sampled horizon returned within1° after roughly0.45–0.47 simulated seconds. (R)
71. **M:** High/low/off barely changed this existing roll tilt. (R)
72. **U:** Horizon settling does not prove comfort, enemy reacquisition or lack of nausea. (R)
73. **P:** Measure when the opponent's blade becomes readable again after rolling. (R,N)
74. **C:** The camera code authors different contact shoves for hits, blocks, parries and guard breaks. (G)
75. **P:** Verify those distinctions survive the actual combat framing and effects. (G,N)
76. **M:** Red coverage measured7.619% high versus8.380% off despite the visible added burst. (R)
77. **U:** That failed colour proxy cannot score blood, visibility or combat readability. (R)
78. **P:** Use clean pre-contact visual review before buying/building a large vision stack. (R,I)
79. **P:** Compare camera views using identical inputs; review weapons, bodies and boundary visibility separately. (R)
80. **U:** Later live arena/background changes were outside the frozen study. (R)
81. **M:** Headless Mac Metal can capture real keyboard fighting with video and game audio together. (N)
82. **M:** The native path uses actual game/WebAudio clocks, not an engine replay or controlled clock. (N)
83. **M:** Zero-gain speaker routing keeps native recording quiet without muting the captured game bus. (N)
84. **M:** Metadata confirms VP9 video plus a48kHz Opus audio stream in inspected native files. (N)
85. **U:** Non-silent samples do not establish sound quality, cue recognition or perceptual synchronization. (R,N)
86. **M:** Event-local audio analysis covers200ms before/after contact; overlapping sounds remain in the mix. (R)
87. **M:** Executioner641 advanced won on6HP; three chip blocks did not earn immediate damaging follow-ups. (I)
88. **P:** Review charge, block, parry and injury cues against impact timestamps and crowded mixes. (N,I)
89. **M:** Recorded Charging events can represent light attacks; they are not automatically charged-heavy cues. (R,N)
90. **M:** Executioner641 captured genuine enemy-heavy Charging1027 and real `charge_foe`; recognition remains unproven. (I)
91. **M:** Controlled Veteran631 took25 damage; native631 took74 from the same initial seed/kit. (N)
92. **U:** Different trajectories/timing prevent attributing that difference solely to the clock. (N)
93. **M:** Input tracking separates trusted browser key receipt, candidate action acceptance and recorded result. (I)
94. **M:** Accepted Veteran637 thrust931 was interrupted940; slash566 missed593. (I)
95. **M:** Beginner638/639/640 each had an unmatched guard/parry attempt near a sampled hurt state. (I)
96. **M:** Hurt-state unmatched commands also occurred at42.73/52/77 stamina; low stamina alone is insufficient explanation. (I)
97. **M:** Bot7009 automatically saves preceding own-state context and sample age;131/131 tests pass. (I)
98. **M:** A beginner641 parry key arrived beside a dead/0HP sample: investigate bot lifecycle timing, not game controls. (I)
99. **U:** Native AV omits DOM HUD; actual audio capture is not AI hearing, and synthetic profiles are not calibrated humans. (I,N)
100. **P:** Prioritise action-state clarity, defence rewards, spacing and weapon visibility; retest unchanged scenarios after game-team fixes. (R,D,N,I)

## Files for the game developer

- Reports: [visual/rendered](live-retest-20261006.md), [pressure/defence](pressure-unseen-20261006.md), [native/move probes](native-live-20261006.md), [input/context](input-action-20261006.md).
- Evidence: [initial raw recount](evidence/live-retest-20261006/fight-recount.json), [profile matrix](evidence/pressure-unseen-20261006/profile-matrix.json), [move audit](evidence/native-live-20261006/move-audit.json), [input/context receipts](evidence/input-action-20261006/).
- Bot implementation: [combat analysis](../scripts/lib/combat-learning.mjs), [input/state tracking](../scripts/lib/input-action-metrics.mjs), [native AV capture](../scripts/lib/live-av.mjs), [actual audio/render hooks](../scripts/lib/audio-review.mjs), [visual/audio measurements](../scripts/lib/player-senses-metrics.mjs), [input regressions](../tests/input-action-metrics.test.mjs).
- Frozen game code (read-only references): [input handling](https://github.com/DomLynch/RPG-game/blob/6fb21b3437a6e794e47dc5a91141b67df7d69162/src/input.ts), [fighter/action rules](https://github.com/DomLynch/RPG-game/blob/6fb21b3437a6e794e47dc5a91141b67df7d69162/src/duel.ts), [move definitions](https://github.com/DomLynch/RPG-game/blob/6fb21b3437a6e794e47dc5a91141b67df7d69162/src/moves.ts), [combat feedback words](https://github.com/DomLynch/RPG-game/blob/6fb21b3437a6e794e47dc5a91141b67df7d69162/src/combat.ts), [camera contact shoves](https://github.com/DomLynch/RPG-game/blob/6fb21b3437a6e794e47dc5a91141b67df7d69162/src/camera-kick.ts), [effects](https://github.com/DomLynch/RPG-game/blob/6fb21b3437a6e794e47dc5a91141b67df7d69162/src/armfeel-fx.ts), [audio](https://github.com/DomLynch/RPG-game/blob/6fb21b3437a6e794e47dc5a91141b67df7d69162/src/audio/armfeel-sound.ts).

## Fresh full-fight video/audio on this Mac

- [Advanced Veteran639: parry follow-through](/Users/domininclynch/Developer/frankendom-test-bot-launcher-20261005/artifacts/combat/native-live-20261006/veteran-input-advanced-639/veteran-2026100639-av/fight-av.webm).
- [Beginner Veteran640: misses, unused opening and hurt-state context](/Users/domininclynch/Developer/frankendom-test-bot-launcher-20261005/artifacts/combat/native-live-20261006/veteran-context-beginner-640/veteran-2026100640-av/fight-av.webm).
- [Native Executioner633: ordinary block→thrust](/Users/domininclynch/Developer/frankendom-test-bot-launcher-20261005/artifacts/combat/native-live-20261006/executioner-633/executioner-2026100633-av/fight-av.webm).
- [Native Executioner641: real enemy charge, roll and costly chip-block follow-through](/Users/domininclynch/Developer/frankendom-test-bot-launcher-20261005/artifacts/combat/native-live-20261006/executioner-context-advanced-641/executioner-2026100641-av/fight-av.webm).
- [Goblin head-hit frame](evidence/live-retest-20261006/goblin-finishing-hit.png), [Executioner torso/contact frame](evidence/live-retest-20261006/senses-high-impact-contact-0-1025.jpg).

Useful review ticks: Veteran639 parries457/912, hits493/950. Veteran640 parry1364, roll1382, next hit1516; unmatched Q at browserperformance34046.7ms with prior sampletick1641. Executioner633 ordinary block389, thrust405, hit421. Ticks are game-time indices; they are not seconds into native video. Use matching `audio.json` frame timestamps to align video, subtracting recording begin time. Losses and raw JSON are retained beside each clip. Local file links require this Mac; share media separately for a remote developer.

Executioner641 review ticks: enemy-heavy charge1027, roll1061, enemy miss1085, useful thrust1192; chip block1759, next useful hit2025. Unmatched/dead-state requests are measurement exclusions for player-control claims, not ordinary game failures. Neither sampled associations nor pre-key snapshots establish exact refusal causes or physical latency.

Next tests: valid level-special bands; adjacent difficulty levels; actual weapon ranges; unseen seeds and imperfect personas. No claim that today's L6/longsword/no-special pilot covers the level50 progression, all weapons or special moves. The UI46-versus-intended50 mapping remains a game-team issue to verify. Keep ordinary profiles, exploit probes, replay captures and native/controlled timing separate. Root builds tooling; Bot Combat operates it; Claude/game team decides and implements game proposals.
