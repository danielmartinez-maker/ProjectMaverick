/*
 * The Political Process represents candidate characters as 183-element arrays.
 * Index metadata is compatible with the public Executive mod-loader documentation
 * (Xoraurea/tpp-executive, MIT) and is guarded by Project Maverick's v0.353 hash gate.
 */
const CANDIDATE_LENGTH = 183;
const CANDIDATE_INDEX = Object.freeze({
  caucusParty: 0, firstName: 4, lastName: 5, fiscalIdeology: 6, socialIdeology: 7,
  partyInnerCaucus: 96, candidateId: 111, traits: 122, stateId: 127, jobs: 129,
  politicalPoints: 134, campaignFunds: 136, nameRecognition: 146, jobHistory: 169,
  extendedAttribs: 178
});
const POLICY_INDEX = Object.freeze({
  minWage:8, lowMain:9, midMain:10, upperMain:11, gunCheck:12, gayMarriage:13,
  illegalAbortion:14, incGap:15, deadlyForce:16, proChoice:17, cutStamps:18,
  ecoGrowth:19, envGrowth:20, globalWHuman:21, limitPow:22, commColl:23,
  preSchool:24, teachPay:25, moreSolar:26, moreWind:27, moreGas:28, moreOil:29,
  moreNuclear:30, moreCoal:31, climatePol:32, solWind:33, altFuel:34, conEm:35,
  oilLand:36, autoStand:37, labelGMO:38, pregClinic:39, gunControl:40,
  banHighCap:41, assaultWeaponBan:42, marBenefit:43, recUse:44, reduceEm:45,
  govAid:46, tightBorder:47, citPath:48, expandVisas:49, mainMil:50,
  uniHealth:165, expandMedicaid:166, flatTax:167, socSecValue:168
});
const NON_POLICY_EXTENDED = new Set(['appr','nE','party','rel','hairAge']);
const POLITICIAN_COLLECTIONS = Object.freeze([
  'allGovernors','usHouse','usSenate1Array','usSenate2Array','usSenate3Array',
  'stateHouse','stateSenate','cityCouncil','schoolBoard'
]);
const POLITICIAN_SINGLETONS = Object.freeze(['usPresident','vicePresident','governor','mayor']);

