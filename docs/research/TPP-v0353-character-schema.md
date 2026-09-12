# The Political Process v0.353 character compatibility notes

Project Maverick reads The Political Process candidate state without mutating it. The game stores candidate characters as fixed-length arrays rather than ordinary named-property objects.

Compatibility research was cross-checked against:

- The v0.353 package's own compiled-module string tables in the local pristine backup.
- Xoraurea's MIT-licensed Executive mod loader and public data API documentation: https://github.com/Xoraurea/tpp-executive
- Executive character enum: https://github.com/Xoraurea/tpp-executive/blob/main/executive/enums/character_enums.js
- Executive data documentation: https://github.com/Xoraurea/tpp-executive/blob/main/documentation/executive/data.md

## Candidate CharacterArray surface used by Maverick

The v0.353-compatible candidate record is expected to contain at least the extended-attributes slot at index 178. Known fields used by Maverick include:

- `0`: caucus party
- `4`, `5`: first and last name
- `6`, `7`: fiscal and social ideology labels
- `8..50`: core policy positions
- `96`: party inner caucus
- `111`: candidate id
- `122`: traits
- `127`: state id
- `129`: current jobs
- `134`: political points
- `136`: campaign funds
- `146`: name recognition
- `165..168`: universal health care, Medicaid expansion, flat tax, Social Security
- `169`: job history
- `178`: extended attributes, including actual party, party-specific approval and additional policy positions

Maverick does not write through these indexes. The adapter clones data into extension-owned snapshots.

## Incumbent collections

For v0.353, Maverick checks the native collections used by the game/mod ecosystem: `allGovernors`, `usHouse`, `usSenate1Array`, `usSenate2Array`, `usSenate3Array`, `stateHouse`, `stateSenate`, `cityCouncil`, and `schoolBoard`, plus the `usPresident`, `vicePresident`, `governor`, and `mayor` singleton candidates. Duplicate candidate IDs are removed after normalization.

The local state/city collections represent the player's currently loaded local political environment; federal House/Senate and governor collections provide broader national incumbent coverage. Project Maverick re-reads these collections when its dashboard opens because they are populated/replaced as gameplay state changes.

## Fail-closed boundary

These indexes are internal implementation details, so they must never be assumed across unknown game versions. Installation remains guarded by the exact v0.353 `index.html` hash, and future game versions require an explicit compatibility update plus adapter tests before installation is allowed.
