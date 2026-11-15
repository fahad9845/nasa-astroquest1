import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
const root = fileURLToPath(new URL('../', import.meta.url));
const base = 'https://pds-geosciences.wustl.edu/lro/lro-l-lola-3-rdr-v1/lrolol_1xxx/data/lola_gdr/cylindrical/img/';
const out = root + 'apps/web/src/data/nasa/';
await mkdir(out + 'metadata', {recursive:true});
await mkdir(out + 'processed', {recursive:true});
await mkdir(root + '.cache', {recursive:true});
async function download(url, path) {
  try { return await readFile(path); } catch { /* Fetch once; cached for reproducibility. */ }
  const response = await fetch(url, {signal:AbortSignal.timeout(60000)});
  if (!response.ok) throw new Error(`NASA download failed: ${response.status} ${url}`);
  const data = Buffer.from(await response.arrayBuffer());
  await writeFile(path, data); return data;
}
const label = await download(base+'ldem_4.lbl', out+'metadata/ldem_4.lbl');
const text = label.toString();
for (const pattern of [/LINES\s*=\s*720/, /LINE_SAMPLES\s*=\s*1440/, /SAMPLE_TYPE\s*=\s*LSB_INTEGER/, /SCALING_FACTOR\s*=\s*0\.5/, /POSITIVE_LONGITUDE_DIRECTION\s*=\s*"EAST"/]) {
  if (!pattern.test(text)) throw new Error('Unexpected PDS label: re-review the importer');
}
const data = await download(base+'ldem_4.img', root+'.cache/ldem_4.img');
if (data.length !== 720*1440*2) throw new Error('Unexpected raster size');
const elevation = (row,col) => data.readInt16LE((row*1440+((col+1440)%1440))*2)*0.5;
const sites = [
  {id:'aurora',name:'Aurora Ridge',region:'South polar sector A',lat:-85.125,lon:0.125,sunlight:[.95,.8,.85,.7,.9]},
  {id:'horizon',name:'Horizon Station',region:'South polar sector B',lat:-85.125,lon:90.125,sunlight:[.8,.65,.9,.6,.8]},
  {id:'farpoint',name:'Farpoint Base',region:'Southern highlands sector',lat:-82.125,lon:180.125,sunlight:[.7,.6,.75,.55,.7]}
].map(site => {
  const row=Math.floor((90-site.lat)*4), col=Math.floor(site.lon*4);
  const neighborhood=[];
  for(let y=row-1;y<=row+1;y++) for(let x=col-1;x<=col+1;x++) neighborhood.push(elevation(y,x));
  return {...site,elevationM:elevation(row,col),reliefM:Math.max(...neighborhood)-Math.min(...neighborhood),sampleLat:90-(row+.5)/4,sampleLon:(col+.5)/4};
});
const grid=[];
for(let r=0;r<720;r+=8) {const row=[];for(let c=0;c<1440;c+=8) row.push(elevation(r,c));grid.push(row);}
const result={dataset:'LDEM_4',version:'V3.0',instrument:'LRO / LOLA',source:base+'ldem_4.img',label:base+'ldem_4.lbl',sha256:createHash('sha256').update(data).digest('hex'),units:'meters above a 1,737,400 m reference sphere',coordinates:'Mean Earth/polar axis of DE421; east-positive longitude',sourceResolutionDeg:.25,gridStepDeg:2,gridFirstLat:89.875,gridFirstLon:.125,grid,sites};
await writeFile(out+'processed/terrain.json',JSON.stringify(result));
const assets=root+'apps/web/public/nasa/'; await mkdir(assets,{recursive:true});
await download('https://svs.gsfc.nasa.gov/vis/a000000/a005000/a005027/moon.2025_print.jpg',assets+'south-pole-illumination.jpg');
console.log(JSON.stringify({dataset:result.dataset,sha256:result.sha256,sites,grid:[90,180]},null,2));
