# Phase 39: Audio Generation & Polish - Research

**Researched:** 2026-05-09
**Domain:** Audio generation tooling (ElevenLabs TTS), script correction, dual-voice MP3 pipeline
**Confidence:** HIGH

## Summary

Phase 39 is the final phase of milestone v6.1. It has three concrete deliverables: (1) extend the `generate-audio-v3.ts` script to support dual-voice generation with separate voice IDs per segment type, (2) generate 47 narrative MP3s for V2 into `public/audio/prerecorded/v2/`, and (3) fix "faz" to "faca" in the ENCERRAMENTO script key and regenerate its MP3 for both V1 and V2.

All upstream infrastructure is in place: voice classification (`getVoiceType()` in `src/lib/voice/voiceClassification.ts`), FallbackTTS v2 directory routing (`getPrerecordedUrl()` in `src/services/tts/fallback.ts`), and the API route voice ID resolution (`src/app/api/tts/route.ts`). The generation script (`scripts/generate-audio-v3.ts`) currently uses a single `ELEVENLABS_VOICE_ID` for all keys. It needs a mode where narrative segments use `ELEVENLABS_VOICE_ID_V2` and output to a `v2/` subdirectory.

**Critical finding:** The `.env.local` file has the wrong env var name: `ELEVENLABS_VOICE_ID2=GIuLCSVfgJaUuh7hYOY8` instead of `ELEVENLABS_VOICE_ID_V2` as expected by the codebase. This must be corrected before generation can work.

**Primary recommendation:** Extend generate-audio-v3.ts with a `--v2` flag that filters to narrative-only keys, uses `ELEVENLABS_VOICE_ID_V2`, and outputs to `public/audio/prerecorded/v2/`. Apply the "faca" fix first so both V1 and V2 ENCERRAMENTO MP3s are generated with the correct text.

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| MP3 generation | CLI Script (Node.js) | -- | Offline batch tool, not runtime |
| Voice classification | Frontend Server (SSR) | CLI Script | getVoiceType() exists in src/lib, script reuses it |
| MP3 file storage | Static / CDN | -- | Files served from public/audio/prerecorded/ |
| FallbackTTS path resolution | Browser / Client | -- | getPrerecordedUrl() runs in browser at runtime |
| Script text correction ("faca") | Data layer (src/data/) | -- | script.ts is source of truth for all text |
| Env var configuration | Server-side / CLI | -- | ELEVENLABS_VOICE_ID_V2 is server-only |

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| AUD-01 | Script de geracao (generate-audio-v3.ts) suporta dual-voice (gerar com voice ID diferente por tipo de segmento) | Generation script anatomy fully documented; needs --v2 flag with getVoiceType() filter + VOICE_ID_V2 routing |
| AUD-02 | MP3s V2 (segmentos narrativos com voz soturna) gerados em public/audio/prerecorded/v2/ | 47 narrative keys identified; v2/ directory exists with .gitkeep; estimated ~16 MB, ~6,900 chars total |
| AUD-03 | Fix "faca" no ENCERRAMENTO regenerado como MP3 (V1 e V2) | Git diff confirms script.ts already has the text fix; MP3 regeneration needed for V1 (--force on ENCERRAMENTO) and V2 (narrative, gets somber voice) |
</phase_requirements>

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| ElevenLabs API | v1 REST | TTS generation (eleven_v3 model) | Already used for all 82 V1 MP3s [VERIFIED: codebase] |
| tsx | 4.21.0 | TypeScript script runner with path alias support | Already used to run generate-audio-v3.ts [VERIFIED: npx tsx --version] |
| Node.js | 22.16.0 | Script runtime | Already installed [VERIFIED: node --version] |

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| getVoiceType() | src/lib/voice/voiceClassification.ts | Classify keys as VOZ_PERGUNTA vs VOZ_NARRATIVA | Import in generation script to filter narrative keys |
| vitest | 2.1.8 | Test runner | Verify FallbackTTS coverage for V2 [VERIFIED: package.json] |

**Installation:** No new packages needed. All dependencies already installed.

## Architecture Patterns

### System Architecture Diagram

