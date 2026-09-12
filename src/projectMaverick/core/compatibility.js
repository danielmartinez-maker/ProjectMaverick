const ns = require('./namespace');
const V0353_INDEX_SHA256 = '6f14224fe1d37240f6bcdd8cb81b1e2305dbdbb3a8bf154afb97c071271878a4';
function check(env) { const failures=[]; if(!env||env.indexSha256!==V0353_INDEX_SHA256) failures.push('Unexpected index hash; expected pristine v0.353 baseline.'); return {ok:failures.length===0,version:failures.length?null:'0.353',failures}; }
ns.compatibility={check,V0353_INDEX_SHA256}; module.exports=ns.compatibility;
