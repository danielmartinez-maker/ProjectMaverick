const {POLITICAL_ARCHETYPES}=require('./politicalArchetypes');

function traitSet(traits){
  if(Array.isArray(traits))return new Set(traits.map(value=>String(value).toLowerCase()));
  if(traits&&typeof traits==='object')return new Set(Object.entries(traits).filter(([,value])=>!!value).map(([key])=>key.toLowerCase()));
  return new Set();
}
function confidenceFor(result){
  if(!result)return 0;
  const evidenceCoverage=Math.min(1,result.evidence.length/4);
  return Math.max(0,Math.min(1,.65*result.score+.35*evidenceCoverage));
}
function classifyPoliticalStyle(snapshot={}){
  const present=traitSet(snapshot.traits),experience=Number(snapshot.experience)||0,popularity=Number(snapshot.popularity)||0,loyalty=Number(snapshot.native?.partyLoyalty);
  const scored=POLITICAL_ARCHETYPES.map(archetype=>{
    const target=new Set(archetype.signatureTraits.map(value=>value.toLowerCase()));
    let intersection=0;
    for(const trait of target)if(present.has(trait))intersection++;
    const union=new Set([...present,...target]).size||1;
    let score=intersection/union;
    const evidence=[...target].filter(trait=>present.has(trait)).map(trait=>`trait:${trait}`);
    if(archetype.signals.experience&&experience){score+=.08*(1-Math.min(1,Math.abs(experience-archetype.signals.experience)/100));evidence.push('experience');}
    if(archetype.signals.popularity&&popularity){score+=.08*(1-Math.min(1,Math.abs(popularity-archetype.signals.popularity)/100));evidence.push('popularity');}
    if(archetype.signals.partyLoyalty!=null&&Number.isFinite(loyalty)){score+=.1*(1-Math.min(1,Math.abs(loyalty-archetype.signals.partyLoyalty)));evidence.push('partyLoyalty');}
    return{archetype,score,evidence};
  }).sort((a,b)=>b.score-a.score||a.archetype.id.localeCompare(b.archetype.id));
  const top=scored[0],next=scored[1],confidence=confidenceFor(top);
  if(!top||top.evidence.filter(value=>value.startsWith('trait:')).length<2||top.score<.45){
    return{primary:{id:'unknown',name:'Insufficient Data'},secondary:null,scores:scored,evidence:[],confidence,modifiers:{}};
  }
  return{primary:top.archetype,secondary:next&&top.score-next.score<=.12?next.archetype:null,scores:scored,evidence:top.evidence,confidence,modifiers:{...top.archetype.modifiers}};
}
module.exports={classifyPoliticalStyle,confidenceFor};
