import {initialState,transition,pendingEvent,feedback,evaluate} from '../packages/simulation-engine';

// Runs the same pure engine as the browser and API; no DOM, network, clock or database.
let state=initialState({seed:42,difficulty:'cadet',siteId:'aurora'});
while(state.status==='active'){
  const review=feedback(state),event=pendingEvent(state);
  if(review)state=transition(state,{type:'learn',eventId:review.eventId});
  else if(event)state=transition(state,{type:'decide',choiceId:event.choices[0].id});
  else if(state.day===1&&!state.activityDays.includes(1))state=transition(state,{type:'activity',activity:'survey'});
  else {state=transition(state,{type:'advance'});console.log(JSON.stringify({completedDays:state.completedDays,resources:state.resources,status:state.status}));}
}
console.log(JSON.stringify({result:evaluate(state)},null,2));
if(state.status!=='success')process.exitCode=1;
