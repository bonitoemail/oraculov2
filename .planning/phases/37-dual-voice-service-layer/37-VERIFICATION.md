---
phase: 37-dual-voice-service-layer
verified: 2026-05-09T08:45:00Z
status: passed
score: 5/5 must-haves verified
overrides_applied: 0
---

# Phase 37: Dual-Voice Service Layer Verification Report

**Phase Goal:** Audio services route to correct voice based on version and segment type
**Verified:** 2026-05-09T08:45:00Z
**Status:** passed
**Re-verification:** No -- initial verification

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | API route /api/tts accepts voice ID parameter and routes to correct ElevenLabs voice | VERIFIED | `src/app/api/tts/route.ts` lines 6-16: TTSRequestBody includes `version?: 'V1' \| 'V2'` and `script_key?: string`. Lines 102-106: server-side resolution via `getVoiceType(body.script_key)` + `getVoiceId(requestVersion, voiceType)` with fallback chain. 6 tests in tts-route.test.ts verify all routing paths (V1 default, V1 explicit, V2 narrative=somber, V2 question=original, V2 fallback key=original, missing env fallback). |
| 2 | FallbackTTS in V2 loads narrative MP3s from public/audio/prerecorded/v2/ directory | VERIFIED | `src/services/tts/fallback.ts` lines 259-268: `getPrerecordedUrl()` returns `/audio/prerecorded/v2/${key.toLowerCase()}.mp3` when `version === 'V2' && voiceType === 'VOZ_NARRATIVA'`. Test `should fetch from /audio/prerecorded/v2/ for V2 narrative segments` in fallback-tts.test.ts asserts fetch URL `/audio/prerecorded/v2/inferno_intro.mp3`. Directory `public/audio/prerecorded/v2/.gitkeep` exists. |
| 3 | FallbackTTS in V2 loads question MP3s from public/audio/prerecorded/ (original location) | VERIFIED | `src/services/tts/fallback.ts` line 267: non-narrative segments return `/audio/prerecorded/${key.toLowerCase()}.mp3`. Test `should fetch from /audio/prerecorded/ for V2 question segments` asserts fetch URL `/audio/prerecorded/inferno_q1_pergunta.mp3` when called with V2 + VOZ_PERGUNTA. |
| 4 | In V2, narrative segments use Voice 2 (somber) and question segments use Voice 1 (current Oracle voice) | VERIFIED | End-to-end chain traced: `OracleExperience.tsx` line 486 calls `getVoiceType(scriptKey)` -> passes `version, voiceType` to `tts.speak()` (line 488). `useTTSOrchestrator.ts` line 68 forwards to `TTSService.speak()`. `elevenlabs.ts` lines 41-42 sends `version` + `script_key` in fetch body. `route.ts` lines 103-106 resolves: V2+NARRATIVA -> ELEVENLABS_VOICE_ID_V2 (somber), V2+PERGUNTA -> ELEVENLABS_VOICE_ID (original). Test `should use V2 voice ID for narrative script key when version is V2` verifies somber voice (`voice-v2-somber`). Test `should use V1 voice ID for question script key even when version is V2` verifies original voice. |
| 5 | In V1, all segments continue using Voice 1 exactly as today (zero regression) | VERIFIED | All parameters are optional with V1 defaults throughout the chain. `route.ts` line 103: `body.version === 'V2' ? 'V2' : 'V1'` defaults to V1. `getVoiceId('V1', anyType)` always returns ELEVENLABS_VOICE_ID. `fallback.ts` line 261: default `version='V1'` returns root directory path. Test `should use default voice ID when no version or script_key provided` confirms V1 behavior unchanged. All 48 existing+new tests pass. |

