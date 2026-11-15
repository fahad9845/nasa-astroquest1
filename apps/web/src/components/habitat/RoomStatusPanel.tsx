import {Link} from 'react-router-dom';
import {ArrowUpRight,ArrowRight,BookOpen} from 'lucide-react';
import {habitatFor,habitatConfig,simulationConfig,siteFor,terrainCost,pendingEvent,feedback,isTerminal,type MissionState,type Command,type CrewActivity,type Resource} from '../../../../../packages/simulation-engine';
import {sourceFor} from '../../../../../packages/shared-config/science';
import {roomFor,type RoomId} from './rooms';
import {ResourceCard} from '../ResourceCard';
import {Button} from '../ui';

export function RoomStatusPanel({roomId,state,busy,dispatch}:{roomId:RoomId;state:MissionState;busy:boolean;dispatch:(command:Command)=>Promise<void>}){
 const room=roomFor(roomId),h=habitatFor(state),Icon=room.icon;
 const blocked=busy||state.status!=='active'||!!pendingEvent(state)||!!feedback(state)||state.activityDays.includes(state.day);
 const source=sourceFor(roomId==='support'?'eclss':roomId==='power'?'illumination':roomId==='crew'||roomId==='airlock'?'environment':roomId==='garage'||roomId==='lab'?'lola':'moon');
 const metrics:Resource[]=roomId==='crew'?['health','shielding']:roomId==='support'?['oxygen','water','equipment']:roomId==='greenhouse'?['food','water']:roomId==='power'?['power','equipment']:roomId==='airlock'?['shielding','oxygen']:['equipment'];
 function action(activity:CrewActivity,label:string,cost:string,unavailable=false){return <Button key={activity} variant="secondary" disabled={blocked||unavailable} onClick={()=>void dispatch({type:'activity',activity})}>{label}<small>{cost}</small></Button>;}
 const maintenance=()=>action('maintenance','Maintain equipment','−6 power · up to +10 integrity',state.resources.power<=6);
 const survey=()=>action('survey','Terrain survey',`−${4+terrainCost(state.options.siteId)} power · −1 integrity`,state.resources.power<=4+terrainCost(state.options.siteId));
 return <section className="room-panel" aria-labelledby="room-title">
  <div className="room-panel-heading"><span className="room-icon"><Icon size={23}/></span><span className="eyebrow">ROOM {room.number} / YOUR HABITAT</span><span className={`room-status ${state.resources[room.resource]<25?'needs-care':''}`}>{state.resources[room.resource]<25?'Needs care':'Operational'}</span></div>
  <h2 id="room-title">{room.name}</h2><p className="room-purpose">{room.purpose}</p>
  <div className="room-metrics">{metrics.map(resource=><ResourceCard key={resource} resource={resource} state={state} compact/>)}</div>
  {roomId==='crew'&&<div className="room-reading"><span>Crew fatigue <small>Shared game index</small></span><strong>{h.fatigue}%</strong><p>{h.fatigue<25?'The crew is rested.':h.fatigue<60?'A recovery shift would help the crew.':'The crew needs recovery time.'} Four astronauts share this wellness model.</p></div>}
  {roomId==='greenhouse'&&<div className="crop-readings"><div><span>Crop maturity</span><strong>{h.harvested?'Harvested':`${h.cropGrowth}%`}</strong><progress value={h.cropGrowth} max={100}/></div><div><span>Crop condition</span><strong>{h.cropCondition}%</strong><progress value={h.cropCondition} max={100}/></div><p>One crop, planted before arrival. Packed food remains your main supply. Growth and yield are simplified game indices, not NASA measurements.</p></div>}
  {roomId==='power'&&<div className="room-reading"><span>Next cycle generation <small>Assumed sunlight × equipment</small></span><strong>{(simulationConfig.solarGeneration*siteFor(state.options.siteId).sunlight[state.day-1]*state.resources.equipment/100).toFixed(1)}</strong><p>Game points generated; {simulationConfig.powerConsumption*(state.options.difficulty==='commander'?1.2:1)} points used by habitat systems. The sunlight schedule is simulated.</p></div>}
  {roomId==='lab'&&<div className="room-reading"><span>Your discoveries</span><strong>{state.learned.length}/8</strong><p>{state.surveys} terrain survey{state.surveys===1?'':'s'} completed. Every reviewed decision adds a lesson to your journal.</p></div>}
  <div className="room-actions">
   {roomId==='crew'&&action('rest','Rest & recover',`−2 food · −2 power · up to +${habitatConfig.restHealth} health`,state.resources.food<=2||state.resources.power<=2)}
   {roomId==='greenhouse'&&<>{action('tend','Tend the crop','−4 water · −3 power · +15 maturity',h.harvested||state.resources.water<=4||state.resources.power<=3)}{action('harvest','Harvest fresh food',`Up to +${Math.round(12*h.cropCondition/100*10)/10} food · one harvest`,h.harvested||h.cropGrowth<100||h.cropCondition<=0)}</>}
   {['support','garage','storage'].includes(roomId)&&maintenance()}
   {['garage','airlock'].includes(roomId)&&survey()}
   {roomId==='power'&&<>{action('conserve','Conserve power','Up to +5 stored power')}{maintenance()}</>}
   {roomId==='lab'&&<><Link className="button button-secondary" to="/journal">Open discovery journal <ArrowRight size={16}/></Link><Link className="text-link" to="/explorer">Explore the lunar terrain <ArrowUpRight size={15}/></Link></>}
  </div>
  {roomId!=='lab'&&<p className="action-guidance">{isTerminal(state)?'This mission has ended. Replay from your debrief.':state.status==='paused'?'Resume the mission to assign your crew.':pendingEvent(state)||feedback(state)?'Resolve and review the current journal event first.':state.activityDays.includes(state.day)?'Today’s crew activity is complete. Advance the day for another assignment.':'Choose one optional crew activity per day, across all rooms.'}</p>}
  <div className="science-insight"><BookOpen size={18}/><div><strong>A little science</strong><p>{room.science}</p><a href={roomId==='greenhouse'?'https://www.nasa.gov/exploration-research-and-technology/growing-plants-in-space/':source.url} target="_blank" rel="noreferrer">NASA reference <ArrowUpRight size={13}/></a></div></div>
 </section>;
}
