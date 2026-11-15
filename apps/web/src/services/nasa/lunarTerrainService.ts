import terrain from '../../data/nasa/processed/terrain.json';
import {guestDemo} from '../api';
export type TerrainDelivery={terrain:typeof terrain;delivery:'server'|'bundled'|'fallback';warning?:string};
/** Pin this release to its reviewed product: a server cannot silently change mission geography. */
export function matchesReviewedTerrain(value:unknown):boolean {
 if(!value||typeof value!=='object')return false;
 const candidate=value as Record<string,unknown>;
 return Object.entries(terrain).every(([key,expected])=>JSON.stringify(candidate[key])===JSON.stringify(expected));
}
export async function loadLunarTerrain(fetcher:typeof fetch=fetch):Promise<TerrainDelivery>{
 if(guestDemo)return {terrain,delivery:'bundled'};
 try{
  const base=(import.meta.env.VITE_API_URL??'').replace(/\/$/,'');
  const response=await fetcher(`${base}/api/nasa/lunar-terrain`,{signal:AbortSignal.timeout(4000)});
  if(!response.ok)throw new Error('Terrain service unavailable');
  const payload=await response.json();
  if(!matchesReviewedTerrain(payload.data))throw new Error('Server terrain did not match the reviewed NASA product');
  return {terrain:payload.data,delivery:'server'};
 }catch(error){
  return {terrain,delivery:'fallback',warning:error instanceof Error?error.message:'Terrain service unavailable'};
 }
}
/** The shipped cache is the default: no runtime download, NASA key, or CORS dependency. */
export function getLunarTerrain(){return terrain;}
export function elevationAtDisplayCell(row:number,column:number){
 if(!Number.isInteger(row)||!Number.isInteger(column)||row<0||row>=90||column<0||column>=180)throw new RangeError('Outside the cached map');
 return {lat:terrain.gridFirstLat-row*terrain.gridStepDeg,lon:terrain.gridFirstLon+column*terrain.gridStepDeg,height:terrain.grid[row][column]};
}
