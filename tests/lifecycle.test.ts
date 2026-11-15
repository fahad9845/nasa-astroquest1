import {describe,it,expect} from 'vitest';
import {initialState,transition,pendingEvent,feedback,events,resourceKeys,evaluate,type MissionState,type Command,type Resource} from '../packages/simulation-engine';

function reach(id:string){
 let state=initialState();
 for(let n=0;n<40;n++){
  const review=feedback(state),event=pendingEvent(state);
  if(!review&&event?.id===id)return state;
  state=transition(state,review?{type:'learn',eventId:review.eventId}:event?{type:'decide',choiceId:event.choices[0].id}:{type:'advance'});
 }
 throw new Error(`Did not reach ${id}`);
}

describe('every engineering choice',()=>{
 it.each(events.flatMap(event=>event.choices.map(choice=>({event,choice}))))('$event.id / $choice.id applies bounded consequences and records the actual deltas',({event,choice})=>{
  const before=reach(event.id),snapshot=structuredClone(before);
  const after=transition(before,{type:'decide',choiceId:choice.id});
  expect(before).toEqual(snapshot);
  for(const key of resourceKeys){
   const expected=Math.round(Math.max(0,Math.min(100,before.resources[key]+(choice.effects[key]??0)))*10)/10;
   expect(after.resources[key]).toBe(expected);
   const delta=Math.round((expected-before.resources[key])*10)/10;
   expect(after.decisions.at(-1)?.effects[key]??0).toBe(delta);
  }
  expect(after.decisions.at(-1)).toMatchObject({eventId:event.id,choiceId:choice.id,points:choice.points,explanation:choice.explanation});
  if(after.status==='active'){
   expect(()=>transition(after,{type:'advance'})).toThrow(/Review/);
   expect(transition(after,{type:'learn',eventId:event.id}).learned).toContain(event.id);
  }
 });
});

const depletionCases:{resource:Resource;event:string;command:Command;reason:string}[]=[
 {resource:'oxygen',event:'oxygen',command:{type:'decide',choiceId:'ignore'},reason:'Oxygen reserves exhausted.'},
 {resource:'water',event:'water',command:{type:'decide',choiceId:'repair'},reason:'Water reserves exhausted.'},
 {resource:'food',event:'communications',command:{type:'advance'},reason:'Food reserves exhausted.'},
 {resource:'power',event:'communications',command:{type:'decide',choiceId:'checklist'},reason:'Power reserves exhausted.'},
 {resource:'health',event:'communications',command:{type:'decide',choiceId:'improvise'},reason:'Crew health reached a critical limit.'},
 {resource:'equipment',event:'communications',command:{type:'decide',choiceId:'improvise'},reason:'Essential equipment is no longer operable.'},
];
describe('depletion and terminal-state boundaries',()=>{
 it.each(depletionCases)('$resource depletion fails once, blocks play, and restarts cleanly',({resource,event,command,reason})=>{
  let state=reach(event);
  if(command.type==='advance')while(pendingEvent(state)||feedback(state)){
   const review=feedback(state),next=pendingEvent(state);
   state=transition(state,review?{type:'learn',eventId:review.eventId}:{type:'decide',choiceId:next!.choices[0].id});
  }
  state={...state,resources:{...state.resources,[resource]:1}};
  const failed=transition(state,command);
  expect(failed.status).toBe('failed');expect(failed.resources[resource]).toBe(0);
  expect(failed.failureReason).toBe(reason);
  expect(failed.log.filter(entry=>entry.message.startsWith('Mission failed:'))).toHaveLength(1);
  expect(evaluate(failed).score).toBeLessThanOrEqual(49);expect(evaluate(failed).achievements).toEqual([]);
  for(const command of [{type:'advance'},{type:'pause'},{type:'resume'},{type:'abort'}] as Command[])expect(()=>transition(failed,command)).toThrow(/ended/);
  expect(transition(failed,{type:'restart'})).toEqual(initialState(state.options));
 });
 it('aborts a paused mission and preserves its configuration on restart',()=>{
  const start=initialState({siteId:'horizon',seed:43,difficulty:'commander'});
  const ended=transition(transition(start,{type:'pause'}),{type:'abort'});
  expect(ended.status).toBe('aborted');expect(ended.resources).toEqual(start.resources);
  expect(transition(ended,{type:'restart'})).toEqual(start);
 });
});
