const { IDEOLOGY_ARCHETYPES } = require('../ideology/taxonomy');

function partisanAffinity(archetype) {
  const family=archetype.family;
  let independent=.14;
  if(family==='heterodox-independent') independent=.72;
  else if(family==='libertarian-classical-liberal') independent=.5;
  else if(family==='centrist-moderate') independent=.44;
  else if(family==='socially-liberal-fiscally-conservative') independent=.38;
  const axis=Math.max(-1,Math.min(1,((archetype.centroid.economics||0)+(archetype.centroid.social||0))/2));
  const partisan=1-independent;
  return Object.freeze({democrat:partisan*(1-axis)/2,republican:partisan*(1+axis)/2,independent});
}
function salienceWeights(archetype) {
  const out={};
  for(const key of ['economics','fiscal','welfare','social','immigration','environment','guns','healthcare','education','institutional']) out[key]=.65+Math.abs(archetype.centroid[key]||0);
  return Object.freeze(out);
}
function stylePreferences(archetype){
  const map={
    'progressive-social-democratic':['coalition-builder','policy-wonk'], liberal:['statesman','pragmatist'], 'centrist-moderate':['pragmatist','coalition-builder'],
    'libertarian-classical-liberal':['maverick','technocrat'], conservative:['party-loyalist','statesman'], 'religious-conservative':['ideologue','retail-politician'],
    'national-right-populist':['populist','firebrand'], 'economically-left-socially-conservative':['populist','maverick'],
    'socially-liberal-fiscally-conservative':['technocrat','pragmatist'], 'heterodox-independent':['maverick','pragmatist']
  };
  return Object.freeze(map[archetype.family]||['pragmatist']);
}
const COHORT_TEMPLATES=Object.freeze(IDEOLOGY_ARCHETYPES.map(archetype=>Object.freeze({id:archetype.id,name:archetype.name,profile:archetype.centroid,partisanAffinity:partisanAffinity(archetype),salienceWeights:salienceWeights(archetype),stylePreferences:stylePreferences(archetype)})));
module.exports={COHORT_TEMPLATES};
