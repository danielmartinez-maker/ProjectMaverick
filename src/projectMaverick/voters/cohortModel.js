const { COHORT_TEMPLATES } = require('./cohortTemplates');
const { scorePolitician, distance, ISSUE_MAP } = require('../ideology/scoring');
function normalizeParty(p={}) { const d=Math.max(0,+p.democrat||0),r=Math.max(0,+p.republican||0),i=Math.max(0,+p.independent||0),s=d+r+i; return s?{democrat:d/s,republican:r/s,independent:i/s}:{democrat:1/3,republican:1/3,independent:1/3}; }
function salienceDimensionWeights(issueSalience={}){const out={};for(const[raw,value]of Object.entries(issueSalience||{})){const key=raw.toLowerCase().replace(/[^a-z]/g,''),map=ISSUE_MAP[key],dimension=map?map[0]:key;if(!['economics','fiscal','welfare','social','immigration','environment','guns','healthcare','education','institutional','partisan','intensity'].includes(dimension))continue;const n=Math.max(0,Number(value)||0);out[dimension]=(out[dimension]||1)+n;}return out;}
function inferCohorts(district={}) {
  const party=normalizeParty(district.partyDistribution);
  const ideological=scorePolitician({fiscalScore:district.fiscalScore,socialScore:district.socialScore,issues:district.issueSupport||{}});
  const salienceWeights=salienceDimensionWeights(district.issueSalience||{});
  const observedDimensions=new Set(ideological.evidence.map(item=>item.dimension));
  const comparisonWeights={};
  for(const dimension of Object.keys(ideological.dimensions)) comparisonWeights[dimension]=observedDimensions.has(dimension)?(salienceWeights[dimension]||1):0;
  const raw=COHORT_TEMPLATES.map(template=>({template,similarity:Math.exp(-2.2*distance(ideological.dimensions,template.profile,comparisonWeights))}));
  const partyKeys=['democrat','republican','independent'];
  const partyContributions=raw.map(()=>({democrat:0,republican:0,independent:0}));
  for(const partyKey of partyKeys){
    let weights=raw.map(item=>item.similarity*Math.max(0,Number(item.template.partisanAffinity[partyKey])||0));
    let total=weights.reduce((sum,value)=>sum+value,0);
    if(!total){weights=raw.map(item=>item.similarity);total=weights.reduce((sum,value)=>sum+value,0)||1;}
    for(let i=0;i<raw.length;i++) partyContributions[i][partyKey]=party[partyKey]*weights[i]/total;
  }
  let running=0;
  const cohorts=raw.map((item,index)=>{
    const contribution=partyContributions[index];
    const derivedShare=partyKeys.reduce((sum,key)=>sum+contribution[key],0);
    const share=index===raw.length-1?Math.max(0,1-running):derivedShare;
    running+=share;
    const partisanAffinity=derivedShare?Object.fromEntries(partyKeys.map(key=>[key,contribution[key]/derivedShare])):item.template.partisanAffinity;
    return{id:item.template.id,name:item.template.name,share,profile:item.template.profile,salience:item.template.salienceWeights,partisanAffinity,stylePreferences:item.template.stylePreferences};
  });
  const suppliedParty= district.partyDistribution||{};
  const partyEvidence=['democrat','republican','independent'].some(key=>Number(suppliedParty[key])>0)?1:0;
  const issueEvidence=ideological.evidence.filter(item=>item.source.indexOf('issue:')===0||item.source.indexOf('policy:')===0).length;
  const salienceEvidence=Object.values(district.issueSalience||{}).filter(value=>Number.isFinite(Number(value))&&Number(value)>=0).length;
  const confidence=Math.min(1,.2+.3*partyEvidence+.25*Math.min(1,issueEvidence/5)+.1*Math.min(1,salienceEvidence/5)+.15*(district.fiscalScore!=null&&district.socialScore!=null?1:0));
  return{cohorts,confidence,constraints:{partyDistribution:party,ideology:ideological.dimensions,issueSalience:{...(district.issueSalience||{})}}};
}
module.exports={inferCohorts,normalizeParty,salienceDimensionWeights};
