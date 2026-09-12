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
function cloneValue(value) { if (value == null) return value; try { return JSON.parse(JSON.stringify(value)); } catch (_) { return value; } }
function text(v) { return v == null ? '' : String(v).trim(); }
function first(obj, names) { for (const n of names) if (obj && obj[n] != null) return obj[n]; return null; }
function slug(s) { return text(s).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''); }
function currentOffice(jobs) { if (!jobs || typeof jobs !== 'object') return ''; for (const key of ['job1','job2','job3']) if (jobs[key] && jobs[key].title) return text(jobs[key].title); return ''; }
function normalizeApproval(appr) { if (!appr || typeof appr !== 'object') return {}; const read=(key)=>appr[key]&&Number.isFinite(Number(appr[key].b))?Number(appr[key].b):null; const democrat=read('d'),republican=read('r'),independent=read('i'),values=[democrat,republican,independent].filter(Number.isFinite); return{democrat,republican,independent,overall:values.length?values.reduce((a,b)=>a+b,0)/values.length:null}; }
function normalizeCandidateArray(candidate,index){
  if(!Array.isArray(candidate)||candidate.length<CANDIDATE_INDEX.extendedAttribs+1)return null;
  const ext=candidate[CANDIDATE_INDEX.extendedAttribs]&&typeof candidate[CANDIDATE_INDEX.extendedAttribs]==='object'?candidate[CANDIDATE_INDEX.extendedAttribs]:{};
  const firstName=text(candidate[CANDIDATE_INDEX.firstName]),lastName=text(candidate[CANDIDATE_INDEX.lastName]),name=[firstName,lastName].filter(Boolean).join(' ')||`Politician ${index+1}`,state=text(candidate[CANDIDATE_INDEX.stateId]),office=currentOffice(candidate[CANDIDATE_INDEX.jobs]),rawId=candidate[CANDIDATE_INDEX.candidateId],id=rawId!=null?String(rawId):`${slug(name)}|${slug(state)}|${slug(office)}`;
  const issues={};for(const[key,position]of Object.entries(POLICY_INDEX))if(candidate[position]!=null)issues[key]=cloneValue(candidate[position]);for(const[key,value]of Object.entries(ext))if(!NON_POLICY_EXTENDED.has(key))issues[key]=cloneValue(value);const approval=normalizeApproval(ext.appr);
  return{id,name,firstName,lastName,state,office,party:text(ext.party||candidate[CANDIDATE_INDEX.caucusParty]),traits:Array.isArray(candidate[CANDIDATE_INDEX.traits])?cloneValue(candidate[CANDIDATE_INDEX.traits]):[],fiscalScore:cloneValue(candidate[CANDIDATE_INDEX.fiscalIdeology]),socialScore:cloneValue(candidate[CANDIDATE_INDEX.socialIdeology]),popularity:approval.overall,approval,experience:cloneValue(candidate[CANDIDATE_INDEX.politicalPoints]),issues,native:cloneValue({caucusParty:candidate[CANDIDATE_INDEX.caucusParty],partyInnerCaucus:candidate[CANDIDATE_INDEX.partyInnerCaucus],jobs:candidate[CANDIDATE_INDEX.jobs],history:candidate[CANDIDATE_INDEX.jobHistory],campaignFunds:candidate[CANDIDATE_INDEX.campaignFunds],nameRecognition:candidate[CANDIDATE_INDEX.nameRecognition]})};
}
function normalizeObjectPolitician(p,index){if(!p||typeof p!=='object')return null;const firstName=text(first(p,['firstName','first','fName'])),lastName=text(first(p,['lastName','last','lName','lastNameI'])),name=text(first(p,['name','fullName']))||[firstName,lastName].filter(Boolean).join(' ')||`Politician ${index+1}`,state=text(first(p,['state','stateName','stateAbbrev','stateId'])),jobs=first(p,['jobs']),office=text(first(p,['office','officeName','position','currentOffice']))||currentOffice(jobs),rawId=first(p,['id','politicianId','polID','candidateId']),id=rawId!=null?String(rawId):`${slug(name)}|${slug(state)}|${slug(office)}`,appr=first(p,['approval','appr']),approval=appr&&(appr.d||appr.r||appr.i)?normalizeApproval(appr):cloneValue(appr)||{};return{id,name,firstName,lastName,state,office,party:text(first(p,['party','partyName','politicalParty','caucusParty'])),traits:Array.isArray(p.traits)?cloneValue(p.traits):[],fiscalScore:first(p,['fiscalScore','fiscalIdeology','econIdeology']),socialScore:first(p,['socialScore','socialIdeology']),popularity:first(p,['popularity','totalAppr','approvalRating'])??approval.overall??null,approval,experience:first(p,['experience','politicalExperience','yearsExperience','politicalPoints']),issues:cloneValue(first(p,['issues','issuePositions','positions','policyPositions']))||{},native:cloneValue({history:first(p,['history','politicalHistory','jobHistory']),partyLoyalty:first(p,['partyLoyalty']),jobs})};}
function normalizePolitician(p,index){return Array.isArray(p)?normalizeCandidateArray(p,index):normalizeObjectPolitician(p,index);}
function findArray(root,names){for(const n of names)if(Array.isArray(root&&root[n]))return root[n];return[];}
function createAdapter(root){root=root||{};function readPoliticians(){const raw=[],generic=findArray(root,['politicians','allPoliticians','activePoliticians','candidateDatabase','candidates']);raw.push(...generic);for(const name of POLITICIAN_COLLECTIONS)if(Array.isArray(root[name]))raw.push(...root[name]);for(const name of POLITICIAN_SINGLETONS)if(Array.isArray(root[name]))raw.push(root[name]);const normalized=raw.map(normalizePolitician).filter(Boolean),seen=new Set(),unique=[];for(const row of normalized){const key=row.id||`${row.name}|${row.state}|${row.office}`;if(seen.has(key))continue;seen.add(key);unique.push(row);}return unique;}function readPlayer(){const p=first(root,['player','playerPolitician','userPolitician']);return p&&typeof p==='object'?normalizePolitician(p,0):null;}function readIssueCatalog(){return cloneValue(findArray(root,['issueCatalog','issues','issueList','policies']));}function readDistrictContext(subject){const d=first(subject||{},['district','districtData','electorate']);return d&&typeof d==='object'?cloneValue(d):null;}function readElectionContext(subject){const e=first(subject||{},['election','electionData','race']);return e&&typeof e==='object'?cloneValue(e):null;}return{readPoliticians,readPlayer,readIssueCatalog,readDistrictContext,readElectionContext};}
module.exports={createAdapter,normalizePolitician,normalizeCandidateArray,CANDIDATE_LENGTH,CANDIDATE_INDEX,POLICY_INDEX};