```
                     generate-audio-v3.ts
                            |
                  +---------+---------+
                  |                   |
              V1 mode             V2 mode (--v2)
                  |                   |
         All 82 keys          47 narrative keys only
         VOICE_ID (V1)        VOICE_ID_V2 (somber)
                  |                   |
          ElevenLabs API      ElevenLabs API
          (eleven_v3)         (eleven_v3)
                  |                   |
    public/audio/prerecorded/  public/audio/prerecorded/v2/
         82 MP3s                  47 MP3s
                  |                   |
                  +--------+----------+
                           |
                     FallbackTTS
                  getPrerecordedUrl()
                           |
              V1: /audio/prerecorded/{key}.mp3
              V2+narrative: /audio/prerecorded/v2/{key}.mp3
              V2+question: /audio/prerecorded/{key}.mp3 (shared)
```

### Recommended Script Enhancement Structure

The generation script modification is surgical -- add a `--v2` mode that:
1. Imports `getVoiceType` from the codebase
2. Reads `ELEVENLABS_VOICE_ID_V2` from `.env.local`
3. Filters SCRIPT keys to only VOZ_NARRATIVA when in V2 mode
4. Outputs to `public/audio/prerecorded/v2/` instead of root
5. Uses the same PHASE_VOICE settings (voice character comes from the voice ID, not settings)

### Pattern: CLI Flag Extension

**What:** Add `--v2` flag to existing generation script
**When to use:** When the generation script needs to support a second voice
**Example:**

```typescript
// Source: existing generate-audio-v3.ts pattern + voiceClassification.ts
import { getVoiceType } from '@/lib/voice/voiceClassification';

const isV2Mode = args.includes('--v2');
const VOICE_ID = isV2Mode
  ? process.env.ELEVENLABS_VOICE_ID_V2!
  : process.env.ELEVENLABS_VOICE_ID!;
const OUTPUT_DIR = isV2Mode
  ? resolve(ROOT, 'public/audio/prerecorded/v2')
  : resolve(ROOT, 'public/audio/prerecorded');

// Filter keys based on mode
const allKeys = Object.keys(SCRIPT);
const keys = isV2Mode
  ? allKeys.filter(key => getVoiceType(key) === 'VOZ_NARRATIVA')
  : allKeys;
```

### Anti-Patterns to Avoid

- **Separate generation script for V2:** Do NOT create a new script. Extend the existing one with a flag. This keeps all ElevenLabs API logic, rate limiting, and error handling in one place.
- **Hardcoded key lists for narrative segments:** Do NOT maintain a manual list of which keys are narrative. Use `getVoiceType()` which is already tested and is the single source of truth.
- **Different voice_settings for V2:** The voice *character* comes from the different voice ID, not from stability/style settings. Use the same PHASE_VOICE settings -- the somber quality is inherent to the `ELEVENLABS_VOICE_ID_V2` voice clone.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Narrative key classification | Manual list of 47 keys | `getVoiceType()` from voiceClassification.ts | Already tested, single source of truth, auto-updates if script keys change |
| Audio format conversion | Custom encoding | ElevenLabs `mp3_44100_192` output format | API handles encoding; consistent with 82 existing V1 files |
| File path routing | Custom directory logic in script | Consistent lowercase convention: `{key.toLowerCase()}.mp3` | Same pattern used by all 82 existing files and by FallbackTTS |

## Common Pitfalls

### Pitfall 1: Wrong Env Var Name in .env.local
**What goes wrong:** Generation script reads `ELEVENLABS_VOICE_ID_V2` but `.env.local` has `ELEVENLABS_VOICE_ID2`
**Why it happens:** Manual entry in `.env.local` used shorthand name instead of the canonical name from `.env.example` and codebase
**How to avoid:** Rename `ELEVENLABS_VOICE_ID2` to `ELEVENLABS_VOICE_ID_V2` in `.env.local` as first step
**Warning signs:** Script exits with "ELEVENLABS_VOICE_ID_V2 must be set" error
**Confidence:** HIGH [VERIFIED: grep of .env.local shows `ELEVENLABS_VOICE_ID2=GIuLCSVfgJaUuh7hYOY8`, code reads `process.env.ELEVENLABS_VOICE_ID_V2`]

### Pitfall 2: ENCERRAMENTO is VOZ_PERGUNTA, Not Narrative
**What goes wrong:** The "faca" fix MP3 for V2 might be skipped if using `--v2` mode (which only generates narrative keys)
**Why it happens:** ENCERRAMENTO is classified as VOZ_PERGUNTA by `getVoiceType()` -- it uses the original voice in V2
**How to avoid:** For the "faca" fix, regenerate ENCERRAMENTO in V1 mode with `--force`. In V2, ENCERRAMENTO uses the same V1 voice (VOZ_PERGUNTA), so the V1 regenerated MP3 is shared for both versions. No separate V2 ENCERRAMENTO MP3 needed.
**Warning signs:** V2 ENCERRAMENTO still says "faz" instead of "faca"
**Confidence:** HIGH [VERIFIED: getVoiceType('ENCERRAMENTO') returns 'VOZ_PERGUNTA'; FallbackTTS getPrerecordedUrl() returns root path for VOZ_PERGUNTA regardless of version]

