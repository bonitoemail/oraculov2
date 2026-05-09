# Roadmap: O Oraculo

## Milestones

- v1.0 MVP (shipped 2026-03-25)
- v1.1 Real API Integration (Paused -- Phase 6 Supabase deferred)
- v1.2 Voice Flow Stabilization (shipped 2026-03-26)
- v1.3 Voice Capture Debug & Fix (shipped 2026-03-26)
- v2.0 Narração Realista com ElevenLabs v3 (shipped 2026-03-27)
- v3.0 Narrative Redesign — 6 Choices (shipped 2026-03-28)
- v3.1 Script Mastery (shipped 2026-03-28)
- v3.2 Integration & Audio (shipped 2026-03-28)
- v4.0 Game Flow (shipped 2026-03-29)
- v5.0 Tester UI Polish (informally shipped 2026-04-06 — Phase 30 R3F visuals + ad-hoc work; Phases 31-33 dropped/superseded by v6.0)
- v6.0 Deep Branching (shipped 2026-04-08)
- v6.1 Duas Vozes (active)

## Phases

<details>
<summary>v1.0 MVP (Phases 1-3) - SHIPPED 2026-03-25</summary>

- [x] **Phase 1: State Machine & Core Flow** - XState v5 machine with 17 states, 4 branching paths
- [x] **Phase 2: Voice Services & UI** - TTS, STT, NLU services with mock pattern + ambient audio + UI
- [x] **Phase 3: Analytics, Multi-Station & Resilience** - Analytics, admin dashboard, offline fallback, timeouts

</details>

<details>
<summary>v1.1 Real API Integration (Phases 4-6) - PAUSED</summary>

- [x] **Phase 4: API Routes & Configuration** - Server-side API routes for ElevenLabs, Whisper, Claude
- [x] **Phase 5: Real Voice Services** - ElevenLabs TTS, Whisper STT, Claude NLU implementations
- [ ] **Phase 6: Supabase Analytics** - Deferred to post-event

</details>

<details>
<summary>v1.2 Voice Flow Stabilization (Phases 7-9) - SHIPPED 2026-03-26</summary>

- [x] **Phase 7: Voice Architecture Refactor** - useReducer FSM, generic guards, decoupled TTS
- [x] **Phase 8: Flow Sequencing & Mic Lifecycle** - TTS gating, mic activation gating, stream cleanup
- [x] **Phase 9: STT/NLU Pipeline Integration** - Pipeline integration tests, edge case hardening

</details>

<details>
<summary>v1.3 Voice Capture Debug & Fix (Phases 10-11) - SHIPPED 2026-03-26</summary>

- [x] **Phase 10: Pipeline Debug Instrumentation** - Dev debug panel + console logging for pipeline visibility
- [x] **Phase 11: TTS Reliability & Voice Pipeline Fix** - Fix root causes: waitForVoices timeout, MockTTS resolution, mic activation
- ~~Phase 12: Browser End-to-End Validation~~ - Dropped (manual browser testing sufficient)

</details>

<details>
<summary>v2.0 Narração Realista com ElevenLabs v3 (Phase 13) - SHIPPED 2026-03-27</summary>

- [x] **Phase 13: Voice Infrastructure & v3 Migration** - Verify voice IVC, update API to eleven_v3, convert SSML to audio tags
- ~~Phase 14: Script Preparation & Tag Strategy~~ - Absorbed into v3.0 Phase 16
- ~~Phase 15: Audio Generation & Quality Validation~~ - Absorbed into v3.0 Phase 19

</details>

<details>
<summary>v3.0 Narrative Redesign — Structure (Phases 16-17) - SHIPPED 2026-03-28</summary>

- [x] **Phase 16: Script Writing** - First draft PT-BR script with 6 choices, 12 responses, 8 devoluções, inflection tags
- [x] **Phase 17: State Machine & Data** - XState redesign for 6 linear choices (~42 states), pattern tracking, NLU keyword maps

</details>

<details>
<summary>v3.1 Script Mastery (Phases 21-24) - SHIPPED 2026-03-28</summary>

