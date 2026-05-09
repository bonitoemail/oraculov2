---
phase: 37-dual-voice-service-layer
plan: 02
subsystem: tts
tags: [elevenlabs, fallback-tts, orchestrator, oracle-experience, dual-voice, voice-routing]

# Dependency graph
requires:
  - phase: 37-dual-voice-service-layer
    plan: 01
    provides: Extended TTSService interface with version + voiceType params, API route voice ID resolution
  - phase: 36-version-context-voice-classification
    provides: getVoiceType, getVoiceId, ExperienceVersion, VoiceType types, useVersion hook
provides:
  - ElevenLabsTTSService sends version + script_key to API route and forwards to fallback
  - FallbackTTSService dual-directory MP3 resolution (V2 narrative from /v2/)
  - useTTSOrchestrator threads version + voiceType from component to service
  - OracleExperience derives voiceType per scriptKey and passes version through TTS chain
  - Empty public/audio/prerecorded/v2/ directory for Phase 39 MP3 generation
affects: [38 (version selector UI), 39 (audio generation populates v2/)]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Client-side voice type derivation via getVoiceType(scriptKey) in OracleExperience"
    - "Dual-directory MP3 resolution: V2+NARRATIVA from /v2/, everything else from root"
    - "Versioned cache keys (version:key) prevent cross-version AudioBuffer contamination"
    - "Conditional spread in fetch body for backward-compatible API parameters"

key-files:
  created:
    - public/audio/prerecorded/v2/.gitkeep
  modified:
    - src/services/tts/elevenlabs.ts
    - src/services/tts/fallback.ts
    - src/hooks/useTTSOrchestrator.ts
    - src/components/experience/OracleExperience.tsx
    - src/services/tts/__tests__/elevenlabs-tts.test.ts
    - src/services/tts/__tests__/fallback-tts.test.ts
    - src/hooks/__tests__/useTTSOrchestrator.test.ts

key-decisions:
  - "FallbackTTS uses version + voiceType (not voiceId string) for directory routing -- avoids exposing server-side env vars client-side"
  - "Versioned cache key format is version:key for all lookups (not just V2) -- simpler, prevents any cross-contamination"
  - "preloadAll() only preloads V1 root directory MP3s; V2 narrative MP3s loaded on-demand during speak()"

patterns-established:
  - "Client-side voice routing: OracleExperience derives voiceType, passes version + voiceType through orchestrator to service"
  - "Dual-directory fallback: V2 narrative -> /audio/prerecorded/v2/{key}.mp3, all else -> /audio/prerecorded/{key}.mp3"

requirements-completed: [VOZ-04, VOZ-05]

# Metrics
duration: 7min
completed: 2026-05-09
---

# Phase 37 Plan 02: Client-Side TTS Voice Routing Summary

**End-to-end dual-voice wiring: ElevenLabsTTS sends version/script_key to API, FallbackTTS resolves V2 narrative MP3s from /v2/ directory, OracleExperience derives voiceType per scriptKey and threads version through useTTSOrchestrator**

## Performance

- **Duration:** 7 min
- **Started:** 2026-05-09T11:25:54Z
- **Completed:** 2026-05-09T11:32:41Z
- **Tasks:** 2
- **Files modified:** 8 (7 modified + 1 created)

## Accomplishments
- ElevenLabsTTSService sends version + script_key in fetch body to /api/tts (conditional spread, omitted when undefined)
- ElevenLabsTTSService forwards version + voiceType to FallbackTTSService on API failure
- FallbackTTSService resolves V2 narrative URLs to /audio/prerecorded/v2/{key}.mp3
- FallbackTTSService uses versioned cache keys (V1:key, V2:key) to prevent cross-version contamination
- useTTSOrchestrator.speak() accepts and threads version + voiceType to TTSService
- OracleExperience imports useVersion + getVoiceType, derives voiceType per scriptKey
- Effect A and fallback tts.speak calls both pass version + voiceType through
- Empty public/audio/prerecorded/v2/ directory created for Phase 39 MP3 generation
- 3 new ElevenLabs voice routing tests (body includes version/script_key, fallback forwarding)
- 5 new FallbackTTS dual-directory routing tests (V2 narrative, V2 question, V1, default, cache keys)
- All 123 tests pass across 12 test files (TTS + API + hooks)

## Task Commits

Each task was committed atomically:

