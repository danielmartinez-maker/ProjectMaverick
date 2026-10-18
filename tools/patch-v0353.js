const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');

const INSTALL_MANIFEST = '.pm-install-manifest.json';
const INSTALL_METADATA = 'install.json';
const LOADER_TAG = '    <script src="projectMaverick/loader.js"></script>';

function hashFile(file) {
  return crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');
}

function assertDirectoryIfPresent(directory, label) {
  if (!fs.existsSync(directory)) return;
  const info = fs.lstatSync(directory);
  if (!info.isDirectory() || info.isSymbolicLink()) throw new Error(`${label} must be a real directory: ${directory}`);
}

function assertFileIfPresent(file, label) {
  if (!fs.existsSync(file)) return;
  const info = fs.lstatSync(file);
  if (!info.isFile() || info.isSymbolicLink()) throw new Error(`${label} must be a regular file: ${file}`);
}

function safeRelativePath(relativePath) {
  if (typeof relativePath !== 'string' || !relativePath || path.isAbsolute(relativePath)) return false;
  const normalized = relativePath.replace(/\\/g, '/');
  return normalized.split('/').every((part) => part && part !== '.' && part !== '..');
}

function listFiles(rootDir, currentDir = rootDir, output = []) {
  for (const entry of fs.readdirSync(currentDir, { withFileTypes: true }).sort((a, b) => a.name < b.name ? -1 : a.name > b.name ? 1 : 0)) {
    const absolute = path.join(currentDir, entry.name);
    const info = fs.lstatSync(absolute);
    if (info.isSymbolicLink()) throw new Error(`Refusing symbolic link in Project Maverick files: ${absolute}`);
    if (info.isDirectory()) listFiles(rootDir, absolute, output);
    else if (info.isFile()) output.push(path.relative(rootDir, absolute).replace(/\\/g, '/'));
    else throw new Error(`Refusing non-file Project Maverick payload: ${absolute}`);
  }
  return output;
}

function snapshotTree(rootDir, { excludeInstallManifest = false } = {}) {
  const files = {};
  for (const relativePath of listFiles(rootDir)) {
    if (excludeInstallManifest && relativePath === INSTALL_MANIFEST) continue;
    files[relativePath] = hashFile(path.join(rootDir, relativePath));
  }
  return files;
}

function makeInstallManifest(distDir, baselineIndexSha256) {
  const files = snapshotTree(distDir);
  if (!Object.prototype.hasOwnProperty.call(files, 'loader.js')) throw new Error('Build output is missing projectMaverick/loader.js.');
  if (Object.prototype.hasOwnProperty.call(files, INSTALL_MANIFEST)) {
    throw new Error(`The build output reserves ${INSTALL_MANIFEST} for installer ownership data.`);
  }
  return { schemaVersion: 1, baselineIndexSha256, files };
}

function parseJsonFile(file, description) {
  try {
    return JSON.parse(fs.readFileSync(file, 'utf8'));
  } catch (error) {
    throw new Error(`Cannot read ${description}: ${error.message}`);
  }
}

function assertSafeManifest(manifest, expectedBaseline) {
  if (!manifest || manifest.schemaVersion !== 1 || manifest.baselineIndexSha256 !== expectedBaseline || !manifest.files || typeof manifest.files !== 'object' || Array.isArray(manifest.files)) {
    throw new Error('Project Maverick install manifest is invalid or belongs to another baseline.');
  }
  for (const [relativePath, digest] of Object.entries(manifest.files)) {
    if (!safeRelativePath(relativePath) || relativePath === INSTALL_MANIFEST || !/^[a-f0-9]{64}$/i.test(digest)) {
      throw new Error(`Project Maverick install manifest contains an invalid entry: ${relativePath}`);
    }
  }
}

