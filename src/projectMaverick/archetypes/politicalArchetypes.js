function archetype(id,name,signatureTraits,signals,modifiers,strengths,liabilities){
  return Object.freeze({id,name,signatureTraits:Object.freeze(signatureTraits),signals:Object.freeze(signals||{}),modifiers:Object.freeze(modifiers||{}),strengths:Object.freeze(strengths||[]),liabilities:Object.freeze(liabilities||[])});
}
const POLITICAL_ARCHETYPES=Object.freeze([
  archetype('technocrat','Technocrat',['Rational','Practical','Introverted'],{experience:45},{policy:+.06,retail:-.03},['Policy depth','Practical problem solving'],['May have weaker retail appeal']),
  archetype('pragmatist','Pragmatist',['Practical','Conciliatory','Rational'],{experience:35},{coalition:+.04,ideologicalIntensity:-.03},['Builds compromise','Adapts to evidence'],['May frustrate ideological activists']),
  archetype('populist','Populist',['Charismatic','Outspoken','Ambitious'],{popularity:70},{visibility:+.06,polarization:+.03},['Connects to public concerns','Draws attention to everyday pressures'],['Can polarize political coalitions']),
  archetype('firebrand','Firebrand',['Aggressive','Outspoken','Stubborn'],{popularity:50},{visibility:+.08,polarization:+.06},['Forceful advocacy','High public visibility'],['Higher polarization risk']),
  archetype('coalition-builder','Coalition Builder',['Conciliatory','Charismatic','Articulate'],{experience:40},{coalition:+.07,endorsement:+.04},['Relationship building','Cross-group support'],['Consensus work can slow decisions']),
  archetype('party-loyalist','Party Loyalist',['Ambitious','Practical','Articulate'],{partyLoyalty:.85},{party:+.07,independence:-.05},['Reliable party support','Organizational discipline'],['Less independence from party leadership']),
  archetype('maverick','Maverick',['Outspoken','Practical','Stubborn'],{partyLoyalty:.15},{independence:+.08,party:-.05},['Independent positioning','Distinctive public voice'],['Weaker establishment support']),
  archetype('policy-wonk','Policy Wonk',['Rational','Articulate','Introverted'],{experience:30},{policy:+.08,retail:-.02},['Analytical policy detail','Careful issue reasoning'],['May have weaker retail appeal']),
  archetype('retail-politician','Retail Politician',['Charismatic','Extroverted','Popular'],{popularity:75},{retail:+.08,visibility:+.03},['Personal voter connection','Strong public presence'],['Public appeal may outpace policy detail']),
  archetype('operator','Operator',['Calculating','Ambitious','Practical'],{experience:50},{organization:+.08,coalition:+.02},['Organization','Institutional navigation'],['May receive less public visibility']),
  archetype('ideologue','Ideologue',['Stubborn','Articulate','Ambitious'],{partyLoyalty:.65},{ideologicalIntensity:+.08,coalition:-.03},['Consistent principles','Clear policy identity'],['Reduced coalition flexibility']),
  archetype('statesman','Statesman',['Conciliatory','Rational','Popular'],{experience:65},{coalition:+.06,governance:+.07},['Governance experience','Consensus building'],['May move cautiously'])
]);
module.exports={POLITICAL_ARCHETYPES};
