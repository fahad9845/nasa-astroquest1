import terrain from '../../apps/web/src/data/nasa/processed/terrain.json';
import {events} from './events';
import {resourceKeys,type Resources,type MissionState,type MissionOptions,type Command,type HabitatState} from './types';
export * from './types'; export {events};
export const simulationConfig={crewSize:4,missionDuration:5,oxygenPerCrew:4,waterPerCrew:3,foodPerCrew:2.4,oxygenProduction:11,electrolysisWater:2,solarGeneration:23,powerConsumption:16,recyclingEfficiency:.75,equipmentDegradation:2};
export const habitatConfig={dailyFatigue:8,restRecovery:25,restHealth:8,restPower:2,restFood:2,tendWater:4,tendPower:3,tendGrowth:15,tendCondition:12,dailyGrowth:5,dailyCropWear:5,harvestFood:12};
export const resourceInfo = {
 oxygen:{label:'Oxygen',unit:'%',description:'Breathable oxygen reserve. Production consumes water and power.'},
 water:{label:'Water',unit:'%',description:'Clean water reserve after crew use, recycling, and electrolysis.'},
 food:{label:'Food',unit:'%',description:'Packed provisions and harvested supplements. Consumed by all four crew members each Earth day.'},
 power:{label:'Power',unit:'%',description:'Stored electrical reserve. Solar generation offsets daily system demand.'},
 shielding:{label:'Radiation protection',unit:'%',description:'Game protection readiness index, not radiation dose or a material measurement.'},
 health:{label:'Crew health',unit:'%',description:'Shared crew wellness index. Unsafe decisions and shortages reduce it.'},
 equipment:{label:'Equipment integrity',unit:'%',description:'System condition affects recycling, oxygen production, and solar output.'}
};
export const sites=terrain.sites;
export function siteFor(id:string) {const site=sites.find(s=>s.id===id);if(!site)throw new Error('Unknown outpost site');return site;}
export const terrainCost=(id:string)=>Math.min(8,Math.max(1,Math.round(siteFor(id).reliefM/1000)));
const clamp=(n:number)=>Math.round(Math.min(100,Math.max(0,n))*10)/10;
function apply(r:Resources,e:Partial<Resources>) {for(const k of resourceKeys) r[k]=clamp(r[k]+(e[k]??0));}
/** Additive save compatibility. These are game indices, including crops planted before crew arrival. */
export function habitatFor(s:Pick<MissionState,'habitat'|'completedDays'>):HabitatState{return s.habitat??{fatigue:clamp(s.completedDays*habitatConfig.dailyFatigue),cropGrowth:clamp(70+s.completedDays*5),cropCondition:clamp(80-s.completedDays*5),harvested:false};}
export function initialState(options:MissionOptions={seed:42,difficulty:'cadet',siteId:'aurora'}):MissionState {
 siteFor(options.siteId);
 if(!Number.isInteger(options.seed)||options.seed<0||options.seed>2147483647) throw new Error('Invalid mission seed');
 if(!['cadet','commander'].includes(options.difficulty)) throw new Error('Invalid difficulty');
 const resources:Resources={oxygen:100,water:100,food:100,power:100,shielding:90,health:100,equipment:100-terrainCost(options.siteId)};
 return {version:1,options:{...options},day:1,completedDays:0,status:'active',resources,previous:{...resources},decisions:[],learned:[],surveys:0,activityDays:[],habitat:habitatFor({completedDays:0}),history:[{day:0,resources:{...resources}}],failureReason:null,log:[{day:1,message:'Landing complete. Habitat and life-support systems initialized.'},{day:1,message:`Terrain survey: ${siteFor(options.siteId).reliefM.toFixed(0)} m regional relief. Game setup wear: ${terrainCost(options.siteId)} points.`}]};
}
export function pendingEvent(s:MissionState) {return events.filter(e=>e.day===s.day&&!s.decisions.some(d=>d.eventId===e.id)).sort((a,b)=>s.options.seed%2===0?events.indexOf(a)-events.indexOf(b):events.indexOf(b)-events.indexOf(a))[0];}
export function feedback(s:MissionState) {return s.decisions.find(d=>!s.learned.includes(d.eventId));}
export const isTerminal=(s:MissionState)=>['success','failed','aborted'].includes(s.status);
export function objectives(s:MissionState) {return [
 {id:'habitat',label:'Initialize the lunar habitat',complete:true},
 {id:'survey',label:'Complete a terrain research survey',complete:s.surveys>0},
 {id:'decisions',label:'Resolve all eight mission events',complete:s.decisions.length===events.length},
 {id:'safety',label:'Return after five days with crew health ≥ 60%',complete:s.status==='success'&&s.resources.health>=60}
];}
function failIfNeeded(s:MissionState){
 if(s.status==='failed')return;
 const depleted=(['oxygen','water','food','power'] as const).find(k=>s.resources[k]===0);
 if(depleted||s.resources.health<=0||s.resources.equipment===0){s.status='failed';s.failureReason=depleted?`${resourceInfo[depleted].label} reserves exhausted.`:s.resources.health<=0?'Crew health reached a critical limit.':'Essential equipment is no longer operable.';s.log.push({day:s.day,message:`Mission failed: ${s.failureReason}`});}
}
export function transition(previous:MissionState,command:Command):MissionState {
 if(command.type==='restart')return initialState(previous.options);
 if(isTerminal(previous))throw new Error('Mission has ended');
 const s=structuredClone(previous);
 s.habitat={...habitatFor(previous)};
 if(command.type==='pause'){if(s.status!=='active')throw new Error('Mission is already paused');s.status='paused';return s;}
 if(command.type==='resume'){if(s.status!=='paused')throw new Error('Mission is not paused');s.status='active';return s;}
 if(command.type==='abort'){s.status='aborted';s.failureReason='Commander ended the mission.';return s;}
 if(s.status!=='active')throw new Error('Resume the mission first');
 s.previous={...s.resources};
 if(command.type==='learn'){
  if(!s.decisions.some(d=>d.eventId===command.eventId)||s.learned.includes(command.eventId))throw new Error('No unread decision for this event');
  s.learned.push(command.eventId);return s;
 }
 if(feedback(s))throw new Error('Review the previous decision first');
 if(command.type==='decide'){
  const event=pendingEvent(s);if(!event)throw new Error('No pending event');
  const choice=event.choices.find(c=>c.id===command.choiceId);if(!choice)throw new Error('Invalid decision');
  const before={...s.resources};apply(s.resources,choice.effects);
  const actual=Object.fromEntries(resourceKeys.filter(k=>before[k]!==s.resources[k]).map(k=>[k,Math.round((s.resources[k]-before[k])*10)/10]));
  s.decisions.push({eventId:event.id,choiceId:choice.id,day:s.day,label:choice.label,explanation:choice.explanation,effects:actual,points:choice.points});
  s.log.push({day:s.day,message:`${event.title}: ${choice.label}. ${Object.entries(actual).map(([k,v])=>`${k} ${Number(v)>0?'+':''}${v}`).join(', ')}.`});
 }else if(command.type==='activity'){
  if(s.activityDays.includes(s.day))throw new Error('One optional crew activity is available each day');
  if(pendingEvent(s))throw new Error('Resolve mission events before assigning the crew');
  if(command.activity==='survey'){const cost=4+terrainCost(s.options.siteId);if(s.resources.power<=cost)throw new Error('Insufficient power for a safe survey');apply(s.resources,{power:-cost,equipment:-1});s.surveys++;}
  else if(command.activity==='maintenance'){if(s.resources.power<=6)throw new Error('Insufficient power for maintenance');apply(s.resources,{power:-6,equipment:10});}
  else if(command.activity==='conserve')apply(s.resources,{power:5});
  else if(command.activity==='rest'){
   const c=habitatConfig;if(s.resources.power<=c.restPower||s.resources.food<=c.restFood)throw new Error('Rest needs more than 2 power and 2 food points');
   apply(s.resources,{power:-c.restPower,food:-c.restFood,health:c.restHealth});s.habitat.fatigue=clamp(s.habitat.fatigue-c.restRecovery);
  }
  else if(command.activity==='tend'){
   const c=habitatConfig;if(s.habitat.harvested)throw new Error('This mission’s crop has already been harvested');
   if(s.resources.water<=c.tendWater||s.resources.power<=c.tendPower)throw new Error('Tending needs more than 4 water and 3 power points');
   apply(s.resources,{water:-c.tendWater,power:-c.tendPower});s.habitat.cropGrowth=clamp(s.habitat.cropGrowth+c.tendGrowth);s.habitat.cropCondition=clamp(s.habitat.cropCondition+c.tendCondition);
  }
  else if(command.activity==='harvest'){
   if(s.habitat.harvested||s.habitat.cropGrowth<100||s.habitat.cropCondition<=0)throw new Error('The crop is not ready to harvest');
   const amount=Math.round(habitatConfig.harvestFood*s.habitat.cropCondition/100*10)/10;const before=s.resources.food;apply(s.resources,{food:amount});s.habitat.harvested=true;
   s.log.push({day:s.day,message:`Greenhouse harvest: +${Math.round((s.resources.food-before)*10)/10} food points from the pre-grown crop. Simulated yield.`});
  }
  else throw new Error('Unknown crew activity');
  if(command.activity==='survey')s.habitat.fatigue=clamp(s.habitat.fatigue+8);
  if(command.activity==='rest')s.log.push({day:s.day,message:`Crew recovery: fatigue ${s.habitat.fatigue}%, health ${s.resources.health}%. Game wellness indices.`});
  if(command.activity==='tend')s.log.push({day:s.day,message:`Greenhouse tended: −4 water, −3 power; crop maturity ${s.habitat.cropGrowth}%, condition ${s.habitat.cropCondition}%.`});
  s.activityDays.push(s.day);s.log.push({day:s.day,message:`Crew assignment completed: ${command.activity}.`});
 }else if(command.type==='advance'){
  if(pendingEvent(s))throw new Error('Resolve all pending events first');
  const c=simulationConfig,condition=s.resources.equipment/100,multiplier=s.options.difficulty==='commander'?1.2:1;
  const sunlight=siteFor(s.options.siteId).sunlight[s.day-1];
  const powered=s.resources.power>=10?1:.4;
  const oxygenProduction=Math.min(c.oxygenProduction*condition*powered,s.resources.water*2);
  apply(s.resources,{
   oxygen:oxygenProduction-c.crewSize*c.oxygenPerCrew*multiplier,
   water:-c.crewSize*c.waterPerCrew*multiplier*(1-c.recyclingEfficiency*condition*powered)-c.electrolysisWater*(oxygenProduction/c.oxygenProduction),
   food:-c.crewSize*c.foodPerCrew*multiplier,
   power:c.solarGeneration*sunlight*condition-c.powerConsumption*multiplier,
   equipment:-c.equipmentDegradation*multiplier
  });
  const shortages=(['oxygen','water','food','power'] as const).filter(k=>s.resources[k]<20).length;
  apply(s.resources,{health:-shortages*7});
  s.habitat.fatigue=clamp(s.habitat.fatigue+habitatConfig.dailyFatigue+shortages*3);
  if(!s.habitat.harvested){
   const supported=s.resources.water>=20&&s.resources.power>=20&&s.resources.equipment>=25;
   s.habitat.cropCondition=clamp(s.habitat.cropCondition-(supported?habitatConfig.dailyCropWear:15));
   if(supported&&s.habitat.cropCondition>0)s.habitat.cropGrowth=clamp(s.habitat.cropGrowth+habitatConfig.dailyGrowth);
  }
  s.completedDays++;s.history.push({day:s.day,resources:{...s.resources}});
  s.log.push({day:s.day,message:`Daily cycle complete. Solar generation ${(c.solarGeneration*sunlight*condition).toFixed(1)}, power demand ${(c.powerConsumption*multiplier).toFixed(1)} game points. Recycling ${(c.recyclingEfficiency*condition*powered*100).toFixed(0)}% (game model).`});
  failIfNeeded(s);
  if(s.status==='active'){if(s.completedDays===c.missionDuration){s.status='success';s.log.push({day:s.day,message:'Five-day mission complete. Crew returned for debrief.'});}else s.day++;}
 }else throw new Error('Unknown command');
 failIfNeeded(s);return s;
}
export function evaluate(s:MissionState){
 const maximumEngineeringPoints=events.reduce((total,event)=>total+Math.max(...event.choices.map(choice=>choice.points)),0);
 const r=s.resources,dimensions={crewSafety:Math.round(r.health),resourceEfficiency:Math.round((r.oxygen+r.water+r.food+r.power)/4),engineering:Math.round(Math.min(100,Math.max(0,s.decisions.reduce((n,d)=>n+d.points,0)/maximumEngineeringPoints*100))),objectives:objectives(s).filter(o=>o.complete).length*25,learning:Math.round(s.learned.length/events.length*100),maintenance:Math.round(r.equipment)};
 const raw=Math.round(Object.values(dimensions).reduce((a,b)=>a+b,0)/6);const score=s.status==='success'?raw:Math.min(raw,49);
 const achievements:string[]=[];
 if(s.status==='success'){
  achievements.push('First Moon Mission');
  if(r.health>=90)achievements.push('Crew Protector');
  if(dimensions.engineering>=90)achievements.push('Efficient Engineer');
  if(Math.min(r.oxygen,r.water,r.food,r.power)>=40)achievements.push('Resource Master');
  if(s.decisions.some(d=>d.eventId==='storm'&&d.choiceId==='shelter'))achievements.push('Solar Storm Survivor');
  if(s.surveys>0&&s.learned.length===events.length)achievements.push('Mission Specialist');
 }
 return {score,rank:s.status!=='success'?'Training in progress':score>=85?'Mission Commander':score>=70?'Mission Specialist':'Lunar Cadet',dimensions,achievements,mistakes:s.decisions.filter(d=>d.points<=2)};
}
