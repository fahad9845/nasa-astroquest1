import {useEffect,useRef,useState} from 'react';
import {useQuery} from '@tanstack/react-query';
import {getLunarTerrain,loadLunarTerrain} from '../services/nasa/lunarTerrainService';
import {sites,siteFor,terrainCost} from '../../../../packages/simulation-engine';
import {Button} from './ui';

export function TerrainMap({selected='aurora',onSelect}:{selected?:string;onSelect?:(id:string)=>void}){
 const query=useQuery({queryKey:['nasa','reviewed-terrain'],queryFn:()=>loadLunarTerrain(),staleTime:Infinity,retry:false});
 const terrain=query.data?.terrain??getLunarTerrain();
 const site=siteFor(selected);
 const canvas=useRef<HTMLCanvasElement>(null);
 const [hover,setHover]=useState<{lat:number;lon:number;height:number}|null>(null);
 useEffect(()=>{
  const ctx=canvas.current?.getContext('2d');if(!ctx)return;
  terrain.grid.forEach((row,y)=>row.forEach((height,x)=>{
   const v=Math.max(0,Math.min(1,(height+9000)/19500));
   ctx.fillStyle=`rgb(${Math.round(23+v*112)},${Math.round(46+v*128)},${Math.round(67+v*121)})`;ctx.fillRect(x*4,y*4,4,4);
  }));
 },[terrain]);
 const status=query.isFetching?'Checking server copy; showing bundled NASA data.':query.data?.delivery==='fallback'?'Server copy unavailable or invalid; using verified bundled NASA data.':query.data?.delivery==='server'?'Server copy matches the reviewed NASA dataset.':'Using verified bundled NASA data.';
 return <div className="terrain-map">
  <div className="nasa-delivery" role="status"><span>{status}</span>{query.data?.delivery==='fallback'&&<Button variant="ghost" disabled={query.isFetching} onClick={()=>void query.refetch()}>Retry data connection</Button>}</div>
  <div className="map-canvas">
   <canvas ref={canvas} width={720} height={360} aria-label="NASA LOLA global elevation map. Choose a site using the buttons below." onMouseMove={e=>{
    const r=e.currentTarget.getBoundingClientRect();
    const x=Math.max(0,Math.min(179,Math.floor((e.clientX-r.left)/r.width*180))),y=Math.max(0,Math.min(89,Math.floor((e.clientY-r.top)/r.height*90)));
    setHover({lat:terrain.gridFirstLat-y*2,lon:terrain.gridFirstLon+x*2,height:terrain.grid[y][x]});
   }} onMouseLeave={()=>setHover(null)}/><div className="map-grid"/>
   {sites.map(s=><button key={s.id} aria-label={`Select ${s.name}`} onClick={()=>onSelect?.(s.id)} disabled={!onSelect} className={`map-marker ${s.id===selected?'active':''}`} style={{left:`${s.lon/360*100}%`,top:`${(90-s.lat)/180*100}%`}}>{s.id===selected&&<span>{s.name}</span>}</button>)}
  </div>
  <div className="map-legend"><span>−9 km <i/> +10.5 km</span><span>{hover?`${Math.abs(hover.lat).toFixed(3)}° ${hover.lat<0?'S':'N'} · ${hover.lon.toFixed(3)}° E · ${hover.height.toFixed(0)} m`:'LOLA · elevation relative to reference sphere'}</span></div>
  {onSelect&&<div className="site-tabs" role="group" aria-label="Outpost selection">{sites.map(s=><button className={s.id===selected?'active':''} aria-pressed={s.id===selected} key={s.id} onClick={()=>onSelect(s.id)}>{s.name}</button>)}</div>}
  <details className="nasa-provenance"><summary>Dataset provenance & mission effect</summary>
   <p><strong>NASA-derived terrain:</strong> LRO/LOLA {terrain.dataset} {terrain.version}. Native PDS3 raster: 1,440 × 720 signed 16-bit little-endian samples; elevation = stored value × 0.5 metres. Reference sphere radius: 1,737,400 m. Native spacing: 0.25°.</p>
   <p><strong>Coordinates:</strong> {terrain.coordinates}. Display samples every eighth pixel. Credit: NASA LRO/LOLA Science Team and NASA PDS Geosciences Node, Washington University in St. Louis.</p>
   <p><strong>Selected region:</strong> {site.elevationM.toLocaleString()} m elevation; {site.reliefM.toLocaleString()} m relief across 3 × 3 native cells. Relief is not slope, and this coarse product cannot certify a landing site.</p>
   <p><strong>Simplified mission rule:</strong> relief ÷ 1,000, rounded and bounded to 1–8, produces {terrainCost(selected)} setup-wear points. {site.name} starts at {100-terrainCost(selected)}% equipment integrity; a terrain survey costs {4+terrainCost(selected)} power points. These costs, outpost names, resource percentages, and sunlight schedules are game assumptions, not NASA observations.</p>
   <p><a className="text-link" href={terrain.label} target="_blank" rel="noreferrer">Original NASA PDS label</a> · <a className="text-link" href={terrain.source} target="_blank" rel="noreferrer">Download source raster</a></p>
   <p className="dataset-digest">Source raster SHA-256: {terrain.sha256}</p>
  </details>
 </div>;
}
