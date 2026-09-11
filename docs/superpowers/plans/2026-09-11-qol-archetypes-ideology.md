# Project Maverick QoL + Archetypes + Ideology Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a reversible, compatibility-first Project Maverick extension to The Political Process v0.353 providing QoL political intelligence, politician operating archetypes, multidimensional politician ideology, and voter ideological cohorts.

**Architecture:** Native v0.353 remains authoritative. A minimal loader hook in `index.html` starts an extension namespace after native `evalNWBin` modules load; native reads pass through a defensive adapter, extension persistence is separate/versioned, and unknown baselines fail closed. Pure classification/model modules are independently testable before UI integration.

**Tech Stack:** NW.js/Chromium, plain JavaScript, CSS, Node built-in test runner/assert, Node patch/build tooling.

**Spec:** `docs/superpowers/specs/2026-09-11-qol-archetypes-ideology-design.md`

## Global Constraints

- Target The Political Process v0.353 first.
- Never modify the pristine backup or overwrite a native `.bin` gameplay module.
- Namespace runtime state under `window.ProjectMaverick`; prefix extension DOM/CSS identifiers with `pm-` / `pm_`.
- Native state is authoritative; extension state is separate, versioned, removable, and never required to load a native save.
- Unknown or hash-mismatched baselines are rejected by default by installation tooling.
- Missing native fields degrade the corresponding feature and emit diagnostics rather than stopping the game.
- No external runtime dependency for the first release.
- Upstream commercial executables, assets, redistributables, and compiled gameplay bytecode remain excluded from Git.

---

## File map

`src/projectMaverick/core/` owns boot, compatibility, diagnostics, storage, events, and native-state access. `src/projectMaverick/ideology/` owns dimensions/taxonomy/scoring. `src/projectMaverick/archetypes/` owns politician operating-style classification. `src/projectMaverick/voters/` owns electorate cohort inference/coalition analysis. `src/projectMaverick/qol/` owns search/filter/watchlist/compare state. `src/projectMaverick/ui/` owns DOM rendering. `tools/` owns patch/build/verification. `tests/` mirrors pure runtime modules and tooling.

### Task 1: Compatibility gate, loader, diagnostics, and reversible patching

**Files:** Create `src/projectMaverick/loader.js`, `core/{namespace,diagnostics,compatibility}.js`, `tools/{patch-v0353,verify-v0353}.js`, `tests/core/compatibility.test.js`, `tests/tools/patch-v0353.test.js`; modify only the separate working-copy upstream `index.html` after the final `evalNWBin(...)`.

**Interfaces:** `ProjectMaverick.version`; `diagnostics.record(code, detail)`; `compatibility.check(env) -> {ok,version,failures[]}`; `patchGame({gameDir,distDir,expectedIndexSha256}) -> {changedFiles[]}`; `restoreGame({gameDir})`.

- [ ] Write compatibility tests proving the exact v0.353 signature is accepted and a changed index hash is rejected.
- [ ] Run `node --test tests/core/compatibility.test.js`; expected FAIL because module does not exist.
- [ ] Implement namespace, a 200-record diagnostic ring buffer, and fail-closed compatibility result.
- [ ] Re-run test; expected PASS.
- [ ] Write patcher test with a temp fixture; assert exactly one `<script src="projectMaverick/loader.js"></script>` is inserted, repeated patch is idempotent, and restore is byte-identical.
- [ ] Run patcher test; expected FAIL.
- [ ] Implement patcher to hash index, save `.project-maverick-backup/index.html`, copy only Maverick dist files, patch once, and reject mismatched hashes unless an explicit development override is passed.
- [ ] Run Task 1 tests; expected PASS.
- [ ] Commit `feat: add reversible v0353 loader and compatibility gate`.

### Task 2: Native adapter and isolated persistence

**Files:** Create `core/nativeAdapter.js`, `core/storage.js`, `core/events.js`, `tests/core/nativeAdapter.test.js`, `tests/core/storage.test.js`.

