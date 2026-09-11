# Project Maverick — QoL, Political Archetypes, and Ideology Design

Date: 2026-09-11
Baseline: The Political Process v0.353
Status: approved design, implementation pending plan

## 1. Goal

Project Maverick extends The Political Process v0.353 with a compatibility-first quality-of-life layer and a comprehensive political classification system for politicians and voters. The extension must improve information access and political simulation legibility without replacing the native election simulation, weakening existing mechanics, or modifying compiled `.bin` gameplay modules.

The first release has three connected pillars:

1. QoL and political intelligence UI.
2. Political personality/operating archetypes for politicians.
3. Multidimensional ideological archetypes for politicians and electorate cohorts.

The original game remains authoritative for game state. Project Maverick derives information from native state, stores only extension-owned state, and applies gameplay modifiers only through explicit, bounded adapters that can be disabled without damaging a save.

## 2. Compatibility and safety constraints

- Target v0.353 first.
- Never modify the pristine backup.
- Never overwrite a native `.bin` gameplay module.
- Inject Project Maverick after all native `evalNWBin` calls have loaded.
- Keep all extension globals under one namespace: `window.ProjectMaverick`.
- Prefix extension DOM ids/classes with `pm-` / `pm_` to avoid collisions.
- Read native state defensively through adapters rather than scattering direct global access throughout the extension.
- Do not replace native save data. Extension state is versioned and separate.
- If a native field is absent or changes type, the corresponding feature degrades gracefully and records a diagnostic instead of blocking the game.
- Installation and removal must be reversible. Removing Project Maverick must leave the native save usable.
- Every modified upstream text file must be backed up and hash-checked before patching.
- The installer must reject an unknown baseline by default rather than patching unverified files.
- Project Maverick source, tests, manifests, documentation, and patch tooling are committed to GitHub. Upstream commercial executables, assets, redistributables, and gameplay bytecode are excluded.

## 3. Architecture

### 3.1 Loader

`index.html` receives the smallest possible compatibility patch: after the final native `evalNWBin` call, load `projectMaverick/loader.js`. `loader.js` validates the environment and then loads Project Maverick modules in a deterministic order.

Proposed source layout:

```text
src/projectMaverick/
  loader.js
  core/
    namespace.js
    diagnostics.js
    compatibility.js
    storage.js
    events.js
    nativeAdapter.js
  archetypes/
    politicalArchetypes.js
    politicianIdeology.js
    ideologyDimensions.js
    taxonomy.js
    scoring.js
  voters/
    cohortModel.js
    cohortTemplates.js
    coalitionAnalysis.js
  qol/
    search.js
    watchlists.js
    recentViews.js
    filters.js
    compare.js
  ui/
    shell.js
    politicianPanel.js
    ideologyExplorer.js
    electoratePanel.js
    comparePanel.js
    components.js
  styles/
    projectMaverick.css
```

Build output mirrors this under the game's `projectMaverick/` directory. The initial implementation should remain understandable as plain ES5-compatible browser JavaScript unless the bundled Chromium runtime proves modern syntax safe. No external runtime dependency is required for the first release.

### 3.2 Native adapter

`nativeAdapter.js` is the only module allowed to know detailed native global names. It exposes normalized functions such as:

- `getPlayer()`
- `getPoliticians()`
- `getPoliticianIdentity(p)`
- `getPoliticianTraits(p)`
- `getPoliticianPolicies(p)`
- `getPoliticianParty(p)`
- `getPoliticianIdeology(p)`
- `getPoliticianApproval(p)`
- `getDistrictContext(p)`
- `getElectorateContext(area)`
- `getElectionContext(election)`
- `getCurrentTurnKey()`

Each accessor returns a normalized object or `null`/empty data and never throws into native UI code.

### 3.3 Extension state

Extension-owned persistent state includes only:

- favorite/watchlist politician identities;
- recent-view history;
- user UI preferences;
- cached derived classifications with source fingerprints;
- optional archetype modifier bookkeeping;
- schema version and migration metadata.

No duplicate authoritative copy of politicians, elections, policies, approval, voter counts, or native saves is stored.

## 4. Political personality archetypes

Political archetypes answer: **How does this politician operate?** They are independent from ideology.

The classifier derives scores from native traits, political experience, party relationships, popularity/name recognition where available, incumbency/career history, and other verified native attributes.

Initial primary archetypes:

- Technocrat
- Pragmatist
- Populist
- Firebrand
- Coalition Builder
- Party Loyalist
- Maverick
- Policy Wonk
- Retail Politician
- Operator
- Ideologue
- Statesman

A politician receives:

- one primary archetype;
- an optional secondary archetype when the second score is sufficiently strong and distinct;
- confidence score;
- evidence list explaining the classification;
- strengths and liabilities;
- optional bounded gameplay modifiers.

