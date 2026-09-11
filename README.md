# Project Maverick

Project Maverick is an additive gameplay/QoL extension project for **The Political Process v0.353**.

## Scope

This repository contains only Project Maverick source code, specifications, tests, patch/build tooling, and compatibility metadata created for the extension. The original commercial game executable, compiled gameplay bytecode, media assets, redistributables, and other third-party distribution files are intentionally excluded.

Project Maverick is designed around guarded runtime adapters so the upstream v0.353 package remains untouched wherever possible.

## Planned systems

- QoL expansion: improved search/filtering, politician watchlists/favorites, richer political profiles and tooltips, comparison views, and election/district intelligence.
- Political personality archetypes: derived operational styles such as Technocrat, Firebrand, Coalition Builder, Operator, Populist, Party Loyalist, and related archetypes.
- Comprehensive ideological archetypes for politicians and voter cohorts using multidimensional issue positions, issue salience, partisan affinity, and ideological intensity.
- Compatibility-first persistence: extension state namespaced separately from native game state.

## Baseline

Initial target: The Political Process v0.353.

The local baseline archive is identified by SHA-256:

`15b048f976c454e3b67c57a63ce7d792a2680a7c378b2f8651b556f7f5d9ded1`

A file-level SHA-256 manifest is stored under `baseline/` so the exact upstream package can be verified locally without redistributing it through this repository.
