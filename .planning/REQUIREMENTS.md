# Requirements: O Oraculo

**Defined:** 2026-05-08 (v6.1)
**Core Value:** Experiencia seamless e imersiva como um jogo — o visitante fala, ouve, e e transformado.

## v6.1 Requirements (Active)

Requirements for **Duas Vozes** milestone. Criar versão V2 da experiência com sistema de duas vozes (Voz 1 = perguntas, Voz 2 soturna = narrativa/devoluções), preservando V1 intacta, com seletor na home.

### Versioning

- [ ] **VER-01**: Operador/visitante pode escolher entre V1 e V2 na home page antes de iniciar
- [x] **VER-02**: Escolha de versão persiste durante toda a sessão (não reseta entre estados) — *Phase 36, Plan 02*
- [ ] **VER-03**: V1 funciona exatamente como hoje (zero regressão)

### Dual-Voice

- [x] **VOZ-01**: Cada script key é classificado como VOZ_PERGUNTA ou VOZ_NARRATIVA (metadata no script ou mapeamento separado) — *Phase 36, Plan 01*
- [x] **VOZ-02**: Nova env `ELEVENLABS_VOICE_ID_V2` configura a voz soturna (server-side only) — *Phase 36, Plan 01*
- [x] **VOZ-03**: API route `/api/tts` aceita parâmetro de voice ID (V1 vs V2) baseado na versão e tipo de segmento — *Phase 37, Plan 01*
- [x] **VOZ-04**: FallbackTTS na V2 busca MP3 narrativos em `public/audio/prerecorded/v2/`, perguntas continuam na raiz -- *Phase 37, Plan 02*
- [x] **VOZ-05**: Na V2, segmentos PERGUNTA usam Voz 1 (atual) e segmentos narrativos usam Voz 2 (soturna) -- *Phase 37, Plan 02*

### Audio

- [ ] **AUD-01**: Script de geração (`generate-audio-v3.ts`) suporta dual-voice (gerar com voice ID diferente por tipo de segmento)
- [ ] **AUD-02**: MP3s V2 (segmentos narrativos com voz soturna) gerados em `public/audio/prerecorded/v2/`
- [ ] **AUD-03**: Fix "faça" no ENCERRAMENTO regenerado como MP3 (V1 e V2)

## v6.0 Deep Branching (Shipped)

All 10 requirements satisfied (BR-01 through UAT-01). 5 conditional branches (Q1B, Q2B, Q4B, Q5B, Q6B), 3 new archetypes (ESPELHO_SILENCIOSO, CONTRA_FOBICO, PORTADOR), 82 MP3s, 78-state machine.

- [x] BR-01: Q1B branch contra-fobica — Phase 31
- [x] BR-02: Q5B branch Paraíso — Phase 32
- [x] BR-03: Q6B branch pré-devolução — Phase 33
- [x] AR-01: DEVOLUCAO_ESPELHO_SILENCIOSO — Phase 33
- [x] AR-02: CONTRA_FOBICO archetype — Phase 34
- [x] AR-03: PORTADOR archetype — Phase 34
- [x] POL-01: Max-path ≤ 7:30 — Phase 35
- [x] POL-02: ChoiceMap extension — Phase 31
- [x] POL-03: roteiro.html sync — Phase 35
- [x] UAT-01: Browser UAT — Phase 35

## Future Requirements

### Browser UAT (deferred from v1.0)

- **UAT-MULTI-01**: Multi-station isolation verified in browser
- **UAT-INACT-01**: Inactivity timeout 30s → reset verified in browser
- **UAT-MULTI-02**: 2-3 simultaneous stations verified in browser

### Analytics (deferred from v1.1)

- **ANALYTICS-01**: Supabase analytics backend (Phase 6)

## Out of Scope (v6.1)

| Feature | Reason |
|---------|--------|
| Mudar roteiro/script text (além do fix "faça") | Roteiro aprovado — apenas correção pontual |
| Terceira voz | Escopo é dual-voice apenas |
| Voice settings diferentes por fase na V2 | Voz soturna usa settings uniformes por enquanto |
| Geração de áudio em runtime com voz dinâmica | Pre-recorded MP3s continuam sendo o modelo principal |
| Refactor da state machine para V2 | Machine é a mesma — diferença é apenas no áudio |

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| VER-01 | Phase 38 | Pending |
| VER-02 | Phase 36 | Complete (Plan 02) |
| VER-03 | Phase 38 | Pending |
| VOZ-01 | Phase 36 | Complete (Plan 01) |
| VOZ-02 | Phase 36 | Complete (Plan 01) |
| VOZ-03 | Phase 37 | Complete (Plan 01) |
| VOZ-04 | Phase 37 | Complete (Plan 02) |
| VOZ-05 | Phase 37 | Complete (Plan 02) |
| AUD-01 | Phase 39 | Pending |
| AUD-02 | Phase 39 | Pending |
| AUD-03 | Phase 39 | Pending |

**Coverage:**
- v6.1 requirements: 11 total
- Mapped to phases: 11/11 (100%)
- Unmapped: 0

**Phase-to-Requirements Mapping:**
- Phase 36 (Dual-Voice Data Layer): VOZ-01, VOZ-02, VER-02
- Phase 37 (Dual-Voice Service Layer): VOZ-03, VOZ-04, VOZ-05
- Phase 38 (Version Selector & UI Integration): VER-01, VER-03
- Phase 39 (Audio Generation & Polish): AUD-01, AUD-02, AUD-03

---
*Requirements defined: 2026-05-08*
*Last updated: 2026-05-09 — VOZ-04, VOZ-05 completed in Plan 37-02*
