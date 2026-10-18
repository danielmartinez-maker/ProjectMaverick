const {filterPoliticians}=require('../qol/filters');
const {el,labeledValue,button,clear}=require('./components');

function filterExplorer(records,criteria={}){return filterPoliticians(records,{ideologyFamily:criteria.family,ideologySubtype:criteria.subtype});}
function option(doc,value,label){const item=el(doc,'option',null,label);item.value=value;return item;}
function candidateProfile(record){return{dimensions:record.ideology?.dimensions||{},observedDimensions:[...new Set((record.ideology?.evidence||[]).map(item=>item.dimension).filter(Boolean))],party:record.party,politicalStyle:record.politicalStyle};}
function percent(value){return Number.isFinite(value)?`${Math.round(value*100)}%`:'Unavailable';}
function renderIdeologyExplorer(doc,target,records,criteria={},actions={}){
  target.append(el(doc,'h2','pm-section-title','Ideology Explorer'));
  if(actions.back)target.append(button(doc,'Back to Political Intelligence',actions.back));
  const controls=el(doc,'div','pm-filters'),family=el(doc,'select','pm-select'),subtype=el(doc,'select','pm-select');
  const families=[...new Set(records.map(record=>record.ideology?.primary?.family).filter(Boolean))].sort();
  const subtypes=[...new Map(records.filter(record=>record.ideology?.primary?.id).map(record=>[record.ideology.primary.id,record.ideology.primary.name])).entries()].sort((a,b)=>a[1].localeCompare(b[1]));
  family.append(option(doc,'','All ideology families'),...families.map(value=>option(doc,value,value)));
  subtype.append(option(doc,'','All subtypes'),...subtypes.map(([id,name])=>option(doc,id,name)));
  family.value=criteria.family||'';subtype.value=criteria.subtype||'';controls.append(family,subtype);
  const electorateControls=el(doc,'div','pm-toolbar'),electoratePicker=el(doc,'select','pm-select');
  const electorates=actions.electorates||[];
  electoratePicker.append(option(doc,'','Choose electorate'));
  for(const electorate of electorates)electoratePicker.append(option(doc,electorate.id,electorate.label||electorate.id));
  if(electorates.length)electorateControls.append(el(doc,'span','pm-muted','Electorate: '),electoratePicker);
  const summary=el(doc,'div','pm-muted'),list=el(doc,'div','pm-list'),cohortHost=el(doc,'div','pm-electorate-host');
  target.append(controls,summary,list,electorateControls,cohortHost);
  function draw(){
    clear(list);clear(cohortHost);
    const rows=filterExplorer(records,{family:family.value,subtype:subtype.value});
    const electorate=electorates.find(item=>String(item.id)===String(electoratePicker.value));
    const model=electorate&&actions.inferCohorts?actions.inferCohorts(electorate):null;
    summary.textContent=`${rows.length} classified politician${rows.length===1?'':'s'}`;
    for(const record of rows.slice(0,300)){
      const card=el(doc,'article','pm-card');
      card.append(labeledValue(doc,'Politician',record.name),labeledValue(doc,'Ideology',record.ideology?.primary?.name||'Unavailable'),labeledValue(doc,'Family',record.ideology?.primary?.family||'Unavailable'),labeledValue(doc,'Political style',record.politicalStyle?.primary?.name||'Unavailable'));
      const dimensions=(record.ideology?.explanation||[]).join(' · ');
      if(dimensions)card.append(labeledValue(doc,'Defining dimensions',dimensions));
      if(model&&actions.analyzeCandidate){
        const analysis=model.confidence>.2?actions.analyzeCandidate(candidateProfile(record),record.politicalStyle,model):null;
        card.append(labeledValue(doc,'Selected electorate fit',analysis?percent(analysis.overallFit):'Unavailable; native electorate evidence is sparse'));
      }
      if(actions.openPolitician)card.append(button(doc,'Open',()=>actions.openPolitician(record)));
      list.append(card);
    }
    if(!rows.length)list.append(el(doc,'p','pm-muted','No politicians match this ideology filter.'));
    if(electorate&&model){
      if(model.confidence<=.2){cohortHost.append(el(doc,'p','pm-muted','Electorate composition unavailable; native party, issue, or ideology evidence is missing.'));}
      else{
        const candidateFits=actions.analyzeCandidate?rows.slice(0,12).map(record=>{
          const analysis=actions.analyzeCandidate(candidateProfile(record),record.politicalStyle,model);
          return{name:record.name,fit:analysis.overallFit,coverage:analysis.coverage,strongest:analysis.strongest,weakest:analysis.weakest};
        }):[];
        if(actions.renderElectoratePanel)actions.renderElectoratePanel(doc,cohortHost,model,{title:electorate.label,candidateFits});
      }
    }
    return rows;
  }
  family.addEventListener('change',draw);subtype.addEventListener('change',draw);electoratePicker.addEventListener('change',draw);
  return draw();
}
module.exports={filterExplorer,renderIdeologyExplorer};
