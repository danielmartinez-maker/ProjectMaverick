const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');

test('dashboard exposes all approved political intelligence surfaces',()=>{
  const source=fs.readFileSync('src/projectMaverick/ui/dashboard.js','utf8');
  for(const label of ['Politicians','Ideology Explorer','Electorates','Watchlist','Recent','Compare']) assert.match(source,new RegExp(label));
  for(const hook of ['openIdeologyExplorer','openElectorates','openCompare','toggleWatchlist']) assert.match(source,new RegExp(hook));
});

test('loader wires explorer electorate comparison and watchlist callbacks into dashboard context',()=>{
  const source=fs.readFileSync('src/projectMaverick/loader.js','utf8');
  for(const hook of ['renderIdeologyExplorer','renderElectoratePanel','renderComparePanel','openIdeologyExplorer','openElectorates','openCompare','toggleWatchlist']) assert.match(source,new RegExp(hook));
  assert.match(source,/readElectorates/);
});
