import {describe,it,expect} from 'vitest';
import {getLunarTerrain,loadLunarTerrain,matchesReviewedTerrain,elevationAtDisplayCell} from '../apps/web/src/services/nasa/lunarTerrainService';
import {initialState,terrainCost} from '../packages/simulation-engine';
const cached=getLunarTerrain();
describe('NASA dataset integrity and delivery',()=>{
 it('uses the reviewed source product, metadata, and measured site values',()=>{
  expect(cached.sha256).toBe('c04632eba6449af49e3108ed7c25b3b1c450600abd3690df4fc815853a1af476');
  expect(cached.source).toMatch(/^https:\/\/pds-geosciences.wustl.edu\//);
  expect(cached.units).toContain('1,737,400');
  expect(cached.grid).toHaveLength(90);expect(cached.grid.every(row=>row.length===180&&row.every(Number.isFinite))).toBe(true);
  expect(cached.sites.map(s=>s.elevationM)).toEqual([-768.5,-3768,-2687.5]);
 });
 it('accepts the reviewed server snapshot',async()=>{
  const fetcher=(async()=>new Response(JSON.stringify({data:cached}),{status:200})) as typeof fetch;
  expect((await loadLunarTerrain(fetcher)).delivery).toBe('server');
 });
 it.each(['network','http','malformed','tampered'])('falls back to authentic bundled data on %s failure',async failure=>{
  const fetcher=(async()=>{
   if(failure==='network')throw new Error('Offline');
   if(failure==='http')return new Response('',{status:503});
   if(failure==='malformed')return new Response('<html>unavailable</html>');
   const changed=structuredClone(cached);changed.grid[0][0]+=1;
   return new Response(JSON.stringify({data:changed}));
  }) as typeof fetch;
  const result=await loadLunarTerrain(fetcher);expect(result.delivery).toBe('fallback');expect(result.warning).toBeTruthy();expect(result.terrain).toEqual(cached);
 });
 it('rejects changed units, coordinates, sites and absent data',()=>{
  expect(matchesReviewedTerrain(null)).toBe(false);
  expect(matchesReviewedTerrain({...cached,units:'kilometers'})).toBe(false);
  expect(matchesReviewedTerrain({...cached,coordinates:'Earth WGS84'})).toBe(false);
  const modified=structuredClone(cached);modified.sites[0].elevationM=0;expect(matchesReviewedTerrain(modified)).toBe(false);
 });
 it('uses actual relief in the explicitly simplified mission rule',()=>{
  expect(terrainCost('aurora')).toBe(2);expect(terrainCost('horizon')).toBe(1);
  expect(initialState({seed:42,difficulty:'cadet',siteId:'aurora'}).resources.equipment).toBe(98);
  expect(initialState({seed:42,difficulty:'cadet',siteId:'horizon'}).resources.equipment).toBe(99);
 });
 it('reports sample-center coordinates and rejects invalid grid cells',()=>{
  expect(elevationAtDisplayCell(0,0)).toEqual({lat:89.875,lon:.125,height:cached.grid[0][0]});
  expect(()=>elevationAtDisplayCell(-1,0)).toThrow(RangeError);expect(()=>elevationAtDisplayCell(90,0)).toThrow(RangeError);
 });
});
