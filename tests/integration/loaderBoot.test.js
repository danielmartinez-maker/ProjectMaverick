const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

function bootHarness() {
  const counts = { politicians: 0, issueCatalog: 0, electorates: 0 };
  const renderCounts = { changelog: 0, dashboard: 0 };
  const elements = [];
  function element(tag) {
    return {
      tagName: tag,
      children: [],
      handlers: {},
      append(...items) { this.children.push(...items); },
      appendChild(item) { this.children.push(item); elements.push(item); },
      addEventListener(name, handler) { this.handlers[name] = handler; },
      setAttribute() {},
    };
  }
  const document = {
    activeElement: null,
    head: element('head'),
    body: element('body'),
    createElement: element,
    getElementById() { return null; },
  };
  const namespace = {};
  const adapter = {
    readIssueCatalog() { counts.issueCatalog++; return []; },
    readPoliticians() { counts.politicians++; return []; },
    readElectorates() { counts.electorates++; return []; },
  };
  const shell = { mount() {}, open(render) { render(element('target')); } };
  const modules = {
    './projectMaverick/core/namespace': namespace,
    './projectMaverick/core/diagnostics': { record() {} },
    './projectMaverick/core/compatibility': { check() { return { ok: true, failures: [] }; } },
    './projectMaverick/core/storage': { createStorage() { return { load() { return {}; }, update() { return {}; } }; } },
    './projectMaverick/core/events': { createEvents() { return { emit() {} }; } },
    './projectMaverick/core/nativeAdapter': { createAdapter() { return adapter; } },
    './projectMaverick/ideology/scoring': { scorePolitician() { return {}; } },
    './projectMaverick/ideology/classifyPolitician': { classifyPolitician() { return {}; } },
    './projectMaverick/archetypes/classifyPoliticalStyle': { classifyPoliticalStyle() { return {}; } },
    './projectMaverick/voters/cohortModel': { inferCohorts() {} },
    './projectMaverick/voters/coalitionAnalysis': { analyzeCandidate() {} },
    './projectMaverick/qol/search': { searchPoliticians() { return []; } },
    './projectMaverick/qol/filters': { filterPoliticians(records) { return records; } },
    './projectMaverick/qol/watchlists': { createWatchlists() { return { toggle() {}, has() { return false; }, list() { return []; } }; } },
    './projectMaverick/qol/recentViews': { createRecentViews() { return { record() {}, list() { return []; } }; } },
    './projectMaverick/ui/shell': { createShell() { return shell; } },
    './projectMaverick/ui/dashboard': { renderDashboard() { renderCounts.dashboard++; } },
    './projectMaverick/ui/politicianPanel': { renderPoliticianPanel() {} },
    './projectMaverick/ui/ideologyExplorer': { renderIdeologyExplorer() {} },
    './projectMaverick/ui/electoratePanel': { renderElectoratePanel() {}, renderElectorateBrowser() {} },
    './projectMaverick/ui/comparePanel': { renderComparePanel() {} },
    './projectMaverick/ui/diagnosticsPanel': { renderDiagnosticsPanel() {} },
    './projectMaverick/ui/changelog': { renderChangelog() { renderCounts.changelog++; } },
    'node:fs': { existsSync() { return true; }, readFileSync() { return Buffer.from('baseline'); } },
    'node:crypto': { createHash() { return { update() { return this; }, digest() { return 'expected-baseline'; } }; } },
    'node:path': path,
  };
  const root = { ProjectMaverick: null, localStorage: {} };
  const require = (name) => {
    if (!(name in modules)) throw new Error('Unexpected module ' + name);
    return modules[name];
  };
  const source = fs.readFileSync(path.join(__dirname, '../../src/projectMaverick/loader.js'), 'utf8');
  vm.runInNewContext(source, { window: root, document, process: { cwd: () => 'C:/game' }, require });
  return { counts, elements, namespace, renderCounts };
}

test('game boot exposes Changelog without scanning native political data', () => {
  const { counts, elements, namespace, renderCounts } = bootHarness();
  assert.equal(elements.some((item) => item.id === 'pm-launcher'), true);
  assert.equal(elements.some((item) => item.id === 'pm-changelog-launcher'), true);
  assert.deepEqual(counts, { politicians: 0, issueCatalog: 0, electorates: 0 });

  elements.find((item) => item.id === 'pm-changelog-launcher').handlers.click();
  assert.equal(renderCounts.changelog, 1);
  assert.deepEqual(counts, { politicians: 0, issueCatalog: 0, electorates: 0 });

  elements.find((item) => item.id === 'pm-launcher').handlers.click();
  assert.equal(renderCounts.dashboard, 1);
  assert.deepEqual(counts, { politicians: 1, issueCatalog: 1, electorates: 1 });
  assert.equal(typeof namespace.openChangelog, 'function');
});