1. **Task 1: Update ElevenLabsTTSService + FallbackTTSService + create v2/ directory** - `f602b77` (feat)
2. **Task 2: Update useTTSOrchestrator + OracleExperience + add service tests** - `e28ca5a` (feat)

## Files Created/Modified
- `src/services/tts/elevenlabs.ts` - Added version + voiceType params, sends version/script_key in body, forwards to fallback
- `src/services/tts/fallback.ts` - Added version + voiceType params, dual-directory URL resolution, versioned cache keys, getVoiceType import
- `public/audio/prerecorded/v2/.gitkeep` - Empty V2 directory for Phase 39 MP3 generation
- `src/hooks/useTTSOrchestrator.ts` - Extended speak signature with version + voiceType, threads to service
- `src/components/experience/OracleExperience.tsx` - Imports useVersion + getVoiceType, derives voiceType, passes through both TTS call sites
- `src/services/tts/__tests__/elevenlabs-tts.test.ts` - 3 new voice routing tests + updated 2 existing assertions
- `src/services/tts/__tests__/fallback-tts.test.ts` - 5 new V2 dual-directory routing tests
- `src/hooks/__tests__/useTTSOrchestrator.test.ts` - Updated 1 existing assertion for 5-arg signature

## Decisions Made
- FallbackTTS uses version + voiceType (not voiceId string) for directory routing -- avoids exposing server-side env vars to client bundle, leverages Phase 36's type system directly
- Versioned cache key format is `${version || 'V1'}:${resolvedKey}` for all lookups -- simpler than conditionally prefixing only for V2, prevents any edge case contamination
- preloadAll() intentionally only preloads V1 root directory MP3s; V2 narrative MP3s will be loaded on-demand during speak() since they don't exist yet (Phase 39)

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Updated existing test assertions for 5-arg speak signature**
- **Found during:** Task 1 verification
- **Issue:** Two existing ElevenLabs tests (`should fall back to FallbackTTSService when fetch returns non-ok response` and `...when fetch throws network error`) asserted fallback was called with 3 args, but the updated fallback call now passes 5 args (including undefined for version and voiceType)
- **Fix:** Updated assertions from `(segments, voiceSettings, undefined)` to `(segments, voiceSettings, undefined, undefined, undefined)`
- **Files modified:** `src/services/tts/__tests__/elevenlabs-tts.test.ts`
- **Commit:** f602b77

**2. [Rule 1 - Bug] Updated useTTSOrchestrator test assertion for 5-arg signature**
- **Found during:** Task 2 verification
- **Issue:** Existing useTTSOrchestrator test asserted service.speak was called with 3 args, but now passes 5 args
- **Fix:** Updated assertion from `(segments, objectContaining, undefined)` to `(segments, objectContaining, undefined, undefined, undefined)`
- **Files modified:** `src/hooks/__tests__/useTTSOrchestrator.test.ts`
- **Commit:** e28ca5a

## Issues Encountered
None beyond the test assertion updates documented above.

## User Setup Required
None - no external service configuration required. Phase 39 will populate the v2/ directory with MP3s.

## Next Phase Readiness
- Full client-side TTS chain now threads version + voiceType from OracleExperience to services
- API route (from Plan 37-01) receives version + script_key and resolves voice ID server-side
- FallbackTTS resolves V2 narrative to /v2/ directory (will 404 gracefully until Phase 39 generates MP3s)
- Phase 38 can wire the version selector UI -- OracleExperience already reads from useVersion()
- Phase 39 can generate V2 MP3s into public/audio/prerecorded/v2/ -- directory exists and routing works
- All 123 TTS/API/hooks tests pass (no regression)

## Self-Check: PASSED

- [x] src/services/tts/elevenlabs.ts: FOUND
- [x] src/services/tts/fallback.ts: FOUND
- [x] public/audio/prerecorded/v2/.gitkeep: FOUND
- [x] src/hooks/useTTSOrchestrator.ts: FOUND
- [x] src/components/experience/OracleExperience.tsx: FOUND
- [x] src/services/tts/__tests__/elevenlabs-tts.test.ts: FOUND
- [x] src/services/tts/__tests__/fallback-tts.test.ts: FOUND
- [x] src/hooks/__tests__/useTTSOrchestrator.test.ts: FOUND
- [x] Commit f602b77: FOUND
- [x] Commit e28ca5a: FOUND

---
*Phase: 37-dual-voice-service-layer*
*Completed: 2026-05-09*
