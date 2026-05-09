---
gsd_state_version: 1.0
milestone: v6.1
milestone_name: Duas Vozes
status: in-progress
last_updated: "2026-05-09T00:04:01.000Z"
last_activity: 2026-05-09
progress:
  total_phases: 4
  completed_phases: 1
  total_plans: 2
  completed_plans: 2
  percent: 25
---

# State: O Oraculo

## Project Reference

**Core Value:** Experiencia seamless e imersiva como um jogo -- o visitante fala, ouve, e e transformado. Se a voz, o roteiro e as transicoes funcionarem perfeitamente, tudo funciona.

**Current Milestone:** v6.1 Duas Vozes

**Current Focus:** Phase 37 — Dual-Voice Service Layer

## Current Position

Phase: 36 of 39 (Dual-Voice Data Layer) -- COMPLETE
Plan: 2 of 2 in current phase (all plans complete)
Status: Phase 36 complete, ready for Phase 37
Last activity: 2026-05-09 — Plan 36-02 complete (VersionContext + page.tsx wiring)

Progress: [█████████████████████████████████████░░] 92% (36/39 phases complete)

## Performance Metrics

**Milestone v6.0 Deep Branching (Complete 2026-04-08):**

- Phases: 5/5 (Phases 31-35), Plans: 15/15
- Duration: 2 days (2026-04-07 to 2026-04-08)
- Requirements: 10/10 (BR-01 to UAT-01) — all satisfied
- Deliverables: 5 conditional branches, 3 new archetypes, 82 MP3s, 78-state machine, 24-path timing matrix

**Milestone v6.1 Duas Vozes (Active):**

- Phases: 4 (Phases 36-39)
- Plans: 2/TBD completed
- Requirements: 11 (VER-01 to AUD-03)
- Goal: Sistema de duas vozes (Voz 1 perguntas, Voz 2 narrativa) com seletor V1/V2 na home
- Coverage: 11/11 requirements mapped (100%)

**Previous Milestones Summary:**

- v1.0 MVP: 3 phases, 13 plans (2026-03-25)
- v1.2 Voice Flow: 3 phases, 6 plans (2026-03-26)
- v3.1 Script Mastery: 4 phases, 8 plans (2026-03-28)
- v4.0 Game Flow: 5 phases, 9 plans (2026-03-29)

## Accumulated Context

### Decisions

Recent decisions affecting current work:

- [v6.1]: React Context for version (not prop drilling or machine context) — natural fit for component tree config (Plan 36-02)
- [v6.1]: V1 as default with no initialVersion in page.tsx — zero regression guaranteed (Plan 36-02)
- [v6.1]: Voice classification derived from key name pattern matching — no SCRIPT mutation or lookup tables (Plan 36-01)
- [v6.1]: getVoiceType hierarchy: explicit names > prefix > suffix > default narrative (Plan 36-01)
- [v6.1]: Duas vozes V2 (Voz 1 perguntas, Voz 2 narrativa) — Separação dramática: quem pergunta vs quem narra — sugestão Paulo Ribeiro, aprovada pelo cliente
- [v6.1]: Seletor V1/V2 na home (coexistência) — V1 preservada intacta como fallback de produção; V2 é evolução aprovada
- [v6.0]: Deep branching com 5 conditional branches — Recompensa perfis extremos com camada extra ORACULAR; mantém max-path em ~7:20
- [v6.0]: ESPELHO_SILENCIOSO devolve forma, não conteúdo — Quando visitante dissolve a própria pergunta + pede leitura, Oráculo devolve estrutura aberta
- [v4.0]: 5-7 min target (down from 10.5) — Bienal foot traffic demands shorter sessions, game pacing keeps engagement high

Full decision log: PROJECT.md Key Decisions table

### Pending Todos

None yet.

### Blockers/Concerns

None yet.

## Deferred Items

Items carried forward from previous milestones:

| Category | Item | Status | Deferred At |
|----------|------|--------|-------------|
| Analytics | Supabase analytics backend | Phase 6 deferred to post-event | v1.1 |
| Testing | Browser UAT multi-station isolation | Manual testing pending | v1.0 |

## Session Continuity

Last session: 2026-05-09
Stopped at: Completed 36-02-PLAN.md (Phase 36 complete)
Resume: Phase 37 — Dual-Voice Service Layer (next phase)
