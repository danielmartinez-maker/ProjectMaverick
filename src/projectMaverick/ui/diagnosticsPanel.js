const {el,labeledValue,button}=require('./components');

function detailText(value){
  if(value==null)return 'No additional detail';
  if(typeof value==='string')return value;
  try{return JSON.stringify(value);}catch(_){return String(value);}
}
function row(doc,target,label,value){target.append(labeledValue(doc,label,value));}
function renderDiagnosticsPanel(doc,target,context={}){
  target.classList.add('pm-diagnostics');
  target.append(el(doc,'h2','pm-section-title','Diagnostics'));
  const toolbar=el(doc,'div','pm-toolbar');
  if(context.back)toolbar.append(button(doc,'Back to Political Intelligence',context.back));
  target.append(toolbar);

  const compatibility=context.compatibilityStatus||{};
  const compatibilityCard=el(doc,'section','pm-card');
  compatibilityCard.append(el(doc,'h3','pm-subtitle','Compatibility'));
  row(doc,compatibilityCard,'Project Maverick version',context.version||'Unavailable');
  row(doc,compatibilityCard,'Detected game version',compatibility.version||'Unknown');
  row(doc,compatibilityCard,'Compatibility state',compatibility.ok?'Verified':'Not verified');
  row(doc,compatibilityCard,'Expected index.html SHA-256',context.expectedIndexSha256||'Unavailable');
  row(doc,compatibilityCard,'Detected index.html SHA-256',context.indexSha256||'Unavailable');
  if(Array.isArray(compatibility.failures))for(const failure of compatibility.failures)compatibilityCard.append(el(doc,'p','pm-muted',failure));
  target.append(compatibilityCard);

  const moduleCard=el(doc,'section','pm-card');
  moduleCard.append(el(doc,'h3','pm-subtitle','Loaded modules'));
  const modules=Array.isArray(context.modules)?context.modules:[];
  if(!modules.length)moduleCard.append(el(doc,'p','pm-muted','Module load status is unavailable.'));
  for(const item of modules)row(doc,moduleCard,item.name,item.status==='loaded'?'Loaded':`Failed${item.message?`: ${item.message}`:''}`);
  target.append(moduleCard);

  const accessorCard=el(doc,'section','pm-card');
  accessorCard.append(el(doc,'h3','pm-subtitle','Native accessors'));
  const accessors=Array.isArray(context.accessors)?context.accessors:[];
  if(!accessors.length)accessorCard.append(el(doc,'p','pm-muted','Native accessor status is unavailable.'));
  for(const item of accessors){
    const state=item.available==null?'On demand':item.available?'Available':'Missing';
    const sources=item.sources&&item.sources.length?` · ${item.sources.join(', ')}`:'';
    row(doc,accessorCard,item.name,`${state}${sources}${item.detail?` · ${item.detail}`:''}`);
  }
  target.append(accessorCard);

  const storage=context.storageStatus||{};
  const storageCard=el(doc,'section','pm-card');
  storageCard.append(el(doc,'h3','pm-subtitle','Extension state'));
  row(doc,storageCard,'Storage key',storage.key||'Unavailable');
  row(doc,storageCard,'Persistent storage',storage.backendAvailable?(storage.persisted?'Available; state saved':'Available; no saved state yet'):'Unavailable; session defaults only');
  row(doc,storageCard,'Schema version',storage.schemaVersion==null?'Unavailable':String(storage.schemaVersion));
  row(doc,storageCard,'Watchlisted politicians',storage.watchlistCount==null?'Unavailable':String(storage.watchlistCount));
  row(doc,storageCard,'Recent politician views',storage.recentViewCount==null?'Unavailable':String(storage.recentViewCount));
  row(doc,storageCard,'Derived classification cache',storage.derivedCache||'Unavailable');
  const safeMode=el(doc,'label','pm-safe-mode-toggle');
  const checkbox=el(doc,'input','pm-safe-mode-input');checkbox.type='checkbox';checkbox.checked=!!context.safeMode;
  const safeModeText=el(doc,'span','pm-muted',' Safe mode: disable optional gameplay modifiers when verified adapters are available.');
  checkbox.addEventListener('change',()=>{if(typeof context.setSafeMode==='function')checkbox.checked=!!context.setSafeMode(checkbox.checked);});
  safeMode.append(checkbox,safeModeText);storageCard.append(safeMode);
  storageCard.append(el(doc,'p','pm-muted','No gameplay modifier adapters are active in this build. Classification and QoL remain available in safe mode.'));
  target.append(storageCard);

  const diagnosticCard=el(doc,'section','pm-card');
  diagnosticCard.append(el(doc,'h3','pm-subtitle','Caught extension errors and diagnostic events'));
  const events=(Array.isArray(context.diagnostics)?context.diagnostics:[]).slice(-30).reverse();
  if(!events.length)diagnosticCard.append(el(doc,'p','pm-muted','No extension diagnostics recorded.'));
  for(const entry of events){
    const item=el(doc,'div','pm-diagnostic-entry');
    item.append(el(doc,'strong','pm-diagnostic-code',entry.code||'diagnostic'),el(doc,'span','pm-muted',entry.at||''),el(doc,'p','pm-muted',detailText(entry.detail)));
    diagnosticCard.append(item);
  }
  target.append(diagnosticCard);
}

module.exports={renderDiagnosticsPanel};