### Pitfall 3: Rate Limiting During Batch Generation
**What goes wrong:** ElevenLabs returns 429 errors partway through 47 files
**Why it happens:** Even with 1s delay between requests, Creator-tier accounts have monthly character limits
**How to avoid:** The script already has quota detection and resume-from-failure (skips existing files). If stopped by rate limit, wait and re-run. Total is only ~6,900 characters -- well within even free-tier monthly limits.
**Warning signs:** "Quota exceeded" message in console output
**Confidence:** HIGH [VERIFIED: existing script has rate limit handling and resume logic at lines 229-244]

### Pitfall 4: Script Text Change Already Applied But MP3 Not Regenerated
**What goes wrong:** The git diff shows `script.ts` already has "Faca alguma coisa com isso." but the existing `encerramento.mp3` still has the old "Faz" text
**Why it happens:** The text fix was applied to script.ts but the MP3 was not regenerated
**How to avoid:** Use `--force` flag when regenerating ENCERRAMENTO to overwrite the existing MP3
**Warning signs:** Playing encerramento.mp3 still says "faz" even after code change
**Confidence:** HIGH [VERIFIED: git diff shows text change, existing MP3 predates the change]

### Pitfall 5: V2 Directory .gitkeep Conflicts
**What goes wrong:** Git add of 47 new MP3s in v2/ might have issues with the existing .gitkeep
**Why it happens:** .gitkeep is a placeholder for empty directories in git
**How to avoid:** .gitkeep can coexist with MP3 files -- no conflict. Just add the MP3s normally.
**Warning signs:** None -- this is a non-issue but worth noting
**Confidence:** HIGH [VERIFIED: .gitkeep exists in v2/ directory]

## Code Examples

### Current Generation Script API Call Pattern

