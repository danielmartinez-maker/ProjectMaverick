# Politician Archetypes and Ideology Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Derive transparent political operating archetypes and comprehensive multidimensional ideological archetypes for every politician whose native data supplies enough evidence.

**Architecture:** Pure classifiers consume normalized snapshots from the foundation plan. Ideological scoring uses twelve bounded dimensions and evidence/confidence accounting; taxonomy classification uses deterministic weighted centroid similarity. Operating archetypes remain distinct from ideological belief and expose data-only modifiers until a separately verified gameplay adapter exists.

**Tech Stack:** Plain JavaScript pure modules; Node built-in test runner/assert; existing Project Maverick adapter/QoL/UI foundation.

**Spec:** `docs/superpowers/specs/2026-09-11-qol-archetypes-ideology-design.md`

## Global Constraints
- Do not mutate native politician records.
- Never fabricate missing policy positions; lower confidence when evidence is sparse.
- Keep operating style and ideological worldview as separate classifications.
- All classifier output is deterministic for identical native snapshots.
- Gameplay modifiers are data only in this milestone and do not directly write native state.

---

### Task 1: Twelve-dimensional ideology scoring
**Files:** Create `src/projectMaverick/ideology/{dimensions,scoring}.js`; test `tests/ideology/scoring.test.js`.
**Interfaces:** dimensions `economics,fiscal,welfare,social,immigration,environment,guns,healthcare,education,institutional,partisan,intensity`; `scorePolitician(snapshot,issueCatalog)` and `distance(a,b,weights?)`.
- [ ] Test progressive, libertarian, cross-pressured, and sparse-data fixtures with exact expected signs/bounds.
- [ ] Implement bounded weighted aggregation from explicit native fiscal/social values and mapped issue evidence; ignore unknown issues.
- [ ] Compute confidence from available evidence rather than defaulting missing values to certainty.
- [ ] Test bounded symmetric ideological distance in `[0,2]`.
- [ ] Run scoring tests; expected PASS.
- [ ] Commit `feat: add multidimensional ideology scoring`.

### Task 2: Comprehensive politician ideology taxonomy
**Files:** Create `src/projectMaverick/ideology/{taxonomy,classifyPolitician}.js`; test `tests/ideology/classifyPolitician.test.js`.
**Interfaces:** 25–35 immutable subtype definitions; `classifyPolitician(profile) -> {primary,secondary,scores,explanation,confidence}`.
- [ ] Test 25–35 unique IDs, complete 12-dimension centroids, bounded values, and required cross-pressured families.
- [ ] Add canonical-vector tests for progressive/social-democratic, liberal, moderate, libertarian/classical-liberal, conservative, religious-conservative, national/right-populist, economic-left/social-conservative, social-liberal/fiscal-conservative, and heterodox families.
- [ ] Implement deterministic weighted centroid similarity with secondary subtype only inside an explicit ambiguity threshold.
- [ ] Generate explanations from the most discriminating evidence dimensions.
- [ ] Run classifier tests; expected PASS.
- [ ] Commit `feat: classify politicians into ideology archetypes`.

### Task 3: Political operating archetypes
**Files:** Create `src/projectMaverick/archetypes/{politicalArchetypes,classifyPoliticalStyle}.js`; test `tests/archetypes/politicalArchetypes.test.js`.
**Interfaces:** `technocrat`, `pragmatist`, `populist`, `firebrand`, `coalition-builder`, `party-loyalist`, `maverick`, `policy-wonk`, `retail-politician`, `operator`, `ideologue`, `statesman`.
- [ ] Test signature native traits for every archetype plus insufficient-evidence behavior.
- [ ] Implement transparent weighted rules using traits, experience, popularity, party alignment, and political history only when present.
- [ ] Verify the classifier never mutates input and emits low-confidence `unknown` when evidence is insufficient.
- [ ] Run archetype tests; expected PASS.
- [ ] Commit `feat: add politician operating archetypes`.

### Task 4: Politician intelligence and comparison views
**Files:** Create `src/projectMaverick/ui/{politicianPanel,comparePanel}.js`; test `tests/ui/politicianPanel.contract.test.js`.
**Interfaces:** politician panel shows native identity/office, operating archetype, ideology primary/secondary, 12 dimensions, evidence/confidence, electorate fit, and watchlist state; compare view shows ideological distance/deltas.
- [ ] Test complete and missing-data politician fixtures.
- [ ] Implement view models using normalized records and safe reusable components only.
- [ ] Render absent native values as `Unavailable`, never inferred facts.
- [ ] Integrate ideology/archetype fields into search/filter records.
- [ ] Run politician UI and QoL regression tests; expected PASS.
- [ ] Commit `feat: add politician archetype and ideology intelligence views`.
