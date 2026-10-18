const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

function createNode(doc, tagName) {
  return {
    ownerDocument: doc,
    tagName,
    children: [],
    textContent: '',
    className: '',
    value: '',
    handlers: {},
    append(...nodes) { this.children.push(...nodes); },
    addEventListener(type, handler) { this.handlers[type] = handler; },
    click() { this.handlers.click?.(); },
  };
}

function createDocument() {
  const doc = {};
  doc.createElement = (tagName) => createNode(doc, tagName);
  return doc;
}

function flatten(root, output = []) {
  output.push(root);
  for (const child of root.children) flatten(child, output);
  return output;
}

test('Changelog shows the Archetype Update and returns to Political Intelligence', () => {
  const modulePath = path.join(__dirname, '../../src/projectMaverick/ui/changelog.js');
  assert.equal(fs.existsSync(modulePath), true, 'the in-game Changelog renderer exists');
  const { renderChangelog } = require(modulePath);
  const doc = createDocument();
  const target = doc.createElement('main');
  let backCount = 0;

  renderChangelog(doc, target, { back: () => { backCount += 1; } });

  const nodes = flatten(target);
  const text = nodes.map((node) => node.textContent).join(' ');
  assert.match(text, /Changelog/);
  assert.match(text, /Archetype Update/);
  assert.match(text, /twelve political operating archetypes/i);
  const backButton = nodes.find((node) => node.tagName === 'button' && node.textContent === 'Back to Political Intelligence');
  assert.ok(backButton, 'the changelog has an in-game back action');
  backButton.click();
  assert.equal(backCount, 1);
});

test('Political Intelligence opens Changelog from its navigation', () => {
  const { renderDashboard } = require('../../src/projectMaverick/ui/dashboard');
  const doc = createDocument();
  const target = doc.createElement('main');
  let openCount = 0;
  const ctx = {
    records: [],
    watchlists: { list: () => [], has: () => false },
    recentViews: { list: () => [] },
    searchPoliticians: () => [],
    filterPoliticians: () => [],
    compareIds: () => [],
    openIdeologyExplorer() {},
    openElectorates() {},
    openCompare() {},
    openChangelog() { openCount += 1; },
  };

  renderDashboard(doc, target, ctx);

  const changelogButton = flatten(target).find((node) => node.tagName === 'button' && node.textContent === 'Changelog');
  assert.ok(changelogButton, 'the in-game dashboard has a Changelog button');
  changelogButton.click();
  assert.equal(openCount, 1);
});

test('runtime loader connects Changelog to the dashboard', () => {
  const source = fs.readFileSync(path.join(__dirname, '../../src/projectMaverick/loader.js'), 'utf8');
  assert.match(source, /renderChangelog/);
  assert.match(source, /openChangelog/);
});
