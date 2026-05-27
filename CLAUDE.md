# O Oraculo — Developer Guide

## What This Is

Interactive voice art installation for the VII Bienal de Psicanalise e Cultura (SBPRP 2026, May 29-30). A visitor puts on headphones, the Oracle guides them through a Dante-inspired journey (Inferno → Purgatorio → Paraiso) with up to 11 max decisions (6 base + 5 conditional branches) in 5-7 minutes, then delivers a personalized devolucao based on their choice pattern.

**Status:** v6.1 in progress. Start screen redesigned with logo + ambient effects. V1 only (VersionSelector removed from flow). Pending: V2 audio generation (Phase 39-02) + browser UAT + event deploy.

## Stack

- **Next.js 15** App Router (API routes as server-side proxies)
- **React 19** (client-side only, `'use client'` everywhere)
- **XState v5** state machine (~78 states, 11 decision points, 5 conditional branches)
- **Tailwind CSS v4** (dark theme, minimal UI — voice is primary)
- **Vitest** + Testing Library (~750 tests, 733 passing baseline)
- **TypeScript 5.7** strict mode, `@/` path alias

## Architecture

### State Machine (single source of truth)

```
IDLE → APRESENTACAO → INFERNO → [Q1B|Q2B] → PURGATORIO → [Q4B] → PARAISO → [Q5B|Q6B] → DEVOLUCAO → ENCERRAMENTO → FIM
```

- **6 base questions** (Q1-Q6) + **5 conditional branches** (Q1B, Q2B, Q4B, Q5B, Q6B) = up to 11 max decisions
- Q1B triggers when Q1=B AND Q2=B (contra-fobico profile in Inferno)
- Q2B triggers when Q1=A AND Q2=A (both cautious choices in Inferno)
- Q4B triggers when Q3=A AND Q4=A (both engaged choices in Purgatorio)
- Q5B triggers when Q4=A AND Q5=A (PORTADOR profile in Paraiso)
- Q6B triggers when Q5=B AND Q6=A (dissolved question + open to be seen)
- 11 devolucao archetypes: 8 baseline (SEEKER, GUARDIAN, CONTRADICTED, PIVOT_EARLY, PIVOT_LATE, DEPTH_SEEKER, SURFACE_KEEPER, MIRROR) + ESPELHO_SILENCIOSO (Q6B=B) + CONTRA_FOBICO (Q1B=A) + PORTADOR (Q5B=A)
- Pattern matching uses percentage-based thresholds on variable-length ChoicePattern (6-9 choices)

**Files:** `src/machines/oracleMachine.ts` (machine), `src/machines/oracleMachine.types.ts` (types + context)

### Service Pattern (interface + factory + mock)

Every external service follows: `index.ts` (interface + factory) → `mock.ts` → `{provider}.ts`

| Service | Real Provider | Factory | Toggle |
|---------|--------------|---------|--------|
| TTS | ElevenLabs v3 + FallbackTTS (82 MP3s) | `createTTSService()` | `NEXT_PUBLIC_USE_REAL_APIS` |
| STT | OpenAI Whisper | `createSTTService()` | same |
| NLU | Claude Haiku (keyword pre-match → LLM) | `createNLUService()` | same |
| Analytics | localStorage mock (Supabase deferred) | `createAnalyticsService()` | same |

### Voice Pipeline (AGUARDANDO states)

```
Mic records 4s → Whisper STT → keyword match (instant) or Claude NLU (2s) → 25s timeout
```

- Keywords defined in `QUESTION_META` (`src/types/index.ts`) — fast path, no API call
- NLU sends `questionContext` + option labels to Claude Haiku for binary classification
- Low confidence (< 0.7) → play fallback script, retry (max 2 attempts)
- Timeout → default choice per question

### Script & Audio

- **Script:** `src/data/script.ts` — 82 keys, all PT-BR, with `pauseAfter` timing and `inflection` tags
- **NLU metadata:** `QUESTION_META` in `src/types/index.ts` — 11 questions with keywords, labels, context
- **MP3s:** `public/audio/prerecorded/` — 82 files, ~24MB total, mp3_44100_192 via ElevenLabs v3
- **Generation:** `scripts/generate-audio-v3.ts` imports from `script.ts` directly
- **Timing validation:** `scripts/validate-timing.ts` checks all 24 branch permutations (max-path: 7:11.2 min, 18.8s headroom under 7:30 budget)

### Key Component

`src/components/experience/OracleExperience.tsx` — the orchestrator. Maps machine states to:
- `getScriptKey()` → which SCRIPT entry to play
- `getBreathingDelay()` → pause between states (SHORT/MEDIUM/LONG)
- `getFallbackScript()` → fallback text per AGUARDANDO state
- `activeChoiceConfig` → which ChoiceConfig to use for voice choice pipeline
- 11 `buildChoiceConfig(N)` instances from `QUESTION_META`

## Conventions

- **Components:** PascalCase, default export, `'use client'` directive
- **Services:** `create{X}Service()` factory, `Mock{X}Service` / `{Provider}{X}Service`
- **Hooks:** `use{X}.ts`, lazy service init via `useRef` + `useCallback`
- **Types:** union types over enums, `| null` over `| undefined`
- **Constants:** `UPPER_SNAKE_CASE` (SCRIPT, PHASE_COLORS, QUESTION_META)
- **Tests:** `{name}.test.ts` next to source or in `__tests__/`, use `data-testid`
- **Imports:** `@/` alias for cross-directory, relative for same directory
- **Styling:** Tailwind only, inline `style={}` for dynamic values

