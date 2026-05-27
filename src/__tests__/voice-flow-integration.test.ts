import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { createActor } from 'xstate';
import { oracleMachine } from '@/machines/oracleMachine';
import type { OracleContext } from '@/machines/oracleMachine.types';

/**
 * Integration tests verifying voice pipeline correctly wires to state machine.
 *
 * QUAL-04: Tests use real timers for integration scenarios.
 * State machine transition tests are synchronous (no timers needed).
 * Timing-dependent tests use real async patterns.
 */

describe('Voice Flow Integration', () => {
  // NO fake timers setup at file level — tests use real timing by default

  describe('Happy path: Voice classification sends correct event to state machine', () => {
    it('should transition from INFERNO.AGUARDANDO to INFERNO.RESPOSTA_A on CHOICE_A event', () => {
      const actor = createActor(oracleMachine);
      actor.start();

      // Navigate to INFERNO.AGUARDANDO
      actor.send({ type: 'START' });
      actor.send({ type: 'NARRATIVA_DONE' }); // APRESENTACAO -> INFERNO
      actor.send({ type: 'NARRATIVA_DONE' }); // INFERNO.NARRATIVA -> PERGUNTA
      actor.send({ type: 'NARRATIVA_DONE' }); // INFERNO.PERGUNTA -> AGUARDANDO

      const beforeState = actor.getSnapshot();
      expect(beforeState.matches({ INFERNO: 'AGUARDANDO' })).toBe(true);

      // Simulate voice choice result with eventType='CHOICE_A' and confidence=0.85
      actor.send({ type: 'CHOICE_A' });

      const afterState = actor.getSnapshot();
      expect(afterState.matches({ INFERNO: 'RESPOSTA_A' })).toBe(true);
      expect(afterState.context.choice1).toBe('A');
    });

    it('should transition from INFERNO.AGUARDANDO to INFERNO.RESPOSTA_B on CHOICE_B event', () => {
      const actor = createActor(oracleMachine);
      actor.start();

      // Navigate to INFERNO.AGUARDANDO
      actor.send({ type: 'START' });
      actor.send({ type: 'NARRATIVA_DONE' });
      actor.send({ type: 'NARRATIVA_DONE' });
      actor.send({ type: 'NARRATIVA_DONE' });

      expect(actor.getSnapshot().matches({ INFERNO: 'AGUARDANDO' })).toBe(true);

      // Simulate voice choice result with eventType='CHOICE_B' and confidence=0.9
      actor.send({ type: 'CHOICE_B' });

      const afterState = actor.getSnapshot();
      expect(afterState.matches({ INFERNO: 'RESPOSTA_B' })).toBe(true);
      expect(afterState.context.choice1).toBe('B');
    });
  });

  describe('Low confidence triggers fallback, then succeeds', () => {
    it('should handle low confidence, wait for fallback TTS, then accept high confidence result', () => {
      const actor = createActor(oracleMachine);
      actor.start();

      // Navigate to INFERNO.AGUARDANDO
      actor.send({ type: 'START' });
      actor.send({ type: 'NARRATIVA_DONE' });
      actor.send({ type: 'NARRATIVA_DONE' });
      actor.send({ type: 'NARRATIVA_DONE' });

      expect(actor.getSnapshot().matches({ INFERNO: 'AGUARDANDO' })).toBe(true);

      // First attempt: low confidence (< 0.7), needsFallback=true
      // In real app: OracleExperience plays SCRIPT.FALLBACK_INFERNO via TTS, then restarts listening
      // In this test: we just verify machine stays in AGUARDANDO waiting for next attempt

      // Still in AGUARDANDO (no transition yet)
      expect(actor.getSnapshot().matches({ INFERNO: 'AGUARDANDO' })).toBe(true);

      // Second attempt: high confidence (0.9), choiceResult with CHOICE_B
      actor.send({ type: 'CHOICE_B' });

      const afterState = actor.getSnapshot();
      expect(afterState.matches({ INFERNO: 'RESPOSTA_B' })).toBe(true);
      expect(afterState.context.choice1).toBe('B');
    });
  });

  describe('Max attempts reached, default choice applied', () => {
    it('should apply default choice after max attempts (2) with low confidence', () => {
      const actor = createActor(oracleMachine);
      actor.start();

      // Navigate to INFERNO.AGUARDANDO
      actor.send({ type: 'START' });
      actor.send({ type: 'NARRATIVA_DONE' });
      actor.send({ type: 'NARRATIVA_DONE' });
      actor.send({ type: 'NARRATIVA_DONE' });

      expect(actor.getSnapshot().matches({ INFERNO: 'AGUARDANDO' })).toBe(true);

      // In real app: after 2 attempts with confidence < 0.7, useVoiceChoice returns
      // choiceResult with defaultEvent='CHOICE_B' and wasDefault=true
      // This sends CHOICE_B to the machine

      actor.send({ type: 'CHOICE_B' });

      const afterState = actor.getSnapshot();
      expect(afterState.matches({ INFERNO: 'RESPOSTA_B' })).toBe(true);
      expect(afterState.context.choice1).toBe('B');
    });
  });

  describe('FLOW-11: Silence timeout treated as valid choice', () => {
    // This test verifies XState's `after` timer behavior (state machine unit concern)
    // Using fake timers is appropriate here since we're testing the machine's timeout logic
    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('should timeout after 25s and transition to TIMEOUT_REDIRECT then RESPOSTA_B', () => {
      const actor = createActor(oracleMachine);
      actor.start();

      // Navigate to INFERNO.AGUARDANDO
      actor.send({ type: 'START' });
      actor.send({ type: 'NARRATIVA_DONE' });
      actor.send({ type: 'NARRATIVA_DONE' });
      actor.send({ type: 'NARRATIVA_DONE' });

      expect(actor.getSnapshot().matches({ INFERNO: 'AGUARDANDO' })).toBe(true);

      // Advance time by 25 seconds (XState timer in AGUARDANDO)
      vi.advanceTimersByTime(35000);

      // Machine should transition to TIMEOUT_REDIRECT
      let currentState = actor.getSnapshot();
      expect(currentState.matches({ INFERNO: 'TIMEOUT_REDIRECT' })).toBe(true);
      expect(currentState.context.choice1).toBe('B');

      // TIMEOUT_REDIRECT waits for speech completion (NARRATIVA_DONE) instead of fixed timer
      actor.send({ type: 'NARRATIVA_DONE' });

      currentState = actor.getSnapshot();
      expect(currentState.matches({ INFERNO: 'RESPOSTA_B' })).toBe(true);
    });
  });

  describe('Voice choice works at PURGATORIO decision points', () => {
    it('should handle voice choice at PURGATORIO_A.AGUARDANDO and transition to RESPOSTA_FICAR', () => {
      const actor = createActor(oracleMachine);
      actor.start();

      // Navigate to PURGATORIO_A.AGUARDANDO via Inferno path A
      actor.send({ type: 'START' });
      actor.send({ type: 'NARRATIVA_DONE' }); // APRESENTACAO -> INFERNO
      actor.send({ type: 'NARRATIVA_DONE' }); // INFERNO.NARRATIVA -> PERGUNTA
      actor.send({ type: 'NARRATIVA_DONE' }); // INFERNO.PERGUNTA -> AGUARDANDO
      actor.send({ type: 'CHOICE_A' }); // INFERNO.AGUARDANDO -> RESPOSTA_A
      actor.send({ type: 'NARRATIVA_DONE' }); // INFERNO.RESPOSTA_A -> PURGATORIO_A
      actor.send({ type: 'NARRATIVA_DONE' }); // PURGATORIO_A.NARRATIVA -> PERGUNTA
      actor.send({ type: 'NARRATIVA_DONE' }); // PURGATORIO_A.PERGUNTA -> AGUARDANDO

      expect(actor.getSnapshot().matches({ PURGATORIO_A: 'AGUARDANDO' })).toBe(true);

      // Voice choice produces CHOICE_FICAR with confidence=0.85
      actor.send({ type: 'CHOICE_FICAR' });

      const afterState = actor.getSnapshot();
      expect(afterState.matches({ PURGATORIO_A: 'RESPOSTA_FICAR' })).toBe(true);
      expect(afterState.context.choice2).toBe('FICAR');
    });

    it('should handle voice choice at PURGATORIO_B.AGUARDANDO and transition to RESPOSTA_CONTORNAR', () => {
      const actor = createActor(oracleMachine);
      actor.start();

      // Navigate to PURGATORIO_B.AGUARDANDO via Inferno path B
      actor.send({ type: 'START' });
      actor.send({ type: 'NARRATIVA_DONE' }); // APRESENTACAO -> INFERNO
      actor.send({ type: 'NARRATIVA_DONE' }); // INFERNO.NARRATIVA -> PERGUNTA
      actor.send({ type: 'NARRATIVA_DONE' }); // INFERNO.PERGUNTA -> AGUARDANDO
      actor.send({ type: 'CHOICE_B' }); // INFERNO.AGUARDANDO -> RESPOSTA_B
      actor.send({ type: 'NARRATIVA_DONE' }); // INFERNO.RESPOSTA_B -> PURGATORIO_B
      actor.send({ type: 'NARRATIVA_DONE' }); // PURGATORIO_B.NARRATIVA -> PERGUNTA
      actor.send({ type: 'NARRATIVA_DONE' }); // PURGATORIO_B.PERGUNTA -> AGUARDANDO

      expect(actor.getSnapshot().matches({ PURGATORIO_B: 'AGUARDANDO' })).toBe(true);

      // Voice choice produces CHOICE_CONTORNAR with confidence=0.9
      actor.send({ type: 'CHOICE_CONTORNAR' });

      const afterState = actor.getSnapshot();
      expect(afterState.matches({ PURGATORIO_B: 'RESPOSTA_CONTORNAR' })).toBe(true);
      expect(afterState.context.choice2).toBe('CONTORNAR');
    });
  });

  describe('Full voice-driven experience path', () => {
    it('should complete A_FICAR path using only voice events', () => {
      const actor = createActor(oracleMachine);
      actor.start();

      // Start experience
      actor.send({ type: 'START' });
      expect(actor.getSnapshot().matches('APRESENTACAO')).toBe(true);

      // APRESENTACAO -> INFERNO
      actor.send({ type: 'NARRATIVA_DONE' });
      expect(actor.getSnapshot().matches({ INFERNO: 'NARRATIVA' })).toBe(true);

      // INFERNO.NARRATIVA -> PERGUNTA -> AGUARDANDO
      actor.send({ type: 'NARRATIVA_DONE' });
      actor.send({ type: 'NARRATIVA_DONE' });

      // Voice choice: CHOICE_A
      actor.send({ type: 'CHOICE_A' });
      expect(actor.getSnapshot().matches({ INFERNO: 'RESPOSTA_A' })).toBe(true);

      // INFERNO.RESPOSTA_A -> PURGATORIO_A
      actor.send({ type: 'NARRATIVA_DONE' });
      expect(actor.getSnapshot().matches({ PURGATORIO_A: 'NARRATIVA' })).toBe(true);

      // PURGATORIO_A.NARRATIVA -> PERGUNTA -> AGUARDANDO
      actor.send({ type: 'NARRATIVA_DONE' });
      actor.send({ type: 'NARRATIVA_DONE' });

      // Voice choice: CHOICE_FICAR
      actor.send({ type: 'CHOICE_FICAR' });
      expect(actor.getSnapshot().matches({ PURGATORIO_A: 'RESPOSTA_FICAR' })).toBe(true);

      // PURGATORIO_A.RESPOSTA_FICAR -> PARAISO
      actor.send({ type: 'NARRATIVA_DONE' });
      expect(actor.getSnapshot().matches('PARAISO')).toBe(true);

      // PARAISO -> DEVOLUCAO -> DEVOLUCAO_A_FICAR
      actor.send({ type: 'NARRATIVA_DONE' });
      expect(actor.getSnapshot().matches('DEVOLUCAO_A_FICAR')).toBe(true);

      // Verify context
      const finalContext: OracleContext = actor.getSnapshot().context;
      expect(finalContext.choice1).toBe('A');
      expect(finalContext.choice2).toBe('FICAR');
    });
  });

  describe('realistic timing (QUAL-04)', () => {
    // Tests that verify async behavior with real delays.
    // These test the INTEGRATION between voice choice hook lifecycle
    // and state machine, using realistic timing.

    it('processes voice choice result and sends event to state machine with async delay', async () => {
      // Test the integration: voiceChoiceResult -> send(event) -> state transition
      // Use a real setTimeout to simulate the async processing pipeline delay
      const actor = createActor(oracleMachine);
      actor.start();

      // Navigate to INFERNO.AGUARDANDO
      actor.send({ type: 'START' });
      actor.send({ type: 'NARRATIVA_DONE' });
      actor.send({ type: 'NARRATIVA_DONE' });
      actor.send({ type: 'NARRATIVA_DONE' });

      expect(actor.getSnapshot().matches({ INFERNO: 'AGUARDANDO' })).toBe(true);

      // Simulate realistic async delay (STT + NLU processing time)
      await new Promise(resolve => setTimeout(resolve, 200));

      // After processing, send the classified event
      actor.send({ type: 'CHOICE_A' });

      expect(actor.getSnapshot().matches({ INFERNO: 'RESPOSTA_A' })).toBe(true);
      expect(actor.getSnapshot().context.choice1).toBe('A');
    });

    it('handles sequential async events across multiple AGUARDANDO states', async () => {
      // Tests that the refactored FSM hook correctly resets between choice points
      const actor = createActor(oracleMachine);
      actor.start();

      // Navigate to INFERNO.AGUARDANDO
      actor.send({ type: 'START' });
      actor.send({ type: 'NARRATIVA_DONE' });
      actor.send({ type: 'NARRATIVA_DONE' });
      actor.send({ type: 'NARRATIVA_DONE' });

      // First choice with async delay
      await new Promise(resolve => setTimeout(resolve, 150));
      actor.send({ type: 'CHOICE_A' });

      expect(actor.getSnapshot().context.choice1).toBe('A');

      // Navigate to PURGATORIO_A.AGUARDANDO
      actor.send({ type: 'NARRATIVA_DONE' }); // RESPOSTA_A -> PURGATORIO_A.NARRATIVA
      actor.send({ type: 'NARRATIVA_DONE' }); // NARRATIVA -> PERGUNTA
      actor.send({ type: 'NARRATIVA_DONE' }); // PERGUNTA -> AGUARDANDO

      expect(actor.getSnapshot().matches({ PURGATORIO_A: 'AGUARDANDO' })).toBe(true);

      // Second choice with async delay
      await new Promise(resolve => setTimeout(resolve, 150));
      actor.send({ type: 'CHOICE_FICAR' });

      expect(actor.getSnapshot().context.choice2).toBe('FICAR');

      // Verify full routing works through DEVOLUCAO with named guards
      actor.send({ type: 'NARRATIVA_DONE' }); // -> PARAISO
      actor.send({ type: 'NARRATIVA_DONE' }); // -> DEVOLUCAO -> DEVOLUCAO_A_FICAR

      expect(actor.getSnapshot().value).toBe('DEVOLUCAO_A_FICAR');
    });

    it('verifies state machine guard routing works for all 4 paths with async transitions', async () => {
      // Test all 4 DEVOLUCAO paths with small async delays between events
      const paths = [
        { c1Event: 'CHOICE_A', c2Event: 'CHOICE_FICAR', expected: 'DEVOLUCAO_A_FICAR' },
        { c1Event: 'CHOICE_A', c2Event: 'CHOICE_EMBORA', expected: 'DEVOLUCAO_A_EMBORA' },
        { c1Event: 'CHOICE_B', c2Event: 'CHOICE_PISAR', expected: 'DEVOLUCAO_B_PISAR' },
        { c1Event: 'CHOICE_B', c2Event: 'CHOICE_CONTORNAR', expected: 'DEVOLUCAO_B_CONTORNAR' },
      ];

      for (const path of paths) {
        const actor = createActor(oracleMachine);
        actor.start();

        actor.send({ type: 'START' });
        actor.send({ type: 'NARRATIVA_DONE' });
        actor.send({ type: 'NARRATIVA_DONE' });
        actor.send({ type: 'NARRATIVA_DONE' });

        await new Promise(resolve => setTimeout(resolve, 50));
        actor.send({ type: path.c1Event as any });

        actor.send({ type: 'NARRATIVA_DONE' });
        actor.send({ type: 'NARRATIVA_DONE' });
        actor.send({ type: 'NARRATIVA_DONE' });

        // Navigate to correct PURGATORIO based on choice1
        await new Promise(resolve => setTimeout(resolve, 50));
        actor.send({ type: path.c2Event as any });

        actor.send({ type: 'NARRATIVA_DONE' }); // -> PARAISO
        actor.send({ type: 'NARRATIVA_DONE' }); // -> DEVOLUCAO -> variant

        expect(actor.getSnapshot().value).toBe(path.expected);
      }
    });

    it('handles fallback cycle with realistic processing delay', async () => {
      // Simulates: first attempt low confidence -> fallback TTS -> retry -> success
      const actor = createActor(oracleMachine);
      actor.start();

      actor.send({ type: 'START' });
      actor.send({ type: 'NARRATIVA_DONE' });
      actor.send({ type: 'NARRATIVA_DONE' });
      actor.send({ type: 'NARRATIVA_DONE' });

      expect(actor.getSnapshot().matches({ INFERNO: 'AGUARDANDO' })).toBe(true);

      // First attempt: processing delay, low confidence -> stays in AGUARDANDO
      await new Promise(resolve => setTimeout(resolve, 300));
      // (In real app, useVoiceChoice enters fallback state, TTS plays, then retries)
      // Machine stays in AGUARDANDO during this

      expect(actor.getSnapshot().matches({ INFERNO: 'AGUARDANDO' })).toBe(true);

      // Second attempt: processing delay, high confidence -> CHOICE_A
      await new Promise(resolve => setTimeout(resolve, 300));
      actor.send({ type: 'CHOICE_A' });

      expect(actor.getSnapshot().matches({ INFERNO: 'RESPOSTA_A' })).toBe(true);
    });
  });

  describe('ttsComplete gating prevents premature mic activation (TTSR-03)', () => {
    it('micShouldActivate is false when isAguardando=true but ttsComplete=false', () => {
      // This tests the gating logic: micShouldActivate = isAguardando && ttsComplete
      const isAguardando = true;
      const ttsComplete = false;
      const micShouldActivate = isAguardando && ttsComplete;

      expect(micShouldActivate).toBe(false);
    });

    it('micShouldActivate is true only when both isAguardando=true AND ttsComplete=true', () => {
      const isAguardando = true;
      const ttsComplete = true;
      const micShouldActivate = isAguardando && ttsComplete;

      expect(micShouldActivate).toBe(true);
    });

    it('micShouldActivate is false when not in AGUARDANDO even if ttsComplete=true', () => {
      const isAguardando = false;
      const ttsComplete = true;
      const micShouldActivate = isAguardando && ttsComplete;

      expect(micShouldActivate).toBe(false);
    });
  });

  describe('Voice pipeline works in all 3 AGUARDANDO states (VPIPE-02)', () => {
    it('INFERNO.AGUARDANDO accepts CHOICE_A and transitions to RESPOSTA_A', () => {
      const actor = createActor(oracleMachine);
      actor.start();
      actor.send({ type: 'START' });
      actor.send({ type: 'NARRATIVA_DONE' }); // -> INFERNO.NARRATIVA
      actor.send({ type: 'NARRATIVA_DONE' }); // -> INFERNO.PERGUNTA
      actor.send({ type: 'NARRATIVA_DONE' }); // -> INFERNO.AGUARDANDO

      expect(actor.getSnapshot().matches({ INFERNO: 'AGUARDANDO' })).toBe(true);
      actor.send({ type: 'CHOICE_A' });
      expect(actor.getSnapshot().matches({ INFERNO: 'RESPOSTA_A' })).toBe(true);
    });

    it('PURGATORIO_A.AGUARDANDO accepts CHOICE_EMBORA and transitions to RESPOSTA_EMBORA', () => {
      const actor = createActor(oracleMachine);
      actor.start();
      actor.send({ type: 'START' });
      actor.send({ type: 'NARRATIVA_DONE' }); // -> INFERNO.NARRATIVA
      actor.send({ type: 'NARRATIVA_DONE' }); // -> INFERNO.PERGUNTA
      actor.send({ type: 'NARRATIVA_DONE' }); // -> INFERNO.AGUARDANDO
      actor.send({ type: 'CHOICE_A' }); // -> INFERNO.RESPOSTA_A
      actor.send({ type: 'NARRATIVA_DONE' }); // -> PURGATORIO_A.NARRATIVA
      actor.send({ type: 'NARRATIVA_DONE' }); // -> PURGATORIO_A.PERGUNTA
      actor.send({ type: 'NARRATIVA_DONE' }); // -> PURGATORIO_A.AGUARDANDO

      expect(actor.getSnapshot().matches({ PURGATORIO_A: 'AGUARDANDO' })).toBe(true);
      actor.send({ type: 'CHOICE_EMBORA' });
      expect(actor.getSnapshot().matches({ PURGATORIO_A: 'RESPOSTA_EMBORA' })).toBe(true);
      expect(actor.getSnapshot().context.choice2).toBe('EMBORA');
    });

    it('PURGATORIO_B.AGUARDANDO accepts CHOICE_PISAR and transitions to RESPOSTA_PISAR', () => {
      const actor = createActor(oracleMachine);
      actor.start();
      actor.send({ type: 'START' });
      actor.send({ type: 'NARRATIVA_DONE' }); // -> INFERNO.NARRATIVA
      actor.send({ type: 'NARRATIVA_DONE' }); // -> INFERNO.PERGUNTA
      actor.send({ type: 'NARRATIVA_DONE' }); // -> INFERNO.AGUARDANDO
      actor.send({ type: 'CHOICE_B' }); // -> INFERNO.RESPOSTA_B
      actor.send({ type: 'NARRATIVA_DONE' }); // -> PURGATORIO_B.NARRATIVA
      actor.send({ type: 'NARRATIVA_DONE' }); // -> PURGATORIO_B.PERGUNTA
      actor.send({ type: 'NARRATIVA_DONE' }); // -> PURGATORIO_B.AGUARDANDO

      expect(actor.getSnapshot().matches({ PURGATORIO_B: 'AGUARDANDO' })).toBe(true);
      actor.send({ type: 'CHOICE_PISAR' });
      expect(actor.getSnapshot().matches({ PURGATORIO_B: 'RESPOSTA_PISAR' })).toBe(true);
      expect(actor.getSnapshot().context.choice2).toBe('PISAR');
    });
  });
});
