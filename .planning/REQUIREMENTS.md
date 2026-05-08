# Requirements: O Oraculo

**Defined:** 2026-05-08 (v6.1)
**Core Value:** Experiencia seamless e imersiva como um jogo — o visitante fala, ouve, e e transformado.

## v6.1 Requirements (Active)

Requirements for **Duas Vozes** milestone. Criar versão V2 da experiência com sistema de duas vozes (Voz 1 = perguntas, Voz 2 soturna = narrativa/devoluções), preservando V1 intacta, com seletor na home.

### Versioning

- [ ] **VER-01**: Operador/visitante pode escolher entre V1 e V2 na home page antes de iniciar
- [ ] **VER-02**: Escolha de versão persiste durante toda a sessão (não reseta entre estados)
- [ ] **VER-03**: V1 funciona exatamente como hoje (zero regressão)

### Dual-Voice

- [ ] **VOZ-01**: Cada script key é classificado como VOZ_PERGUNTA ou VOZ_NARRATIVA (metadata no script ou mapeamento separado)
- [ ] **VOZ-02**: Nova env `ELEVENLABS_VOICE_ID_V2` configura a voz soturna (server-side only)
- [ ] **VOZ-03**: API route `/api/tts` aceita parâmetro de voice ID (V1 vs V2) baseado na versão e tipo de segmento
- [ ] **VOZ-04**: FallbackTTS na V2 busca MP3 narrativos em `public/audio/prerecorded/v2/`, perguntas continuam na raiz
- [ ] **VOZ-05**: Na V2, segmentos PERGUNTA usam Voz 1 (atual) e segmentos narrativos usam Voz 2 (soturna)

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
| VER-01 | TBD | Pending |
| VER-02 | TBD | Pending |
| VER-03 | TBD | Pending |
| VOZ-01 | TBD | Pending |
| VOZ-02 | TBD | Pending |
| VOZ-03 | TBD | Pending |
| VOZ-04 | TBD | Pending |
| VOZ-05 | TBD | Pending |
| AUD-01 | TBD | Pending |
| AUD-02 | TBD | Pending |
| AUD-03 | TBD | Pending |

**Coverage:**
- v6.1 requirements: 11 total
- Mapped to phases: 0 (awaiting roadmap)
- Unmapped: 11

---
*Requirements defined: 2026-05-08*
*Last updated: 2026-05-08 after initial definition*
