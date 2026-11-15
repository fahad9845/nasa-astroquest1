import {describe,it,expect} from 'vitest';
import {initialState,transition,pendingEvent,feedback,evaluate,sites,type MissionState,type MissionOptions} from '../packages/simulation-engine';

function safeStep(state:MissionState):MissionState {
  const review=feedback(state),event=pendingEvent(state);
  if(review)return transition(state,{type:'learn',eventId:review.eventId});
  if(event)return transition(state,{type:'decide',choiceId:event.choices[0].id});
  if(!state.activityDays.includes(state.day))return transition(state,{type:'activity',activity:state.day===1?'survey':'conserve'});
  return transition(state,{type:'advance'});
}
function beforeEvent(id:string){
  let state=initialState();
  for(let step=0;step<40;step++){
    if(!feedback(state)&&pendingEvent(state)?.id===id)return state;
    state=safeStep(state);
  }
  throw new Error(`Event ${id} never triggered`);
}
describe('complete emergency scenarios',()=>{
  it('water repair, backup treatment and rationing have distinct operational costs',()=>{
    const state=beforeEvent('water');
    const repair=transition(state,{type:'decide',choiceId:'repair'});
    const backup=transition(state,{type:'decide',choiceId:'backup'});
    const ration=transition(state,{type:'decide',choiceId:'ration'});
    expect(repair.resources.power).toBeGreaterThan(backup.resources.power);
    expect(backup.resources.water).toBeGreaterThan(repair.resources.water);
    expect(ration.resources.health).toBeLessThan(repair.resources.health);
    expect(ration.resources.equipment).toBeLessThan(repair.resources.equipment);
    expect(repair.decisions.at(-1)?.explanation).toMatch(/flushing water/);
    expect(pendingEvent(state)?.id).toBe('water');
  });
  it('radiation shelter protects crew health while continuing work causes exposure penalties',()=>{
    const state=beforeEvent('storm');
    const shelter=transition(state,{type:'decide',choiceId:'shelter'});
    const outside=transition(state,{type:'decide',choiceId:'continue'});
    expect(shelter.resources.health).toBe(state.resources.health);
    expect(outside.resources.health).toBe(state.resources.health-55);
    expect(shelter.resources.power).toBeLessThan(outside.resources.power);
    expect(shelter.resources.shielding).toBeGreaterThan(outside.resources.shielding);
    expect(evaluate(shelter).dimensions.engineering).toBeGreaterThan(evaluate(outside).dimensions.engineering);
  });
  it('oxygen repair consumes water and power; ignoring a fault can end the mission immediately',()=>{
    const state=beforeEvent('oxygen');
    const repaired=transition(state,{type:'decide',choiceId:'restart'});
    expect(repaired.resources.oxygen).toBeGreaterThan(state.resources.oxygen);
    expect(repaired.resources.water).toBeLessThan(state.resources.water);
    expect(repaired.resources.power).toBeLessThan(state.resources.power);
    const vulnerable={...state,resources:{...state.resources,health:20}};
    const failed=transition(vulnerable,{type:'decide',choiceId:'ignore'});
    expect(failed.status).toBe('failed');
    expect(failed.resources.health).toBe(0);
    expect(evaluate(failed).achievements).toEqual([]);
    expect(()=>transition(failed,{type:'advance'})).toThrow(/ended/);
    expect(transition(failed,{type:'restart'})).toEqual(initialState(state.options));
  });
  it('records a daily exhaustion failure once and does not advance to the next day',()=>{
    let state=initialState();
    while(pendingEvent(state)||feedback(state))state=safeStep(state);
    state={...state,resources:{...state.resources,food:1}};
    const failed=transition(state,{type:'advance'});
    expect(failed.status).toBe('failed');
    expect(failed.day).toBe(1);
    expect(failed.resources.food).toBe(0);
    expect(failed.log.filter(entry=>entry.message.startsWith('Mission failed:'))).toHaveLength(1);
  });
});

const configurations:MissionOptions[]=sites.flatMap(site=>(['cadet','commander'] as const).flatMap(difficulty=>[42,43].map(seed=>({siteId:site.id,difficulty,seed}))));
describe('complete deterministic mission matrix',()=>{
  it.each(configurations)('survives $siteId / $difficulty / seed $seed and replays exactly',options=>{
    const run=()=>{let state=initialState(options);let commands=0;while(state.status==='active'&&commands++<40)state=safeStep(state);expect(commands).toBeLessThan(40);return state;};
    const final=run();
    expect(final.status).toBe('success');expect(final.completedDays).toBe(5);
    expect(final.decisions).toHaveLength(8);expect(final.learned).toHaveLength(8);
    expect(final.history.map(entry=>entry.day)).toEqual([0,1,2,3,4,5]);
    expect(evaluate(final).score).toBeGreaterThan(49);
    expect(evaluate(final).achievements).toContain('Mission Specialist');
    expect(run()).toEqual(final);
  });
});
