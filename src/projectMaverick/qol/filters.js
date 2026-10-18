function eq(a,b){return b==null||b===''||String(a??'').toLowerCase()===String(b).toLowerCase();}
function numeric(value){const number=Number(value);return value!=null&&value!==''&&Number.isFinite(number)?number:null;}
function filterPoliticians(records=[],filters={}){
  const minPopularity=numeric(filters.minPopularity),maxPopularity=numeric(filters.maxPopularity);
  const minApproval=numeric(filters.minApproval),maxApproval=numeric(filters.maxApproval);
  return records.filter(record=>{
    const popularity=numeric(record.popularity??record.approval?.overall);
    const approval=numeric(record.approval?.overall);
    if(!eq(record.party,filters.party)||!eq(record.office,filters.office)||!eq(record.state,filters.state))return false;
    if(!eq(record.politicalStyle?.primary?.id,filters.politicalArchetype)||!eq(record.ideology?.primary?.family,filters.ideologyFamily)||!eq(record.ideology?.primary?.id,filters.ideologySubtype))return false;
    if(!eq(record.fiscalScore,filters.fiscalIdeology)||!eq(record.socialScore,filters.socialIdeology))return false;
    if(filters.incumbency==='incumbent'&&record.incumbent!==true)return false;
    if(filters.incumbency==='non-incumbent'&&record.incumbent!==false)return false;
    if(filters.incumbency==='unknown'&&record.incumbent!=null)return false;
    if(!eq(record.electionStatus,filters.electionStatus))return false;
    if(filters.approvalAvailability==='available'&&approval==null)return false;
    if(filters.approvalAvailability==='unavailable'&&approval!=null)return false;
    if(minPopularity!=null&&(popularity==null||popularity<minPopularity))return false;
    if(maxPopularity!=null&&(popularity==null||popularity>maxPopularity))return false;
    if(minApproval!=null&&(approval==null||approval<minApproval))return false;
    if(maxApproval!=null&&(approval==null||approval>maxApproval))return false;
    return true;
  });
}
function sortPoliticians(records=[],sortBy='name'){
  const copy=records.slice();
  if(sortBy==='approval'||sortBy==='popularity'){
    const field=sortBy;
    return copy.sort((a,b)=>{
      const av=numeric(field==='approval'?a.approval?.overall:a.popularity??a.approval?.overall);
      const bv=numeric(field==='approval'?b.approval?.overall:b.popularity??b.approval?.overall);
      if(av==null)return bv==null?String(a.name||'').localeCompare(String(b.name||'')):1;
      if(bv==null)return -1;
      return bv-av||String(a.name||'').localeCompare(String(b.name||''));
    });
  }
  const getter=sortBy==='state'?record=>record.state:sortBy==='office'?record=>record.office:record=>record.name;
  return copy.sort((a,b)=>String(getter(a)||'').localeCompare(String(getter(b)||'')));
}
module.exports={filterPoliticians,sortPoliticians};
