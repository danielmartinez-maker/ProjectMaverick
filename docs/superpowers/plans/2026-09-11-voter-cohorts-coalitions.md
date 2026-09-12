# Voter Cohorts and Coalition Analysis Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Infer transparent ideological voter cohorts from native aggregate electorate data and expose candidate/bloc coalition analysis without pretending the native game simulates persistent individual citizens.

**Architecture:** Deterministic cohort inference constrains template mixtures by native party distribution, fiscal/social values, issue support, and issue salience. Candidate compatibility is ideology-dominant with bounded partisan and operating-style adjustments. UI exposes cohort composition and candidate coalition fit with confidence and sparse-data warnings.

**Tech Stack:** Plain JavaScript pure models, Node built-in test runner/assert, Project Maverick ideology/archetype foundation and UI shell.

**Spec:** `docs/superpowers/specs/2026-09-11-qol-archetypes-ideology-design.md`

## Global Constraints
- Model aggregate cohorts, not invented persistent individual voters.
- Cohort shares are deterministic, nonnegative, and normalize to exactly `1.0` internally.
- Native electorate aggregates constrain results; absent issue evidence reduces confidence.
- Ideological distance remains the dominant candidate-compatibility term.
- Party/style affinity may adjust but never overwhelm extreme issue mismatch.

---

### Task 1: Cohort templates and constrained inference
**Files:** Create `src/projectMaverick/voters/{cohortTemplates,cohortModel}.js`; test `tests/voters/cohortModel.test.js`.
**Interfaces:** cohorts add `salienceWeights`, `partisanAffinity`, `stylePreferences`; `inferCohorts(districtSnapshot) -> {cohorts,confidence,constraints}`.
- [ ] Test strongly Democratic, strongly Republican, balanced, libertarian-leaning, and economically-populist/socially-traditional fixtures.
- [ ] Assert all shares are nonnegative, sum exactly to 1.0, and aggregate affinity tracks native party distribution within tolerance.
- [ ] Implement deterministic mixture inference from party distribution, issue support/salience, and fiscal/social electorate values.
- [ ] Make sparse-data behavior explicit and lower confidence without inventing issue values.
- [ ] Run cohort tests; expected PASS.
- [ ] Commit `feat: infer ideological voter cohorts`.

### Task 2: Candidate-coalition compatibility
**Files:** Create `src/projectMaverick/voters/coalitionAnalysis.js`; test `tests/voters/coalitionAnalysis.test.js`.
**Interfaces:** `analyzeCandidate(candidateProfile,politicalStyle,cohortSet)` and `compareCandidates(a,b,cohortSet)`.
- [ ] Test salience effects, ideology dominance, bounded style adjustment, bounded party prior, and candidate-vs-candidate bloc lean.
- [ ] Implement deterministic compatibility with explicit per-bloc reasons.
- [ ] Run coalition tests; expected PASS.
- [ ] Commit `feat: add voter coalition compatibility analysis`.

### Task 3: Ideology Explorer and electorate intelligence UI
**Files:** Create `src/projectMaverick/ui/{ideologyExplorer,electoratePanel}.js`; test `tests/ui/ideologyExplorer.contract.test.js`.
**Interfaces:** explorer filters politicians by family/subtype and exposes dimensions/evidence; electorate panel shows cohort shares, issue salience, strongest/weakest blocs, and candidate-vs-candidate coalition analysis.
- [ ] Test complete and sparse electorate fixtures.
- [ ] Implement deterministic sorted cohort display.
- [ ] Correct display rounding so shown percentages sum to 100% while preserving internal shares.
- [ ] Expose confidence/sparse-data warnings prominently.
- [ ] Run UI contract tests; expected PASS.
- [ ] Commit `feat: add ideology explorer and electorate intelligence`.

### Task 4: Full milestone regression and release checkpoint
**Files:** Create/update `docs/verification/v0.353-qol-archetypes-ideology.md`, `README.md`.
**Interfaces:** release certification only.
- [ ] Run the complete Node test suite twice from a clean state.
- [ ] Re-hash the pristine backup and confirm SHA-256 `15b048f976c454e3b67c57a63ce7d792a2680a7c378b2f8651b556f7f5d9ded1`.
- [ ] Run build prohibited-file scan and confirm Git does not track upstream proprietary payloads.
- [ ] Patch a fresh extracted v0.353 working copy, then restore and compare restored `index.html` byte-for-byte.
- [ ] Record exact commands, test counts, compatibility hashes, patch status, limitations, and manual in-game smoke checklist.
- [ ] Update README feature/compatibility summary.
- [ ] Commit `chore: verify Project Maverick v0.353 milestone`.
