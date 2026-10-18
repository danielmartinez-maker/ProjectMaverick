const {el,labeledValue,button,clear}=require('./components');

function electorateViewModel(model={}){
  const source=(model.cohorts||[]).slice().sort((a,b)=>(b.share||0)-(a.share||0));
  const percents=source.map(c=>Math.round((Number(c.share)||0)*100));
  const diff=100-percents.reduce((a,b)=>a+b,0);
  if(percents.length)percents[percents.length-1]+=diff;
  return{cohorts:source.map((c,i)=>({...c,percent:percents[i]})),confidence:Number.isFinite(model.confidence)?`${Math.round(model.confidence*100)}%`:'Unavailable',empty:source.length===0};
}
function candidateName(record){return record?.name||'Unavailable';}
function percent(value){return Number.isFinite(value)?`${Math.round(value*100)}%`:'Unavailable';}
function points(value){return Number.isFinite(value)?`${Math.round(value*100)} percentage points`:'Unavailable';}
function renderCandidateFit(doc,target,row,model){
  const card=el(doc,'article','pm-card');
  card.append(labeledValue(doc,candidateName(row),'Overall fit '+percent(row.fit)));
  card.append(labeledValue(doc,'Electorate share with usable fit',percent(row.coverage)));
  for(const [label,group] of [['Strongest blocs',row.strongest],['Weakest blocs',row.weakest]]){
    const names=(group||[]).map(bloc=>{
      const cohort=model.cohorts.find(item=>item.id===bloc.cohortId);
      return `${cohort?.name||cohort?.id||bloc.cohortId} ${percent(bloc.compatibility)}`;
    });
    if(names.length)card.append(labeledValue(doc,label,names.join(' · ')));
  }
  target.append(card);
}
function renderElectoratePanel(doc,target,model,options={}){
  const vm=electorateViewModel(model);
  target.append(el(doc,'h2','pm-section-title',options.title||'Electorate Ideology'));
  target.append(labeledValue(doc,'Model confidence',vm.confidence));
  if(vm.empty)target.append(el(doc,'p','pm-muted','Electorate ideology data unavailable.'));
  const grid=el(doc,'div','pm-grid');
  for(const c of vm.cohorts.slice(0,18)){
    const card=el(doc,'div','pm-card');
    card.append(labeledValue(doc,c.name||c.id,`${c.percent}%`),labeledValue(doc,'Family',c.family||'Unavailable'));
    if(c.salience&&Object.keys(c.salience).length){
      const priorities=Object.entries(c.salience).sort((a,b)=>b[1]-a[1]).slice(0,3).map(([key,value])=>`${key} ${Math.round(value*100)}%`).join(' · ');
      card.append(labeledValue(doc,'Top issue salience',priorities));
    }
    grid.append(card);
  }
  target.append(grid);
  if(options.candidateFits?.length){
    target.append(el(doc,'h3','pm-subtitle','Candidate coalition fit'));
    const fitGrid=el(doc,'div','pm-grid');
    for(const row of options.candidateFits.slice(0,12))renderCandidateFit(doc,fitGrid,row,model);
    target.append(fitGrid);
  }
  if(options.candidateComparison){
    const comparison=options.candidateComparison;
    const card=el(doc,'section','pm-card');
    card.append(el(doc,'h3','pm-subtitle',`${comparison.aName} vs ${comparison.bName}: coalition fit`));
    card.append(labeledValue(doc,comparison.aName,percent(comparison.aFit)),labeledValue(doc,comparison.bName,percent(comparison.bFit)));
    card.append(labeledValue(doc,`${comparison.aName} usable electorate coverage`,percent(comparison.aCoverage)),labeledValue(doc,`${comparison.bName} usable electorate coverage`,percent(comparison.bCoverage)));
    const lead=comparison.advantage;
    const leader=!Number.isFinite(lead)?'Unavailable':Math.abs(lead)<.02?'Even modeled fit':lead>0?`${comparison.aName} leads by ${points(Math.abs(lead))}`:`${comparison.bName} leads by ${points(Math.abs(lead))}`;
    card.append(labeledValue(doc,'Aggregate comparison',leader));
    for(const bloc of comparison.blocs){
      const cohort=model.cohorts.find(item=>item.id===bloc.cohortId);
      const lean=bloc.lean==='unavailable'?'Unavailable':bloc.lean==='even'?'Even':bloc.lean==='a'?comparison.aName:comparison.bName;
      card.append(labeledValue(doc,cohort?.name||cohort?.id||bloc.cohortId,`${lean} · ${comparison.aName} ${percent(bloc.a)} / ${comparison.bName} ${percent(bloc.b)}`));
    }
    target.append(card);
  }
  return vm;
}
function politicianProfile(record){const evidence=record.ideology?.evidence||[];return{dimensions:record.ideology?.dimensions||{},observedDimensions:[...new Set(evidence.map(item=>item.dimension).filter(Boolean))],party:record.party,politicalStyle:record.politicalStyle};}
function option(doc,value,label){const item=el(doc,'option',null,label);item.value=value;return item;}
function renderElectorateBrowser(doc,target,electorates,services={}){
  target.append(el(doc,'h2','pm-section-title','Electorates'));
  if(services.back)target.append(button(doc,'Back to Political Intelligence',services.back));
  const picker=el(doc,'select','pm-select');
  const records=(services.records||[]).slice().sort((a,b)=>candidateName(a).localeCompare(candidateName(b)));
  const candidateA=el(doc,'select','pm-select'),candidateB=el(doc,'select','pm-select');
  for(const electorate of electorates)picker.append(option(doc,electorate.id,electorate.label||electorate.id));
  candidateA.append(option(doc,'','Choose first politician'));
  candidateB.append(option(doc,'','Choose second politician'));
  for(const record of records){
    const id=String(record.id);
    const label=[candidateName(record),record.party].filter(Boolean).join(' · ');
    candidateA.append(option(doc,id,label));candidateB.append(option(doc,id,label));
  }
  const compareControls=el(doc,'div','pm-toolbar');
  candidateA.setAttribute('aria-label','First politician to compare');candidateB.setAttribute('aria-label','Second politician to compare');
  compareControls.append(el(doc,'span','pm-muted','Compare candidates: '),candidateA,candidateB);
  const host=el(doc,'div','pm-electorate-host');
  target.append(picker,compareControls,host);
  function draw(){
    clear(host);
    const electorate=electorates.find(item=>String(item.id)===String(picker.value))||electorates[0];
    if(!electorate){host.append(el(doc,'p','pm-muted','No native electorate data is available in the current game state.'));return null;}
    const model=services.inferCohorts(electorate);
    const analyses=new Map();
    const candidateFits=model.cohorts?.length?records.map(record=>{
      const analysis=services.analyzeCandidate(politicianProfile(record),record.politicalStyle,model);
      analyses.set(String(record.id),analysis);
      return{name:candidateName(record),fit:analysis.overallFit,coverage:analysis.coverage,strongest:analysis.strongest,weakest:analysis.weakest};
    }).sort((a,b)=>(Number.isFinite(b.fit)?b.fit:-1)-(Number.isFinite(a.fit)?a.fit:-1)):[];
    let candidateComparison=null;
    const a=records.find(record=>String(record.id)===String(candidateA.value));
    const b=records.find(record=>String(record.id)===String(candidateB.value));
    if(a&&b&&String(a.id)!==String(b.id)&&services.compareCandidates){
      const comparison=services.compareCandidates(politicianProfile(a),politicianProfile(b),model);
      candidateComparison={...comparison,aName:candidateName(a),bName:candidateName(b),aFit:analyses.get(String(a.id))?.overallFit,bFit:analyses.get(String(b.id))?.overallFit};
    }
    renderElectoratePanel(doc,host,model,{title:electorate.label,candidateFits,candidateComparison});
    return model;
  }
  for(const control of [picker,candidateA,candidateB])control.addEventListener('change',draw);
  return draw();
}
module.exports={electorateViewModel,renderElectoratePanel,renderElectorateBrowser};
