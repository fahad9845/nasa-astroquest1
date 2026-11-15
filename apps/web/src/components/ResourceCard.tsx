import {useState} from 'react';
import {motion} from 'framer-motion';
import {Wind,Droplets,Utensils,Zap,ShieldCheck,Heart,Activity,ArrowUpRight,ArrowDownRight,Minus} from 'lucide-react';
import {resourceInfo,type Resource,type MissionState} from '../../../../packages/simulation-engine';
import {Dialog,Tooltip} from './ui';
import {TelemetryTrace} from './TelemetryTrace';

const icons={oxygen:Wind,water:Droplets,food:Utensils,power:Zap,shielding:ShieldCheck,health:Heart,equipment:Activity};

export function ResourceCard({resource,state,compact=false,trace=false}:{resource:Resource;state:MissionState;compact?:boolean;trace?:boolean}){
 const [help,setHelp]=useState(false);
 const value=state.resources[resource],delta=Math.round((value-state.previous[resource])*10)/10;
 const info=resourceInfo[resource],Icon=icons[resource];
 return <div className={`resource-card ${compact?'compact':''} ${value<25?'critical':''}`}>
  <div className="resource-top">
   <Tooltip text={info.description}><button className="resource-title" aria-label={`About ${info.label}`} aria-haspopup="dialog" onClick={()=>setHelp(true)}><Icon size={17}/>{info.label}</button></Tooltip>
   <span className={`resource-status ${value<25?'low':''}`}>{value<25?'LOW':'NOMINAL'}</span>
  </div>
  <div className="resource-value"><motion.strong key={value} initial={{opacity:.6}} animate={{opacity:1}}>{value.toFixed(value%1?1:0)}<small>%</small></motion.strong><span className={delta<0?'trend down':'trend'}>{delta<0?<ArrowDownRight size={14}/>:delta>0?<ArrowUpRight size={14}/>:<Minus size={14}/>} {Math.abs(delta).toFixed(1)}</span></div>
  {trace&&<TelemetryTrace state={state} resource={resource}/>}
  <div className="resource-track" role="meter" aria-label={info.label} aria-valuemin={0} aria-valuemax={100} aria-valuenow={value}><div style={{width:`${value}%`}}/></div>
  <span className="resource-capacity">{compact?'Readiness index':'Reserve capacity'} · max 100%</span>
  <Dialog open={help} onOpenChange={setHelp} title={info.label} description={info.description}>
   <p className="resource-help">Current value: <strong>{value}%</strong> of a maximum 100%. This is a simplified game index, not a NASA operational measurement.</p>
  </Dialog>
 </div>;
}
