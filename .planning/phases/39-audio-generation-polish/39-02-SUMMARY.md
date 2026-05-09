---
phase: 39-audio-generation-polish
plan: 02
status: complete
started: 2026-05-09
completed: 2026-05-09
---

## Summary

Generated V2 narrative MP3s with somber voice and regenerated ENCERRAMENTO MP3 with corrected "Faca" text. After client feedback, reclassified voice types so somber voice applies only to oracle formulations (respostas + devoluções), not guide narration (intros/setups).

## What Changed

- Generated 33 V2 MP3s (22 respostas + 11 devoluções) in `public/audio/prerecorded/v2/`
- Regenerated `public/audio/prerecorded/encerramento.mp3` with "Faca" text fix
- Reclassified `getVoiceType()`: `*_INTRO` and `*_SETUP` moved from VOZ_NARRATIVA to VOZ_PERGUNTA
- Deleted 14 unused V2 intro/setup MP3s
- Updated voice classification tests (21/21 passing)
- Total MP3s: 115 (82 V1 + 33 V2)

## Key Files

### Created
- `public/audio/prerecorded/v2/*.mp3` (33 files — respostas + devoluções)

### Modified
- `public/audio/prerecorded/encerramento.mp3` — regenerated with "Faca" text
- `src/lib/voice/voiceClassification.ts` — intro/setup reclassified as VOZ_PERGUNTA
- `src/types/__tests__/voice-classification.test.ts` — updated counts and expectations

## Commits
- `5f377cd` feat(39-02): generate 47 V2 narrative MP3s with somber voice
- `cd7348b` fix(39-02): regenerate ENCERRAMENTO MP3 with corrected faca text
- `20b65cb` fix(39-02): reclassify voice types — somber voice only on respostas and devoluções

## Self-Check: PASSED
- V1 MP3 count: 82 (unchanged)
- V2 MP3 count: 33 (respostas + devoluções only)
- FallbackTTS tests: 12/12 passing
- Voice classification tests: 21/21 passing
- No VOZ_PERGUNTA keys in V2 directory
