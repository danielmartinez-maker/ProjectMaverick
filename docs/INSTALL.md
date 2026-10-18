# Install / uninstall

Project Maverick targets a verified The Political Process v0.353 installation.

1. Build with `node tools/build.js [outputDir]`. The build replaces only a prior Project Maverick build whose ownership manifest still matches its files; it does not clear the output directory.
2. Verify the unmodified game directory with `node tools/verify-v0353.js <gameDir>`. This checks every entry in `baseline/v0.353-code.sha256`, including the native `.bin` modules, HTML, CSS, and package bootstrap.
3. Call `patchGame` from `tools/patch-v0353.js` with `gameDir`, `distDir` set to `<outputDir>/projectMaverick`, and the expected v0.353 index SHA-256. For the known v0.353 hash, the patcher checks the full compatibility manifest before it checks the pristine index hash, creates and verifies `.project-maverick-backup/index.html`, copies only the Project Maverick build, and inserts its loader after the last native `evalNWBin` script. It records hashes for the patch and files it owns.

To uninstall, call `restoreGame({gameDir})`. Rollback restores the exact backed-up `index.html` only while the installed index still matches the recorded patch hash, then removes the runtime directory only if every file still matches the installer manifest. If the index or runtime files were edited after installation, rollback stops and preserves those changes for manual review. The recovery backup remains in `.project-maverick-backup/`. Never point patch tooling at the pristine ZIP backup.