**Interfaces:** `readPoliticians() -> PoliticianSnapshot[]`; `readPlayer() -> PoliticianSnapshot|null`; `readDistrictContext(subject) -> DistrictSnapshot|null`; `readElectionContext(subject) -> ElectionSnapshot|null`; `readIssueCatalog() -> IssueDefinition[]`; `storage.load/save/update`; `events.on/emit`.

- [ ] Write adapter fixture tests for array/object native globals, malformed records, absent globals, and stable normalized IDs.
- [ ] Run adapter test; expected FAIL.
- [ ] Implement read-only defensive snapshots; never mutate native objects.
- [ ] Re-run; expected PASS.
- [ ] Write storage tests for schema `{schemaVersion:1,watchlists:{politicians:[]},recentViews:[],preferences:{}}`, corrupt/empty migration, max 50 recent views, and write failures that log without throwing.
- [ ] Run storage tests; expected FAIL.
- [ ] Implement storage/events; expected PASS.
- [ ] Commit `feat: add native adapter and isolated extension state`.

### Task 3: Ideology dimensions and scoring primitives

**Files:** Create `ideology/dimensions.js`, `ideology/scoring.js`, `tests/ideology/scoring.test.js`.

**Interfaces:** Twelve dimensions normalized to `[-1,1]`: `economics`, `fiscal`, `welfare`, `social`, `immigration`, `environment`, `guns`, `healthcare`, `education`, `institutional`, `partisan`, `intensity`. `scorePolitician(snapshot, issueCatalog) -> {dimensions,evidence,confidence}`. `distance(a,b,weights?) -> [0,2]`.

- [ ] Write progressive, libertarian, cross-pressured, and sparse-data fixture tests with exact sign/confidence assertions.
- [ ] Run scoring tests; expected FAIL.
- [ ] Implement bounded weighted aggregation from native fiscal/social values plus mapped issue positions; unknown issues are ignored rather than guessed.
- [ ] Calculate confidence from usable evidence and explicit native dimensions.
- [ ] Run tests; expected PASS.
- [ ] Commit `feat: add multidimensional ideology scoring`.

### Task 4: Comprehensive ideology taxonomy and politician classifier

**Files:** Create `ideology/taxonomy.js`, `ideology/classifyPolitician.js`, `tests/ideology/classifyPolitician.test.js`.

**Interfaces:** `IDEOLOGY_ARCHETYPES` contains 25–35 immutable subtype definitions (`id,name,family,centroid,dimensionWeights,minimumConfidence,criteria`). Required families: progressive/social-democratic, liberal, centrist/moderate, libertarian/classical-liberal, conservative, religious-conservative, national/right-populist, economically-left/socially-conservative, socially-liberal/fiscally-conservative, heterodox/independent. `classifyPolitician(profile) -> {primary,secondary|null,scores[],explanation[],confidence}`.

- [ ] Write integrity test: 25–35 unique IDs; all 12 dimensions present and bounded; required cross-pressured families present.
- [ ] Write classifier tests for at least 10 canonical vectors plus an ambiguous vector with secondary subtype.
- [ ] Run; expected FAIL.
- [ ] Implement weighted centroid similarity, deterministic ties, and secondary ambiguity threshold.
- [ ] Generate explanations from the three most discriminating evidence dimensions.
- [ ] Run; expected PASS.
- [ ] Commit `feat: classify politicians into ideology archetypes`.

### Task 5: Political operating archetypes

**Files:** Create `archetypes/politicalArchetypes.js`, `archetypes/classifyPoliticalStyle.js`, `tests/archetypes/politicalArchetypes.test.js`.

**Interfaces:** archetypes are `technocrat`, `pragmatist`, `populist`, `firebrand`, `coalition-builder`, `party-loyalist`, `maverick`, `policy-wonk`, `retail-politician`, `operator`, `ideologue`, `statesman`. `classifyPoliticalStyle(snapshot) -> {primary,secondary|null,scores[],evidence[],modifiers}`. Modifiers remain data-only in v1 until an explicitly tested native adapter consumes them.

