const {DIMENSIONS}=require('../ideology/dimensions');

function observed(record){return new Set((record?.ideology?.evidence||[]).map(item=>item.dimension).filter(Boolean));}
function comparePoliticianRecords(a,b){
  const deltas={},observedA=observed(a),observedB=observed(b);
  for(const dimension of DIMENSIONS){
    const aValue=a?.ideology?.dimensions?.[dimension],bValue=b?.ideology?.dimensions?.[dimension];
    deltas[dimension]=observedA.has(dimension)&&observedB.has(dimension)&&Number.isFinite(aValue)&&Number.isFinite(bValue)?aValue-bValue:null;
  }
  return{a,b,dimensionDeltas:deltas};
}
module.exports={comparePoliticianRecords};