- [x] **Phase 21: Script Audit & Framework Integration** - 3 frameworks + 9 gold phrases audited (2 plans)
- [x] **Phase 22: Core Narrative Rewrite** - 6 choices deepened to depth 4-5 (3 plans)
- [x] **Phase 23: Devoluções & Bookends** - 8 devoluções + bookends + fallbacks/timeouts (2 plans)
- [x] **Phase 24: Rhythm, Inflection & Validation** - Timing optimized to 10.498 min, 60 tests (1 plan)

See: `.planning/milestones/v3.1-ROADMAP.md`

</details>

<details>
<summary>v3.2 Integration & Audio (Phases 18-20) - SHIPPED 2026-03-28</summary>

- [x] **Phase 18: Components & Services** - OracleExperience.tsx, FallbackTTS, useVoiceChoice updates for 6 choice points (completed 2026-03-28)
- [x] **Phase 19: Audio Generation** - 49 MP3s generated with ElevenLabs v3 (completed 2026-03-28)
- [ ] **Phase 20: Testing** - Update all tests for new 6-choice structure (skipped for v4.0 pivot)

</details>

<details>
<summary>v4.0 Game Flow (Phases 25-29) - SHIPPED 2026-03-29</summary>

- [x] **Phase 25: Script Restructure — Pacing** - Trim all segments to 5-7 min target (completed 2026-03-28)
- [x] **Phase 26: Script Restructure — Branching** - Design and write 8-10 decision points with branching paths (completed 2026-03-29)
- [x] **Phase 27: State Machine Redesign** - XState v5 with conditional transitions for branching (completed 2026-03-29)
- [x] **Phase 28: Audio Regeneration** - Generate all MP3s for trimmed/branching script (completed 2026-03-29)
- [x] **Phase 29: Integration & Validation** - Update components/services, verify all tests pass (completed 2026-03-29)

</details>

<details>
<summary>v5.0 Tester UI Polish (Phase 30) - INFORMALLY SHIPPED 2026-04-06</summary>

- [x] **Phase 30: Audio-Reactive Visual System** - R3F custom GLSL shaders, simplex noise displacement, fresnel glow (shipped via direct commits)
- ~~Phase 31: Microphone State Indicators~~ - Dropped/superseded by v6.0 (numbering reused)
- ~~Phase 32: Debug Overlay Redesign~~ - Dropped/superseded by v6.0 (numbering reused)
- ~~Phase 33: UX Polish & Consistency~~ - Dropped/superseded by v6.0 (numbering reused)

**Note:** Subsequent ad-hoc work (ambient audio, voice pipeline 9 fixes, intro delay, roteiro page) shipped without GSD planning. Milestone never formally closed via `/gsd:complete-milestone`.

</details>

<details>
<summary>v6.0 Deep Branching (Phases 31-35) - SHIPPED 2026-04-08</summary>

- [x] **Phase 31: Q1B Branch (Inferno contra-fobico)** - Add "A Porta no Fundo" branch triggered by q1=B && q2=B (completed 2026-04-07)
- [x] **Phase 32: Q5B Branch (Paraiso gap closure)** - Add "O Que Já Não Cabe" branch triggered by q4=A && q5=A (completed 2026-04-07)
- [x] **Phase 33: Q6B + ESPELHO_SILENCIOSO** - Add "O Espelho Extra" branch + new DEVOLUCAO_ESPELHO_SILENCIOSO archetype (completed 2026-04-07)
- [x] **Phase 34: Detectable Archetypes** - Add CONTRA_FOBICO and PORTADOR archetypes leveraging new branch data (completed 2026-04-08)
- [x] **Phase 35: Timing Mitigation + Browser UAT** - Validate 96 path permutations + browser UAT in >=3 paths (completed 2026-04-08)

See: `.planning/milestones/v6.0-ROADMAP.md` for full phase details, success criteria, and requirements traceability.

</details>

### v6.1 Duas Vozes (Active)

- [x] **Phase 36: Dual-Voice Data Layer** - Script key voice classification + env configuration + version context types (completed 2026-05-09)
- [ ] **Phase 37: Dual-Voice Service Layer** - TTS/FallbackTTS dual-voice support + API route voice ID routing
- [ ] **Phase 38: Version Selector & UI Integration** - Home page V1/V2 selector + OracleExperience version-aware audio routing
- [ ] **Phase 39: Audio Generation & Polish** - Generate V2 narrative MP3s + fix "faça" in ENCERRAMENTO (both versions)