- [ ] Write fixture tests mapping trait combinations to all archetypes and insufficient evidence to low-confidence unknown.
- [ ] Run; expected FAIL.
- [ ] Implement transparent weighted rules from traits, experience, popularity, party alignment and available political history.
- [ ] Verify input snapshots are not mutated.
- [ ] Run; expected PASS.
- [ ] Commit `feat: add politician operating archetypes`.

### Task 6: Voter ideological cohort inference

**Files:** Create `voters/cohortTemplates.js`, `voters/cohortModel.js`, `tests/voters/cohortModel.test.js`.

**Interfaces:** cohorts reuse ideology families and add `salienceWeights`, `partisanAffinity`, `stylePreferences`. `inferCohorts(districtSnapshot) -> {cohorts:[{id,share,profile,salience}],confidence,constraints}`. Shares sum exactly to `1.0` after deterministic normalization.

- [ ] Write fixtures for strongly Democratic, strongly Republican, balanced, libertarian-leaning, and economically-populist/socially-traditional electorates.
- [ ] Assert nonnegative shares sum to 1 and aggregate partisan affinity stays within tolerance of native distribution.
- [ ] Run; expected FAIL.
- [ ] Implement constrained deterministic mixture inference from party distribution, issue support, issue salience/priorities, and fiscal/social electorate values.
- [ ] Missing issue data reduces confidence rather than creating invented values.
- [ ] Run; expected PASS.
- [ ] Commit `feat: infer ideological voter cohorts`.

### Task 7: Candidate-coalition compatibility

**Files:** Create `voters/coalitionAnalysis.js`, `tests/voters/coalitionAnalysis.test.js`.

**Interfaces:** `analyzeCandidate(candidateProfile, politicalStyle, cohortSet) -> {overallFit,blocs:[{cohortId,compatibility,salienceAdjusted,reasons[]}],strongest[],weakest[]}`; `compareCandidates(a,b,cohortSet) -> {blocs:[{cohortId,a,b,lean}],advantage}`.

- [ ] Write tests proving salience changes compatibility, ideological distance dominates, style affinity is bounded, and party prior cannot override extreme issue mismatch.
- [ ] Run; expected FAIL.
- [ ] Implement deterministic compatibility with ideology dominant, salience weighting, bounded party prior and bounded style affinity.
- [ ] Run; expected PASS.
- [ ] Commit `feat: add voter coalition compatibility analysis`.

### Task 8: QoL data services

**Files:** Create `qol/search.js`, `qol/filters.js`, `qol/watchlists.js`, `qol/recentViews.js`, `qol/compare.js`, `tests/qol/qolServices.test.js`.

**Interfaces:** `searchPoliticians(query,records)`, `filterPoliticians(records,filters)`, `toggleWatchlist(id)`, `recordRecentView(id)`, `comparePoliticianRecords(a,b)`. Search indexes name/state/office/party/political archetype/ideology.

- [ ] Write tests for tokenized case-insensitive search, compound filters, persistent watchlists, recent de-duplication and comparison output.
- [ ] Run; expected FAIL.
- [ ] Implement pure transforms and storage-backed list services.
- [ ] Run; expected PASS.
- [ ] Commit `feat: add political intelligence qol services`.

### Task 9: Browser shell and reusable UI

**Files:** Create `ui/components.js`, `ui/shell.js`, `styles/projectMaverick.css`, `tests/ui/shell.contract.test.js`.

**Interfaces:** `shell.mount()` creates one `#pm-root`; repeated calls are idempotent. `shell.open(view,context)`, `shell.close()`, `shell.refresh()`. Native text is inserted via `textContent`, never unsanitized `innerHTML`.