function assertInstalledTree(extensionDir, manifest, expectedManifestSha256) {
  const manifestPath = path.join(extensionDir, INSTALL_MANIFEST);
  assertFileIfPresent(manifestPath, 'Project Maverick ownership manifest');
  if (!fs.existsSync(manifestPath)) throw new Error('Existing projectMaverick directory has no ownership manifest; refusing to overwrite or remove it.');
  const manifestBytes = fs.readFileSync(manifestPath);
  if (expectedManifestSha256 && hashFile(manifestPath) !== expectedManifestSha256) {
    throw new Error('Project Maverick ownership manifest changed after installation; refusing to replace or remove user data.');
  }
  const installedManifest = JSON.parse(manifestBytes.toString('utf8'));
  assertSafeManifest(installedManifest, manifest.baselineIndexSha256);
  if (JSON.stringify(installedManifest) !== JSON.stringify(manifest)) {
    throw new Error('An existing Project Maverick installation differs from this build; restore it before installing another build.');
  }
  const actualFiles = snapshotTree(extensionDir, { excludeInstallManifest: true });
  if (JSON.stringify(actualFiles) !== JSON.stringify(manifest.files)) {
    throw new Error('Project Maverick files changed or untracked files were added; refusing to overwrite or remove them.');
  }
  return hashFile(manifestPath);
}