```typescript
// Source: scripts/generate-audio-v3.ts, lines 106-135
async function generateAudio(
  key: string,
  text: string,
  voiceSettings: { stability: number; similarity_boost: number; style: number }
): Promise<Buffer> {
  const url = `https://api.elevenlabs.io/v1/text-to-speech/${VOICE_ID}?output_format=mp3_44100_192`;

  const body = {
    text,
    model_id: 'eleven_v3',
    voice_settings: {
      stability: voiceSettings.stability,
      similarity_boost: voiceSettings.similarity_boost,
      style: voiceSettings.style,
    },
  };

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'xi-api-key': API_KEY,
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`API error for ${key}: ${response.status} - ${errorText}`);
  }

  const arrayBuffer = await response.arrayBuffer();
  return Buffer.from(arrayBuffer);
}
```

### Voice Type Classification (Reusable in Script)

```typescript
// Source: src/lib/voice/voiceClassification.ts
export function getVoiceType(key: string): VoiceType {
  if (key === 'APRESENTACAO' || key === 'ENCERRAMENTO') return 'VOZ_PERGUNTA';
  if (key.startsWith('FALLBACK_') || key.startsWith('TIMEOUT_')) return 'VOZ_PERGUNTA';
  if (key.endsWith('_PERGUNTA')) return 'VOZ_PERGUNTA';
  return 'VOZ_NARRATIVA';
}
```

### FallbackTTS V2 Path Resolution (Already Implemented)

```typescript
// Source: src/services/tts/fallback.ts, lines 259-268
private getPrerecordedUrl(
  key: string,
  version: ExperienceVersion = 'V1',
  voiceType: VoiceType = 'VOZ_PERGUNTA',
): string {
  if (version === 'V2' && voiceType === 'VOZ_NARRATIVA') {
    return `/audio/prerecorded/v2/${key.toLowerCase()}.mp3`;
  }
  return `/audio/prerecorded/${key.toLowerCase()}.mp3`;
}
```

## Key Data Points

### Voice Classification Counts [VERIFIED: Node.js analysis of all 82 keys]

| Type | Count | V2 MP3 Action |
|------|-------|---------------|
| VOZ_NARRATIVA | 47 | Generate with somber voice into v2/ |
| VOZ_PERGUNTA | 35 | No V2 generation needed (shared with V1) |
| **Total** | **82** | **47 new MP3s for V2** |

### Narrative Segments Breakdown [VERIFIED: getVoiceType() applied to all SCRIPT keys]

| Category | Keys | Count |
|----------|------|-------|
| Phase intros | INFERNO_INTRO, PURGATORIO_INTRO, PARAISO_INTRO | 3 |
| Question setups | *_SETUP (Q1-Q6 + Q1B/Q2B/Q4B/Q5B/Q6B) | 11 |
| Respostas | *_RESPOSTA_A/B (Q1-Q6 + Q1B/Q2B/Q4B/Q5B/Q6B) | 22 |
| Devolucoes | DEVOLUCAO_* (8 baseline + 3 special) | 11 |
| **Total** | | **47** |

### Size Estimates [VERIFIED: file system analysis]

| Item | Size |
|------|------|
| Existing V1 MP3s | 21.35 MB (82 files) |
| V1 narrative subset | 16.21 MB (47 files, avg 353 KB each) |
| Estimated V2 narrative set | ~16 MB (47 files, similar sizes) |
| Total after V2 generation | ~37 MB (82 V1 + 47 V2 = 129 files) |

### ElevenLabs API Cost [VERIFIED: character count analysis]

| Metric | Value |
|--------|-------|
| Total narrative characters | ~6,900 |
| ENCERRAMENTO characters | ~205 |
| Credits per character | 1 |
| Estimated total credits | ~7,100 |
| Creator plan monthly chars | 100,000 |
| Cost impact | Negligible (~7% of monthly quota) |

### Env Var Configuration [VERIFIED: .env.local + codebase grep]

| Var Name | .env.local Value | Expected By Code | Status |
|----------|-----------------|-----------------|--------|
| ELEVENLABS_API_KEY | sk_49336... | generate-audio-v3.ts | OK |
| ELEVENLABS_VOICE_ID | PznTnBc8X6pvixs9UkQm | generate-audio-v3.ts | OK (V1 Oracle voice) |
| ELEVENLABS_VOICE_ID_V2 | (missing -- listed as ELEVENLABS_VOICE_ID2) | voiceClassification.ts, generation script | MISMATCH -- must rename |
| ELEVENLABS_VOICE_ID2 | GIuLCSVfgJaUuh7hYOY8 | nothing | Wrong name -- rename to ELEVENLABS_VOICE_ID_V2 |

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Single voice for all segments | Dual-voice (V1 original + V2 somber narrative) | Phase 36-37 (2026-05-09) | V2 requires separate MP3 set for narrative segments |
| Manual list of audio URLs | Dynamic derivation from SCRIPT keys | Phase 18 (2026-03-28) | PRERECORDED_URLS auto-syncs with script.ts |
| eleven_multilingual_v2 model | eleven_v3 model | Phase 13 (2026-03-27) | Audio tags, no SSML, better PT-BR |

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | V2 voice settings (stability, similarity_boost, style) should be the same as V1 per-phase settings | Architecture Patterns | If the somber voice needs different settings, audio quality may suffer -- but can be tuned post-generation |
| A2 | The voice ID GIuLCSVfgJaUuh7hYOY8 in .env.local is the intended somber voice for V2 | Key Data Points | If wrong voice ID, all 47 V2 MP3s would need regeneration |
| A3 | ~16 MB for V2 narrative MP3s is acceptable for browser loading | Key Data Points | If too large, may need lazy loading or compression -- but V1 is already 21 MB and works fine |

## Open Questions (RESOLVED)

1. **Voice settings tuning for V2 somber voice**
   - What we know: Same PHASE_VOICE settings work for V1 Oracle voice. V2 voice character comes primarily from the voice ID itself.
   - What's unclear: Whether the somber voice clone responds optimally to the same stability/similarity_boost/style values
   - RESOLVED: Generate with same settings first. Voice character comes from the voice ID, not settings. Tuning is a separate post-generation pass if needed.

2. **ENCERRAMENTO scope for V2**
   - What we know: ENCERRAMENTO is classified as VOZ_PERGUNTA. In V2, VOZ_PERGUNTA segments use V1 voice. FallbackTTS serves V1 root MP3 for both versions.
   - What's unclear: Whether the client explicitly asked for ENCERRAMENTO to be somber-voiced in V2 or if pergunta-classification (original voice) is intentional
   - RESOLVED: Keep ENCERRAMENTO as VOZ_PERGUNTA per existing classification. The "faca" fix applies to the shared V1 MP3 only. V1 MP3 is shared for both versions. The Oracle's closing words use the familiar voice, not the somber narrator.

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Node.js | Script execution | Yes | 22.16.0 | -- |
| tsx | TypeScript script runner | Yes | 4.21.0 | -- |
| ElevenLabs API | MP3 generation | Yes (API key in .env.local) | v1 REST | -- |
| ELEVENLABS_VOICE_ID | V1 voice | Yes | PznTnBc8X6pvixs9UkQm | -- |
| ELEVENLABS_VOICE_ID_V2 | V2 somber voice | Partial (wrong name in .env.local) | GIuLCSVfgJaUuh7hYOY8 | Rename env var |
| Internet connection | ElevenLabs API calls | Required | -- | No fallback for generation |

**Missing dependencies with no fallback:**
- None (all resolved with env var rename)

**Missing dependencies with fallback:**
- `ELEVENLABS_VOICE_ID_V2` env var: exists as `ELEVENLABS_VOICE_ID2` -- rename it

## Validation Architecture

### Test Framework

| Property | Value |
|----------|-------|
| Framework | vitest 2.1.8 |
| Config file | vitest.config.ts (in project root) |
| Quick run command | `npx vitest run src/services/tts/__tests__/fallback-tts.test.ts` |
| Full suite command | `npm test` |

### Phase Requirements to Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| AUD-01 | Generation script supports --v2 flag | manual | `npx tsx scripts/generate-audio-v3.ts --v2 --dry-run` | N/A (CLI tool, not unit test) |
| AUD-02 | 47 V2 narrative MP3s exist in v2/ | smoke | `ls public/audio/prerecorded/v2/*.mp3 \| wc -l` (expect 47) | N/A (file check) |
| AUD-03 | ENCERRAMENTO text says "Faca" | unit | `npx vitest run src/data/ -x` | Depends on existing tests |
| AUD-03 | ENCERRAMENTO MP3 regenerated | manual | `npx tsx scripts/generate-audio-v3.ts --dry-run` (should show GEN for encerramento if --force) | N/A |
| Coverage | FallbackTTS V2 directory routing | unit | `npx vitest run src/services/tts/__tests__/fallback-tts.test.ts -x` | Yes |
| Coverage | Voice classification for all 82 keys | unit | `npx vitest run src/types/__tests__/voice-classification.test.ts -x` | Yes |

### Sampling Rate
- **Per task commit:** `npx vitest run src/services/tts/__tests__/fallback-tts.test.ts src/types/__tests__/voice-classification.test.ts -x`
- **Per wave merge:** `npm test`
- **Phase gate:** Full suite green + file count verification (47 V2 MP3s + 82 V1 MP3s)

### Wave 0 Gaps
- [ ] Test that ENCERRAMENTO text contains "Faca" (not "Faz") -- may need a new assertion in script tests
- [ ] File count verification script/test for V2 directory (47 narrative MP3s present)

None -- existing test infrastructure covers the code-level requirements. The primary outputs (MP3 files) are verified by file existence checks.

## Sources

### Primary (HIGH confidence)
- `scripts/generate-audio-v3.ts` -- full generation script anatomy (262 lines) [VERIFIED: codebase]
- `src/lib/voice/voiceClassification.ts` -- getVoiceType() classification logic [VERIFIED: codebase]
- `src/services/tts/fallback.ts` -- FallbackTTS getPrerecordedUrl() V2 routing [VERIFIED: codebase]
- `src/data/script.ts` -- all 82 SCRIPT keys, ScriptDataV4 interface [VERIFIED: codebase]
- `.env.local` -- env var names and values [VERIFIED: codebase]
- `public/audio/prerecorded/` -- 82 existing MP3 files, v2/ subdirectory with .gitkeep [VERIFIED: filesystem]
- Git diff of script.ts -- "faz" to "faca" change already applied to text [VERIFIED: git diff]

### Secondary (MEDIUM confidence)
- [ElevenLabs API Documentation](https://elevenlabs.io/docs/api-reference/text-to-speech/convert) -- mp3_44100_192 format, voice_settings parameters, eleven_v3 model [CITED: elevenlabs.io/docs]

### Tertiary (LOW confidence)
- None

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH -- no new dependencies, all tools already in use and verified
- Architecture: HIGH -- pattern is extension of existing generation script, all infrastructure proven in Phases 36-38
- Pitfalls: HIGH -- all pitfalls verified against actual codebase state (env var mismatch, voice type classification, rate limiting)

**Research date:** 2026-05-09
**Valid until:** 2026-06-09 (stable -- no fast-moving dependencies)
