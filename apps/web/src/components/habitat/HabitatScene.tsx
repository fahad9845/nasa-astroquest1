import {useId, type PointerEvent} from 'react';
import {rooms,type RoomId} from './rooms';
import {habitatFor,type MissionState} from '../../../../../packages/simulation-engine';

const positions:Record<RoomId,[number,number,number]>={crew:[250,285,1.1],support:[438,225,.86],greenhouse:[675,246,1.05],power:[880,410,.85],garage:[452,492,.95],lab:[653,410,.9],storage:[232,453,.72],airlock:[448,348,.6]};
const stars=[[52,56],[199,88],[372,36],[497,72],[663,29],[774,94],[919,39],[1136,49]];
// Fixed artwork coordinates, independent of the mission's deterministic random seed.
const rocks=Array.from({length:65},(_,i)=>({x:(i*173+31)%1200,y:220+(i*97)%445,r:1+(i%4)}));

export function HabitatScene({state,selected,onSelect,panorama=false}:{state?:MissionState;selected?:RoomId;onSelect?:(id:RoomId)=>void;panorama?:boolean}){
 const id=useId().replaceAll(':','');
 function look(event:PointerEvent<HTMLDivElement>){
  if(event.pointerType!=='mouse'||window.matchMedia('(prefers-reduced-motion: reduce)').matches)return;
  const rect=event.currentTarget.getBoundingClientRect();
  event.currentTarget.style.setProperty('--look-x',`${((event.clientX-rect.left)/rect.width-.5)*6}px`);
  event.currentTarget.style.setProperty('--look-y',`${((event.clientY-rect.top)/rect.height-.5)*3}px`);
 }
 return <div className={`habitat-scene ${panorama?'panorama':''}`} onPointerMove={look} onPointerLeave={e=>{e.currentTarget.style.setProperty('--look-x','0px');e.currentTarget.style.setProperty('--look-y','0px');}}>
  <svg viewBox="0 0 1200 690" preserveAspectRatio="xMidYMid meet" role={onSelect?'group':'img'} aria-label={onSelect?'Interactive lunar habitat. Select a room to inspect its systems.':'Architectural illustration of a lunar habitat, astronauts and Earth. Not a NASA image.'}>
   <defs>
    <linearGradient id={`${id}-sky`} x2="0" y2="1"><stop stopColor="#050911"/><stop offset=".65" stopColor="#0b1525"/><stop offset="1" stopColor="#203b5b"/></linearGradient>
    <linearGradient id={`${id}-ground`} x2=".3" y2="1"><stop stopColor="#3a4859"/><stop offset=".35" stopColor="#222e3d"/><stop offset="1" stopColor="#0c1420"/></linearGradient>
    <linearGradient id={`${id}-roof`} x2=".8" y2="1"><stop stopColor="#d8e7f4"/><stop offset=".4" stopColor="#9ab3cc"/><stop offset="1" stopColor="#415a76"/></linearGradient>
    <linearGradient id={`${id}-rim`}><stop stopColor="#385875" stopOpacity="0"/><stop offset=".48" stopColor="#89c5ff"/><stop offset="1" stopColor="#385875" stopOpacity="0"/></linearGradient>
    <radialGradient id={`${id}-earth`} cx=".3" cy=".25"><stop stopColor="#c1e8f1"/><stop offset=".4" stopColor="#517fbb"/><stop offset="1" stopColor="#0a1830"/></radialGradient>
    <radialGradient id={`${id}-crater`}><stop offset=".4" stopColor="#080e17"/><stop offset=".8" stopColor="#1e2c3d"/><stop offset="1" stopColor="#526277" stopOpacity=".3"/></radialGradient>
    <pattern id={`${id}-panels`} width="20" height="18" patternUnits="userSpaceOnUse"><rect width="20" height="18" fill="#102b54"/><path d="M20 0H0V18M10 0V18" stroke="#5983b0" strokeWidth=".6" fill="none"/></pattern>
    <pattern id={`${id}-grain`} width="53" height="39" patternUnits="userSpaceOnUse"><path d="M2 8h2m19 13h1m15-17h3m-6 30h2" stroke="#a4bdd5" strokeOpacity=".1"/></pattern>
   </defs>
   <rect width="1200" height="690" fill={`url(#${id}-sky)`}/>
   <g className="celestial-parallax">
    {stars.map(([x,y],i)=><circle key={x} cx={x} cy={y} r={i%3===0?1.1:.65} fill="#d7e7f8" opacity={.3+i%3*.16}/>)}
    <circle cx="1027" cy="77" r="34" fill={`url(#${id}-earth)`} stroke="#8cc8ff" strokeOpacity=".35"/>
    <path d="M1011 51l20 4 8 15-16 4 7 20-13 10-8-22-13-8Z" fill="#b7d2d4" opacity=".6"/><path d="M1035 45q41 34-3 65q50-18 3-65" fill="#050c17" opacity=".8"/>
   </g>
   <g className="terrain-parallax">
    <path d="M-10 183L112 137 163 161 278 103 358 145 471 127 577 161 708 133 808 157 934 129 1063 166 1210 138V690H-10Z" fill="#182333" stroke={`url(#${id}-rim)`} strokeWidth="2"/>
    <path d="M112 137l-20 49 71-25 115-58-58 81 138-39 48 41 65-59-7 57 113-23 65 37 66-65 62 64 38-40 126-28-32 58 161-21" fill="#29394d" opacity=".5"/>
    <path d="M-10 214L149 178 260 211 402 175 546 204 689 184 836 208 1020 177 1210 211V690H-10Z" fill={`url(#${id}-ground)`}/>
    <path d="M-10 214L149 178 260 211 402 175 546 204 689 184 836 208 1020 177 1210 211" fill="none" stroke={`url(#${id}-rim)`} strokeWidth="1.4"/>
    <path d="M0 260Q290 202 540 240T1200 265M-30 618Q300 544 510 612T1230 607M600 340Q840 280 1200 335" fill="none" stroke="#65758b" strokeOpacity=".13" strokeWidth="2"/>
    <ellipse cx="1057" cy="517" rx="131" ry="45" fill={`url(#${id}-crater)`}/><path d="M933 507q121-61 248 9" fill="none" stroke="#778aa1" strokeOpacity=".25" strokeWidth="3"/>
    <ellipse cx="96" cy="379" rx="67" ry="20" fill={`url(#${id}-crater)`}/><ellipse cx="756" cy="625" rx="90" ry="21" fill={`url(#${id}-crater)`}/>
    <path d="M0 220L1200 215V690H0Z" fill={`url(#${id}-grain)`}/>
    {rocks.map(({x,y,r},i)=><g key={i}><path d={`M${x} ${y}l${r*2} ${-r} ${r*3} ${r*1.5} ${-r*3} ${r}Z`} fill="#7a8ca1" opacity=".23"/><path d={`M${x} ${y}l${r*6} ${r*2} ${-r*2} ${r}Z`} fill="#050b13" opacity=".5"/></g>)}
   </g>
   <g stroke="#5b6e83" strokeWidth="27" fill="none"><path d="M270 322L448 366 655 446 876 438M448 366l-3-110m3 110 4 144m-4-144 228-95M250 472l202 38"/></g>
   <g stroke="#a1c4df" strokeWidth="1" strokeDasharray="3 9" opacity=".55" fill="none"><path d="M270 322L448 366 655 446 876 438M448 366l-3-110m3 110 4 144m-4-144 228-95M250 472l202 38"/></g>
   {rooms.map(room=>{
    const [x,y,scale]=positions[room.id],active=selected===room.id;
    const low=state&&(room.id==='greenhouse'?habitatFor(state).cropCondition<25:state.resources[room.resource]<25);
    return <g key={room.id} className={`habitat-building ${active?'is-selected':''}`} transform={`translate(${x} ${y}) scale(${scale})`} role={onSelect?'button':undefined} tabIndex={onSelect?0:undefined} aria-label={onSelect?`Open ${room.name}`:undefined} aria-pressed={onSelect?active:undefined} onClick={()=>onSelect?.(room.id)} onKeyDown={e=>{if(onSelect&&(e.key==='Enter'||e.key===' ')){e.preventDefault();onSelect(room.id);}}}>
     <title>{room.name}</title>
     <path d="M-85 42L20 15 202 99 66 111Z" fill="#020710" opacity=".65"/>
     <ellipse className="selection-ring" cx="0" cy="29" rx="117" ry="65" fill={active?'#68b5ff0a':'transparent'} stroke={active?'#68b5ff':'transparent'} strokeWidth="2" strokeDasharray="5 5"/>
     {room.id==='power'?<>
      <path className="room-roof" d="M-90-12l116-33 89 53L0 44Z" fill={`url(#${id}-panels)`} stroke="#9bb3cc" strokeWidth="4"/>
      <path d="M-75 1v44M11 35v37M97 13v35" stroke="#647d94" strokeWidth="5"/>
      <path d="M-88 65l38-10 27 17v32l-39 11-26-16Z" fill="#7b93ac" stroke="#b6c7d6"/><path d="M-58 74v25m10-28v25m10-28v25" stroke="#80e5e7" strokeWidth="3"/>
     </>:<>
      <path d="M-84-6L4-36 87 5v63L0 97-84 55Z" fill="#304158" stroke="#8199b0"/>
      <path d="M-84-6L0 36v61l-84-42Z" fill="#506882"/>
      <path d="M0 36L87 5v63L0 97Z" fill="#22364d"/>
      <path className="room-roof" d="M-84-6q-8-48 33-68L33-39q47 10 54 44L0 36Z" fill={room.id==='greenhouse'?'#385f68':`url(#${id}-roof)`} stroke={active?'#80e5e7':'#9ab6cf'} strokeWidth={active?3:1.5}/>
      <path d="M-62-46L21-5m-60-55 82 39m-104 4L21 24" stroke={room.id==='greenhouse'?'#90d4cb':'#d4e0ed'} strokeOpacity=".5" strokeWidth="2" fill="none"/>
      {room.id==='greenhouse'?<g stroke="#9cdec1" strokeWidth="3"><path d="M-43-27v18m0-8-9-8m9 10 9-7M-16-15V3m0-8-9-7m9 9 9-7M13 0v18m0-9-9-7m9 10 9-7"/></g>:<g className="habitat-windows" fill="#b4e9ff" stroke="#80c4eb"><path d="M-68 11l19 9v19l-19-9Z"/><path d="M-36 27l19 9v19l-19-9Z"/></g>}
      <path d="M31 51l24-8v38l-24 9Z" fill="#080f1b" stroke="#52748f"/><path d="M36 56l14-5" stroke="#80e5e7" strokeWidth="2"/>
      <path d="M-73 57v14M-9 90v14M75 69v13" stroke="#6c8399" strokeWidth="4"/>
      <rect x="-12" y="-23" width="30" height="4" rx="2" transform="rotate(26)" fill={low?'#ffaaa5':active?'#80e5e7':'#68b5ff'}/>
     </>}
     {room.id==='garage'&&<g transform="translate(80 87)"><path d="M-13-15l32-10 29 17v19l-31 9-30-17Z" fill="#c0cedb"/><path d="M-5-17l12-13 21 11-10 14Z" fill="#365775"/>{[-5,27].map(cx=><ellipse key={cx} cx={cx} cy="15" rx="7" ry="10" fill="#070c14" stroke="#71839a"/>)}<path d="M14-30v-16" stroke="#94abc1" strokeWidth="2"/></g>}
     <g className="habitat-label" transform={room.id==='garage'?'translate(0 124)':'translate(0 -98)'}><rect x="-68" y="-14" width="136" height="29" rx="5" fill={active?'#153454':'#0b1422'} fillOpacity=".96" stroke={active?'#68b5ff':'#3b5068'}/><circle cx="-51" cy="0" r="3" fill={low?'#ffaaa5':active?'#80e5e7':'#9baac2'}/><text x="3" y="4" textAnchor="middle" fill="#e0eaf6" fontSize="12" fontFamily="Inter,sans-serif">{room.name}</text></g>
    </g>;
   })}
   {[{x:573,y:539},{x:605,y:559},{x:336,y:367}].map(({x,y},i)=><g key={i} transform={`translate(${x} ${y})`}><ellipse cx="15" cy="19" rx="25" ry="5" fill="#030710" opacity=".6"/><rect x="-7" y="-12" width="14" height="23" rx="5" fill="#cedae5"/><rect x="-11" y="-8" width="5" height="16" rx="2" fill="#7e98b7"/><circle cy="-18" r="8" fill="#f0f5ff"/><path d="M-5-21h10v6H-5Z" fill="#354a68"/><path d="M-4 9l-2 13m10-13 3 13M7-7l8 12" stroke="#cfdeec" strokeWidth="6"/><path d="M-4-2h9" stroke="#68b5ff" strokeWidth="3"/></g>)}
   <g className="lunar-dust" fill="#b0cce8" opacity=".2" aria-hidden="true"><circle cx="142" cy="550" r="1.3"/><circle cx="817" cy="534" r="1"/><circle cx="946" cy="290" r="1.2"/><circle cx="76" cy="270" r="1"/></g>
   <text x="34" y="658" fontSize="11" fontFamily="monospace" fill="#9baac2">ORBITAL / HABITAT STUDY 001</text><text x="1166" y="658" textAnchor="end" fontSize="10" fontFamily="monospace" fill="#9baac2">ILLUSTRATED · NOT TO SCALE</text>
  </svg>
 </div>;
}