## Phase Details

### Phase 36: Dual-Voice Data Layer
**Goal**: Establish voice classification metadata and configuration foundation for V2 dual-voice system
**Depends on**: Phase 35 (v6.0 complete)
**Requirements**: VOZ-01, VOZ-02, VER-02
**Success Criteria** (what must be TRUE):
  1. Every SCRIPT key has voice classification metadata (VOZ_PERGUNTA or VOZ_NARRATIVA)
  2. New env var ELEVENLABS_VOICE_ID_V2 exists and configures somber voice for V2
  3. Version context (V1 vs V2) can be passed through the component tree and persists during session
  4. Voice classification metadata is queryable by audio services to determine which voice ID to use
**Plans:** 2 plans

Plans:
- [x] 36-01-PLAN.md — VoiceType + getVoiceType() + getVoiceId() with TDD + ELEVENLABS_VOICE_ID_V2 env var
- [x] 36-02-PLAN.md — VersionContext provider + hook + page.tsx wiring

### Phase 37: Dual-Voice Service Layer
**Goal**: Audio services route to correct voice based on version and segment type
**Depends on**: Phase 36
**Requirements**: VOZ-03, VOZ-04, VOZ-05
**Success Criteria** (what must be TRUE):
  1. API route /api/tts accepts voice ID parameter and routes to correct ElevenLabs voice
  2. FallbackTTS in V2 loads narrative MP3s from public/audio/prerecorded/v2/ directory
  3. FallbackTTS in V2 loads question MP3s from public/audio/prerecorded/ (original location)
  4. In V2, narrative segments use Voice 2 (somber) and question segments use Voice 1 (current Oracle voice)
  5. In V1, all segments continue using Voice 1 exactly as today (zero regression)
**Plans**: TBD

### Phase 38: Version Selector & UI Integration
**Goal**: Users can choose V1 or V2 at start and experience version-specific audio routing
**Depends on**: Phase 37
**Requirements**: VER-01, VER-03
**Success Criteria** (what must be TRUE):
  1. Home page displays version selector (V1/V2) before Start button
  2. Visitor or operator can choose version and selection persists through entire session
  3. OracleExperience component receives version context and routes audio requests accordingly
  4. V1 experience plays exactly as it does today with zero changes to audio, timing, or behavior
  5. V2 experience plays with dual voices (questions in Voice 1, narrative in Voice 2)
**Plans**: TBD
**UI hint**: yes

### Phase 39: Audio Generation & Polish
**Goal**: All V2 narrative MP3s generated with somber voice plus "faça" fix applied to both versions
**Depends on**: Phase 36 (voice classification metadata exists)
**Requirements**: AUD-01, AUD-02, AUD-03
**Success Criteria** (what must be TRUE):
  1. Script generation tool (generate-audio-v3.ts) supports dual-voice mode with voice ID per segment type
  2. All narrative segments have MP3s generated with somber voice in public/audio/prerecorded/v2/
  3. ENCERRAMENTO script key updated from "faz" to "faça" and MP3 regenerated for both V1 and V2
  4. Total MP3 count increases to accommodate V2 narrative files (approximately 82 V1 files + ~50 V2 narrative files)
  5. FallbackTTS coverage verified for both versions with correct directory paths
**Plans**: TBD

---

## Historical Phase Details

### Phase 18: Components & Services (v3.2) - COMPLETE
**Goal**: All UI components and services updated for 6-choice flow
**Depends on**: Phase 24 (script must be final)
**Requirements**: CMPV3-01, CMPV3-02, CMPV3-03
**Plans:** 2/2 plans complete

Plans:
- [x] 18-01-PLAN.md — FallbackTTS PRERECORDED_URLS dynamic derivation from SCRIPT keys
- [x] 18-02-PLAN.md — OracleExperience v3 state mapping, ChoiceConfigs, UI wiring

**Success Criteria**:
  1. OracleExperience handles all ~42 states
  2. FallbackTTS PRERECORDED_URLS updated for ~50 audio keys
  3. 6 ChoiceConfig objects with per-question NLU context

