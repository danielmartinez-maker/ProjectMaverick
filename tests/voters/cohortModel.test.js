const test = require('node:test');
const assert = require('node:assert/strict');
const { inferCohorts } = require('../../src/projectMaverick/voters/cohortModel');

for (const [name,district] of [
 ['strong Democratic',{partyDistribution:{democrat:.7,republican:.2,independent:.1},fiscalScore:-.6,socialScore:-.65,issueSupport:{healthcare:-.7,environment:-.7}}],
 ['strong Republican',{partyDistribution:{democrat:.2,republican:.7,independent:.1},fiscalScore:.65,socialScore:.7,issueSupport:{guns:.8,immigration:.7}}],
 ['balanced',{partyDistribution:{democrat:.4,republican:.4,independent:.2},fiscalScore:0,socialScore:0}],
 ['libertarian',{partyDistribution:{democrat:.25,republican:.35,independent:.4},fiscalScore:.8,socialScore:-.7,issueSupport:{guns:.9,immigration:-.5}}],
 ['working class populist',{partyDistribution:{democrat:.35,republican:.45,independent:.2},fiscalScore:-.55,socialScore:.6,issueSupport:{welfare:-.7,immigration:.75}}]
]) test(`${name} electorate yields constrained normalized cohorts`, () => {
   const r = inferCohorts(district);
   assert.ok(r.cohorts.length >= 8);
   assert.ok(r.cohorts.every(c => c.share >= 0));
   assert.ok(Math.abs(r.cohorts.reduce((s,c)=>s+c.share,0)-1) < 1e-12);
   assert.ok(r.confidence > 0);
});

test('strong party electorates tilt aggregate cohort affinity in the same direction', () => {
  const d = inferCohorts({partyDistribution:{democrat:.75,republican:.15,independent:.1},fiscalScore:-.6,socialScore:-.6});
  const dem = d.cohorts.reduce((s,c)=>s+c.share*c.partisanAffinity.democrat,0);
  const rep = d.cohorts.reduce((s,c)=>s+c.share*c.partisanAffinity.republican,0);
  assert.ok(dem > rep);
});

const { COHORT_TEMPLATES } = require('../../src/projectMaverick/voters/cohortTemplates');
const { IDEOLOGY_ARCHETYPES } = require('../../src/projectMaverick/ideology/taxonomy');
test('voter ideology cohorts cover every comprehensive ideology archetype',()=>{
  assert.equal(COHORT_TEMPLATES.length,IDEOLOGY_ARCHETYPES.length);
  assert.deepEqual(new Set(COHORT_TEMPLATES.map(c=>c.id)),new Set(IDEOLOGY_ARCHETYPES.map(a=>a.id)));
});

test('native issue salience materially weights cohort inference',()=>{
  const base={partyDistribution:{democrat:.33,republican:.33,independent:.34},fiscalScore:0,socialScore:0,issueSupport:{guns:1}};
  const low=inferCohorts({...base,issueSalience:{guns:.1}});
  const high=inferCohorts({...base,issueSalience:{guns:5}});
  const avg=(set)=>set.cohorts.reduce((s,c)=>s+c.share*(c.profile.guns||0),0);
  assert.ok(avg(high)>avg(low)+.01);
});
