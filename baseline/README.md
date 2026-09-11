# Upstream baseline — v0.353

Project Maverick targets The Political Process v0.353.

The upstream distribution is **not stored in this repository**. Project Maverick source and tooling must patch or load against a locally supplied game installation.

## Verification

Expected local archive SHA-256:

```
15b048f976c454e3b67c57a63ce7d792a2680a7c378b2f8651b556f7f5d9ded1
```

The inspected archive contains 218 files. `v0.353-code.sha256` records the hashes of the gameplay bytecode modules plus the readable HTML/CSS/package bootstrap files that form Project Maverick's compatibility surface.

Before applying an extension build, tooling should verify the relevant hashes and refuse destructive replacement when the local baseline is unknown. Project Maverick should prefer additive files and minimal bootstrap hooks over modification of upstream bytecode.

## Repository policy

Commit Project Maverick-authored source, tests, documentation, fixtures, schemas, and patch/build tooling. Do not commit upstream executables, `.bin` gameplay modules, audio/media, redistributables, or NW.js runtime binaries.
