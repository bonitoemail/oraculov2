---
phase: 38-version-selector-ui-integration
plan: 01
subsystem: experience-ui
tags: [version-selector, ui-component, oracle-experience]
dependency_graph:
  requires: [VersionContext, useVersion, ExperienceVersion type]
  provides: [VersionSelector component, OracleExperience version gate]
  affects: [OracleExperience render flow, user experience startup sequence]
tech_stack:
  added: []
  patterns: [aria-pressed for toggle state, mounted fade-in animation, conditional render gating]
key_files:
  created:
    - src/components/experience/VersionSelector.tsx
    - src/components/experience/__tests__/VersionSelector.test.tsx
  modified:
    - src/components/experience/OracleExperience.tsx
decisions:
  - "VersionSelector uses aria-pressed for accessibility-friendly selection indication"
  - "versionSelected boolean gates StartButton visibility - simple and unmounts selector once chosen"
metrics:
  duration: "2m 15s"
  completed: "2026-05-09T14:22:14Z"
  tasks: 2
  files: 3
---

# Phase 38 Plan 01: VersionSelector UI Component Summary

**One-liner:** Dark-themed V1/V2 toggle component wired between PermissionScreen and StartButton in OracleExperience flow.

## What Was Done

### Task 1: Create VersionSelector component (544f7be)

Created `VersionSelector.tsx` with:
- Full-screen dark overlay matching PermissionScreen/StartButton radial gradient style
- Cormorant font, ornamental lines, fade-in animation on mount
- Two pill-shaped version option buttons (V1 "Voz unica", V2 "Duas vozes")
- Selected state indicated by brighter border/text and `aria-pressed` attribute
- "Continuar" button with oracle-glow animation to advance the flow
- All required `data-testid` attributes for testing

Created 5 unit tests (all passing):
1. Renders with V1 selected by default
2. Calls setVersion when V2 is clicked
3. Calls onContinue when Continuar is clicked
4. Shows both version options
5. Has data-testid=version-selector on root

### Task 2: Wire VersionSelector into OracleExperience (6d08bcc)

Modified `OracleExperience.tsx`:
- Added `import VersionSelector from './VersionSelector'`
- Added `versionSelected` state variable (boolean, initially false)
- Updated render logic to create three-step startup flow:
  - `!micPermissionGranted` -> PermissionScreen
  - `micPermissionGranted && !versionSelected && IDLE` -> VersionSelector
  - `micPermissionGranted && versionSelected && IDLE` -> StartButton
- Version is locked once experience starts (VersionSelector unmounts, no UI to change mid-session)

## Deviations from Plan

None - plan executed exactly as written.

## Verification Results

- VersionSelector tests: 5/5 passing
- VersionContext tests: 5/5 passing
- 3 pre-existing failures in OracleExperience-helpers.test.ts (script segment count assertions) - NOT caused by this plan's changes; relate to prior script.ts modifications

## Self-Check: PASSED
