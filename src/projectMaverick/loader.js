(function(root){
  if(root.ProjectMaverick&&(root.ProjectMaverick.__booted||root.ProjectMaverick.__booting))return;
  const pathPrefix='./projectMaverick/';
  const moduleStatus=[];
  let ns=root.ProjectMaverick||{};
  let diagnostics=null;
  root.ProjectMaverick=ns;
  ns.__booting=true;

  function loadModule(name){
    try{
      const value=require(pathPrefix+name);
      moduleStatus.push({name,status:'loaded'});
      ns.loadedModules=moduleStatus;
      return value;
    }catch(error){
      const detail={module:name,message:error&&error.message?error.message:String(error)};
      moduleStatus.push({name,status:'failed',message:detail.message});
      ns.loadedModules=moduleStatus;
      if(diagnostics)diagnostics.record('module-load-failed',detail);
      throw error;
    }
  }

  try{
    ns=loadModule('core/namespace');
    ns.__booting=true;
    ns.loadedModules=moduleStatus;
    diagnostics=loadModule('core/diagnostics');
    const compatibility=loadModule('core/compatibility');
    const {createStorage}=loadModule('core/storage');
    const {createEvents}=loadModule('core/events');
    const {createAdapter}=loadModule('core/nativeAdapter');
    const {scorePolitician}=loadModule('ideology/scoring');
    const {classifyPolitician}=loadModule('ideology/classifyPolitician');
    const {classifyPoliticalStyle}=loadModule('archetypes/classifyPoliticalStyle');
    const {inferCohorts}=loadModule('voters/cohortModel');
    const {analyzeCandidate,compareCandidates}=loadModule('voters/coalitionAnalysis');
    const {searchPoliticians}=loadModule('qol/search');
    const {filterPoliticians,sortPoliticians}=loadModule('qol/filters');
    const {createWatchlists}=loadModule('qol/watchlists');
    const {createRecentViews}=loadModule('qol/recentViews');
    const {createShell}=loadModule('ui/shell');
    const {renderDashboard}=loadModule('ui/dashboard');
    const {renderPoliticianPanel}=loadModule('ui/politicianPanel');
    const {renderIdeologyExplorer}=loadModule('ui/ideologyExplorer');
    const {renderElectoratePanel,renderElectorateBrowser}=loadModule('ui/electoratePanel');
    const {renderComparePanel}=loadModule('ui/comparePanel');
    const {renderChangelog}=loadModule('ui/changelog');
    const {renderDiagnosticsPanel}=loadModule('ui/diagnosticsPanel');

    const fs=require('node:fs'),crypto=require('node:crypto'),path=require('node:path');
    const backup=path.join(process.cwd(),'.project-maverick-backup','index.html');
    const indexSha256=fs.existsSync(backup)?crypto.createHash('sha256').update(fs.readFileSync(backup)).digest('hex'):null;
    const status=compatibility.check({indexSha256});
    ns.compatibilityStatus=status;
    if(!status.ok){
      diagnostics.record('compatibility-failed',status.failures);
      ns.__booting=false;
      ns.__booted=false;
      return;
    }

    const storage=createStorage(root.localStorage,(code,detail)=>diagnostics.record(code,detail));
    const events=createEvents();
    const adapter=createAdapter(root,(code,detail)=>diagnostics.record(code,detail));
    const classificationCache=new Map(),electorateCache=new Map();
    function fingerprint(value){try{return JSON.stringify(value);}catch(_){return null;}}
    function cohortModel(snapshot){
      if(!snapshot||typeof snapshot!=='object')return inferCohorts(snapshot||{});
      const identity=String(snapshot.id??snapshot.label??snapshot.scope??'electorate');
      const sourceFingerprint=fingerprint(snapshot),cached=electorateCache.get(identity);
      if(sourceFingerprint!=null&&cached?.fingerprint===sourceFingerprint)return cached.model;
      const model=inferCohorts(snapshot);
      if(sourceFingerprint!=null){electorateCache.set(identity,{fingerprint:sourceFingerprint,model});if(electorateCache.size>100)electorateCache.delete(electorateCache.keys().next().value);}
      return model;
    }
    function buildRecords(){
      const issueCatalog=adapter.readIssueCatalog();
      const catalogFingerprint=fingerprint(issueCatalog),politicians=adapter.readPoliticians(),currentIds=new Set();
      const built=politicians.map(p=>{
        const id=String(p.id||'');currentIds.add(id);
        const sourceFingerprint=fingerprint(p),combinedFingerprint=sourceFingerprint==null||catalogFingerprint==null?null:`${sourceFingerprint}\u001f${catalogFingerprint}`;
        const cached=classificationCache.get(id);
        if(combinedFingerprint!=null&&cached?.fingerprint===combinedFingerprint)return cached.record;
        const scored=scorePolitician(p,issueCatalog);
        const classified=classifyPolitician(scored);
        const politicalStyle=classifyPoliticalStyle(p);
        const record={...p,politicalStyle,ideology:{...classified,dimensions:scored.dimensions,evidence:scored.evidence}};
        if(combinedFingerprint!=null)classificationCache.set(id,{fingerprint:combinedFingerprint,record});
        else classificationCache.delete(id);
        return record;
      });
      for(const id of classificationCache.keys())if(!currentIds.has(id))classificationCache.delete(id);
      return built;
    }
    let records=[],electorates=[];
    function refreshData(){try{records=buildRecords();electorates=adapter.readElectorates();ns.records=records;ns.electorates=electorates;}catch(error){diagnostics.record('data-refresh-failed',{message:error&&error.message?error.message:String(error),stack:error&&error.stack?error.stack:null});throw error;}}
    const style=document.createElement('link');
    style.rel='stylesheet';style.href='projectMaverick/styles/projectMaverick.css';style.id='pm-styles';
    if(!document.getElementById(style.id))document.head.appendChild(style);
    const shell=createShell(document,root,(code,detail)=>diagnostics.record(code,detail));shell.mount();
    const watchlists=createWatchlists(storage),recentViews=createRecentViews(storage),compareSelection=[];
    function compareIds(){return compareSelection.slice();}
    function toggleWatchlist(id){watchlists.toggle(id);return watchlists.has(id);}
    function toggleCompare(record){const id=String(record?.id??record);const index=compareSelection.indexOf(id);if(index>=0)compareSelection.splice(index,1);else{if(compareSelection.length>=2)compareSelection.shift();compareSelection.push(id);}return compareIds();}
    function isSafeMode(){return storage.load().preferences.safeMode!==false;}
    function setSafeMode(enabled){storage.update(current=>{current.preferences.safeMode=Boolean(enabled);return current;});return isSafeMode();}
    function politicianProfile(record){return{dimensions:record.ideology?.dimensions||{},observedDimensions:[...new Set((record.ideology?.evidence||[]).map(item=>item.dimension).filter(Boolean))],party:record.party,politicalStyle:record.politicalStyle};}
    function sameContext(a,b){if(!a||!b)return false;try{return JSON.stringify(a)===JSON.stringify(b);}catch(_){return false;}}
    function openPolitician(record){
      recentViews.record(record.id);
      const district=adapter.readDistrictContext(record);
      const model=district?cohortModel(district):null;
      const electorateAnalysis=model&&model.confidence>.2?analyzeCandidate(politicianProfile(record),record.politicalStyle,model):null;
      shell.open(target=>renderPoliticianPanel(document,target,record,{back:openDashboard,toggleWatchlist,isWatched:id=>watchlists.has(id),toggleCompare,isCompareSelected:id=>compareSelection.includes(String(id)),electorateAnalysis,electorateCohorts:model?.cohorts,electorateLabel:district?.label||district?.name||'Native constituency'}));
    }
    function openIdeologyExplorer(){refreshData();shell.open(target=>renderIdeologyExplorer(document,target,records,{}, {back:openDashboard,openPolitician,toggleWatchlist,electorates,inferCohorts:cohortModel,analyzeCandidate,renderElectoratePanel}));}
    function openElectorates(){refreshData();shell.open(target=>renderElectorateBrowser(document,target,electorates,{back:openDashboard,records,inferCohorts:cohortModel,analyzeCandidate,compareCandidates,renderElectoratePanel}));}
    function openCompare(){
      refreshData();
      const chosen=compareSelection.map(id=>records.find(r=>String(r.id)===id)).filter(Boolean);
      shell.open(target=>{
        if(chosen.length!==2){
          const p=document.createElement('p');p.className='pm-muted';p.textContent='Select two politicians from Political Intelligence to compare them.';target.appendChild(p);
          const b=document.createElement('button');b.className='pm-button';b.type='button';b.textContent='Back to Political Intelligence';b.addEventListener('click',openDashboard);target.appendChild(b);return;
        }
        const districtA=adapter.readDistrictContext(chosen[0]),districtB=adapter.readDistrictContext(chosen[1]);
        const model=sameContext(districtA,districtB)?cohortModel(districtA):null;
        const coalitionComparison=model&&model.confidence>.2?compareCandidates(politicianProfile(chosen[0]),politicianProfile(chosen[1]),model):null;
        renderComparePanel(document,target,chosen[0],chosen[1],{back:openDashboard,coalitionComparison});
      });
    }
    function openDiagnostics(){
      const storageStatus={...storage.inspect(),derivedCache:`${classificationCache.size} politician profiles and ${electorateCache.size} electorate models; in memory only`};
      const safeMode=isSafeMode();
      const accessors=adapter.accessorStatus();
      const diagnosticEvents=diagnostics.list();
      shell.open(target=>renderDiagnosticsPanel(document,target,{
        back:openDashboard,version:ns.version,compatibilityStatus:ns.compatibilityStatus,
        expectedIndexSha256:compatibility.V0353_INDEX_SHA256,indexSha256,
        modules:ns.loadedModules,accessors,diagnostics:diagnosticEvents,
        storageStatus,safeMode,setSafeMode
      }));
    }
    function openChangelog(){shell.open(target=>renderChangelog(document,target,{back:openDashboard}));}
    function openDashboard(){
      refreshData();
      shell.open(target=>renderDashboard(document,target,{records,searchPoliticians,filterPoliticians,sortPoliticians,watchlists,recentViews,openPolitician,openIdeologyExplorer,openElectorates,openCompare,openDiagnostics,openChangelog,toggleWatchlist,toggleCompare,compareIds}));
    }
    if(!document.getElementById('pm-launcher')){
      const launcher=document.createElement('button');launcher.id='pm-launcher';launcher.className='pm-button';launcher.type='button';launcher.textContent='Maverick';launcher.addEventListener('click',openDashboard);document.body.appendChild(launcher);
    }
    if(!document.getElementById('pm-changelog-launcher')){
      const launcher=document.createElement('button');launcher.id='pm-changelog-launcher';launcher.className='pm-button';launcher.type='button';launcher.textContent='Changelog';launcher.addEventListener('click',openChangelog);document.body.appendChild(launcher);
    }
    Object.assign(ns,{storage,events,adapter,records,electorates,watchlists,recentViews,shell,openDashboard,openPolitician,openIdeologyExplorer,openElectorates,openCompare,openDiagnostics,openChangelog,toggleWatchlist,toggleCompare,compareIds,inferCohorts:cohortModel,analyzeCandidate,isSafeMode,setSafeMode});
    ns.__booting=false;ns.__booted=true;
    events.emit('ready',{recordCount:records.length,electorateCount:electorates.length});
  }catch(error){
    const detail={message:error&&error.message?error.message:String(error),stack:error&&error.stack?error.stack:null};
    if(diagnostics)diagnostics.record('boot-failed',detail);
    ns.loadedModules=moduleStatus;
    ns.__booting=false;ns.__booted=false;
  }
})(window);