- [ ] Write source-contract tests for prefixed IDs/classes, mount guard, stylesheet load and safe native-text insertion.
- [ ] Run; expected FAIL.
- [ ] Implement accessible overlay/panel shell with keyboard close, focus return, and layout usable at native 1000x500 minimum.
- [ ] Run; expected PASS.
- [ ] Commit `feat: add Project Maverick UI shell`.

### Task 10: Politician intelligence and comparison UI

**Files:** Create `ui/politicianPanel.js`, `ui/comparePanel.js`, `tests/ui/politicianPanel.contract.test.js`.

**Interfaces:** Politician panel shows identity/office, operating archetype, ideology primary/secondary, 12-dimension profile, evidence/confidence, electorate fit, and watchlist. Compare panel shows native facts, dimensions, archetypes, distance and coalition differences.

- [ ] Write contract tests against complete and missing-data fixtures.
- [ ] Run; expected FAIL.
- [ ] Implement panels using QoL services/components; absent values display `Unavailable`, never fabricated defaults.
- [ ] Run; expected PASS.
- [ ] Commit `feat: add politician intelligence and comparison views`.

### Task 11: Ideology Explorer and electorate panel

**Files:** Create `ui/ideologyExplorer.js`, `ui/electoratePanel.js`, `tests/ui/ideologyExplorer.contract.test.js`.

**Interfaces:** Explorer filters by ideology family/subtype and shows dimensions/evidence. Electorate panel renders cohort shares, issue salience, strongest/weakest candidate blocs, and two-candidate coalition analysis.

- [ ] Write contract tests for complete and sparse district data.
- [ ] Run; expected FAIL.
- [ ] Implement deterministic sorted cohort display and candidate bloc analysis.
- [ ] Percentages derive only from normalized shares and use display rounding correction so shown values sum to 100%.
- [ ] Run; expected PASS.
- [ ] Commit `feat: add ideology explorer and electorate intelligence`.

### Task 12: Loader integration, build output, and smoke verification

**Files:** Modify `loader.js`; create `tools/build.js`, `tests/integration/loaderOrder.test.js`, `docs/INSTALL.md`, `docs/COMPATIBILITY.md`.

**Interfaces:** load order is namespace → diagnostics → compatibility → storage/events → nativeAdapter → ideology → political archetypes → voter model → QoL → UI → mount. `node tools/build.js` produces `dist/projectMaverick/**` without upstream files.

- [ ] Write loader-order and build-output allowlist tests; expected FAIL.
- [ ] Implement deterministic browser script loading with per-module diagnostic failures and duplicate-boot guard.
- [ ] Implement build validation that fails if dist contains `.bin`, `.exe`, `.dll`, upstream `audio/`, or other prohibited commercial payload.
- [ ] Run `node --test tests/**/*.test.js`; expected all PASS.
- [ ] Run build then pristine verifier against working game; expected v0.353 compatibility PASS.
- [ ] Patch only the separate working copy; verify pristine archive SHA-256 remains `15b048f976c454e3b67c57a63ce7d792a2680a7c378b2f8651b556f7f5d9ded1`.
- [ ] Static smoke check: exactly one Maverick loader in patched index and all referenced extension files exist.
- [ ] Document install, uninstall/restore, compatibility boundary, diagnostics, and recovery.
- [ ] Commit `feat: integrate Project Maverick v0.353 extension`.

### Task 13: Final regression and release checkpoint

**Files:** Create `docs/verification/v0.353-qol-archetypes-ideology.md`; update `README.md`.

- [ ] Run complete Node suite twice from clean checkout to catch persistence/order dependence.
- [ ] Re-hash pristine backup and compare with baseline.
- [ ] Re-run prohibited-file scan and verify no upstream proprietary payload is Git-tracked.
- [ ] Patch a fresh extracted working copy then restore; compare restored index byte-for-byte to baseline.
- [ ] Record exact commands, test counts, hashes, patch status, limitations and manual in-game smoke items in verification document.
- [ ] Update README feature/compatibility summary.
- [ ] Commit `chore: verify Project Maverick v0.353 milestone`.