**Score:** 5/5 truths verified

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `src/services/tts/index.ts` | Extended TTSService interface with version + voiceType params | VERIFIED | Lines 28-29: `version?: ExperienceVersion, voiceType?: VoiceType` in speak() signature |
| `src/app/api/tts/route.ts` | Server-side voice ID resolution using getVoiceType + getVoiceId | VERIFIED | Lines 3-4: imports from voiceClassification. Lines 102-106: resolution chain |
| `src/services/tts/mock.ts` | Updated MockTTSService matching extended interface | VERIFIED | Lines 10-12: `_version?: ExperienceVersion, _voiceType?: VoiceType` |
| `src/services/tts/elevenlabs.ts` | ElevenLabsTTSService with version + voiceType pass-through | VERIFIED | Lines 19-21: params in signature. Lines 41-42: conditional spread in body. Line 82: forwards to fallback |
| `src/services/tts/fallback.ts` | FallbackTTSService with V2 dual-directory MP3 resolution | VERIFIED | Lines 63-64: resolves voiceType + URL. Lines 259-268: getPrerecordedUrl(). Lines 78,92: versioned cache keys |
| `src/hooks/useTTSOrchestrator.ts` | useTTSOrchestrator with version + voiceType threading | VERIFIED | Lines 11-13: params in interface. Lines 49-51: params in callback. Line 68: forwards to service |
| `src/components/experience/OracleExperience.tsx` | OracleExperience with useVersion + getVoiceType integration | VERIFIED | Lines 12-13: imports. Line 281: `const { version } = useVersion()`. Lines 486-488: voiceType derivation + speak call. Lines 583-584: fallback voiceType derivation + speak call. Line 514: version in dependency array |
| `public/audio/prerecorded/v2/.gitkeep` | Empty V2 directory for future MP3s | VERIFIED | File exists on disk |
| `src/app/api/tts/__tests__/tts-route.test.ts` | Tests for voice routing (V1 default, V2 narrative, V2 question) | VERIFIED | Lines 182-363: 6 test cases in `voice routing (Phase 37)` describe block |
| `src/services/tts/__tests__/elevenlabs-tts.test.ts` | Voice routing tests for ElevenLabs service | VERIFIED | Lines 290-354: 3 test cases in `voice routing (Phase 37)` describe block |
| `src/services/tts/__tests__/fallback-tts.test.ts` | V2 dual-directory routing tests | VERIFIED | Lines 147-249: 5 test cases in `V2 dual-directory routing (Phase 37)` describe block |

### Key Link Verification

| From | To | Via | Status | Details |
|------|----|-----|--------|---------|
| `OracleExperience.tsx` | `useTTSOrchestrator.ts` | `tts.speak(segments, phase, scriptKey, version, voiceType)` | WIRED | Lines 488, 584 pass version + voiceType through tts.speak() |
| `useTTSOrchestrator.ts` | `TTSService (index.ts)` | `ttsRef.current.speak(segments, settings, scriptKey, version, voiceType)` | WIRED | Line 68 forwards all 5 params |
| `elevenlabs.ts` | `/api/tts route` | `fetch /api/tts with version + script_key in body` | WIRED | Lines 41-42 conditional spread of version + script_key |
| `elevenlabs.ts` | `fallback.ts` | `this.fallbackService.speak(segments, voiceSettings, scriptKey, version, voiceType)` | WIRED | Line 82 forwards all 5 params on API failure |
| `fallback.ts` | `public/audio/prerecorded/v2/` | `getPrerecordedUrl with version + voiceType` | WIRED | Lines 264-265: V2+NARRATIVA -> /v2/ path |
| `route.ts` | `voiceClassification.ts` | `import getVoiceType, getVoiceId` | WIRED | Line 3 import, lines 104-105 usage |
| `OracleExperience.tsx` | `VersionContext.tsx` | `import { useVersion }` | WIRED | Line 12 import, line 281 usage |
| `OracleExperience.tsx` | `voiceClassification.ts` | `import { getVoiceType }` | WIRED | Line 13 import, lines 486, 583 usage |

### Data-Flow Trace (Level 4)