## Common Tasks

### Change script text
1. Edit `src/data/script.ts` (find the key, change `.text`)
2. If NLU options/keywords changed: update `QUESTION_META` in `src/types/index.ts`
3. Regenerate MP3: `npx ts-node scripts/generate-audio-v3.ts` (needs `ELEVENLABS_API_KEY`)
4. Run tests: `npm test`

### Add a new question/branch
1. Add script entries in `src/data/script.ts` (SETUP, PERGUNTA, RESPOSTA_A/B, FALLBACK, TIMEOUT)
2. Add `QUESTION_META` entry in `src/types/index.ts`
3. Add states in `src/machines/oracleMachine.ts` with guards if conditional
4. Extend `OracleExperience.tsx`: getScriptKey, getBreathingDelay, getFallbackScript, activeChoiceConfig, isAguardando
5. Generate MP3s, update tests

### Run tests
```bash
npm test              # all tests (~750 tests, 733 passing baseline / 16 failing pre-existing)
npm run test:watch    # watch mode
npx vitest run src/data/  # specific directory
```

**Known:** 2 test files from v1.0 (`voice-flow-integration.test.ts`, `flow-sequencing.test.ts`) reference obsolete PURGATORIO_A/B states. They need rewrite for v4.0 machine.

## Git Remotes

- **`origin`** → `github.com/oimilo/oraculo` (branch `master`) — source repo
- **`vercel`** → `github.com/bonitoemail/oraculov2` (branch `main`) — **production deploy**. Always push here for Vercel to build: `git push vercel master:main`

## Environment Variables

```bash
NEXT_PUBLIC_USE_REAL_APIS=true  # false = FallbackTTS + mocks
ELEVENLABS_API_KEY=sk_...       # server-side only
ELEVENLABS_VOICE_ID=PznTnBc8X6pvixs9UkQm  # Oracle voice
USE_V3_MODEL=true               # eleven_v3 with audio tags
OPENAI_API_KEY=sk-proj-...      # Whisper STT
ANTHROPIC_API_KEY=sk-ant-...    # Claude Haiku NLU
```

## Project Structure

```
src/
  app/
    page.tsx                    # Main experience (renders OracleExperience)
    admin/page.tsx              # Admin dashboard
    api/tts/route.ts            # ElevenLabs proxy
    api/stt/route.ts            # Whisper proxy
    api/nlu/route.ts            # Claude Haiku proxy
  components/experience/
    OracleExperience.tsx        # THE orchestrator component
    PermissionScreen.tsx        # Mic permission UI
    StartButton.tsx             # Start screen (logo + ambient particles + enter button)
    ChoiceButtons.tsx           # Voice choice fallback buttons
  components/audio/
    WaveformVisualizer.tsx      # Canvas waveform
    ListeningIndicator.tsx      # Mic active indicator
  machines/
    oracleMachine.ts            # XState v5 machine (~78 states)
    oracleMachine.types.ts      # Context, events, types
  data/
    script.ts                   # Full PT-BR script (82 keys)
  types/
    index.ts                    # Core types + QUESTION_META
  hooks/
    useVoiceChoice.ts           # Voice choice pipeline hook
    useMicrophone.ts            # Mic recording hook
  services/
    tts/                        # TTS: interface, mock, elevenlabs, fallback
    stt/                        # STT: interface, mock, whisper
    nlu/                        # NLU: interface, mock, claude
    analytics/                  # Analytics: interface, mock
    audio/                      # Ambient audio, crossfader
    station/                    # Multi-station registry
  lib/audio/
    audioContext.ts             # AudioContext singleton
scripts/
  generate-audio-v3.ts         # MP3 generation via ElevenLabs
  validate-timing.ts           # Duration validation (24 branch paths)
public/audio/prerecorded/      # 82 pre-recorded MP3s (~24MB)
public/images/oraculogo.png    # Hand-painted logo (used on start screen)
```

## Mobile Audio Compatibility (CRITICAL)

- **AudioBufferSourceNode** is the ONLY reliable playback method on mobile. Use `source.connect(effectsInput)` + `source.start()`.
- **HTMLAudioElement + createMediaElementSource** BREAKS on mobile — `createMediaElementSource` throws silently, audio falls back to native path (thin voice), then freezes on subsequent segments. DO NOT use this approach.
- **PLAYBACK_RATE / pitch-preserved speed** requires HTMLAudioElement, which breaks mobile. If speed change is needed, must find an alternative (e.g., OfflineAudioContext resampling).
- **Effects chain** (effectsChain.ts: EQ + ConvolverNode reverb + echo/robot bursts) works fine on mobile with AudioBufferSourceNode. The chain was mistakenly suspected of breaking mobile audio, but the real culprit was HTMLAudioElement.
- **AudioContext.resume()** — use fire-and-forget (`ctx.resume().catch(() => {})`) before playback as safety net. NEVER await it in a `.then()` chain — it can hang indefinitely on mobile without user gesture.

## Important Constraints

- **Audio-only experience** — UI shows abstract visuals, NEVER text from script
- **LGPD compliance** — zero personal data stored, audio discarded after classification
- **Offline fallback** — FallbackTTS plays pre-recorded MP3s when APIs unavailable
- **Event hardware** — 2-3 laptops + headphones, Chrome browser, HTTPS required
- **Budget** — ~$50 for 300 visitors across ElevenLabs + Whisper + Claude APIs
- **PT-BR only** — all script, NLU, keywords in Brazilian Portuguese
