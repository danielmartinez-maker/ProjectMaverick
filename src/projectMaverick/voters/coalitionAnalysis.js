const {DIMENSIONS}=require('../ideology/dimensions');

function observedDimensions(candidateProfile={}){
  if(Array.isArray(candidateProfile.observedDimensions))return [...new Set(candidateProfile.observedDimensions.filter(d=>DIMENSIONS.includes(d)))];
  return DIMENSIONS.filter(d=>candidateProfile.dimensions?.[d]!=null&&Number.isFinite(Number(candidateProfile.dimensions[d])));
}
function weightedDistance(a,b,weights={},dimensions=DIMENSIONS){
  let sum=0,den=0;
  for(const dimension of dimensions){
    if(a?.[dimension]==null||b?.[dimension]==null)continue;
    const av=Number(a[dimension]),bv=Number(b[dimension]);
    if(!Number.isFinite(av)||!Number.isFinite(bv))continue;
    const weight=Math.max(.25,Number(weights[dimension])||1);
    sum+=Math.abs(av-bv)*weight;den+=weight;
  }
  return den?Math.min(2,sum/den):null;
}
function partyKey(party){
  const value=String(party||'').toLowerCase();
  if(value.startsWith('d'))return'democrat';
  if(value.startsWith('r'))return'republican';
  if(value.startsWith('i'))return'independent';
  return null;
}
function analyzeCandidate(candidateProfile={},politicalStyle={},cohortSet={cohorts:[]}){
  const dimensions=observedDimensions(candidateProfile);
  const party=partyKey(candidateProfile.party),style=politicalStyle?.primary?.id;
  const blocs=(cohortSet.cohorts||[]).map(cohort=>{
    const distance=weightedDistance(candidateProfile.dimensions,cohort.profile,cohort.salience,dimensions);
    if(distance==null)return{cohortId:cohort.id,share:cohort.share,compatibility:null,salienceAdjusted:null,reasons:['insufficient ideological evidence']};
    const ideology=1-distance/2;
    const prior=party?(cohort.partisanAffinity?.[party]??1/3)-1/3:0;
    const styleAdjustment=(cohort.stylePreferences||[]).includes(style)?.04:0;
    const compatibility=Math.max(0,Math.min(1,.86*ideology+.1*(prior+.333)+styleAdjustment));
    const partyReason=party?`party prior ${(prior*100).toFixed(0)}pp`:'party prior unavailable';
    return{cohortId:cohort.id,share:cohort.share,compatibility,salienceAdjusted:distance,reasons:[`ideology ${(ideology*100).toFixed(0)}%`,partyReason,styleAdjustment?'style fit':'neutral style']};
  });
  const usable=blocs.filter(bloc=>Number.isFinite(bloc.compatibility));
  const coverage=usable.reduce((sum,bloc)=>sum+(Number(bloc.share)||0),0);
  const overallFit=coverage?usable.reduce((sum,bloc)=>sum+(Number(bloc.share)||0)*bloc.compatibility,0)/coverage:null;
  const sorted=usable.slice().sort((a,b)=>b.compatibility-a.compatibility);
  return{overallFit,coverage,blocs,strongest:sorted.slice(0,3),weakest:sorted.slice(-3).reverse()};
}
function compareCandidates(a,b,cohortSet){
  const aa=analyzeCandidate(a,a.politicalStyle||{},cohortSet),bb=analyzeCandidate(b,b.politicalStyle||{},cohortSet);
  const otherById=new Map(bb.blocs.map(bloc=>[String(bloc.cohortId),bloc]));
  const blocs=aa.blocs.map(x=>{
    const y=otherById.get(String(x.cohortId));
    if(!y||!Number.isFinite(x.compatibility)||!Number.isFinite(y.compatibility))return{cohortId:x.cohortId,a:x.compatibility,b:y?.compatibility??null,lean:'unavailable'};
    const delta=x.compatibility-y.compatibility;
    return{cohortId:x.cohortId,a:x.compatibility,b:y.compatibility,lean:Math.abs(delta)<.02?'even':delta>0?'a':'b'};
  });
  const advantage=Number.isFinite(aa.overallFit)&&Number.isFinite(bb.overallFit)?aa.overallFit-bb.overallFit:null;
  return{blocs,advantage,aFit:aa.overallFit,bFit:bb.overallFit,aCoverage:aa.coverage,bCoverage:bb.coverage};
}
module.exports={analyzeCandidate,compareCandidates,weightedDistance,observedDimensions};
