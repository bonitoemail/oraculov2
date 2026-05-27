import { setup, assign } from 'xstate';
import type { OracleContextV4, OracleEventV4 } from './oracleMachine.types';
import { INITIAL_CONTEXT_V4, recordChoice } from './oracleMachine.types';
import { ARCHETYPE_GUARDS } from './guards/patternMatching';

/**
 * Oracle State Machine v4 - Branching 6-8 Choice Flow
 *
 * Rewrite for v4.0 milestone: Game Flow — Branching Decisions
 *
 * Structure:
 * - IDLE -> APRESENTACAO -> INFERNO -> PURGATORIO -> PARAISO -> DEVOLUCAO -> ENCERRAMENTO -> FIM -> IDLE
 * - 6 base choices (Q1-Q6) + 2 conditional branches (Q2B, Q4B) = 6-8 decision points
 * - Q2B unlocked when Q1=A AND Q2=A (visitor ficou AND recuou)
 * - Q4B unlocked when Q3=A AND Q4=A (visitor entrou AND lembrou)
 * - Pattern-based devolucao routing via ARCHETYPE_GUARDS (handles variable-length arrays)
 *
 * Hierarchical states:
 * - INFERNO: Q1 + Q2 + conditional Q2B (shouldBranchQ2B guard)
 * - PURGATORIO: Q3 + Q4 + conditional Q4B (shouldBranchQ4B guard)
 * - PARAISO: Q5 + Q6
 *
 * Each question follows: SETUP -> PERGUNTA -> AGUARDANDO -> TIMEOUT or RESPOSTA_A/B
 */
