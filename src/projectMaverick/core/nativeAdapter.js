function cloneValue(value) {
  if (value == null) return value;
  try { return JSON.parse(JSON.stringify(value)); } catch (_) { return value; }
}
function text(v) { return v == null ? '' : String(v).trim(); }
function first(obj, names) { for (const n of names) if (obj && obj[n] != null) return obj[n]; return null; }
function slug(s) { return text(s).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''); }
function normalizePolitician(p, index) {
  if (!p || typeof p !== 'object') return null;
  const firstName = text(first(p, ['firstName','first','fName']));
  const lastName = text(first(p, ['lastName','last','lName']));
  const name = text(first(p, ['name','fullName'])) || [firstName,lastName].filter(Boolean).join(' ') || `Politician ${index + 1}`;
  const state = text(first(p, ['state','stateName','stateAbbrev']));
  const office = text(first(p, ['office','officeName','position','currentOffice']));
  const rawId = first(p, ['id','politicianId','polID','candidateId']);
  const id = rawId != null ? String(rawId) : `${slug(name)}|${slug(state)}|${slug(office)}`;
  return { id, name, firstName, lastName, state, office, party: text(first(p, ['party','partyName','politicalParty'])), traits: Array.isArray(p.traits) ? cloneValue(p.traits) : [], fiscalScore: first(p, ['fiscalScore','fiscalIdeology','econIdeology']), socialScore: first(p, ['socialScore','socialIdeology']), popularity: first(p, ['popularity','approval','approvalRating']), experience: first(p, ['experience','politicalExperience','yearsExperience']), issues: cloneValue(first(p, ['issues','issuePositions','positions'])) || {}, native: cloneValue({ history: first(p, ['history','politicalHistory']), partyLoyalty: first(p, ['partyLoyalty']) }) };
}
function findArray(root, names) { for (const n of names) if (Array.isArray(root && root[n])) return root[n]; return []; }
function createAdapter(root) {
  root = root || {};
  function readPoliticians() { return findArray(root, ['politicians','allPoliticians','activePoliticians','candidateDatabase','candidates']).map(normalizePolitician).filter(Boolean); }
  function readPlayer() { const p = first(root, ['player','playerPolitician','userPolitician']); return p && typeof p === 'object' ? normalizePolitician(p, 0) : null; }
  function readIssueCatalog() { return cloneValue(findArray(root, ['issueCatalog','issues','issueList','policies'])); }
  function readDistrictContext(subject) { const d = first(subject || {}, ['district','districtData','electorate']); return d && typeof d === 'object' ? cloneValue(d) : null; }
  function readElectionContext(subject) { const e = first(subject || {}, ['election','electionData','race']); return e && typeof e === 'object' ? cloneValue(e) : null; }
  return { readPoliticians, readPlayer, readIssueCatalog, readDistrictContext, readElectionContext };
}
module.exports = { createAdapter, normalizePolitician };