### Phase 19: Audio Generation (v3.2) - COMPLETE
**Goal**: Generate all MP3s for final script using ElevenLabs v3
**Depends on**: Phase 24 (script text final), Phase 18 (PRERECORDED_URLS)
**Requirements**: AUDV3-01, AUDV3-02
**Voice ID**: PznTnBc8X6pvixs9UkQm (confirmed by user)
**Results**: 49 MP3s, 27 MB total, mp3_44100_192 format
**Script**: scripts/generate-audio-v3.ts (imports from src/data/script.ts directly)
**Success Criteria**:
  1. 49 MP3s generated with eleven_v3 and inflection tags
  2. 192kbps format (mp3_44100_192), consistent voice

### Phase 20: Testing (v3.2) - SKIPPED
**Goal**: All tests updated and passing for v3 structure
**Depends on**: Phase 18 (all code changes complete)
**Requirements**: TSTV3-01, TSTV3-02, TSTV3-03
**Status**: Skipped for v4.0 pivot — testing will be done in Phase 29
**Success Criteria**:
  1. Machine tests cover all 6 choices, pattern tracking, devolução routing
  2. Component tests verify script key mapping
  3. All tests pass (no regressions)

### Phase 25: Script Restructure — Pacing (v4.0)
**Goal**: Experience runs 5-7 minutes with trimmed segments preserving psychoanalytic depth
**Depends on**: Phase 24 (v3.1 script as baseline)
**Requirements**: PACE-01, PACE-02, PACE-03, PACE-04, PACE-05
**Plans:** 2/2 plans complete

Plans:
- [x] 25-01-PLAN.md — Surgical trim of all script sections (bookends, intros, setups, respostas, devoluções)
- [x] 25-02-PLAN.md — Timing validation script + duration adjustment to hit 5-7 min target

**Success Criteria** (what must be TRUE):
  1. Max-path experience duration is 5-7 minutes when audio is generated
  2. All respostas contain 1-2 segments maximum (down from 4-5)
  3. All setups contain 1 segment maximum (down from 3-5)
  4. Phase intros reduced to 1 sentence each
  5. Bookends trimmed while preserving emotional impact and structural symmetry

### Phase 26: Script Restructure — Branching (v4.0)
**Goal**: Experience offers 8-10 decision points with branching paths that converge before devoluções
**Depends on**: Phase 25 (trimmed script as foundation)
**Requirements**: BRNC-01, BRNC-02, BRNC-03, BRNC-04
**Plans:** 2/2 plans complete

Plans:
- [x] 26-01-PLAN.md — Type contracts (ChoicePattern variable-length, QUESTION_META 7-8) + branch script content (Q2B, Q4B)
- [x] 26-02-PLAN.md — Percentage-based pattern matching + branch-aware timing validation

**Success Criteria** (what must be TRUE):
  1. Experience has 8-10 total decision points (up from 6)
  2. At least 2 branching points where choice A leads to different scenario than choice B
  3. All branch paths converge before devoluções (no orphaned endings)
  4. Branch-specific content maintains depth 4-5 psychoanalytic quality
  5. NLU keyword maps updated for all new decision points
**UI hint**: yes

### Phase 27: State Machine Redesign (v4.0)
**Goal**: XState machine handles conditional branching transitions and variable-length choice paths
**Depends on**: Phase 26 (branching structure finalized)
**Requirements**: MACH-01, MACH-02, MACH-03
**Plans:** 2/2 plans complete

Plans:
- [x] 27-01-PLAN.md — OracleContextV4 types + machine rewrite with Q2B/Q4B branch states and guards
- [x] 27-02-PLAN.md — Comprehensive branching tests (all 4 path permutations, devolucao routing)

**Success Criteria** (what must be TRUE):
  1. XState machine uses conditional transitions (guards) to route based on previous choices
  2. Pattern tracking context updated to handle variable-length paths (6-10 choices)
  3. Devoluçao routing function works for all possible branch combinations
  4. Machine tests cover all branching scenarios and pattern variations

### Phase 28: Audio Regeneration (v4.0)
**Goal**: All MP3s regenerated for trimmed/branching script with consistent voice quality
**Depends on**: Phase 27 (final script keys known)
**Requirements**: AUDI-01, AUDI-02
**Plans:** 1/1 plans complete

