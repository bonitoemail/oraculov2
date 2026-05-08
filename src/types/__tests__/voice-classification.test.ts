import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { getVoiceType, getVoiceId } from '@/lib/voice/voiceClassification';
import type { VoiceType } from '@/types';
import { SCRIPT } from '@/data/script';

/**
 * Voice Classification Tests — Phase 36, Plan 01
 * TDD: RED phase — tests written before implementation.
 *
 * Classification rules (per D-01 through D-04):
 *   VOZ_PERGUNTA: APRESENTACAO, ENCERRAMENTO, *_PERGUNTA, FALLBACK_*, TIMEOUT_*
 *   VOZ_NARRATIVA: *_INTRO, *_SETUP, *_RESPOSTA_*, DEVOLUCAO_*
 */

describe('getVoiceType — VOZ_PERGUNTA classification', () => {
  // D-04: Bookends = direct contact with visitor
  it('Test 1: APRESENTACAO returns VOZ_PERGUNTA (D-04 bookend)', () => {
    expect(getVoiceType('APRESENTACAO')).toBe('VOZ_PERGUNTA');
  });

  it('Test 2: ENCERRAMENTO returns VOZ_PERGUNTA (D-04 bookend)', () => {
    expect(getVoiceType('ENCERRAMENTO')).toBe('VOZ_PERGUNTA');
  });

  // D-02: _PERGUNTA suffix = question voice
  it('Test 3: INFERNO_Q1_PERGUNTA returns VOZ_PERGUNTA (D-02 suffix)', () => {
    expect(getVoiceType('INFERNO_Q1_PERGUNTA')).toBe('VOZ_PERGUNTA');
  });

  it('Test 4: INFERNO_Q2B_PERGUNTA returns VOZ_PERGUNTA (branch question)', () => {
    expect(getVoiceType('INFERNO_Q2B_PERGUNTA')).toBe('VOZ_PERGUNTA');
  });

  // D-03: FALLBACK_* = re-engagement with visitor
  it('Test 5: FALLBACK_Q1 returns VOZ_PERGUNTA (D-03 re-engagement)', () => {
    expect(getVoiceType('FALLBACK_Q1')).toBe('VOZ_PERGUNTA');
  });

  it('Test 6: FALLBACK_Q6B returns VOZ_PERGUNTA (branch fallback)', () => {
    expect(getVoiceType('FALLBACK_Q6B')).toBe('VOZ_PERGUNTA');
  });

  // D-03: TIMEOUT_* = re-engagement with visitor
  it('Test 7: TIMEOUT_Q3 returns VOZ_PERGUNTA (D-03 re-engagement)', () => {
    expect(getVoiceType('TIMEOUT_Q3')).toBe('VOZ_PERGUNTA');
  });

  it('Test 8: TIMEOUT_Q5B returns VOZ_PERGUNTA (branch timeout)', () => {
    expect(getVoiceType('TIMEOUT_Q5B')).toBe('VOZ_PERGUNTA');
  });
});

describe('getVoiceType — VOZ_NARRATIVA classification', () => {
  it('Test 9: INFERNO_INTRO returns VOZ_NARRATIVA (narrative)', () => {
    expect(getVoiceType('INFERNO_INTRO')).toBe('VOZ_NARRATIVA');
  });

  it('Test 10: INFERNO_Q1_SETUP returns VOZ_NARRATIVA (narrative)', () => {
    expect(getVoiceType('INFERNO_Q1_SETUP')).toBe('VOZ_NARRATIVA');
  });

  it('Test 11: INFERNO_Q1_RESPOSTA_A returns VOZ_NARRATIVA (narrative)', () => {
    expect(getVoiceType('INFERNO_Q1_RESPOSTA_A')).toBe('VOZ_NARRATIVA');
  });

  it('Test 12: DEVOLUCAO_SEEKER returns VOZ_NARRATIVA (narrative)', () => {
    expect(getVoiceType('DEVOLUCAO_SEEKER')).toBe('VOZ_NARRATIVA');
  });

  it('Test 13: DEVOLUCAO_ESPELHO_SILENCIOSO returns VOZ_NARRATIVA (narrative)', () => {
    expect(getVoiceType('DEVOLUCAO_ESPELHO_SILENCIOSO')).toBe('VOZ_NARRATIVA');
  });

  it('Test 14: PURGATORIO_Q4B_SETUP returns VOZ_NARRATIVA (branch setup)', () => {
    expect(getVoiceType('PURGATORIO_Q4B_SETUP')).toBe('VOZ_NARRATIVA');
  });

  it('Test 15: PARAISO_Q6B_RESPOSTA_B returns VOZ_NARRATIVA (branch response)', () => {
    expect(getVoiceType('PARAISO_Q6B_RESPOSTA_B')).toBe('VOZ_NARRATIVA');
  });
});

describe('getVoiceType — exhaustive coverage', () => {
  it('Test 16: every SCRIPT key returns a valid VoiceType', () => {
    const allKeys = Object.keys(SCRIPT);
    allKeys.forEach(key => {
      const vt = getVoiceType(key);
      expect(['VOZ_PERGUNTA', 'VOZ_NARRATIVA']).toContain(vt);
    });
  });

  it('Test 17: VOZ_PERGUNTA count is 35, VOZ_NARRATIVA count is 47', () => {
    const allKeys = Object.keys(SCRIPT);
    const pergunta = allKeys.filter(k => getVoiceType(k) === 'VOZ_PERGUNTA');
    const narrativa = allKeys.filter(k => getVoiceType(k) === 'VOZ_NARRATIVA');
    expect(pergunta.length).toBe(35);
    expect(narrativa.length).toBe(47);
  });
});

describe('getVoiceId — voice ID routing', () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    process.env.ELEVENLABS_VOICE_ID = 'test-voice-v1';
    process.env.ELEVENLABS_VOICE_ID_V2 = 'test-voice-v2';
  });

  afterEach(() => {
    process.env.ELEVENLABS_VOICE_ID = originalEnv.ELEVENLABS_VOICE_ID;
    process.env.ELEVENLABS_VOICE_ID_V2 = originalEnv.ELEVENLABS_VOICE_ID_V2;
  });

  it('Test 18: V1 + VOZ_PERGUNTA returns ELEVENLABS_VOICE_ID', () => {
    expect(getVoiceId('V1', 'VOZ_PERGUNTA')).toBe('test-voice-v1');
  });

  it('Test 19: V1 + VOZ_NARRATIVA returns ELEVENLABS_VOICE_ID (V1 = single voice)', () => {
    expect(getVoiceId('V1', 'VOZ_NARRATIVA')).toBe('test-voice-v1');
  });

  it('Test 20: V2 + VOZ_PERGUNTA returns ELEVENLABS_VOICE_ID (questions keep original)', () => {
    expect(getVoiceId('V2', 'VOZ_PERGUNTA')).toBe('test-voice-v1');
  });

  it('Test 21: V2 + VOZ_NARRATIVA returns ELEVENLABS_VOICE_ID_V2 (narrative gets somber)', () => {
    expect(getVoiceId('V2', 'VOZ_NARRATIVA')).toBe('test-voice-v2');
  });
});
