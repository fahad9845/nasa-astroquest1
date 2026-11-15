import {useState} from 'react';
import {illuminationReference} from '../services/nasa/illuminationService';
import {Button} from './ui';

export function NasaImage(){
 const [status,setStatus]=useState<'loading'|'ready'|'error'>('loading');
 const [attempt,setAttempt]=useState(0);
 return <div className="nasa-image">
  {status==='loading'&&<p role="status">Loading NASA illumination visualization…</p>}
  {status==='error'?<div className="inline-error" role="status">
   <p>NASA visualization unavailable. The illumination lesson and cached elevation data remain available.</p>
   <a className="text-link" href={illuminationReference.source} target="_blank" rel="noreferrer">View NASA’s original visualization</a>
   <Button variant="secondary" onClick={()=>{setStatus('loading');setAttempt(n=>n+1);}}>Retry image</Button>
  </div>:<img key={attempt} src={illuminationReference.image} alt="NASA scientific visualization of illumination near the Moon’s south pole in 2025" loading="lazy" onLoad={()=>setStatus('ready')} onError={()=>setStatus('error')}/>}
 </div>;
}