Example display: `Pragmatist · Technocrat`.

### 4.1 Scoring rules

Each archetype is represented by weighted evidence rules. Rules must be data-driven. Native traits such as Charismatic, Ambitious, Aggressive, Articulate, Conciliatory, Calculating, Popular, Outspoken, Practical, Rational, Stubborn, Extroverted, and Introverted can contribute when present.

No archetype is assigned from party alone. Political style must be separable from ideology and party affiliation.

### 4.2 Gameplay effects

Classification ships first. Gameplay modifiers are enabled only where a safe runtime hook is verified. Effects must be modest and capped so native campaign/election mechanics remain dominant.

Candidate examples subject to verified hooks:

- Coalition Builder: small relationship/endorsement effectiveness bonus.
- Firebrand: visibility/enthusiasm upside paired with polarization liability.
- Technocrat: policy/governance effectiveness bonus paired with weaker retail appeal.
- Operator: party/institutional influence advantage.
- Maverick: reduced establishment synergy paired with cross-party/independent appeal.

An unavailable or unsafe hook results in no mechanical modifier, never an emulated rewrite of the native simulation.

## 5. Ideological model

Ideology answers: **What does this actor believe and which trade-offs define those beliefs?**

The native game's fiscal/social labels are preserved as source signals, but Project Maverick adds a multidimensional profile so cross-pressured actors are represented correctly.

### 5.1 Dimensions

The initial normalized dimensions are:

1. Economic distribution: redistributive ↔ market-oriented.
2. Tax/fiscal policy: high-tax/high-service ↔ low-tax/low-spending.
3. Welfare/safety net: expansive ↔ limited.
4. Social/cultural policy: progressive ↔ traditional.
5. Immigration: permissive ↔ restrictive.
6. Environment/energy: regulatory/environmentalist ↔ growth/deregulatory.
7. Guns: restrictive ↔ permissive.
8. Health care: public/universal ↔ private/market.
9. Education: public-system emphasis ↔ choice/decentralization.
10. Institutional orientation: reformist ↔ institutionalist.
11. Partisan alignment: weak/independent ↔ strongly partisan.
12. Ideological intensity: low-salience/moderate ↔ highly ideological.

Dimensions are calculated from verified policies and native indicators. Missing policy inputs reduce confidence rather than being silently treated as neutral.

### 5.2 Politician ideological taxonomy

Project Maverick uses a family/subtype taxonomy rather than one linear label. The target is approximately 25–35 meaningful ideological types, organized into broad families. The initial taxonomy includes:

**Left / progressive**
- Democratic Socialist
- Progressive Left
- Environmental Progressive
- Social Democrat
- Labor Progressive

**Liberal**
- New Deal Liberal
- Mainstream Liberal
- Institutional Liberal
- Moderate Liberal
- Social Liberal

**Center / heterodox**
- Centrist
- Pragmatic Centrist
- Heterodox Independent
- Economically Populist Social Moderate
- Socially Liberal Fiscal Conservative
- Disengaged/Low-Intensity Moderate

**Libertarian / classical liberal**
- Civil Libertarian
- Classical Liberal
- Market Libertarian

**Conservative**
- Fiscal Conservative
- Mainstream Conservative
- Business Conservative
- Social Conservative
- Christian Conservative
- Institutional Conservative

**National / populist right**
- National Conservative
- Right Populist
- Economic Nationalist

The implementation may add a small number of subtypes when native policy dimensions clearly support them, but must not proliferate labels that cannot be distinguished using actual game data.

### 5.3 Classification method

Each taxonomy template contains:

- preferred ranges for ideology dimensions;
- required/forbidden strong positions where necessary;
- issue-salience expectations;
- party affinity as a weak prior, never a deciding rule;
- distance weights;
- minimum evidence requirements.

Classification computes weighted distance from templates, applies cross-pressure rules, returns the closest valid subtype, and reports confidence. A broad family is shown when evidence is insufficient for a defensible subtype.

The explanation UI displays the strongest dimensions and policies responsible for the result.

## 6. Voter ideological cohorts

The native game appears to model electorates primarily as aggregated voter data rather than persistent individual citizen agents. Project Maverick therefore models **electorate cohorts**, not invented individual voters.

For each available electorate (district, state, or other native geographic unit), the cohort model derives a distribution over ideology types from native data such as:

- party registration/support distribution;
- issue support by party where available;
- issue priorities/salience;
- fiscal/social ideology indicators;
- demographic/geographic context only where native game data already provides a supported relationship;
- turnout/enthusiasm where exposed.

The cohort percentages must reconcile to the native electorate total/distribution within rounding tolerance. Project Maverick must not alter native registration counts merely to make archetype labels fit.

