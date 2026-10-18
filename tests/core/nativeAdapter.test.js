const test = require('node:test');
const assert = require('node:assert/strict');
const { createAdapter } = require('../../src/projectMaverick/core/nativeAdapter');

test('normalizes politician arrays without retaining mutable native objects', () => {
  const native = { politicians: [{ id: 7, firstName: 'Ada', lastName: 'Jones', party: 'Independent', state: 'TX', traits: ['Practical'] }] };
  const adapter = createAdapter(native);
  const rows = adapter.readPoliticians();
  assert.equal(rows[0].id, '7');
  assert.equal(rows[0].name, 'Ada Jones');
  rows[0].traits.push('Injected');
  assert.deepEqual(native.politicians[0].traits, ['Practical']);
});

test('returns safe empty values when native globals are absent or malformed', () => {
  const adapter = createAdapter({ politicians: 'bad' });
  assert.deepEqual(adapter.readPoliticians(), []);
  assert.equal(adapter.readPlayer(), null);
  assert.deepEqual(adapter.readIssueCatalog(), []);
});

test('uses stable fallback IDs when explicit politician id is absent', () => {
  const adapter = createAdapter({ politicians: [{ firstName: 'Sam', lastName: 'Lee', state: 'CA', office: 'Senator' }] });
  assert.equal(adapter.readPoliticians()[0].id, 'sam-lee|ca|senator');
});

test('normalizes native v0.353 CharacterArray candidates and real incumbent collections', () => {
  const candidate = Array(183).fill(null);
  candidate[0] = 'Democrat';
  candidate[4] = 'Alex';
  candidate[5] = 'Rivera';
  candidate[6] = 'Liberal';
  candidate[7] = 'Moderate';
  candidate[8] = true; // minWage
  candidate[12] = true; // gunCheck
  candidate[13] = true; // gayMarriage
  candidate[17] = true; // proChoice
  candidate[21] = 'Human'; // globalWHuman
  candidate[22] = true; // limitPow
  candidate[23] = true; // commColl
  candidate[32] = true; // climatePol
  candidate[40] = true; // gunControl
  candidate[46] = true; // govAid
  candidate[48] = true; // citPath
  candidate[49] = true; // expandVisas
  candidate[50] = 'Decrease'; // mainMil
  candidate[96] = 'Progressive Democrats';
  candidate[111] = 4242;
  candidate[122] = ['Charismatic', 'Practical'];
  candidate[127] = 'TX';
  candidate[129] = { job1: { title: 'U.S. Senator - Texas', id: 'usSenate' }, job2: null, job3: null };
  candidate[134] = 900;
  candidate[136] = 250000;
  candidate[146] = 77;
  candidate[169] = [{ title: 'U.S. Senator - Texas', start: 2024, end: 0 }];
  candidate[178] = { party: 'Democrat', appr: { d: { b: 82 }, r: { b: 19 }, i: { b: 55 } }, basicIncome: true, carbonTax: true, greenNewDeal: true, singlePay: true };

  const adapter = createAdapter({ allGovernors: [candidate], usHouse: [candidate], usSenate1Array: [candidate] });
  const rows = adapter.readPoliticians();
  assert.equal(rows.length, 1, 'duplicate references across native collections are de-duplicated');
  assert.equal(rows[0].id, '4242');
  assert.equal(rows[0].name, 'Alex Rivera');
  assert.equal(rows[0].party, 'Democrat');
  assert.equal(rows[0].state, 'TX');
  assert.equal(rows[0].office, 'U.S. Senator - Texas');
  assert.equal(rows[0].fiscalScore, 'Liberal');
  assert.equal(rows[0].socialScore, 'Moderate');
  assert.deepEqual(rows[0].traits, ['Charismatic', 'Practical']);
  assert.equal(rows[0].issues.minWage, true);
  assert.equal(rows[0].issues.basicIncome, true);
  assert.equal(rows[0].issues.singlePay, true);
  assert.equal(rows[0].approval.democrat, 82);
  assert.equal(rows[0].experience, 900);
  rows[0].traits.push('Injected');
  assert.deepEqual(candidate[122], ['Charismatic', 'Practical']);
});

test('reads player CharacterArray separately from incumbent politician collections', () => {
  const player = Array(183).fill(null);
  player[4] = 'Jamie'; player[5] = 'Chen'; player[6] = 'Libertarian'; player[7] = 'Liberal';
  player[111] = 99; player[127] = 'CA'; player[178] = { party: 'Independent', appr: {} };
  const adapter = createAdapter({ player });
  const normalized = adapter.readPlayer();
  assert.equal(normalized.id, '99');
  assert.equal(normalized.name, 'Jamie Chen');
  assert.equal(normalized.party, 'Independent');
  assert.equal(normalized.fiscalScore, 'Libertarian');
});

test('adapter exposes native v0.353 electorate snapshots from nation, state, and district stats',()=>{
  const policy={demPop:60,repPop:30,indPop:10,demMinWage:80,repMinWage:20,indMinWage:55,demGunControl:75,repGunControl:15,indGunControl:45,demHealthPri:80,repHealthPri:40,indHealthPri:55,demGunPri:45,repGunPri:80,indGunPri:60};
  const root={nationStats:{...policy},stateStats:{...policy,demPop:50,repPop:40,indPop:10},usHouseElectStats:[{...policy,demPop:45,repPop:45,indPop:10}],stateHouseElectStats:[{...policy}],stateSenateElectStats:[{...policy}],cityCouncilStats:{...policy},schoolBoardStats:{...policy}};
  const rows=createAdapter(root).readElectorates();
  assert.ok(rows.length>=7);
  const nation=rows.find(r=>r.id==='nation');
  assert.ok(nation);
  assert.deepEqual(nation.partyDistribution,{democrat:.6,republican:.3,independent:.1});
  assert.ok(Number.isFinite(nation.issueSupport.welfare));
  assert.ok(Number.isFinite(nation.issueSupport.guns));
  assert.ok(nation.issueSalience.healthcare>0);
  assert.ok(rows.some(r=>r.id==='us-house-1'));
});
