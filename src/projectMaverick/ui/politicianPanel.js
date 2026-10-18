const {DIMENSIONS}=require('../ideology/dimensions');
const {el,labeledValue,button}=require('./components');

function val(value){return value==null||value===''?'Unavailable':value;}
function percent(value){return Number.isFinite(value)?`${Math.round(value*100)}%`:'Unavailable';}
function signed(value){return`${value>=0?'+':''}${Number(value).toFixed(2)}`;}
function evidenceRows(evidence,predicate){
  return(evidence||[]).filter(predicate).slice().sort((a,b)=>Math.abs(Number(b.value)||0)*(Number(b.weight)||1)-Math.abs(Number(a.value)||0)*(Number(a.weight)||1));
}
function politicianViewModel(record={}){
  const policyEvidence=evidenceRows(record.ideology?.evidence,item=>String(item.source||'').startsWith('issue:')||String(item.source||'').startsWith('policy:')).slice(0,5);
  return{
    name:val(record.name),office:val(record.office),state:val(record.state),party:val(record.party),
    politicalStyle:val(record.politicalStyle?.primary?.name),politicalSecondary:val(record.politicalStyle?.secondary?.name),
    styleConfidence:percent(record.politicalStyle?.confidence),styleEvidence:record.politicalStyle?.evidence||[],
    strengths:record.politicalStyle?.primary?.strengths||[],liabilities:record.politicalStyle?.primary?.liabilities||[],
    ideology:val(record.ideology?.primary?.name),secondaryIdeology:val(record.ideology?.secondary?.name),
    confidence:percent(record.ideology?.confidence),dimensions:Object.fromEntries(DIMENSIONS.map(key=>[key,Number.isFinite(record.ideology?.dimensions?.[key])?record.ideology.dimensions[key]:null])),
    explanation:record.ideology?.explanation||[],policyEvidence,
    popularity:record.popularity??record.approval?.overall??null,approval:record.approval||{},
    nameRecognition:record.nameRecognition??record.native?.nameRecognition??null
  };
}
function renderPoliticianPanel(doc,target,record,actions={}){
  const vm=politicianViewModel(record);
  target.append(el(doc,'h2','pm-section-title',vm.name));
  const toolbar=el(doc,'div','pm-toolbar');
  if(actions.back)toolbar.append(button(doc,'Back',actions.back));
  if(actions.toggleWatchlist)toolbar.append(button(doc,actions.isWatched?.(record.id)?'Unwatch':'Watch',()=>{actions.toggleWatchlist(record.id);actions.back?.();}));
  if(actions.toggleCompare)toolbar.append(button(doc,actions.isCompareSelected?.(record.id)?'Unselect comparison':'Select for comparison',()=>{actions.toggleCompare(record);actions.back?.();}));
  target.append(toolbar);
  for(const [label,key] of [['Office','office'],['State','state'],['Party','party'],['Political archetype','politicalStyle'],['Secondary style','politicalSecondary'],['Political-style confidence','styleConfidence'],['Ideology','ideology'],['Secondary ideology','secondaryIdeology'],['Ideology confidence','confidence'],['Popularity','popularity'],['Name recognition','nameRecognition']])target.append(labeledValue(doc,label,val(vm[key])));
  for(const [party,label] of [['democrat','Democratic approval'],['republican','Republican approval'],['independent','Independent approval']])target.append(labeledValue(doc,label,val(vm.approval[party])));
  if(vm.styleEvidence.length)target.append(labeledValue(doc,'Political-style evidence',vm.styleEvidence.join(' · ')));
  if(vm.strengths.length)target.append(labeledValue(doc,'Archetype strengths',vm.strengths.join(' · ')));
  if(vm.liabilities.length)target.append(labeledValue(doc,'Archetype liabilities',vm.liabilities.join(' · ')));
  if(vm.explanation.length)target.append(labeledValue(doc,'Ideology evidence',vm.explanation.join(' · ')));
  if(vm.policyEvidence.length){
    const policies=el(doc,'section','pm-card');
    policies.append(el(doc,'h3','pm-subtitle','Strongest defining policy positions'));
    for(const item of vm.policyEvidence){
      const name=String(item.source).replace(/^(issue|policy):/,'');
      policies.append(labeledValue(doc,name,signed(item.value)));
    }
    target.append(policies);
  }else target.append(labeledValue(doc,'Strongest defining policy positions','Unavailable'));
  const grid=el(doc,'div','pm-grid');
  for(const [key,value] of Object.entries(vm.dimensions)){
    const card=el(doc,'div','pm-card');card.append(labeledValue(doc,key,value==null?'Unavailable':signed(value)));grid.append(card);
  }
  target.append(grid);
  if(actions.electorateAnalysis){
    const analysis=actions.electorateAnalysis,cohorts=actions.electorateCohorts||[];
    const card=el(doc,'section','pm-card');
    card.append(el(doc,'h3','pm-subtitle',actions.electorateLabel||'Relevant electorate fit'));
    card.append(labeledValue(doc,'Modeled compatibility',percent(analysis.overallFit)),labeledValue(doc,'Electorate share with usable fit',percent(analysis.coverage)));
    for(const [label,group] of [['Strongest voter cohorts',analysis.strongest],['Weakest voter cohorts',analysis.weakest]]){
      const summaries=(group||[]).map(bloc=>{const cohort=cohorts.find(item=>item.id===bloc.cohortId);return`${cohort?.name||cohort?.id||bloc.cohortId} ${percent(bloc.compatibility)}`;});
      if(summaries.length)card.append(labeledValue(doc,label,summaries.join(' · ')));
    }
    target.append(card);
  }else target.append(labeledValue(doc,'Relevant electorate fit','Unavailable; no native district context is exposed for this politician.'));
  return vm;
}
module.exports={politicianViewModel,renderPoliticianPanel};
