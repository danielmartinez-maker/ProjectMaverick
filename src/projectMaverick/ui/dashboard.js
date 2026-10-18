const {el,button,clear}=require('./components');
function option(doc,value,label){const o=el(doc,'option',null,label);o.value=value;return o;}
function values(records,getter){return [...new Set(records.map(getter).filter(value=>value!=null&&value!==''))].sort((a,b)=>String(a).localeCompare(String(b)));}
function renderDashboard(doc,target,ctx){
  const title=el(doc,'h2','pm-section-title','Political Intelligence');
  const nav=el(doc,'div','pm-toolbar');
  nav.append(
    button(doc,'Politicians',()=>setMode('all')),
    button(doc,'Ideology Explorer',ctx.openIdeologyExplorer),
    button(doc,'Electorates',ctx.openElectorates),
    button(doc,'Watchlist',()=>setMode('watchlist')),
    button(doc,'Recent',()=>setMode('recent')),
    button(doc,'Compare',ctx.openCompare),
    button(doc,'Diagnostics',ctx.openDiagnostics),
    button(doc,'Changelog',ctx.openChangelog)
  );
  const filters=el(doc,'div','pm-filters');
  const input=el(doc,'input','pm-search');input.id='pm-search';input.type='search';input.placeholder='Search politician, office, state, party, ideology, archetype';
  const party=el(doc,'select','pm-select'),state=el(doc,'select','pm-select'),office=el(doc,'select','pm-select'),ideology=el(doc,'select','pm-select'),archetype=el(doc,'select','pm-select');
  const fiscal=el(doc,'select','pm-select'),social=el(doc,'select','pm-select'),incumbency=el(doc,'select','pm-select'),electionStatus=el(doc,'select','pm-select'),approval=el(doc,'select','pm-select'),sort=el(doc,'select','pm-select');
  party.append(option(doc,'','All parties'),...values(ctx.records,r=>r.party).map(v=>option(doc,v,v)));
  state.append(option(doc,'','All states'),...values(ctx.records,r=>r.state).map(v=>option(doc,v,v)));
  office.append(option(doc,'','All offices'),...values(ctx.records,r=>r.office).map(v=>option(doc,v,v)));
  ideology.append(option(doc,'','All ideologies'),...values(ctx.records,r=>r.ideology?.primary?.family).map(v=>option(doc,v,v)));
  archetype.append(option(doc,'','All archetypes'),...values(ctx.records,r=>r.politicalStyle?.primary?.id).map(v=>option(doc,v,v)));
  fiscal.append(option(doc,'','Any fiscal ideology'),...values(ctx.records,r=>r.fiscalScore).map(v=>option(doc,v,v)));
  social.append(option(doc,'','Any social ideology'),...values(ctx.records,r=>r.socialScore).map(v=>option(doc,v,v)));
  incumbency.append(option(doc,'','All incumbency'),option(doc,'incumbent','Incumbents'),option(doc,'non-incumbent','Non-incumbents'),option(doc,'unknown','Unknown incumbency'));
  electionStatus.append(option(doc,'','All election statuses'),...values(ctx.records,r=>r.electionStatus).map(v=>option(doc,v,v)));
  approval.append(option(doc,'','Any approval data'),option(doc,'available','Approval available'),option(doc,'unavailable','Approval unavailable'));
  sort.append(option(doc,'name','Sort: name'),option(doc,'state','Sort: state'),option(doc,'office','Sort: office'),option(doc,'approval','Sort: approval'),option(doc,'popularity','Sort: popularity'));
  filters.append(input,party,state,office,ideology,archetype,fiscal,social,incumbency,electionStatus,approval,sort);
  const status=el(doc,'div','pm-muted');const list=el(doc,'div','pm-list');target.append(title,nav,filters,status,list);
  let mode='all';
  function setMode(next){mode=next;draw();}
  function idsInOrder(){
    if(mode==='watchlist')return ctx.watchlists.list();
    if(mode==='recent')return ctx.recentViews.list().slice().reverse();
    return null;
  }
  function draw(){
    clear(list);
    let rows=ctx.searchPoliticians(input.value,ctx.records);
    rows=ctx.filterPoliticians(rows,{party:party.value,state:state.value,office:office.value,ideologyFamily:ideology.value,politicalArchetype:archetype.value,fiscalIdeology:fiscal.value,socialIdeology:social.value,incumbency:incumbency.value,electionStatus:electionStatus.value,approvalAvailability:approval.value});
    rows=ctx.sortPoliticians?ctx.sortPoliticians(rows,sort.value):rows;
    const orderedIds=idsInOrder();if(orderedIds){const rank=new Map(orderedIds.map((id,i)=>[String(id),i]));rows=rows.filter(r=>rank.has(String(r.id))).sort((a,b)=>rank.get(String(a.id))-rank.get(String(b.id)));}
    const selected=ctx.compareIds?ctx.compareIds():[];status.textContent=`${rows.length} politician${rows.length===1?'':'s'} · ${ctx.watchlists.list().length} watched · ${selected.length}/2 selected for comparison`;
    for(const r of rows.slice(0,300)){
      const card=el(doc,'div','pm-card');const actions=el(doc,'div','pm-card-actions');
      const meta=[r.party,r.office,r.state,r.ideology?.primary?.name,r.politicalStyle?.primary?.name,r.electionStatus,r.popularity!=null?`Popularity ${r.popularity}`:null,r.incumbent===true?'Incumbent':r.incumbent===false?'Non-incumbent':null].filter(value=>value!=null&&value!=='').join(' · ');
      const name=el(doc,'strong','pm-person-name',r.name);
      name.title=[r.ideology?.primary?.name,r.politicalStyle?.primary?.name,r.electionStatus].filter(Boolean).join(' · ')||'Open politician intelligence';
      actions.append(
        button(doc,'Open',()=>ctx.openPolitician(r)),
        button(doc,ctx.watchlists.has(r.id)?'Unwatch':'Watch',()=>{ctx.toggleWatchlist(r.id);draw();}),
        button(doc,selected.includes(String(r.id))?'Unselect':'Compare',()=>{ctx.toggleCompare(r);draw();})
      );
      card.append(name,el(doc,'div','pm-muted',meta),actions);list.append(card);
    }
    if(!rows.length)list.append(el(doc,'p','pm-muted',mode==='all'?'No politicians match these filters.':'No politicians in this view yet.'));
  }
  for(const control of [input,party,state,office,ideology,archetype,fiscal,social,incumbency,electionStatus,approval,sort])control.addEventListener(control===input?'input':'change',draw);
  draw();return{refresh:draw,setMode};
}
module.exports={renderDashboard};