Plans:
- [x] 28-01-PLAN.md — Verify generation script, generate 61 MP3s via ElevenLabs v3, validate FallbackTTS coverage

**Success Criteria** (what must be TRUE):
  1. All MP3s regenerated using ElevenLabs v3 (voice ID PznTnBc8X6pvixs9UkQm)
  2. FallbackTTS PRERECORDED_URLS updated to match new script keys
  3. Audio format consistent (mp3_44100_192, 192kbps)
  4. Total audio size reasonable for browser loading

### Phase 29: Integration & Validation (v4.0) - COMPLETE
**Goal**: All components updated for branching flow with passing tests
**Depends on**: Phase 28 (audio files ready)
**Requirements**: INTG-01, INTG-02
**Plans:** 2/2 plans complete

Plans:
- [x] 29-01-PLAN.md — OracleExperience Q2B/Q4B branching integration (8 AGUARDANDO states, script keys, fallbacks)
- [x] 29-02-PLAN.md — Test suite alignment for v4 structure (18 new Q2B/Q4B tests, update existing)

**Success Criteria** (what must be TRUE):
  1. OracleExperience component handles conditional branching UI states
  2. useVoiceChoice hook updated for variable-length choice sequences
  3. All machine tests pass (branching transitions, pattern tracking, devolução routing)
  4. All component tests pass (script key mapping, UI state rendering)
  5. Manual browser verification confirms 5-7 min experience with branching
**UI hint**: yes

### Phase 30: Audio-Reactive Visual System
**Goal**: Full-screen audio-reactive background that responds to TTS playback intensity with phase-specific visual themes
**Depends on**: Phase 29 (v4.0 complete)
**Requirements**: VIS-01, VIS-02, VIS-03, VIS-04
**Plans:** 1/2 plans executed

Plans:
- [x] 30-01-PLAN.md — Test infra (vitest-canvas-mock), VISUAL_THEMES config, useAudioAnalyser + useAnimationFrame hooks
- [ ] 30-02-PLAN.md — EqualizerVisualizer, IdleAnimation, AudioReactiveBackground components + OracleExperience integration

**Success Criteria** (what must be TRUE):
  1. Visitor sees real-time visual response to Oracle voice intensity (equalizer bars or particle system)
  2. Background visual style changes automatically when narrative phase transitions (Inferno red/fire, Purgatorio blue/mist, Paraiso gold/light)
  3. Visual transitions between phases crossfade smoothly matching the 3-second audio crossfade
  4. Idle state displays subtle ambient animation instead of static black screen
  5. Canvas animation performs smoothly at 60fps on target event hardware
**UI hint**: yes

### Phase 31: Q1B Branch (Inferno contra-fobico)
**Goal**: Add "A Porta no Fundo" branch — triggered when q1=B && q2=B (contra-fobico/destemido profile), tests courage against emptiness. Adds 6 SCRIPT keys, QUESTION_META[9], shouldBranchQ1B guard, 6 machine states, OracleExperience helper extensions, 6 MP3s, timing validation update, and roteiro.html documentation.
**Depends on**: v4.0 Phase 29 baseline
**Requirements**: BR-01, POL-02
**Plans:** 3/3 plans complete

Plans:
- [x] 31-01-PLAN.md — Data + Types: script.ts entries, QUESTION_META[9], QuestionId union extension (Wave 1)
- [x] 31-02-PLAN.md — Machine + UI: shouldBranchQ1B guard, Q1B states, OracleExperience helpers (Wave 2, depends on 31-01)
- [x] 31-03-PLAN.md — Audio + Validation + Docs: 6 MP3s, validate-timing.ts permutations, roteiro.html updates (Wave 3, depends on 31-01 and 31-02)

**UI hint**: no

