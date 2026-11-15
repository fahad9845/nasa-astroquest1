import {resourceInfo,type MissionState,type Resource} from '../../../../packages/simulation-engine';

/** Daily engine snapshots plus the current reading, on a fixed 0–100 scale. */
export function TelemetryTrace({state,resource}:{state:MissionState;resource:Resource}){
 const values=[...state.history.map(snapshot=>snapshot.resources[resource]),state.resources[resource]];
 const points=values.map((value,index)=>`${index*100/(values.length-1)},${22-value*.2}`).join(' ');
 return <svg className="telemetry-trace" viewBox="0 0 100 24" preserveAspectRatio="none" role="img" aria-label={`${resourceInfo[resource].label} history: ${values.join(', ')} percent. Daily snapshots followed by the current reading.`}>
  <path d="M0 22H100" stroke="currentColor" strokeOpacity=".15" fill="none"/>
  <polyline points={points} stroke="currentColor" strokeWidth="1.3" vectorEffect="non-scaling-stroke" strokeLinejoin="round" fill="none"/>
 </svg>;
}