function cloneValue(value) {
  if (value == null) return value;
  try { return JSON.parse(JSON.stringify(value)); } catch (_) { return value; }
}
function text(v) { return v == null ? '' : String(v).trim(); }
function first(obj, names) { for (const n of names) if (obj && obj[n] != null) return obj[n]; return null; }
function slug(s) { return text(s).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''); }
function currentOffice(jobs) {
  if (!jobs || typeof jobs !== 'object') return '';
  for (const key of ['job1','job2','job3']) if (jobs[key] && jobs[key].title) return text(jobs[key].title);
  return '';
}
function normalizeApproval(appr) {
  if (!appr || typeof appr !== 'object') return {};
  const read = (key) => appr[key] && Number.isFinite(Number(appr[key].b)) ? Number(appr[key].b) : null;
  const democrat=read('d'), republican=read('r'), independent=read('i');
  const values=[democrat,republican,independent].filter(Number.isFinite);
  return {
    democrat, republican, independent,
    overall: values.length ? values.reduce((a,b)=>a+b,0)/values.length : null
  };
}
function normalizeCandidateArray(candidate, index) {
  if (!Array.isArray(candidate) || candidate.length < CANDIDATE_INDEX.extendedAttribs + 1) return null;
  const ext = candidate[CANDIDATE_INDEX.extendedAttribs] && typeof candidate[CANDIDATE_INDEX.extendedAttribs] === 'object'
    ? candidate[CANDIDATE_INDEX.extendedAttribs] : {};
  const firstName=text(candidate[CANDIDATE_INDEX.firstName]);
  const lastName=text(candidate[CANDIDATE_INDEX.lastName]);
  const name=[firstName,lastName].filter(Boolean).join(' ') || `Politician ${index + 1}`;
  const state=text(candidate[CANDIDATE_INDEX.stateId]);
  const office=currentOffice(candidate[CANDIDATE_INDEX.jobs]);
  const rawId=candidate[CANDIDATE_INDEX.candidateId];
  const id=rawId != null ? String(rawId) : `${slug(name)}|${slug(state)}|${slug(office)}`;
  const issues={};
  for (const [key,position] of Object.entries(POLICY_INDEX)) if (candidate[position] != null) issues[key]=cloneValue(candidate[position]);
  for (const [key,value] of Object.entries(ext)) if (!NON_POLICY_EXTENDED.has(key)) issues[key]=cloneValue(value);
  const approval=normalizeApproval(ext.appr);
  return {
    id, name, firstName, lastName, state, office,
    party:text(ext.party || candidate[CANDIDATE_INDEX.caucusParty]),
    traits:Array.isArray(candidate[CANDIDATE_INDEX.traits]) ? cloneValue(candidate[CANDIDATE_INDEX.traits]) : [],
    fiscalScore:cloneValue(candidate[CANDIDATE_INDEX.fiscalIdeology]),
    socialScore:cloneValue(candidate[CANDIDATE_INDEX.socialIdeology]),
    popularity:approval.overall,
    approval,
    experience:cloneValue(candidate[CANDIDATE_INDEX.politicalPoints]),
    issues,
    native:cloneValue({
      caucusParty:candidate[CANDIDATE_INDEX.caucusParty],
      partyInnerCaucus:candidate[CANDIDATE_INDEX.partyInnerCaucus],
      jobs:candidate[CANDIDATE_INDEX.jobs],
      history:candidate[CANDIDATE_INDEX.jobHistory],
      campaignFunds:candidate[CANDIDATE_INDEX.campaignFunds],
      nameRecognition:candidate[CANDIDATE_INDEX.nameRecognition]
    })
  };
}
function normalizeObjectPolitician(p, index) {
  if (!p || typeof p !== 'object') return null;
  const firstName = text(first(p, ['firstName','first','fName']));
  const lastName = text(first(p, ['lastName','last','lName','lastNameI']));
  const name = text(first(p, ['name','fullName'])) || [firstName,lastName].filter(Boolean).join(' ') || `Politician ${index + 1}`;
  const state = text(first(p, ['state','stateName','stateAbbrev','stateId']));
  const jobs=first(p,['jobs']);
  const office = text(first(p, ['office','officeName','position','currentOffice'])) || currentOffice(jobs);
  const rawId = first(p, ['id','politicianId','polID','candidateId']);
  const id = rawId != null ? String(rawId) : `${slug(name)}|${slug(state)}|${slug(office)}`;
  const appr=first(p,['approval','appr']);
  const approval=appr && (appr.d || appr.r || appr.i) ? normalizeApproval(appr) : cloneValue(appr) || {};
  return {
    id, name, firstName, lastName, state, office,
    party: text(first(p, ['party','partyName','politicalParty','caucusParty'])),
    traits: Array.isArray(p.traits) ? cloneValue(p.traits) : [],
    fiscalScore: first(p, ['fiscalScore','fiscalIdeology','econIdeology']),
    socialScore: first(p, ['socialScore','socialIdeology']),
    popularity: first(p, ['popularity','totalAppr','approvalRating']) ?? approval.overall ?? null,
    approval,
    experience: first(p, ['experience','politicalExperience','yearsExperience','politicalPoints']),
    issues: cloneValue(first(p, ['issues','issuePositions','positions','policyPositions'])) || {},
    native: cloneValue({ history: first(p, ['history','politicalHistory','jobHistory']), partyLoyalty: first(p, ['partyLoyalty']), jobs })
  };
}
function normalizePolitician(p,index){ return Array.isArray(p) ? normalizeCandidateArray(p,index) : normalizeObjectPolitician(p,index); }
function findArray(root, names) { for (const n of names) if (Array.isArray(root && root[n])) return root[n]; return []; }
const STATE_ABBRS=Object.freeze(['al','ak','az','ar','ca','co','ct','de','fl','ga','hi','id','il','in','ia','ks','ky','la','me','md','ma','mi','mn','ms','mo','mt','ne','nv','nh','nj','nm','ny','nc','nd','oh','ok','or','pa','ri','sc','sd','tn','tx','ut','vt','va','wa','wv','wi','wy']);
const PARTY_PREFIX=Object.freeze({democrat:'dem',republican:'rep',independent:'ind'});
const SUPPORT_AXES=Object.freeze({
  welfare:[['MinWage',-1],['GovAid',-1],['IncGap',-1],['CutStamps',1],['SocSecValue',-1]],
  guns:[['GunControl',-1],['GunCheck',-1],['BanHighCap',-1],['BanAssault',-1],['DeadlyForce',1]],
  social:[['GayMarriage',-1],['ProChoice',-1],['IllegalAbortion',1],['RecUse',-1],['MarBenefit',-1]],
  immigration:[['TightBorder',1],['CitPath',-1],['ExpandVisas',-1]],
  environment:[['ClimatePol',-1],['ReduceEm',-1],['LimitPow',-1],['OilLand',1],['ConEm',-1]],
  healthcare:[['UniHealth',-1],['ExpandMedicaid',-1]],
  education:[['CommColl',-1],['PreSchool',-1],['TeachPay',-1]],
  fiscal:[['FlatTax',1],['CutStamps',1]],
  economics:[['MinWage',-1],['GovAid',-1],['IncGap',-1],['FlatTax',1]]
});
const PRIORITY_AXES=Object.freeze({
  economics:['EcoPri','JobPri'], fiscal:['TaxPri','BudgPri'], welfare:['PovPri','WorPri'],
  social:['SocPri','AbortPri'], immigration:['ImmPri'], environment:['EnvPri','WarmPri','EnePri'],
  guns:['GunPri'], healthcare:['HealthPri'], education:['EduPri'], institutional:['GovPri']
});
function normalizeShare(v){v=Number(v);return Number.isFinite(v)&&v>0?v:0;}
function normalizeSupport(v){v=Number(v);if(!Number.isFinite(v))return null;if(v>=0&&v<=1)return v*2-1;if(v>=0&&v<=100)return (v-50)/50;if(v>=-1&&v<=1)return v;return null;}
function normalizePriority(v){v=Number(v);if(!Number.isFinite(v)||v<0)return null;if(v<=1)return v;if(v<=10)return v/10;if(v<=100)return v/100;return null;}
function electorateParties(stats){const d=normalizeShare(stats.demPop),r=normalizeShare(stats.repPop),i=normalizeShare(stats.indPop),sum=d+r+i;if(!sum)return null;return{democrat:d/sum,republican:r/sum,independent:i/sum};}
function weightedPartyMetric(stats,partyDistribution,suffix,normalizer){let total=0,weight=0;for(const [party,prefix] of Object.entries(PARTY_PREFIX)){const n=normalizer(stats[prefix+suffix]);if(n==null)continue;const w=partyDistribution[party]||0;total+=n*w;weight+=w;}return weight?total/weight:null;}
function axisSupport(stats,partyDistribution,specs){let total=0,count=0;for(const [suffix,direction] of specs){const n=weightedPartyMetric(stats,partyDistribution,suffix,normalizeSupport);if(n==null)continue;total+=n*direction;count++;}return count?Math.max(-1,Math.min(1,total/count)):null;}
function axisPriority(stats,partyDistribution,suffixes){let total=0,count=0;for(const suffix of suffixes){const n=weightedPartyMetric(stats,partyDistribution,suffix,normalizePriority);if(n==null)continue;total+=n;count++;}return count?total/count:null;}
function normalizeElectorate(stats,id,label,scope){if(!stats||typeof stats!=='object'||Array.isArray(stats))return null;const partyDistribution=electorateParties(stats);if(!partyDistribution)return null;const issueSupport={},issueSalience={};for(const [axis,specs] of Object.entries(SUPPORT_AXES)){const v=axisSupport(stats,partyDistribution,specs);if(v!=null)issueSupport[axis]=v;}for(const [axis,suffixes] of Object.entries(PRIORITY_AXES)){const v=axisPriority(stats,partyDistribution,suffixes);if(v!=null)issueSalience[axis]=v;}return{id,label,scope,partyDistribution,issueSupport,issueSalience,nativeEvidence:{partyFields:['demPop','repPop','indPop'],supportAxes:Object.keys(issueSupport),priorityAxes:Object.keys(issueSalience)}};}
function createAdapter(root) {
  root = root || {};
  function readPoliticians() {
    const raw=[];
    const generic=findArray(root,['politicians','allPoliticians','activePoliticians','candidateDatabase','candidates']);
    raw.push(...generic);
    for (const name of POLITICIAN_COLLECTIONS) if (Array.isArray(root[name])) raw.push(...root[name]);
    for (const name of POLITICIAN_SINGLETONS) if (Array.isArray(root[name])) raw.push(root[name]);
    const normalized=raw.map(normalizePolitician).filter(Boolean), seen=new Set(), unique=[];
    for (const row of normalized) { const key=row.id || `${row.name}|${row.state}|${row.office}`; if (seen.has(key)) continue; seen.add(key); unique.push(row); }
    return unique;
  }
  function readPlayer() {
    const p = first(root, ['player','playerPolitician','userPolitician']);
    return p && typeof p === 'object' ? normalizePolitician(p, 0) : null;
  }
  function readIssueCatalog() { return cloneValue(findArray(root, ['issueCatalog','issues','issueList','policies'])); }
  function readElectorates() {
    const rows=[],ids=new Set();
    function add(stats,id,label,scope){if(ids.has(id))return;const row=normalizeElectorate(stats,id,label,scope);if(row){ids.add(id);rows.push(row);}}
    add(root.nationStats,'nation','National electorate','nation');
    for(const abbr of STATE_ABBRS) add(root[abbr+'Stats'],'state-'+abbr,abbr.toUpperCase()+' electorate','state');
    add(root.stateStats,'current-state','Current state electorate','state');
    add(root.cityStats,'city','Current city electorate','city');
    const collections=[['usHouseElectStats','us-house','U.S. House District','us-house'],['stateSenateElectStats','state-senate','State Senate District','state-senate'],['stateHouseElectStats','state-house','State House District','state-house']];
    for(const [key,prefix,label,scope] of collections){const value=root[key];if(Array.isArray(value))value.forEach((stats,index)=>add(stats,`${prefix}-${index+1}`,`${label} ${index+1}`,scope));else add(value,prefix,label,scope);}
    const locals=[['cityCouncilStats','city-council','City Council electorate','city-council'],['schoolBoardStats','school-board','School Board electorate','school-board']];
    for(const [key,id,label,scope] of locals){const value=root[key];if(Array.isArray(value))value.forEach((stats,index)=>add(stats,`${id}-${index+1}`,`${label} ${index+1}`,scope));else add(value,id,label,scope);}
    return rows;
  }
  function readDistrictContext(subject) { const d = first(subject || {}, ['district','districtData','electorate']); return d && typeof d === 'object' ? cloneValue(d) : null; }
  function readElectionContext(subject) { const e = first(subject || {}, ['election','electionData','race']); return e && typeof e === 'object' ? cloneValue(e) : null; }
  return { readPoliticians, readPlayer, readIssueCatalog, readElectorates, readDistrictContext, readElectionContext };
}
module.exports = { createAdapter, normalizePolitician, normalizeCandidateArray, normalizeElectorate, CANDIDATE_LENGTH, CANDIDATE_INDEX, POLICY_INDEX };
