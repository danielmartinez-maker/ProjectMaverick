const fs = require('node:fs');
const path = require('node:path');
const { hashFile } = require('./patch-v0353');
const { V0353_INDEX_SHA256 } = require('../src/projectMaverick/core/compatibility');

function readManifest(manifestPath) {
  const entries = [];
  const seen = new Set();
  for (const [lineIndex, line] of fs.readFileSync(manifestPath, 'utf8').split(/\r?\n/).entries()) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const match = /^([a-f0-9]{64})\s+(.+)$/i.exec(trimmed);
    if (!match) throw new Error(`Invalid baseline manifest entry on line ${lineIndex + 1}.`);
    const relativePath = match[2].replace(/\\/g, '/');
    if (seen.has(relativePath)) throw new Error(`Duplicate baseline manifest entry for ${relativePath}.`);
    seen.add(relativePath);
    entries.push({ expected: match[1].toLowerCase(), relativePath });
  }
  if (!entries.length) throw new Error('Baseline manifest has no file entries.');
  return entries;
}

function verifyGameDir(gameDir, manifestPath = path.join(__dirname, '..', 'baseline', 'v0.353-code.sha256')) {
  const manifest = readManifest(manifestPath);
  const index = manifest.find((entry) => entry.relativePath.toLowerCase() === 'index.html');
  if (!index || index.expected !== V0353_INDEX_SHA256) throw new Error('Baseline manifest index hash does not match the v0.353 compatibility signature.');
  const results = manifest.map(({ expected, relativePath }) => {
    const filePath = path.join(gameDir, ...relativePath.split('/'));
    const actual = fs.existsSync(filePath) && fs.statSync(filePath).isFile() ? hashFile(filePath) : null;
    return { relativePath, expected, actual, ok: actual === expected };
  });
  return { ok: results.every((result) => result.ok), results };
}

if (require.main === module) {
  const gameDir = process.argv[2];
  if (!gameDir) throw new Error('Usage: node tools/verify-v0353.js <unmodified-gameDir>');
  const result = verifyGameDir(gameDir);
  const failures = result.results.filter((entry) => !entry.ok);
  if (failures.length) {
    for (const entry of failures) console.error(`FAIL ${entry.relativePath}: expected ${entry.expected}, got ${entry.actual || 'missing'}`);
    process.exitCode = 1;
  } else {
    console.log(`PASS v0.353 compatibility surface (${result.results.length} files; index ${V0353_INDEX_SHA256})`);
  }
}

module.exports = { readManifest, verifyGameDir };