### Phase 32: Q5B Branch (Paraiso gap closure)
**Goal**: Add "O Que Já Não Cabe" branch — triggered when q4=A && q5=A (PORTADOR profile precursor), addresses the gap that no Paraíso branch exists despite Inferno (Q2B) and Purgatorio (Q4B) having one each. Adds 6 SCRIPT keys, QUESTION_META[10], shouldBranchQ5B guard, 6 machine states with sibling-state rejoin to Q6_SETUP, OracleExperience helper extensions, 6 MP3s, timing validation expansion to 12 paths, and roteiro.html documentation. Mirrors Phase 31 (Q1B) structure with two key differences: (1) sibling-state rejoin pattern (no #oracle. prefix because Q5B and Q6_SETUP both live inside PARAISO compound state), (2) Q5B is COEXISTENT with Q4B (both fire when q3=A, q4=A, q5=A — not mutually exclusive). PORTADOR archetype detection deliberately deferred to Phase 34 to honor POL-02 invariant (patternMatching.ts byte-identical).
**Depends on**: Phase 31
**Requirements**: BR-02
**Plans:** 3/3 plans complete

Plans:
- [x] 32-01-PLAN.md — Data + Types: script.ts entries, QUESTION_META[10], POL-02 verification (Wave 1)
- [x] 32-02-PLAN.md — Machine + UI: shouldBranchQ5B guard, 6 Q5B states with sibling rejoin, OracleExperience helpers + Q4B/Q5B coexistence tests (Wave 2, depends on 32-01)
- [x] 32-03-PLAN.md — Audio + Validation + Docs: 6 MP3s, validate-timing.ts 12-path matrix, roteiro.html updates (Wave 3, depends on 32-01 and 32-02)

**UI hint**: no

### Phase 33: Q6B + ESPELHO_SILENCIOSO
**Goal**: Add "O Espelho Extra" branch — triggered when q5=B && q6=A (visitor dissolveu a pergunta MAS pediu leitura) — plus the new DEVOLUCAO_ESPELHO_SILENCIOSO archetype that returns open structure instead of closed diagnosis. Adds 6 Q6B SCRIPT keys + 1 DEVOLUCAO_ESPELHO_SILENCIOSO SCRIPT key (6 segments in 1 MP3), QUESTION_META[11], shouldBranchQ6B guard + isEspelhoSilencioso guard (both in oracleMachine.ts setup.guards, NOT in patternMatching.ts — POL-02 invariant), 6 new Q6B machine states with QUALIFIED `#oracle.DEVOLUCAO` rejoin (different from Phase 32's sibling pattern because DEVOLUCAO lives at machine root), DEVOLUCAO.always[0] insertion (HIGHEST priority — ahead of all 8 existing archetypes), new top-level DEVOLUCAO_ESPELHO_SILENCIOSO state, OracleExperience Q6B_CHOICE + 6 helper extensions (including isPergunta mic warmup fix), 7 MP3s generated via generate-audio-v3.ts auto-discovery, validate-timing.ts expansion from 12 → 20 paths with hasQ6B/hasEspelhoSilencioso flags and pickLongestDevolucao update, and public/roteiro.html updates (Mermaid Q6B branch + ESPELHO archetype + ramificações count 3).
**Depends on**: Phase 32
**Requirements**: BR-03, AR-01
**Plans:** 3/3 plans complete

Plans:
- [x] 33-01-PLAN.md — Data + Types: 6 Q6B SCRIPT keys + DEVOLUCAO_ESPELHO_SILENCIOSO (6 segments), QUESTION_META[11], POL-02 verification (Wave 1)
- [x] 33-02-PLAN.md — Machine + UI: shouldBranchQ6B + isEspelhoSilencioso guards, Q6_RESPOSTA_A guarded transition, 6 Q6B states with QUALIFIED #oracle.DEVOLUCAO rejoin, DEVOLUCAO.always[0] = ESPELHO_SILENCIOSO (highest priority), new top-level DEVOLUCAO_ESPELHO_SILENCIOSO state, Q6B_CHOICE + 6 OracleExperience helper extensions with mic warmup fix (Wave 2, depends on 33-01)
- [x] 33-03-PLAN.md — Audio + Timing + Roteiro: 7 new MP3s via generate-audio-v3.ts auto-discovery, validate-timing.ts 20-path matrix with Q6B + ESPELHO coverage, pickLongestDevolucao update, public/roteiro.html Mermaid + indicator + devoluções list update (Wave 3, depends on 33-01 and 33-02)

**UI hint**: no

### Phase 34: Detectable Archetypes (CONTRA_FOBICO + PORTADOR)
**Goal**: Add 2 new detectable archetypes leveraging new branch choice data. Guard priority: ESPELHO_SILENCIOSO → CONTRA_FOBICO → PORTADOR → 8 existing.
**Depends on**: Phase 33
**Requirements**: AR-02, AR-03
**Plans:** 3/3 plans complete

Plans:
- [x] 34-01-PLAN.md — Data + Types: DevolucaoArchetype union extension (+ ESPELHO_SILENCIOSO backfill) + DEVOLUCAO_CONTRA_FOBICO and DEVOLUCAO_PORTADOR SCRIPT keys with drafted segment text (Wave 1)
- [x] 34-02-PLAN.md — Guards + Machine + UI + Tests: isContraFobico/isPortador guards, oracleMachine setup.guards + DEVOLUCAO.always insertion + 2 new top-level states, OracleExperience getScriptKey extensions, TDD across 3 suites (Wave 2, depends on 34-01)
- [x] 34-03-PLAN.md — Audio + Timing + Roteiro: generate 2 MP3s via ElevenLabs v3, extend validate-timing.ts (24 paths, trigger-aware pickLongestDevolucao), fix fallback-tts SCRIPT count (80→82), update roteiro.html with 2 new cards + 11-archetype priority list (Wave 3, depends on 34-02)

**UI hint**: no

### Phase 35: Timing Mitigation + Browser UAT
**Goal**: Validate timing across 24 path permutations, mitigate overflow if needed, browser UAT in >=3 representative paths, update roteiro.html and CLAUDE.md.
**Depends on**: Phase 34
**Requirements**: POL-01, POL-03, UAT-01
**Plans:** 3/3 plans complete

Plans:
- [x] 35-01-PLAN.md — Timing validation across 24 paths + overflow mitigation if max-path > 7:30
- [x] 35-02-PLAN.md — Browser UAT across >=3 representative paths (short, long, branch-heavy)
- [x] 35-03-PLAN.md — Update roteiro.html timing table + CLAUDE.md status documentation

**UI hint**: no

## Progress

| Phase | Milestone | Plans Complete | Status | Completed |
|-------|-----------|----------------|--------|-----------|
| 18. Components & Services | v3.2 | 2/2 | Complete    | 2026-03-28 |
| 19. Audio Generation | v3.2 | 1/1 | Complete | 2026-03-28 |
| 20. Testing | v3.2 | - | Skipped | - |
| 25. Script Pacing | v4.0 | 2/2 | Complete    | 2026-03-28 |
| 26. Script Branching | v4.0 | 2/2 | Complete    | 2026-03-29 |
| 27. State Machine | v4.0 | 2/2 | Complete    | 2026-03-29 |
| 28. Audio Regen | v4.0 | 1/1 | Complete    | 2026-03-29 |
| 29. Integration | v4.0 | 2/2 | Complete    | 2026-03-29 |
| 30. Visual System | v5.0 | 1/2 | Informally Shipped | 2026-04-06 |
| 31. Q1B Branch | v6.0 | 3/3 | Complete    | 2026-04-07 |
| 32. Q5B Branch | v6.0 | 3/3 | Complete    | 2026-04-07 |
| 33. Q6B + ESPELHO_SILENCIOSO | v6.0 | 3/3 | Complete    | 2026-04-07 |
| 34. Detectable Archetypes | v6.0 | 3/3 | Complete    | 2026-04-08 |
| 35. Timing + UAT | v6.0 | 3/3 | Complete    | 2026-04-08 |
| 36. Dual-Voice Data Layer | v6.1 | 2/2 | Complete    | 2026-05-09 |
| 37. Dual-Voice Service Layer | v6.1 | 0/TBD | Not started | - |
| 38. Version Selector & UI Integration | v6.1 | 0/TBD | Not started | - |
| 39. Audio Generation & Polish | v6.1 | 0/TBD | Not started | - |

## Dependencies

```
v6.0 Deep Branching (shipped):
  Phase 35: Timing + UAT (DONE)
                |
v6.1 Duas Vozes (active):
  Phase 36: Dual-Voice Data Layer -> Phase 37: Dual-Voice Service Layer -> Phase 38: Version Selector & UI -> Phase 39: Audio Generation & Polish
```

---

*Last updated: 2026-05-09 -- Phase 36 complete (Plan 36-02: VersionContext + page.tsx wiring)*
