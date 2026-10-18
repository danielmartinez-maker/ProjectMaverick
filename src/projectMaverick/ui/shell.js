const {el,button,clear}=require('./components');

function parsedColor(color){
  const match=/^rgba?\(([^)]+)\)$/.exec(String(color||'').trim());
  if(!match)return null;
  const parts=match[1].split(',').map(value=>Number.parseFloat(value.trim()));
  if(parts.length<3||parts.some(value=>!Number.isFinite(value)))return null;
  if(parts.length>3&&parts[3]<=.05)return null;
  return parts.slice(0,3);
}
function isDarkColor(rgb){return!!rgb&&(rgb[0]*.299+rgb[1]*.587+rgb[2]*.114)<128;}
function createShell(doc,win,report){
  let lastFocus=null;
  report=typeof report==='function'?report:()=>{};
  function syncTheme(root){
    try{
      const getStyle=win&&win.getComputedStyle;
      if(typeof getStyle!=='function')return;
      const body=parsedColor(getStyle.call(win,doc.body).backgroundColor);
      const page=body||parsedColor(getStyle.call(win,doc.documentElement).backgroundColor);
      root.dataset.theme=isDarkColor(page)?'dark':'light';
    }catch(_){}
  }
  function mount(){
    let root=doc.getElementById('pm-root');
    if(root)return root;
    root=el(doc,'div','pm-shell');root.id='pm-root';root.hidden=true;
    root.setAttribute('role','dialog');root.setAttribute('aria-label','Project Maverick political intelligence');
    const head=el(doc,'div','pm-header');
    head.append(el(doc,'strong','pm-title','Project Maverick'),button(doc,'Close',close,'pm-close'));
    const body=el(doc,'div','pm-body');body.id='pm-body';root.append(head,body);doc.body.appendChild(root);
    syncTheme(root);
    return root;
  }
  function open(render,context){
    const root=mount(),body=doc.getElementById('pm-body');
    lastFocus=doc.activeElement;clear(body);
    if(typeof render==='function'){
      try{render(body,context);}
      catch(error){
        try{report('ui-render-failed',{message:error&&error.message?error.message:String(error),stack:error&&error.stack?error.stack:null});}catch(_){}
        clear(body);
        body.append(el(doc,'h2','pm-section-title','Project Maverick could not render this view.'),el(doc,'p','pm-muted','The game is still running. Open Diagnostics to inspect the captured extension error.'));
      }
    }
    syncTheme(root);root.hidden=false;root.querySelector('button')?.focus();
  }
  function close(){const root=mount();root.hidden=true;lastFocus?.focus?.();}
  function refresh(render,context){if(!mount().hidden)open(render,context);}
  doc.addEventListener?.('keydown',event=>{if(event.key==='Escape'&&!mount().hidden)close();});
  const Observer=win&&win.MutationObserver;
  if(typeof Observer==='function'&&doc.documentElement){
    const observer=new Observer(()=>{const root=doc.getElementById('pm-root');if(root)syncTheme(root);});
    const options={attributes:true,attributeFilter:['class','style']};
    observer.observe(doc.documentElement,options);
    if(doc.body)observer.observe(doc.body,options);
  }
  return{mount,open,close,refresh};
}
module.exports={createShell,parsedColor,isDarkColor};
