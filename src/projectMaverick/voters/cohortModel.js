const { COHORT_TEMPLATES } = require('./cohortTemplates');
const { scorePolitician, distance, ISSUE_MAP } = require('../ideology/scoring');
function normalizeParty(p={}) { const d=Math.max(0,+p.democrat||0),r=Math.max(0,+p.republican||0),i=Math.max(0,+p.independent||0),s=d+r+i; return s?{democrat:d/s,republican:r/s,independent:i/s}:{democrat:1/3,republican:1/3,independent:1/3}; }
function salienceDimensionWeights(issueSalience={}){const out={};for(const[raw,value]of Object.entries(issueSalience||{})){const key=raw.toLowerCase().replace(/[^a-z]/g,''),map=ISSUE_MAP[key],dimension=map?map[0]:key;if(!['economics','fiscal','welfare','social','immigration','environment','guns','healthcare','education','institutional','partisan','intensity'].includes(dimension))continue;const n=Math.max(0,Number(value)||0);out[dimension]=(out[dimension]||1)+n;}return out;}
function inferCohorts(district={}) {
  const party=normalizeParty(district.partyDistribution);
  const ideological=scorePolitician({fiscalScore:district.fiscalScore,socialScore:district.socialScore,issues:district.issueSupport||{}});
  const salienceWeights=salienceDimensionWeights(district.issueSalience||{});
  const raw=COHORT_TEMPLATES.map(t=>{const sim=Math.exp(-2.2*distance(ideological.dimensions,t.profile,salienceWeights));const prior=.08+party.democrat*t.partisanAffinity.democrat+party.republican*t.partisanAffinity.republican+party.independent*t.partisanAffinity.independent;return{template:t,weight:sim*prior};});
  const total=raw.reduce((s,x)=>s+x.weight,0)||1;let running=0;
  const cohorts=raw.map((x,idx)=>{const share=idx===raw.length-1?Math.max(0,1-running):x.weight/total;running+=share;return{id:x.template.id,name:x.template.name,share,profile:x.template.profile,salience:x.template.salienceWeights,partisanAffinity:x.template.partisanAffinity,stylePreferences:x.template.stylePreferences};});
  const partyEvidence=district.partyDistribution?1:0,issueEvidence=Object.keys(district.issueSupport||{}).length,salienceEvidence=Object.keys(district.issueSalience||{}).length;
  const confidence=Math.min(1,.2+.3*partyEvidence+.25*Math.min(1,issueEvidence/5)+.1*Math.min(1,salienceEvidence/5)+.15*(district.fiscalScore!=null&&district.socialScore!=null?1:0));
  return{cohorts,confidence,constraints:{partyDistribution:party,ideology:ideological.dimensions,issueSalience:{...(district.issueSalience||{})}}};
}
module.exports={inferCohorts,normalizeParty,salienceDimensionWeights};
