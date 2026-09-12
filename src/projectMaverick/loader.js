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
  require(pathPrefix+'ui/ideologyExplorer');
  require(pathPrefix+'ui/electoratePanel');
  require(pathPrefix+'ui/comparePanel');
  try{
    const fs=require('node:fs'),crypto=require('node:crypto'),path=require('node:path');
    const backup=path.join(process.cwd(),'.project-maverick-backup','index.html');
    const indexSha256=fs.existsSync(backup)?crypto.createHash('sha256').update(fs.readFileSync(backup)).digest('hex'):null;
    const status=compatibility.check({indexSha256});ns.compatibilityStatus=status;if(!status.ok){diagnostics.record('compatibility-failed',status.failures);return;}
    const storage=createStorage(root.localStorage,(code,detail)=>diagnostics.record(code,detail));const events=createEvents();const adapter=createAdapter(root);
    function buildRecords(){const issueCatalog=adapter.readIssueCatalog();return adapter.readPoliticians().map(p=>{const scored=scorePolitician(p,issueCatalog);const classified=classifyPolitician(scored);const politicalStyle=classifyPoliticalStyle(p);return{...p,politicalStyle,ideology:{...classified,dimensions:scored.dimensions,evidence:scored.evidence}};});}
    let records=buildRecords();
    const style=document.createElement('link');style.rel='stylesheet';style.href='projectMaverick/styles/projectMaverick.css';style.id='pm-styles';if(!document.getElementById(style.id))document.head.appendChild(style);
    const shell=createShell(document,root);shell.mount();const watchlists=createWatchlists(storage),recentViews=createRecentViews(storage);
    function openPolitician(record){recentViews.record(record.id);shell.open((target)=>renderPoliticianPanel(document,target,record));}
    function openDashboard(){records=buildRecords();ns.records=records;shell.open((target)=>renderDashboard(document,target,{records,searchPoliticians,filterPoliticians,watchlists,recentViews,openPolitician}));}
    if(!document.getElementById('pm-launcher')){const launcher=document.createElement('button');launcher.id='pm-launcher';launcher.className='pm-button';launcher.type='button';launcher.textContent='Maverick';launcher.addEventListener('click',openDashboard);document.body.appendChild(launcher);}
    Object.assign(ns,{storage,events,adapter,records,watchlists,recentViews,shell,openDashboard,openPolitician,inferCohorts,analyzeCandidate});events.emit('ready',{recordCount:records.length});
  }catch(error){diagnostics.record('boot-failed',{message:error.message,stack:error.stack});}
})(window);