export const oracleMachine = setup({
  types: {} as {
    context: OracleContextV4;
    events: OracleEventV4;
  },
  guards: {
    // Archetype guards (existing)
    isMirror: ARCHETYPE_GUARDS.isMirror,
    isDepthSeeker: ARCHETYPE_GUARDS.isDepthSeeker,
    isSurfaceKeeper: ARCHETYPE_GUARDS.isSurfaceKeeper,
    isPivotEarly: ARCHETYPE_GUARDS.isPivotEarly,
    isPivotLate: ARCHETYPE_GUARDS.isPivotLate,
    isSeeker: ARCHETYPE_GUARDS.isSeeker,
    isGuardian: ARCHETYPE_GUARDS.isGuardian,
    isContradicted: ARCHETYPE_GUARDS.isContradicted,
    // Phase 34 — AR-02 + AR-03 archetype guards (read context.choiceMap)
    isContraFobico: ARCHETYPE_GUARDS.isContraFobico,
    isPortador: ARCHETYPE_GUARDS.isPortador,
    // Branch guards (new)
    shouldBranchQ2B: ({ context }) => context.choiceMap.q1 === 'A' && context.choiceMap.q2 === 'A',
    shouldBranchQ4B: ({ context }) => context.choiceMap.q3 === 'A' && context.choiceMap.q4 === 'A',
    // Branch guards (new — Phase 31, BR-01)
    shouldBranchQ1B: ({ context }) => context.choiceMap.q1 === 'B' && context.choiceMap.q2 === 'B',
    // Branch guards (new — Phase 32, BR-02)
    shouldBranchQ5B: ({ context }) => context.choiceMap.q4 === 'A' && context.choiceMap.q5 === 'A',
    // Branch guards (new — Phase 33, BR-03)
    shouldBranchQ6B: ({ context }) =>
      context.choiceMap.q5 === 'B' && context.choiceMap.q6 === 'A',
    // Phase 33 — AR-01 (DEVOLUCAO_ESPELHO_SILENCIOSO trigger)
    // HIGHEST PRIORITY in DEVOLUCAO.always — must be checked first.
    // Lives here (NOT in patternMatching.ts) because it reads choiceMap.q6b
    // which is a NAMED lookup, not a positional index in context.choices.
    // POL-02 invariant: patternMatching.ts MUST stay byte-identical.
    isEspelhoSilencioso: ({ context }) => context.choiceMap.q6b === 'B',
  },
}).createMachine({
  id: 'oracle',
  initial: 'IDLE',
  context: INITIAL_CONTEXT_V4,
  on: {
    FALLBACK_USED: {
      actions: assign({
        fallbackCount: ({ context }) => context.fallbackCount + 1,
      }),
    },
  },
  states: {
    IDLE: {
      on: {
        START: {
          target: 'APRESENTACAO',
          actions: assign({
            sessionId: () => crypto.randomUUID(),
            choices: [],
            choiceMap: {},
            fallbackCount: 0,
            currentPhase: 'APRESENTACAO',
          }),
        },
      },
    },

    APRESENTACAO: {
      entry: assign({ currentPhase: 'APRESENTACAO' }),
      on: {
        NARRATIVA_DONE: 'INFERNO',
      },
      after: {
        300000: {
          target: '#oracle.IDLE',
          actions: assign({
            sessionId: '',
            choices: [],
            choiceMap: {},
            fallbackCount: 0,
            currentPhase: 'APRESENTACAO',
          }),
        },
      },
    },

    INFERNO: {
      id: 'INFERNO',
      initial: 'INTRO',
      entry: assign({ currentPhase: 'INFERNO' }),
      after: {
        300000: {
          target: '#oracle.IDLE',
          actions: assign({
            sessionId: '',
            choices: [],
            choiceMap: {},
            fallbackCount: 0,
            currentPhase: 'APRESENTACAO',
          }),
        },
      },
      states: {
        INTRO: {
          on: {
            NARRATIVA_DONE: 'Q1_SETUP',
          },
        },
        Q1_SETUP: {
          on: {
            NARRATIVA_DONE: 'Q1_PERGUNTA',
          },
        },
        Q1_PERGUNTA: {
          on: {
            NARRATIVA_DONE: 'Q1_AGUARDANDO',
          },
        },
        Q1_AGUARDANDO: {
          after: {
            35000: {
              target: 'Q1_TIMEOUT',
              actions: assign(recordChoice('q1', 'A')),
            },
          },
          on: {
            CHOICE_A: {
              target: 'Q1_RESPOSTA_A',
              actions: assign(recordChoice('q1', 'A')),
            },
            CHOICE_B: {
              target: 'Q1_RESPOSTA_B',
              actions: assign(recordChoice('q1', 'B')),
            },
          },
        },
        Q1_TIMEOUT: {
          on: {
            NARRATIVA_DONE: 'Q1_RESPOSTA_A',
          },
        },
        Q1_RESPOSTA_A: {
          on: {
            NARRATIVA_DONE: 'Q2_SETUP',
          },
        },
        Q1_RESPOSTA_B: {
          on: {
            NARRATIVA_DONE: 'Q2_SETUP',
          },
        },
        Q2_SETUP: {
          on: {
            NARRATIVA_DONE: 'Q2_PERGUNTA',
          },
        },
        Q2_PERGUNTA: {
          on: {
            NARRATIVA_DONE: 'Q2_AGUARDANDO',
          },
        },
        Q2_AGUARDANDO: {
          after: {
            35000: {
              target: 'Q2_TIMEOUT',
              actions: assign(recordChoice('q2', 'A')),
            },
          },
          on: {
            CHOICE_A: {
              target: 'Q2_RESPOSTA_A',
              actions: assign(recordChoice('q2', 'A')),
            },
            CHOICE_B: {
              target: 'Q2_RESPOSTA_B',
              actions: assign(recordChoice('q2', 'B')),
            },
          },
        },
        Q2_TIMEOUT: {
          on: {
            NARRATIVA_DONE: 'Q2_RESPOSTA_A',
          },
        },
        Q2_RESPOSTA_A: {
          on: {
            NARRATIVA_DONE: [
              { target: 'Q2B_SETUP', guard: 'shouldBranchQ2B' },
              { target: '#oracle.PURGATORIO' },
            ],
          },
        },
        Q2_RESPOSTA_B: {
          on: {
            NARRATIVA_DONE: [
              { target: 'Q1B_SETUP', guard: 'shouldBranchQ1B' },
              { target: '#oracle.PURGATORIO' },
            ],
          },
        },
        // Q2B Branch states — conditional, only entered when shouldBranchQ2B guard passes
        Q2B_SETUP: {
          on: {
            NARRATIVA_DONE: 'Q2B_PERGUNTA',
          },
        },
        Q2B_PERGUNTA: {
          on: {
            NARRATIVA_DONE: 'Q2B_AGUARDANDO',
          },
        },
        Q2B_AGUARDANDO: {
          after: {
            35000: {
              target: 'Q2B_TIMEOUT',
              actions: assign(recordChoice('q2b', 'A')),
            },
          },
          on: {
            CHOICE_A: {
              target: 'Q2B_RESPOSTA_A',
              actions: assign(recordChoice('q2b', 'A')),
            },
            CHOICE_B: {
              target: 'Q2B_RESPOSTA_B',
              actions: assign(recordChoice('q2b', 'B')),
            },
          },
        },
        Q2B_TIMEOUT: {
          on: {
            NARRATIVA_DONE: 'Q2B_RESPOSTA_A',
          },
        },
        Q2B_RESPOSTA_A: {
          on: {
            NARRATIVA_DONE: '#oracle.PURGATORIO',
          },
        },
        Q2B_RESPOSTA_B: {
          on: {
            NARRATIVA_DONE: '#oracle.PURGATORIO',
          },
        },
        // Q1B Branch states — conditional, only entered when shouldBranchQ1B guard passes
        // Triggers from Q2_RESPOSTA_B when q1='B' AND q2='B' (contra-fobico profile)
        // Both rejoin at #oracle.PURGATORIO (Phase 31, BR-01)
        Q1B_SETUP: {
          on: {
            NARRATIVA_DONE: 'Q1B_PERGUNTA',
          },
        },
        Q1B_PERGUNTA: {
          on: {
            NARRATIVA_DONE: 'Q1B_AGUARDANDO',
          },
        },
        Q1B_AGUARDANDO: {
          after: {
            35000: {
              target: 'Q1B_TIMEOUT',
              actions: assign(recordChoice('q1b', 'A')),
            },
          },
          on: {
            CHOICE_A: {
              target: 'Q1B_RESPOSTA_A',
              actions: assign(recordChoice('q1b', 'A')),
            },
            CHOICE_B: {
              target: 'Q1B_RESPOSTA_B',
              actions: assign(recordChoice('q1b', 'B')),
            },
          },
        },
        Q1B_TIMEOUT: {
          on: {
            NARRATIVA_DONE: 'Q1B_RESPOSTA_A',
          },
        },
        Q1B_RESPOSTA_A: {
          on: {
            NARRATIVA_DONE: '#oracle.PURGATORIO',
          },
        },
        Q1B_RESPOSTA_B: {
          on: {
            NARRATIVA_DONE: '#oracle.PURGATORIO',
          },
        },
      },
    },

    PURGATORIO: {
      id: 'PURGATORIO',
      initial: 'INTRO',
      entry: assign({ currentPhase: 'PURGATORIO' }),
      after: {
        300000: {
          target: '#oracle.IDLE',
          actions: assign({
            sessionId: '',
            choices: [],
            choiceMap: {},
            fallbackCount: 0,
            currentPhase: 'APRESENTACAO',
          }),
        },
      },
      states: {
        INTRO: {
          on: {
            NARRATIVA_DONE: 'Q3_SETUP',
          },
        },
        Q3_SETUP: {
          on: {
            NARRATIVA_DONE: 'Q3_PERGUNTA',
          },
        },
        Q3_PERGUNTA: {
          on: {
            NARRATIVA_DONE: 'Q3_AGUARDANDO',
          },
        },
        Q3_AGUARDANDO: {
          after: {
            35000: {
              target: 'Q3_TIMEOUT',
              actions: assign(recordChoice('q3', 'A')),
            },
          },
          on: {
            CHOICE_A: {
              target: 'Q3_RESPOSTA_A',
              actions: assign(recordChoice('q3', 'A')),
            },
            CHOICE_B: {
              target: 'Q3_RESPOSTA_B',
              actions: assign(recordChoice('q3', 'B')),
            },
          },
        },
        Q3_TIMEOUT: {
          on: {
            NARRATIVA_DONE: 'Q3_RESPOSTA_A',
          },
        },
        Q3_RESPOSTA_A: {
          on: {
            NARRATIVA_DONE: 'Q4_SETUP',
          },
        },
        Q3_RESPOSTA_B: {
          on: {
            NARRATIVA_DONE: 'Q4_SETUP',
          },
        },
        Q4_SETUP: {
          on: {
            NARRATIVA_DONE: 'Q4_PERGUNTA',
          },
        },
        Q4_PERGUNTA: {
          on: {
            NARRATIVA_DONE: 'Q4_AGUARDANDO',
          },
        },
        Q4_AGUARDANDO: {
          after: {
            35000: {
              target: 'Q4_TIMEOUT',
              actions: assign(recordChoice('q4', 'A')),
            },
          },
          on: {
            CHOICE_A: {
              target: 'Q4_RESPOSTA_A',
              actions: assign(recordChoice('q4', 'A')),
            },
            CHOICE_B: {
              target: 'Q4_RESPOSTA_B',
              actions: assign(recordChoice('q4', 'B')),
            },
          },
        },
        Q4_TIMEOUT: {
          on: {
            NARRATIVA_DONE: 'Q4_RESPOSTA_A',
          },
        },
        Q4_RESPOSTA_A: {
          on: {
            NARRATIVA_DONE: [
              { target: 'Q4B_SETUP', guard: 'shouldBranchQ4B' },
              { target: '#oracle.PARAISO' },
            ],
          },
        },
        Q4_RESPOSTA_B: {
          on: {
            NARRATIVA_DONE: '#oracle.PARAISO',
          },
        },
        // Q4B Branch states — conditional, only entered when shouldBranchQ4B guard passes
        Q4B_SETUP: {
          on: {
            NARRATIVA_DONE: 'Q4B_PERGUNTA',
          },
        },
        Q4B_PERGUNTA: {
          on: {
            NARRATIVA_DONE: 'Q4B_AGUARDANDO',
          },
        },
        Q4B_AGUARDANDO: {
          after: {
            35000: {
              target: 'Q4B_TIMEOUT',
              actions: assign(recordChoice('q4b', 'A')),
            },
          },
          on: {
            CHOICE_A: {
              target: 'Q4B_RESPOSTA_A',
              actions: assign(recordChoice('q4b', 'A')),
            },
            CHOICE_B: {
              target: 'Q4B_RESPOSTA_B',
              actions: assign(recordChoice('q4b', 'B')),
            },
          },
        },
        Q4B_TIMEOUT: {
          on: {
            NARRATIVA_DONE: 'Q4B_RESPOSTA_A',
          },
        },
        Q4B_RESPOSTA_A: {
          on: {
            NARRATIVA_DONE: '#oracle.PARAISO',
          },
        },
        Q4B_RESPOSTA_B: {
          on: {
            NARRATIVA_DONE: '#oracle.PARAISO',
          },
        },
      },
    },

    PARAISO: {
      id: 'PARAISO',
      initial: 'INTRO',
      entry: assign({ currentPhase: 'PARAISO' }),
      after: {
        300000: {
          target: '#oracle.IDLE',
          actions: assign({
            sessionId: '',
            choices: [],
            choiceMap: {},
            fallbackCount: 0,
            currentPhase: 'APRESENTACAO',
          }),
        },
      },
      states: {
        INTRO: {
          on: {
            NARRATIVA_DONE: 'Q5_SETUP',
          },
        },
        Q5_SETUP: {
          on: {
            NARRATIVA_DONE: 'Q5_PERGUNTA',
          },
        },
        Q5_PERGUNTA: {
          on: {
            NARRATIVA_DONE: 'Q5_AGUARDANDO',
          },
        },
        Q5_AGUARDANDO: {
          after: {
            35000: {
              target: 'Q5_TIMEOUT',
              actions: assign(recordChoice('q5', 'A')),
            },
          },
          on: {
            CHOICE_A: {
              target: 'Q5_RESPOSTA_A',
              actions: assign(recordChoice('q5', 'A')),
            },
            CHOICE_B: {
              target: 'Q5_RESPOSTA_B',
              actions: assign(recordChoice('q5', 'B')),
            },
          },
        },
        Q5_TIMEOUT: {
          on: {
            NARRATIVA_DONE: 'Q5_RESPOSTA_A',
          },
        },
        Q5_RESPOSTA_A: {
          on: {
            NARRATIVA_DONE: [
              { target: 'Q5B_SETUP', guard: 'shouldBranchQ5B' },
              { target: 'Q6_SETUP' },
            ],
          },
        },
        Q5_RESPOSTA_B: {
          on: {
            NARRATIVA_DONE: 'Q6_SETUP',
          },
        },
        Q6_SETUP: {
          on: {
            NARRATIVA_DONE: 'Q6_PERGUNTA',
          },
        },
        Q6_PERGUNTA: {
          on: {
            NARRATIVA_DONE: 'Q6_AGUARDANDO',
          },
        },
        Q6_AGUARDANDO: {
          after: {
            35000: {
              target: 'Q6_TIMEOUT',
              actions: assign(recordChoice('q6', 'B')),
            },
          },
          on: {
            CHOICE_A: {
              target: 'Q6_RESPOSTA_A',
              actions: assign(recordChoice('q6', 'A')),
            },
            CHOICE_B: {
              target: 'Q6_RESPOSTA_B',
              actions: assign(recordChoice('q6', 'B')),
            },
          },
        },
        Q6_TIMEOUT: {
          on: {
            NARRATIVA_DONE: 'Q6_RESPOSTA_B',
          },
        },
        Q6_RESPOSTA_A: {
          on: {
            NARRATIVA_DONE: [
              { target: 'Q6B_SETUP', guard: 'shouldBranchQ6B' },
              { target: '#oracle.DEVOLUCAO' },
            ],
          },
        },
        Q6_RESPOSTA_B: {
          on: {
            NARRATIVA_DONE: '#oracle.DEVOLUCAO',
          },
        },
        // Phase 33 — Q6B branch ("O Espelho Extra")
        // Triggered by shouldBranchQ6B (q5='B' && q6='A').
        // Both rejoin paths use QUALIFIED '#oracle.DEVOLUCAO' (DEVOLUCAO is at machine root).
        Q6B_SETUP: {
          on: { NARRATIVA_DONE: 'Q6B_PERGUNTA' },
        },
        Q6B_PERGUNTA: {
          on: { NARRATIVA_DONE: 'Q6B_AGUARDANDO' },
        },
        Q6B_AGUARDANDO: {
          after: {
            35000: {
              target: 'Q6B_TIMEOUT',
              // DEFAULT 'A' on silence — silence MUST NEVER fire ESPELHO_SILENCIOSO.
              actions: assign(recordChoice('q6b', 'A')),
            },
          },
          on: {
            CHOICE_A: {
              target: 'Q6B_RESPOSTA_A',
              actions: assign(recordChoice('q6b', 'A')),
            },
            CHOICE_B: {
              target: 'Q6B_RESPOSTA_B',
              actions: assign(recordChoice('q6b', 'B')),
            },
          },
        },
        Q6B_TIMEOUT: {
          on: { NARRATIVA_DONE: 'Q6B_RESPOSTA_A' },
        },
        Q6B_RESPOSTA_A: {
          // QUALIFIED rejoin — DEVOLUCAO is at machine root, NOT inside PARAISO.
          on: { NARRATIVA_DONE: '#oracle.DEVOLUCAO' },
        },
        Q6B_RESPOSTA_B: {
          // QUALIFIED rejoin — once at DEVOLUCAO root, isEspelhoSilencioso at always[0] fires.
          on: { NARRATIVA_DONE: '#oracle.DEVOLUCAO' },
        },
        // Q5B Branch states — conditional, only entered when shouldBranchQ5B guard passes
        // Triggers from Q5_RESPOSTA_A when q4='A' AND q5='A' (PORTADOR profile precursor)
        // Both rejoin at sibling Q6_SETUP (Phase 32, BR-02)
        // CRITICAL: target is plain 'Q6_SETUP' (NO #oracle. prefix) — sibling reference inside PARAISO
        Q5B_SETUP: {
          on: {
            NARRATIVA_DONE: 'Q5B_PERGUNTA',
          },
        },
        Q5B_PERGUNTA: {
          on: {
            NARRATIVA_DONE: 'Q5B_AGUARDANDO',
          },
        },
        Q5B_AGUARDANDO: {
          after: {
            35000: {
              target: 'Q5B_TIMEOUT',
              actions: assign(recordChoice('q5b', 'A')),
            },
          },
          on: {
            CHOICE_A: {
              target: 'Q5B_RESPOSTA_A',
              actions: assign(recordChoice('q5b', 'A')),
            },
            CHOICE_B: {
              target: 'Q5B_RESPOSTA_B',
              actions: assign(recordChoice('q5b', 'B')),
            },
          },
        },
        Q5B_TIMEOUT: {
          on: {
            NARRATIVA_DONE: 'Q5B_RESPOSTA_A',
          },
        },
        Q5B_RESPOSTA_A: {
          on: {
            NARRATIVA_DONE: 'Q6_SETUP',
          },
        },
        Q5B_RESPOSTA_B: {
          on: {
            NARRATIVA_DONE: 'Q6_SETUP',
          },
        },
      },
    },

    DEVOLUCAO: {
      id: 'DEVOLUCAO',
      entry: assign({ currentPhase: 'DEVOLUCAO' }),
      always: [
        // [0] HIGHEST PRIORITY — Phase 33, AR-01
        // ESPELHO_SILENCIOSO must be checked FIRST. Triggered by isEspelhoSilencioso (q6b='B').
        // First-match-wins: this entry MUST stay at index [0] or routing breaks.
        { target: 'DEVOLUCAO_ESPELHO_SILENCIOSO', guard: 'isEspelhoSilencioso' },
        // [1] Phase 34 — AR-02 — CONTRA_FOBICO (q1=B && q2=B && q1b=A)
        // Reads choiceMap.q1b — bespoke field-isolated guard (POL-02 deeper invariant).
        { target: 'DEVOLUCAO_CONTRA_FOBICO', guard: 'isContraFobico' },
        // [2] Phase 34 — AR-03 — PORTADOR (q4=A && q5=A && q5b=A)
        // Reads choiceMap.q5b — bespoke field-isolated guard.
        { target: 'DEVOLUCAO_PORTADOR', guard: 'isPortador' },
        // [3-10] — 8 baseline archetypes (preserved order, indices shifted +2 from Phase 33)
        { target: 'DEVOLUCAO_MIRROR', guard: 'isMirror' },
        { target: 'DEVOLUCAO_DEPTH_SEEKER', guard: 'isDepthSeeker' },
        { target: 'DEVOLUCAO_SURFACE_KEEPER', guard: 'isSurfaceKeeper' },
        { target: 'DEVOLUCAO_PIVOT_EARLY', guard: 'isPivotEarly' },
        { target: 'DEVOLUCAO_PIVOT_LATE', guard: 'isPivotLate' },
        { target: 'DEVOLUCAO_SEEKER', guard: 'isSeeker' },
        { target: 'DEVOLUCAO_GUARDIAN', guard: 'isGuardian' },
        // [11] UNGUARDED FALLTHROUGH — preserved (NO guard field)
        { target: 'DEVOLUCAO_CONTRADICTED' },
      ],
    },

    // Phase 33 — AR-01 — DEVOLUCAO_ESPELHO_SILENCIOSO archetype state
    // Sibling of all other DEVOLUCAO_* states (top-level, NOT inside DEVOLUCAO).
    // Triggered by isEspelhoSilencioso at DEVOLUCAO.always[0].
    DEVOLUCAO_ESPELHO_SILENCIOSO: {
      on: { NARRATIVA_DONE: 'ENCERRAMENTO' },
      after: {
        // Standard 5-min idle reset (matches all other DEVOLUCAO_* states for Bienal).
        300000: {
          target: '#oracle.IDLE',
          actions: assign({
            sessionId: '',
            choices: [],
            choiceMap: {},
            fallbackCount: 0,
            currentPhase: 'APRESENTACAO',
          }),
        },
      },
    },

    // Phase 34 — AR-02 — DEVOLUCAO_CONTRA_FOBICO archetype state
    // Sibling of all other DEVOLUCAO_* states (top-level, NOT inside DEVOLUCAO).
    // Triggered by isContraFobico at DEVOLUCAO.always[1].
    DEVOLUCAO_CONTRA_FOBICO: {
      on: { NARRATIVA_DONE: 'ENCERRAMENTO' },
      after: {
        // Standard 5-min idle reset (matches all other DEVOLUCAO_* states for Bienal).
        300000: {
          target: '#oracle.IDLE',
          actions: assign({
            sessionId: '',
            choices: [],
            choiceMap: {},
            fallbackCount: 0,
            currentPhase: 'APRESENTACAO',
          }),
        },
      },
    },

    // Phase 34 — AR-03 — DEVOLUCAO_PORTADOR archetype state
    // Sibling of all other DEVOLUCAO_* states.
    // Triggered by isPortador at DEVOLUCAO.always[2].
    DEVOLUCAO_PORTADOR: {
      on: { NARRATIVA_DONE: 'ENCERRAMENTO' },
      after: {
        300000: {
          target: '#oracle.IDLE',
          actions: assign({
            sessionId: '',
            choices: [],
            choiceMap: {},
            fallbackCount: 0,
            currentPhase: 'APRESENTACAO',
          }),
        },
      },
    },

    DEVOLUCAO_SEEKER: {
      on: {
        NARRATIVA_DONE: 'ENCERRAMENTO',
      },
      after: {
        300000: {
          target: '#oracle.IDLE',
          actions: assign({
            sessionId: '',
            choices: [],
            choiceMap: {},
            fallbackCount: 0,
            currentPhase: 'APRESENTACAO',
          }),
        },
      },
    },

    DEVOLUCAO_GUARDIAN: {
      on: {
        NARRATIVA_DONE: 'ENCERRAMENTO',
      },
      after: {
        300000: {
          target: '#oracle.IDLE',
          actions: assign({
            sessionId: '',
            choices: [],
            choiceMap: {},
            fallbackCount: 0,
            currentPhase: 'APRESENTACAO',
          }),
        },
      },
    },

    DEVOLUCAO_CONTRADICTED: {
      on: {
        NARRATIVA_DONE: 'ENCERRAMENTO',
      },
      after: {
        300000: {
          target: '#oracle.IDLE',
          actions: assign({
            sessionId: '',
            choices: [],
            choiceMap: {},
            fallbackCount: 0,
            currentPhase: 'APRESENTACAO',
          }),
        },
      },
    },

    DEVOLUCAO_PIVOT_EARLY: {
      on: {
        NARRATIVA_DONE: 'ENCERRAMENTO',
      },
      after: {
        300000: {
          target: '#oracle.IDLE',
          actions: assign({
            sessionId: '',
            choices: [],
            choiceMap: {},
            fallbackCount: 0,
            currentPhase: 'APRESENTACAO',
          }),
        },
      },
    },

    DEVOLUCAO_PIVOT_LATE: {
      on: {
        NARRATIVA_DONE: 'ENCERRAMENTO',
      },
      after: {
        300000: {
          target: '#oracle.IDLE',
          actions: assign({
            sessionId: '',
            choices: [],
            choiceMap: {},
            fallbackCount: 0,
            currentPhase: 'APRESENTACAO',
          }),
        },
      },
    },

    DEVOLUCAO_DEPTH_SEEKER: {
      on: {
        NARRATIVA_DONE: 'ENCERRAMENTO',
      },
      after: {
        300000: {
          target: '#oracle.IDLE',
          actions: assign({
            sessionId: '',
            choices: [],
            choiceMap: {},
            fallbackCount: 0,
            currentPhase: 'APRESENTACAO',
          }),
        },
      },
    },

    DEVOLUCAO_SURFACE_KEEPER: {
      on: {
        NARRATIVA_DONE: 'ENCERRAMENTO',
      },
      after: {
        300000: {
          target: '#oracle.IDLE',
          actions: assign({
            sessionId: '',
            choices: [],
            choiceMap: {},
            fallbackCount: 0,
            currentPhase: 'APRESENTACAO',
          }),
        },
      },
    },

    DEVOLUCAO_MIRROR: {
      on: {
        NARRATIVA_DONE: 'ENCERRAMENTO',
      },
      after: {
        300000: {
          target: '#oracle.IDLE',
          actions: assign({
            sessionId: '',
            choices: [],
            choiceMap: {},
            fallbackCount: 0,
            currentPhase: 'APRESENTACAO',
          }),
        },
      },
    },

    ENCERRAMENTO: {
      entry: assign({ currentPhase: 'ENCERRAMENTO' }),
      on: {
        NARRATIVA_DONE: 'FIM',
      },
      after: {
        300000: {
          target: '#oracle.IDLE',
          actions: assign({
            sessionId: '',
            choices: [],
            choiceMap: {},
            fallbackCount: 0,
            currentPhase: 'APRESENTACAO',
          }),
        },
      },
    },

    FIM: {
      after: {
        18000: {
          target: 'IDLE',
          actions: assign({
            sessionId: '',
            choices: [],
            choiceMap: {},
            fallbackCount: 0,
            currentPhase: 'APRESENTACAO',
          }),
        },
      },
    },
  },
});