### 6.1 Cohort representation

Each cohort carries:

- ideological family/subtype;
- share of electorate;
- party affinity;
- issue position vector;
- issue salience vector;
- ideological intensity;
- turnout/enthusiasm signal when available;
- candidate-style preferences;
- confidence/derivation quality.

Example district display:

`Progressive Left 14% · Mainstream Liberal 19% · Working-Class Populist 9% · Centrist 13% · Libertarian 5% · Mainstream Conservative 20% · Religious Conservative 12% · Right Populist 8%`

### 6.2 Candidate compatibility

Candidate-to-cohort compatibility is an analytical Project Maverick score. It considers:

- ideological distance;
- issue salience (high-salience disagreements matter more);
- political archetype/style affinity;
- party affinity;
- native approval/name-recognition/incumbency indicators where appropriate.

For the first release, this score explains likely coalition strengths/weaknesses and does not replace native vote calculation. Native election outcomes remain authoritative.

## 7. QoL expansion

### 7.1 Global politician search

Enhance the existing search experience with fast matching by:

- politician name;
- party;
- current office;
- state/geography;
- political archetype;
- ideological family/subtype.

Search results provide compact contextual information and can open the native politician/profile flow where a verified function exists.

### 7.2 Watchlists and favorites

Users can favorite politicians and create a default watchlist. Watchlist state is extension-owned and persisted separately. Entries expose office, party, ideology, political archetype, approval/popularity where available, and election status.

### 7.3 Filters and sorting

Project Maverick lists support filtering/sorting by:

- name;
- party;
- office;
- state;
- political archetype;
- ideology family/subtype;
- fiscal/social native ideology;
- approval/popularity where available;
- incumbency/election status.

Filters must not mutate native arrays.

### 7.4 Politician intelligence panel

A Project Maverick panel for a selected politician shows:

- identity/office/party;
- primary + secondary political archetype;
- ideology family + subtype;
- 12-dimension ideology profile;
- strongest defining policy positions;
- classification evidence/confidence;
- approval/popularity/name recognition where exposed;
- electorate fit for their current/relevant constituency;
- strongest/weakest voter cohorts;
- favorite/watchlist action.

### 7.5 Side-by-side comparison

Compare two politicians/candidates across:

- office/party;
- political archetype;
- ideology dimensions;
- defining policies;
- approval/popularity;
- constituency compatibility;
- strongest voter coalitions.

The comparison is descriptive/analytical and does not simulate an election unless the native game already exposes a safe simulator entry point.

### 7.6 Ideology Explorer

A dedicated Project Maverick view connects:

- ideology taxonomy;
- politicians matching each archetype;
- voter cohort composition for a selected electorate;
- key issues driving the classification;
- candidate-cohort compatibility.

It must expose underlying dimension scores so labels remain explainable.

### 7.7 Recent views and compact tooltips

Recent politician views are stored in a bounded MRU list. Project Maverick tooltips add ideology/archetype summaries without replacing native tooltip behavior globally.

## 8. UI integration

The extension will avoid broad native markup rewrites. UI is mounted into a Project Maverick root attached to `document.body` after native initialization.

The first release adds a single `Maverick` navigation entry adjacent to existing top navigation when safe. Its shell contains tabs for:

- Search
- Watchlist
- Politicians
- Ideology
- Electorates
- Compare
- Diagnostics

Where useful, small Project Maverick badges/buttons may be injected into native politician views using idempotent DOM observers. All injection routines must tolerate native page rerenders.

The visual style follows the game's existing density and typography instead of introducing a visually unrelated framework. Dark-mode compatibility is required if the native stylesheet switches to dark mode.

## 9. Persistence and migrations

Extension storage uses a versioned key, for example `projectMaverickStateV1`, in the safest persistent mechanism verified in NW.js. The stored document includes:

```json
{
  "schemaVersion": 1,
  "watchlists": [],
  "recentPoliticians": [],
  "preferences": {},
  "derivedCache": {},
  "modifierLedger": {}
}
```

Derived cache entries include fingerprints of their native source values. Stale entries are recomputed. Cache corruption discards only the extension cache.

Future schema migrations are one-way transformations of extension-owned state and never modify native saves.

## 10. Performance

- Do not rescan every politician on every animation frame.
- Build indexes lazily after native data becomes available.
- Cache classifications by stable identity + source fingerprint.
- Recompute on relevant turn/state changes or on demand.
- Cohort derivation runs per electorate and caches by source fingerprint.
- DOM observers must be narrow and debounced.
- Large politician lists render incrementally or with pagination if required by measured performance.

A QoL feature is rejected or redesigned if it causes visible turn-processing regressions.

## 11. Error handling and diagnostics