| Artifact | Data Variable | Source | Produces Real Data | Status |
|----------|---------------|--------|--------------------|--------|
| `OracleExperience.tsx` | `version` | `useVersion()` from VersionContext | Yes -- React Context state, defaults to 'V1' | FLOWING |
| `OracleExperience.tsx` | `voiceType` | `getVoiceType(scriptKey)` pure function | Yes -- returns VOZ_PERGUNTA or VOZ_NARRATIVA based on key pattern | FLOWING |
| `route.ts` | `resolvedVoiceId` | `getVoiceId(requestVersion, voiceType)` from env vars | Yes -- reads ELEVENLABS_VOICE_ID / ELEVENLABS_VOICE_ID_V2 at runtime | FLOWING |
| `fallback.ts` | URL | `getPrerecordedUrl(key, version, voiceType)` | Yes -- constructs path from key name, checked by V2 directory routing tests | FLOWING |

### Behavioral Spot-Checks

| Behavior | Command | Result | Status |
|----------|---------|--------|--------|
| All Phase 37 tests pass | `npx vitest run` (4 test files) | 48 passed, 0 failed | PASS |
| Voice routing tests verify V2 narrative uses somber voice | Test assertion: `text-to-speech/voice-v2-somber` | Assertion passes | PASS |
| Voice routing tests verify V2 question uses original voice | Test assertion: `text-to-speech/voice-v1-test` | Assertion passes | PASS |
| FallbackTTS V2 narrative resolves to /v2/ directory | Test assertion: `fetch('/audio/prerecorded/v2/inferno_intro.mp3')` | Assertion passes | PASS |
| Versioned cache keys prevent contamination | Test verifies two separate fetches for V1 and V2 of same key | Both URLs fetched independently | PASS |

### Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
|-------------|------------|-------------|--------|----------|
| VOZ-03 | 37-01 | API route `/api/tts` aceita parametro de voice ID (V1 vs V2) baseado na versao e tipo de segmento | SATISFIED | route.ts accepts version + script_key, resolves voice ID server-side via getVoiceType + getVoiceId. 6 routing tests verify all scenarios. |
| VOZ-04 | 37-02 | FallbackTTS na V2 busca MP3 narrativos em `public/audio/prerecorded/v2/`, perguntas continuam na raiz | SATISFIED | fallback.ts getPrerecordedUrl() routes V2+NARRATIVA to /v2/ directory, all else to root. 5 FallbackTTS tests verify directory routing + cache isolation. |
| VOZ-05 | 37-02 | Na V2, segmentos PERGUNTA usam Voz 1 (atual) e segmentos narrativos usam Voz 2 (soturna) | SATISFIED | Full chain wired: OracleExperience derives voiceType via getVoiceType(scriptKey), passes version + voiceType through useTTSOrchestrator to ElevenLabsTTSService (sends to API route for server-side voice resolution) and FallbackTTSService (resolves directory). 3 ElevenLabs routing tests + 6 API route tests confirm voice separation. |

### Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
|------|------|---------|----------|--------|
| None | -- | No anti-patterns detected | -- | -- |

No TODO, FIXME, PLACEHOLDER, or stub patterns found in any modified file. No empty implementations, no hardcoded empty data, no console.log-only handlers.

### Human Verification Required

None. All verification can be done programmatically through code inspection and test execution. The dual-voice audio routing is a data-flow concern verified by tests. Actual audio playback with different voices requires Phase 39 (MP3 generation) and is not in scope for Phase 37.

### Gaps Summary

No gaps found. All 5 ROADMAP success criteria verified. All 3 requirement IDs (VOZ-03, VOZ-04, VOZ-05) satisfied. All artifacts exist, are substantive, are wired, and have data flowing through them. All 48 tests pass. No anti-patterns detected. V1 backward compatibility is preserved through optional parameters with safe defaults throughout the entire chain.

---

_Verified: 2026-05-09T08:45:00Z_
_Verifier: Claude (gsd-verifier)_
