# Project Maverick Foundation and QoL Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the reversible v0.353 loader, compatibility/storage/native-adapter foundation, and the first usable political-intelligence QoL surface.

**Architecture:** The native game remains authoritative. Project Maverick loads after native bytecode, reads game state through a defensive adapter, stores extension state separately, and patches only verified v0.353 text surfaces. QoL services are pure transforms above normalized snapshots and UI code consumes those services rather than native globals.

**Tech Stack:** NW.js/Chromium, plain JavaScript, CSS, Node built-in test runner/assert, Node patch/build tooling.

**Spec:** `docs/superpowers/specs/2026-09-11-qol-archetypes-ideology-design.md`

## Global Constraints
- Target The Political Process v0.353 first.
- Never modify the pristine backup or overwrite native `.bin` modules.
- Runtime namespace is `window.ProjectMaverick`; DOM/CSS uses `pm-` / `pm_` prefixes.
- Native state is authoritative; Project Maverick persistence is separate and removable.
- Unknown/hash-mismatched baselines fail closed by default.
- Missing native fields degrade features and emit diagnostics instead of stopping the game.
- No external runtime dependency in the first release.
- Never commit upstream commercial executables/assets/bytecode.

---

### Task 1: Compatibility gate and reversible loader
**Files:** Create `src/projectMaverick/loader.js`, `src/projectMaverick/core/{namespace,diagnostics,compatibility}.js`, `tools/{patch-v0353,verify-v0353}.js`; test `tests/core/compatibility.test.js`, `tests/tools/patch-v0353.test.js`.
**Interfaces:** `ProjectMaverick.compatibility.check(env)`, `diagnostics.record(code, detail)`, `patchGame(...)`, `restoreGame(...)`.
- [ ] Write tests accepting the exact v0.353 signature and rejecting a changed hash.
- [ ] Run `node --test tests/core/compatibility.test.js`; verify failure before implementation.
- [ ] Implement namespace, bounded diagnostics buffer, and fail-closed compatibility check.
- [ ] Write patch tests proving a single loader insertion, idempotent patching, and byte-identical restore.
- [ ] Implement backup-first patching to `.project-maverick-backup/index.html` and copying only Maverick dist files.
- [ ] Run Task 1 tests; expected PASS.
- [ ] Commit `feat: add reversible v0353 loader and compatibility gate`.

### Task 2: Native adapter, persistence, and event bus
**Files:** Create `src/projectMaverick/core/{nativeAdapter,storage,events}.js`; tests `tests/core/{nativeAdapter,storage}.test.js`.
**Interfaces:** `readPoliticians()`, `readPlayer()`, `readDistrictContext(subject)`, `readElectionContext(subject)`, `readIssueCatalog()`, `storage.load/save/update`, `events.on/emit`.
- [ ] Add malformed/absent-global fixtures and stable-ID normalization tests.
- [ ] Implement read-only snapshot normalization without retaining mutable native objects.
- [ ] Add persistence tests for schema version 1, corruption recovery, 50-item recent-view cap, and nonthrowing write failures.
- [ ] Implement versioned localStorage state and minimal event bus.
- [ ] Run Task 2 tests; expected PASS.
- [ ] Commit `feat: add native adapter and isolated extension state`.

### Task 3: QoL data services
**Files:** Create `src/projectMaverick/qol/{search,filters,watchlists,recentViews,compare}.js`; test `tests/qol/qolServices.test.js`.
**Interfaces:** `searchPoliticians(query,records)`, `filterPoliticians(records,filters)`, `toggleWatchlist(id)`, `recordRecentView(id)`, `comparePoliticianRecords(a,b)`.
- [ ] Test tokenized/case-insensitive search, compound filters, persistent watchlists, deduplicated recent views, and comparison deltas.
- [ ] Implement pure search/filter/compare transforms and persistence-backed list services.
- [ ] Run `node --test tests/qol/qolServices.test.js`; expected PASS.
- [ ] Commit `feat: add political intelligence qol services`.

### Task 4: UI shell and safe reusable components
**Files:** Create `src/projectMaverick/ui/{components,shell,dashboard}.js`, `src/projectMaverick/styles/projectMaverick.css`; test `tests/ui/shell.contract.test.js`.
**Interfaces:** `shell.mount()`, `shell.open(view,context)`, `shell.close()`, `shell.refresh()`.
- [ ] Add contract tests for one `#pm-root`, idempotent mounting, prefixed selectors, stylesheet loading, keyboard close/focus return, and `textContent` for native strings.
- [ ] Implement a compact desktop-first shell usable at the native 1000x500 minimum window.
- [ ] Run shell contract tests; expected PASS.
- [ ] Commit `feat: add Project Maverick UI shell`.

### Task 5: Build, loader order, and smoke verification
**Files:** Create/modify `tools/build.js`, `src/projectMaverick/loader.js`, `tests/integration/loaderOrder.test.js`, `docs/{INSTALL,COMPATIBILITY}.md`.
**Interfaces:** loader order is core → models → QoL → UI; `node tools/build.js` emits only `dist/projectMaverick/**`.
- [ ] Test deterministic load order, duplicate-boot guard, and prohibited payload scan.
- [ ] Build and ensure `.bin`, `.exe`, `.dll`, and upstream asset directories are rejected from dist.
- [ ] Verify pristine v0.353, patch a separate working copy, and check exactly one loader reference plus complete extension files.
- [ ] Restore and compare upstream `index.html` byte-for-byte.
- [ ] Document install/uninstall/recovery.
- [ ] Commit `feat: integrate Project Maverick v0.353 foundation`.