Project Maverick contains a diagnostics panel showing:

- Project Maverick version;
- detected game compatibility version/hash state;
- loaded modules;
- missing native accessors;
- caught extension errors;
- cache/schema state;
- safe-mode toggle for mechanical modifiers.

Extension exceptions are caught at module/UI boundaries and logged with context. They must not suppress native game errors or monkey-patch global error handling in a way that hides failures.

A safe mode disables all optional gameplay modifiers while keeping classification and QoL UI available.

## 12. Installation and rollback

Installer flow:

1. Verify expected v0.353 hashes for patched upstream text files.
2. Copy original patched files to a local backup directory if absent.
3. Copy Project Maverick build output into `projectMaverick/`.
4. Apply the minimal idempotent `index.html` loader patch and stylesheet reference if required.
5. Verify expected patch markers and file hashes.
6. Produce an installation report.

Rollback flow:

1. Remove Project Maverick loader/style references or restore the verified backed-up `index.html`.
2. Remove `projectMaverick/` build output.
3. Leave native game saves untouched.
4. Optionally preserve extension preferences/watchlists externally.

The pristine v0.353 ZIP remains an independent final recovery source.

## 13. Testing strategy

### 13.1 Pure unit tests

Test without NW.js where possible:

- ideology dimension normalization;
- missing-data confidence handling;
- politician ideology classification;
- cross-pressure cases;
- political archetype scoring;
- voter cohort reconciliation to 100%;
- candidate-cohort compatibility;
- stable classification under irrelevant field changes;
- storage migrations;
- search/filter behavior.

### 13.2 Fixture tests

Create sanitized synthetic fixtures shaped like normalized adapter outputs. Do not commit upstream game data.

Fixtures must cover:

- conventional progressive/liberal/conservative cases;
- libertarian case;
- economically left/socially traditional cross-pressure case;
- socially liberal/fiscally conservative case;
- low-information politician;
- missing policy categories;
- district with strong partisan skew;
- balanced/swing electorate;
- cohort rounding/reconciliation edge cases.

### 13.3 Integration tests

On the verified local v0.353 working copy:

- loader executes after native modules;
- extension failure does not prevent native startup;
- Maverick shell opens/closes repeatedly;
- search/watchlist persistence survives reload;
- native profile/election navigation still works;
- dark mode does not make extension UI unusable;
- next-turn processing remains functional;
- native save/load remains functional;
- rollback returns patched upstream files to their baseline hash.

### 13.4 Compatibility gate

Before packaging a build, verify:

- pristine archive SHA-256 still matches recorded baseline;
- upstream `.bin` hashes remain unchanged;
- only approved upstream text files differ in the working copy;
- every differing upstream file is explained by the patch manifest;
- Project Maverick source tree passes tests;
- install and rollback scripts are idempotent.

## 14. Delivery sequence

Implementation is intentionally staged to reduce compatibility risk:

1. Repository/tooling foundation and v0.353 patch verifier.
2. Loader, namespace, diagnostics, native adapter, and extension storage.
3. Pure politician political-archetype classifier.
4. Pure multidimensional politician ideology classifier and taxonomy.
5. Voter electorate cohort model and reconciliation.
6. Search, filters, favorites/watchlists, recent views.
7. Politician intelligence and comparison UI.
8. Ideology Explorer and electorate coalition UI.
9. Safe verified gameplay modifier adapters, only where supported.
10. Integration hardening, install/rollback validation, compatibility report.

Each stage is committed independently to ProjectMaverick so regressions can be bisected and reverted.

## 15. Acceptance criteria

The first Project Maverick release is complete when:

- v0.353 starts normally with Project Maverick installed;
- the extension can be disabled/removed without damaging native saves;
- upstream gameplay `.bin` files remain byte-identical to baseline;
- politicians receive explainable political archetypes;
- politicians receive explainable multidimensional ideological classifications;
- electorates display reconciled ideological cohort distributions derived from native data;
- candidate/cohort compatibility analysis is available without replacing native election outcomes;
- global search, filters, watchlists, recent views, comparison, and ideology/electorate views work;
- low-information classifications communicate uncertainty instead of fabricating precision;
- extension state persists and migrates independently;
- automated unit/fixture tests pass;
- install and rollback are verified against the baseline hashes;
- Project Maverick source and documentation are backed up in GitHub after each implementation stage.

## 16. Explicit non-goals for this release

- Decompiling or rewriting the native `.bin` simulation.
- Replacing the game's election result algorithm.
- Fabricating persistent individual voter agents where the native game has aggregate electorates.
- Rebalancing the entire game around Project Maverick archetypes.
- Modifying native saves to store extension metadata.
- Publishing or committing upstream commercial game files to the public ProjectMaverick repository.
