const { el, button } = require('./components');

const CHANGELOG_ENTRIES = Object.freeze([
  Object.freeze({
    title: 'Archetype Update',
    summary: 'Twelve political operating archetypes make each politician’s governing and campaign style easier to read.',
    details: Object.freeze([
      'See primary and secondary archetypes on politician profiles.',
      'Filter the politician roster by archetype from Political Intelligence.',
    ]),
  }),
]);

function renderChangelog(doc, target, actions = {}) {
  target.append(el(doc, 'h2', 'pm-section-title', 'Changelog'));

  const toolbar = el(doc, 'div', 'pm-toolbar');
  if (actions.back) toolbar.append(button(doc, 'Back to Political Intelligence', actions.back));
  target.append(toolbar);

  for (const entry of CHANGELOG_ENTRIES) {
    const card = el(doc, 'article', 'pm-card');
    card.append(el(doc, 'h3', 'pm-subtitle', entry.title));
    card.append(el(doc, 'p', 'pm-muted', entry.summary));
    for (const detail of entry.details) card.append(el(doc, 'p', 'pm-muted', detail));
    target.append(card);
  }
}

module.exports = { CHANGELOG_ENTRIES, renderChangelog };
