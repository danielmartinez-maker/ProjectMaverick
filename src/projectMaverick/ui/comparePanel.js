const {comparePoliticianRecords}=require('../qol/compare');
const {el,labeledValue,button}=require('./components');

function compareViewModel(a,b){return comparePoliticianRecords(a,b);}
function scalar(value){return value==null||value===''?'Unavailable':String(value);}
function percent(value){return Number.isFinite(value)?`${Math.round(value*100)}%`:'Unavailable';}
function points(value){return Number.isFinite(value)?`${Math.round(value*100)} percentage points`:'Unavailable';}
function signed(value){return Number.isFinite(value)?`${value>=0?'+':''}${value.toFixed(2)}`:'Unavailable';}
function policyEvidence(record){
  const rows=(record.ideology?.evidence||[]).filter(item=>String(item.source||'').startsWith('issue:')||String(item.source||'').startsWith('policy:'));
  rows.sort((a,b)=>Math.abs(Number(b.value)||0)*(Number(b.weight)||1)-Math.abs(Number(a.value)||0)*(Number(a.weight)||1));
  const selected=new Map();
  for(const item of rows){if(selected.size>=6)break;selected.set(String(item.source).replace(/^(issue|policy):/,''),item.value);}
  return selected;
}
function renderCoalitionComparison(doc,target,comparison,a,b){
  const card=el(doc,'section','pm-card');
  card.append(el(doc,'h3','pm-subtitle','Constituency coalition compatibility'));
  if(!comparison){card.append(el(doc,'p','pm-muted','Unavailable; both politicians need the same verified native district context.'));target.append(card);return;}
  card.append(labeledValue(doc,a.name||'First politician',percent(comparison.aFit)),labeledValue(doc,b.name||'Second politician',percent(comparison.bFit)));
  card.append(labeledValue(doc,'Usable electorate coverage',`${percent(comparison.aCoverage)} / ${percent(comparison.bCoverage)}`));
  const advantage=comparison.advantage;
  const summary=!Number.isFinite(advantage)?'Unavailable':Math.abs(advantage)<.02?'Even modeled fit':advantage>0?`${a.name} leads by ${points(Math.abs(advantage))}`:`${b.name} leads by ${points(Math.abs(advantage))}`;
  card.append(labeledValue(doc,'Aggregate compatibility',summary));
  for(const bloc of comparison.blocs){
    const leader=bloc.lean==='unavailable'?'Unavailable':bloc.lean==='even'?'Even':bloc.lean==='a'?a.name:b.name;
    card.append(labeledValue(doc,bloc.cohortId,`${leader} · ${percent(bloc.a)} / ${percent(bloc.b)}`));
  }
  target.append(card);
}
function renderComparePanel(doc,target,a,b,actions={}){
  const vm=compareViewModel(a,b);
  target.append(el(doc,'h2','pm-section-title',`${a?.name||'Unavailable'} vs ${b?.name||'Unavailable'}`));
  if(actions.back)target.append(button(doc,'Back to Political Intelligence',actions.back));
  const summary=el(doc,'div','pm-grid');
  for(const record of [a,b]){
    const card=el(doc,'article','pm-card');
    card.append(labeledValue(doc,'Politician',record?.name),labeledValue(doc,'Party',record?.party),labeledValue(doc,'Office',record?.office),labeledValue(doc,'State',record?.state),labeledValue(doc,'Ideology',record?.ideology?.primary?.name),labeledValue(doc,'Secondary ideology',record?.ideology?.secondary?.name),labeledValue(doc,'Political archetype',record?.politicalStyle?.primary?.name),labeledValue(doc,'Secondary style',record?.politicalStyle?.secondary?.name),labeledValue(doc,'Political-style confidence',percent(record?.politicalStyle?.confidence)),labeledValue(doc,'Popularity',scalar(record?.popularity??record?.approval?.overall)),labeledValue(doc,'Name recognition',scalar(record?.nameRecognition??record?.native?.nameRecognition)),labeledValue(doc,'Approval (D / R / I)',`${scalar(record?.approval?.democrat)} / ${scalar(record?.approval?.republican)} / ${scalar(record?.approval?.independent)}`));
    summary.append(card);
  }
  target.append(summary,el(doc,'h3','pm-subtitle','Ideological dimension delta (first minus second)'));
  for(const [dimension,delta] of Object.entries(vm.dimensionDeltas))target.append(labeledValue(doc,dimension,signed(delta)));
  const policiesA=policyEvidence(a),policiesB=policyEvidence(b),policyKeys=[...new Set([...policiesA.keys(),...policiesB.keys()])].slice(0,8);
  const policyCard=el(doc,'section','pm-card');
  policyCard.append(el(doc,'h3','pm-subtitle','Defining policy positions'));
  if(!policyKeys.length)policyCard.append(el(doc,'p','pm-muted','No mapped policy evidence is available for both records.'));
  for(const key of policyKeys){
    const av=policiesA.get(key),bv=policiesB.get(key);
    policyCard.append(labeledValue(doc,key,`${a.name||'First'} ${av==null?'Unavailable':signed(av)} · ${b.name||'Second'} ${bv==null?'Unavailable':signed(bv)}`));
  }
  target.append(policyCard);
  renderCoalitionComparison(doc,target,actions.coalitionComparison,a,b);
  return vm;
}
module.exports={compareViewModel,renderComparePanel};
