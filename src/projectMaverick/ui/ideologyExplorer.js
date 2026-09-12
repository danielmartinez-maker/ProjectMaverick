const {filterPoliticians}=require('../qol/filters');const {el,labeledValue,button,clear}=require('./components');
function filterExplorer(records,criteria={}){return filterPoliticians(records,{ideologyFamily:criteria.family,ideologySubtype:criteria.subtype});}
function option(doc,value,label){const o=el(doc,'option',null,label);o.value=value;return o;}
function renderIdeologyExplorer(doc,target,records,criteria={},actions={}){
  target.append(el(doc,'h2','pm-section-title','Ideology Explorer'));
  if(actions.back)target.append(button(doc,'Back to Political Intelligence',actions.back));
  const controls=el(doc,'div','pm-filters'),family=el(doc,'select','pm-select'),subtype=el(doc,'select','pm-select'),list=el(doc,'div','pm-list'),summary=el(doc,'div','pm-muted');
  const families=[...new Set(records.map(r=>r.ideology?.primary?.family).filter(Boolean))].sort();
  const subtypes=[...new Map(records.filter(r=>r.ideology?.primary?.id).map(r=>[r.ideology.primary.id,r.ideology.primary.name])).entries()].sort((a,b)=>a[1].localeCompare(b[1]));
  family.append(option(doc,'','All ideology families'),...families.map(v=>option(doc,v,v)));subtype.append(option(doc,'','All subtypes'),...subtypes.map(([id,name])=>option(doc,id,name)));
  family.value=criteria.family||'';subtype.value=criteria.subtype||'';controls.append(family,subtype);target.append(controls,summary,list);
  function draw(){clear(list);const rows=filterExplorer(records,{family:family.value,subtype:subtype.value});summary.textContent=`${rows.length} classified politician${rows.length===1?'':'s'}`;for(const r of rows.slice(0,300)){const card=el(doc,'div','pm-card');card.append(labeledValue(doc,'Politician',r.name),labeledValue(doc,'Ideology',r.ideology?.primary?.name||'Unavailable'),labeledValue(doc,'Family',r.ideology?.primary?.family||'Unavailable'),labeledValue(doc,'Political style',r.politicalStyle?.primary?.name||'Unavailable'));if(actions.openPolitician)card.append(button(doc,'Open',()=>actions.openPolitician(r)));list.append(card);}if(!rows.length)list.append(el(doc,'p','pm-muted','No politicians match this ideology filter.'));return rows;}
  family.addEventListener('change',draw);subtype.addEventListener('change',draw);return draw();
}
module.exports={filterExplorer,renderIdeologyExplorer};
