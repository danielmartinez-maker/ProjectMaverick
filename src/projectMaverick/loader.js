(function(root){
  if(root.ProjectMaverick&&root.ProjectMaverick.__booted)return;
  const pathPrefix='./projectMaverick/';
  const ns=require(pathPrefix+'core/namespace');
  ns.__booted=true;
  const diagnostics=require(pathPrefix+'core/diagnostics');
  const compatibility=require(pathPrefix+'core/compatibility');
  const {createStorage}=require(pathPrefix+'core/storage');
  const {createEvents}=require(pathPrefix+'core/events');
  const {createAdapter}=require(pathPrefix+'core/nativeAdapter');
  const {scorePolitician}=require(pathPrefix+'ideology/scoring');
  const {classifyPolitician}=require(pathPrefix+'ideology/classifyPolitician');
  const {classifyPoliticalStyle}=require(pathPrefix+'archetypes/classifyPoliticalStyle');
  const {inferCohorts}=require(pathPrefix+'voters/cohortModel');
  const {analyzeCandidate}=require(pathPrefix+'voters/coalitionAnalysis');
  const {searchPoliticians}=require(pathPrefix+'qol/search');
  const {filterPoliticians}=require(pathPrefix+'qol/filters');
  const {createWatchlists}=require(pathPrefix+'qol/watchlists');
  const {createRecentViews}=require(pathPrefix+'qol/recentViews');
  const {createShell}=require(pathPrefix+'ui/shell');
  const {renderDashboard}=require(pathPrefix+'ui/dashboard');
  const {renderPoliticianPanel}=require(pathPrefix+'ui/politicianPanel');
  const {renderIdeologyExplorer}=require(pathPrefix+'ui/ideologyExplorer');
  const {renderElectoratePanel,renderElectorateBrowser}=require(pathPrefix+'ui/electoratePanel');
  const {renderComparePanel}=require(pathPrefix+'ui/comparePanel');
  try{
    const fs=require('node:fs'),crypto=require('node:crypto'),path=require('node:path');
    const backup=path.join(process.cwd(),'.project-maverick-backup','index.html');
    const indexSha256=fs.existsSync(backup)?crypto.createHash('sha256').update(fs.readFileSync(backup)).digest('hex'):null;
    const status=compatibility.check({indexSha256});ns.compatibilityStatus=status;if(!status.ok){diagnostics.record('compatibility-failed',status.failures);return;}
    const storage=createStorage(root.localStorage,(code,detail)=>diagnostics.record(code,detail));const events=createEvents();const adapter=createAdapter(root);
    function buildRecords(){const issueCatalog=adapter.readIssueCatalog();return adapter.readPoliticians().map(p=>{const scored=scorePolitician(p,issueCatalog);const classified=classifyPolitician(scored);const politicalStyle=classifyPoliticalStyle(p);return{...p,politicalStyle,ideology:{...classified,dimensions:scored.dimensions,evidence:scored.evidence}};});}
    let records=buildRecords(),electorates=adapter.readElectorates();
    function refreshData(){records=buildRecords();electorates=adapter.readElectorates();ns.records=records;ns.electorates=electorates;}
    const style=document.createElement('link');style.rel='stylesheet';style.href='projectMaverick/styles/projectMaverick.css';style.id='pm-styles';if(!document.getElementById(style.id))document.head.appendChild(style);
    const shell=createShell(document,root);shell.mount();const watchlists=createWatchlists(storage),recentViews=createRecentViews(storage);const compareSelection=[];
    function compareIds(){return compareSelection.slice();}
    function toggleWatchlist(id){watchlists.toggle(id);return watchlists.has(id);}
    function toggleCompare(record){const id=String(record?.id??record);const index=compareSelection.indexOf(id);if(index>=0)compareSelection.splice(index,1);else{if(compareSelection.length>=2)compareSelection.shift();compareSelection.push(id);}return compareIds();}
    function openPolitician(record){recentViews.record(record.id);shell.open((target)=>renderPoliticianPanel(document,target,record,{back:openDashboard,toggleWatchlist,isWatched:id=>watchlists.has(id),toggleCompare,isCompareSelected:id=>compareSelection.includes(String(id))}));}
    function openIdeologyExplorer(){refreshData();shell.open((target)=>renderIdeologyExplorer(document,target,records,{}, {back:openDashboard,openPolitician,toggleWatchlist}));}
    function openElectorates(){refreshData();shell.open((target)=>renderElectorateBrowser(document,target,electorates,{back:openDashboard,records,inferCohorts,analyzeCandidate,renderElectoratePanel}));}
    function openCompare(){refreshData();const chosen=compareSelection.map(id=>records.find(r=>String(r.id)===id)).filter(Boolean);shell.open((target)=>{if(chosen.length!==2){const p=document.createElement('p');p.className='pm-muted';p.textContent='Select two politicians from Political Intelligence to compare them.';target.appendChild(p);const b=document.createElement('button');b.className='pm-button';b.type='button';b.textContent='Back to Political Intelligence';b.addEventListener('click',openDashboard);target.appendChild(b);return;}renderComparePanel(document,target,chosen[0],chosen[1],{back:openDashboard});});}
    function openDashboard(){refreshData();shell.open((target)=>renderDashboard(document,target,{records,searchPoliticians,filterPoliticians,watchlists,recentViews,openPolitician,openIdeologyExplorer,openElectorates,openCompare,toggleWatchlist,toggleCompare,compareIds}));}
    if(!document.getElementById('pm-launcher')){const launcher=document.createElement('button');launcher.id='pm-launcher';launcher.className='pm-button';launcher.type='button';launcher.textContent='Maverick';launcher.addEventListener('click',openDashboard);document.body.appendChild(launcher);}
    Object.assign(ns,{storage,events,adapter,records,electorates,watchlists,recentViews,shell,openDashboard,openPolitician,openIdeologyExplorer,openElectorates,openCompare,toggleWatchlist,toggleCompare,compareIds,inferCohorts,analyzeCandidate});events.emit('ready',{recordCount:records.length,electorateCount:electorates.length});
  }catch(error){diagnostics.record('boot-failed',{message:error.message,stack:error.stack});}
})(window);