function getLoaderReferences(html) {
  const references = [];
  const scriptTag = /<script\b[^>]*\bsrc\s*=\s*(['"])(?:\.\/)?projectMaverick\/loader\.js\1[^>]*>\s*<\/script\s*>/gi;
  let match;
  while ((match = scriptTag.exec(html))) references.push({ index: match.index, end: scriptTag.lastIndex });
  return references;
}

function findInsertionPoint(html) {
  const scriptTag = /<script\b[^>]*>[\s\S]*?<\/script\s*>/gi;
  const nativeLoad = /\bevalNWBin\s*\(/i;
  let match;
  let insertionPoint = -1;
  while ((match = scriptTag.exec(html))) {
    if (nativeLoad.test(match[0])) insertionPoint = scriptTag.lastIndex;
  }
  if (insertionPoint >= 0) return { index: insertionPoint, followsNativeLoad: true };

  // This fallback supports explicitly hash-pinned non-game fixtures. The known
  // v0.353 hash resolves through the native evalNWBin branch above.
  const bodyEnd = html.toLowerCase().lastIndexOf('</body>');
  if (bodyEnd >= 0) return { index: bodyEnd, followsNativeLoad: false };
  throw new Error('Baseline verification failed: no native evalNWBin script or closing body marker found.');
}

function atomicWrite(file, bytes) {
  const directory = path.dirname(file);
  const temporary = path.join(directory, `.${path.basename(file)}.${process.pid}.${crypto.randomBytes(6).toString('hex')}.tmp`);
  fs.writeFileSync(temporary, bytes, { flag: 'wx' });
  try {
    fs.renameSync(temporary, file);
  } catch (error) {
    fs.rmSync(temporary, { force: true });
    throw error;
  }
}

function writeDirectoryFromDist(distDir, extensionDir, manifest) {
  const parent = path.dirname(extensionDir);
  const stageDir = fs.mkdtempSync(path.join(parent, '.project-maverick-stage-'));
  try {
    for (const relativePath of Object.keys(manifest.files)) {
      const source = path.join(distDir, relativePath);
      const target = path.join(stageDir, relativePath);
      fs.mkdirSync(path.dirname(target), { recursive: true });
      fs.copyFileSync(source, target);
    }
    fs.writeFileSync(path.join(stageDir, INSTALL_MANIFEST), `${JSON.stringify(manifest, null, 2)}\n`, { flag: 'wx' });
    if (JSON.stringify(snapshotTree(stageDir, { excludeInstallManifest: true })) !== JSON.stringify(manifest.files)) {
      throw new Error('Staged Project Maverick files do not match the build manifest.');
    }
    fs.renameSync(stageDir, extensionDir);
  } catch (error) {
    fs.rmSync(stageDir, { recursive: true, force: true });
    throw error;
  }
}

function readInstallMetadata(file, expectedBaseline) {
  const metadata = parseJsonFile(file, 'Project Maverick install metadata');
  if (metadata.schemaVersion !== 1 || metadata.baselineIndexSha256 !== expectedBaseline || !/^[a-f0-9]{64}$/i.test(metadata.patchedIndexSha256 || '') || !/^[a-f0-9]{64}$/i.test(metadata.extensionManifestSha256 || '')) {
    throw new Error('Project Maverick install metadata is invalid or belongs to another baseline.');
  }
  return metadata;
}

function patchGame({ gameDir, distDir, expectedIndexSha256 }) {
  if (!gameDir || !distDir || !expectedIndexSha256) throw new Error('gameDir, distDir and expectedIndexSha256 are required.');
  assertDirectoryIfPresent(gameDir, 'gameDir');
  assertDirectoryIfPresent(distDir, 'distDir');
  if (!fs.existsSync(gameDir) || !fs.existsSync(distDir)) throw new Error('gameDir and distDir must be existing directories.');

  const indexPath = path.join(gameDir, 'index.html');
  const backupDir = path.join(gameDir, '.project-maverick-backup');
  const backupPath = path.join(backupDir, 'index.html');
  const metadataPath = path.join(backupDir, INSTALL_METADATA);
  const extensionDir = path.join(gameDir, 'projectMaverick');
  assertFileIfPresent(indexPath, 'index.html');
  assertDirectoryIfPresent(backupDir, 'Recovery directory');
  assertFileIfPresent(backupPath, 'Recovery backup');
  assertFileIfPresent(metadataPath, 'Install metadata');
  assertDirectoryIfPresent(extensionDir, 'Project Maverick runtime directory');
  const currentBytes = fs.readFileSync(indexPath);
  const current = currentBytes.toString('utf8');
  const currentHash = hashFile(indexPath);
  const references = getLoaderReferences(current);
  const manifest = makeInstallManifest(distDir, expectedIndexSha256);

  if (fs.existsSync(backupPath) && hashFile(backupPath) !== expectedIndexSha256) {
    throw new Error('Baseline verification failed: existing recovery backup does not match the expected index hash.');
  }

  if (references.length > 0) {
    if (references.length !== 1 || !fs.existsSync(backupPath) || !fs.existsSync(metadataPath)) {
      throw new Error('Baseline verification failed: existing loader reference has no trusted Project Maverick recovery metadata.');
    }
    const metadata = readInstallMetadata(metadataPath, expectedIndexSha256);
    if (currentHash !== metadata.patchedIndexSha256) {
      throw new Error('Baseline verification failed: patched index changed after installation.');
    }
    const insertionPoint = findInsertionPoint(current);
    if (insertionPoint.followsNativeLoad && references[0].index < insertionPoint.index) throw new Error('Project Maverick loader appears before native evalNWBin initialization.');
    if (!fs.existsSync(extensionDir)) throw new Error('Project Maverick loader is present but its runtime directory is missing.');
    const extensionManifestSha256 = assertInstalledTree(extensionDir, manifest, metadata.extensionManifestSha256);
    if (extensionManifestSha256 !== metadata.extensionManifestSha256) throw new Error('Project Maverick runtime manifest does not match recovery metadata.');
    return { changedFiles: [], alreadyInstalled: true };
  }

  if (expectedIndexSha256 === require('../src/projectMaverick/core/compatibility').V0353_INDEX_SHA256) {
    const { verifyGameDir } = require('./verify-v0353');
    const baseline = verifyGameDir(gameDir);
    if (!baseline.ok) {
      const failures = baseline.results.filter((entry) => !entry.ok).map((entry) => entry.relativePath);
      throw new Error(`Baseline verification failed for v0.353 compatibility files: ${failures.join(', ')}`);
    }
  }

  if (currentHash !== expectedIndexSha256) throw new Error('Baseline verification failed: unexpected index hash.');
  const insertionPoint = findInsertionPoint(current).index;
  const patchedBytes = Buffer.from(`${current.slice(0, insertionPoint)}\n${LOADER_TAG}\n${current.slice(insertionPoint)}`, 'utf8');
  const patchedIndexSha256 = crypto.createHash('sha256').update(patchedBytes).digest('hex');

  let extensionManifestSha256;
  if (fs.existsSync(extensionDir)) extensionManifestSha256 = assertInstalledTree(extensionDir, manifest);
  if (fs.existsSync(metadataPath)) {
    const previousMetadata = readInstallMetadata(metadataPath, expectedIndexSha256);
    if (previousMetadata.patchedIndexSha256 !== patchedIndexSha256 || previousMetadata.extensionManifestSha256 !== extensionManifestSha256) {
      throw new Error('Existing Project Maverick recovery metadata is unrelated to this install; refusing to overwrite it.');
    }
  }

  fs.mkdirSync(backupDir, { recursive: true });
  if (!fs.existsSync(backupPath)) fs.copyFileSync(indexPath, backupPath, fs.constants.COPYFILE_EXCL);
  if (hashFile(backupPath) !== expectedIndexSha256) throw new Error('Recovery backup verification failed after creation.');

  if (!extensionManifestSha256) {
    writeDirectoryFromDist(distDir, extensionDir, manifest);
    extensionManifestSha256 = hashFile(path.join(extensionDir, INSTALL_MANIFEST));
  }

  const metadata = {
    schemaVersion: 1,
    baselineIndexSha256: expectedIndexSha256,
    patchedIndexSha256,
    extensionManifestSha256,
  };
  atomicWrite(metadataPath, `${JSON.stringify(metadata, null, 2)}\n`);
  atomicWrite(indexPath, patchedBytes);
  return { changedFiles: ['index.html', 'projectMaverick/'], alreadyInstalled: false };
}

function restoreGame({ gameDir, expectedIndexSha256 }) {
  const backupDir = path.join(gameDir, '.project-maverick-backup');
  const backupPath = path.join(backupDir, 'index.html');
  const metadataPath = path.join(backupDir, INSTALL_METADATA);
  const indexPath = path.join(gameDir, 'index.html');
  const extensionDir = path.join(gameDir, 'projectMaverick');
  assertDirectoryIfPresent(gameDir, 'gameDir');
  assertDirectoryIfPresent(backupDir, 'Recovery directory');
  assertFileIfPresent(backupPath, 'Recovery backup');
  assertFileIfPresent(metadataPath, 'Install metadata');
  assertFileIfPresent(indexPath, 'index.html');
  assertDirectoryIfPresent(extensionDir, 'Project Maverick runtime directory');
  if (!fs.existsSync(backupPath)) throw new Error('No Project Maverick recovery backup found.');

  const savedMetadata = fs.existsSync(metadataPath) ? parseJsonFile(metadataPath, 'Project Maverick install metadata') : null;
  const baselineHash = expectedIndexSha256 || savedMetadata?.baselineIndexSha256 || require('../src/projectMaverick/core/compatibility').V0353_INDEX_SHA256;
  if (hashFile(backupPath) !== baselineHash) throw new Error('Recovery backup does not match the recorded pristine index hash.');

  const currentHash = hashFile(indexPath);
  const metadata = savedMetadata ? readInstallMetadata(metadataPath, baselineHash) : null;
  if (currentHash !== baselineHash && (!metadata || currentHash !== metadata.patchedIndexSha256)) {
    throw new Error('Current index.html changed after installation; refusing to overwrite those changes during rollback.');
  }

  if (fs.existsSync(extensionDir)) {
    if (!metadata) throw new Error('Project Maverick directory has no trusted ownership metadata; refusing to remove it.');
    const installedManifest = parseJsonFile(path.join(extensionDir, INSTALL_MANIFEST), 'Project Maverick ownership manifest');
    assertSafeManifest(installedManifest, baselineHash);
    assertInstalledTree(extensionDir, installedManifest, metadata.extensionManifestSha256);
  }

  if (currentHash !== baselineHash) atomicWrite(indexPath, fs.readFileSync(backupPath));
  if (fs.existsSync(extensionDir)) fs.rmSync(extensionDir, { recursive: true });
  if (fs.existsSync(metadataPath)) fs.rmSync(metadataPath);
  return { restoredFiles: ['index.html', ...(fs.existsSync(extensionDir) ? [] : ['projectMaverick/'])] };
}

module.exports = { patchGame, restoreGame, hashFile };
