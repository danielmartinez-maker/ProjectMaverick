const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');

const BUILD_MANIFEST = '.pm-project-maverick-build.json';

function hashFile(file) {
  return crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');
}

function isWithin(parent, candidate) {
  const relative = path.relative(parent, candidate);
  return relative === '' || (!relative.startsWith(`..${path.sep}`) && relative !== '..' && !path.isAbsolute(relative));
}

function walk(root, current = root, output = []) {
  for (const entry of fs.readdirSync(current, { withFileTypes: true }).sort((a, b) => a.name < b.name ? -1 : a.name > b.name ? 1 : 0)) {
    const absolute = path.join(current, entry.name);
    const info = fs.lstatSync(absolute);
    if (info.isSymbolicLink()) throw new Error(`Refusing symbolic link in source tree: ${absolute}`);
    if (info.isDirectory()) walk(root, absolute, output);
    else if (info.isFile()) output.push(path.relative(root, absolute).replace(/\\/g, '/'));
    else throw new Error(`Refusing non-file source payload: ${absolute}`);
  }
  return output;
}

function snapshot(dir) {
  const files = {};
  for (const relativePath of walk(dir)) files[relativePath] = hashFile(path.join(dir, relativePath));
  return files;
}

function validateExistingBuild(targetDir, manifestPath) {
  if (!fs.existsSync(targetDir)) {
    if (fs.existsSync(manifestPath)) throw new Error('Build ownership manifest exists without its output directory; refusing to overwrite it.');
    return;
  }
  const targetInfo = fs.lstatSync(targetDir);
  if (!targetInfo.isDirectory() || targetInfo.isSymbolicLink()) throw new Error('Build output must be a real directory; refusing to replace it.');
  if (!fs.existsSync(manifestPath)) throw new Error('Build output already exists without a Project Maverick ownership manifest; refusing to replace it.');
  let manifest;
  try {
    manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
  } catch (error) {
    throw new Error(`Cannot read build ownership manifest: ${error.message}`);
  }
  if (manifest.schemaVersion !== 1 || !manifest.files || typeof manifest.files !== 'object' || Array.isArray(manifest.files)) {
    throw new Error('Build ownership manifest is invalid; refusing to replace output.');
  }
  const actual = snapshot(targetDir);
  if (JSON.stringify(actual) !== JSON.stringify(manifest.files)) {
    throw new Error('Build output changed or contains untracked files; refusing to replace it.');
  }
}

function build(outDir = path.join(process.cwd(), 'dist')) {
  const sourceDir = path.resolve(process.cwd(), 'src', 'projectMaverick');
  const outputDir = path.resolve(outDir);
  if (!fs.statSync(sourceDir).isDirectory()) throw new Error(`Project Maverick source directory is missing: ${sourceDir}`);
  const targetDir = path.join(outputDir, 'projectMaverick');
  if (isWithin(sourceDir, targetDir) || isWithin(targetDir, sourceDir)) throw new Error('Build output cannot overlap the Project Maverick source tree.');

  const sourceFiles = walk(sourceDir);
  const prohibited = sourceFiles.filter((file) => /\.(bin|exe|dll)$/i.test(file) || /(^|\/)audio\//i.test(file));
  if (prohibited.length) throw new Error(`Prohibited build payload: ${prohibited.join(', ')}`);

  const files = {};
  for (const relativePath of sourceFiles) files[relativePath] = hashFile(path.join(sourceDir, relativePath));
  const manifestPath = path.join(outputDir, BUILD_MANIFEST);
  validateExistingBuild(targetDir, manifestPath);
  fs.mkdirSync(outputDir, { recursive: true });

  const stageDir = fs.mkdtempSync(path.join(outputDir, '.pm-build-stage-'));
  const nextManifestPath = path.join(outputDir, `.${BUILD_MANIFEST}.${process.pid}.${crypto.randomBytes(6).toString('hex')}.tmp`);
  const oldDir = path.join(outputDir, `.pm-build-old-${process.pid}-${crypto.randomBytes(6).toString('hex')}`);
  let movedOld = false;
  let installedStage = false;
  try {
    for (const relativePath of sourceFiles) {
      const destination = path.join(stageDir, relativePath);
      fs.mkdirSync(path.dirname(destination), { recursive: true });
      fs.copyFileSync(path.join(sourceDir, relativePath), destination);
    }
    if (JSON.stringify(snapshot(stageDir)) !== JSON.stringify(files)) throw new Error('Staged build does not match source hashes.');
    fs.writeFileSync(nextManifestPath, `${JSON.stringify({ schemaVersion: 1, files }, null, 2)}\n`, { flag: 'wx' });

    if (fs.existsSync(targetDir)) {
      fs.renameSync(targetDir, oldDir);
      movedOld = true;
    }
    fs.renameSync(stageDir, targetDir);
    installedStage = true;
    fs.renameSync(nextManifestPath, manifestPath);
  } catch (error) {
    if (installedStage) fs.rmSync(targetDir, { recursive: true, force: true });
    if (movedOld && fs.existsSync(oldDir)) fs.renameSync(oldDir, targetDir);
    fs.rmSync(stageDir, { recursive: true, force: true });
    fs.rmSync(nextManifestPath, { force: true });
    throw error;
  }

  if (movedOld) {
    try { fs.rmSync(oldDir, { recursive: true }); } catch (_) { /* Keep the verified prior build if the OS temporarily locks a file. */ }
  }

  return { files: sourceFiles.map((file) => `projectMaverick/${file}`), prohibited: [] };
}

if (require.main === module) {
  const result = build(process.argv[2]);
  console.log(`Built ${result.files.length} files`);
}

module.exports = { build };
