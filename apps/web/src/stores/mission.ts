import {create} from 'zustand';
import {initialState,transition,isTerminal,type MissionState,type MissionOptions,type Command} from '../../../../packages/simulation-engine';
import {stateSchema} from '../../../../packages/simulation-engine/schema';
import {api} from '../services/api';
import {queryClient} from '../services/queryClient';
export type Envelope={id:string;revision:number;state:MissionState};
type Saved={mission:Envelope;history:Envelope[]};
const key='astroquest.guest.v1';
const accountKey='astroquest.accountMission.v1';
function accountPointer(){try{return sessionStorage.getItem(accountKey);}catch{return null;}}
function setAccountPointer(id:string|null){try{if(id)sessionStorage.setItem(accountKey,id);else sessionStorage.removeItem(accountKey);}catch{/* Server saves still work when tab storage is unavailable. */}}
function readSaved():Saved|null{try{const parsed=JSON.parse(localStorage.getItem(key)??'null');if(!parsed||!stateSchema.safeParse(parsed.mission?.state).success)return null;return {mission:parsed.mission,history:(parsed.history??[]).filter((m:Envelope)=>stateSchema.safeParse(m.state).success).slice(0,20)};}catch{return null;}}
const saved=readSaved();
type Store={mission:Envelope|null;mode:'guest'|'account';history:Envelope[];busy:boolean;error:string|null;notice:string|null;start:(options:MissionOptions,account:boolean)=>Promise<void>;dispatch:(command:Command)=>Promise<void>;resume:(mission:Envelope)=>void;restoreAccount:()=>Promise<void>;loadGuest:()=>void;save:()=>Promise<void>;clearError:()=>void;};
export const useMission=create<Store>((set,get)=>({
 mission:accountPointer()?null:saved?.mission??null,history:saved?.history??[],mode:'guest',busy:false,error:null,notice:null,
 start:async(options,account)=>{
  set({busy:true,error:null});try{const mission=account?await api<Envelope>('/missions/start',options):{id:crypto.randomUUID(),revision:0,state:initialState(options)};set({mission,mode:account?'account':'guest',notice:null});setAccountPointer(account?mission.id:null);if(!account)persist(mission,get().history,set);else void queryClient.invalidateQueries({queryKey:['missions']});}catch(e){set({error:(e as Error).message});throw e;}finally{set({busy:false});}
 },
 dispatch:async(command)=>{
  const {mission,mode,busy}=get();if(!mission||busy)return;set({busy:true,error:null,notice:null});
  try{const next=mode==='account'?await api<Envelope>(`/missions/${mission.id}/command`,{revision:mission.revision,command}):{...mission,revision:mission.revision+1,state:transition(mission.state,command)};
   let history=get().history;if(mode==='guest'&&isTerminal(next.state))history=[next,...history.filter(m=>m.id!==next.id)].slice(0,20);
   set({mission:next,history});if(mode==='guest')persist(next,history,set);else {void queryClient.invalidateQueries({queryKey:['missions']});void queryClient.invalidateQueries({queryKey:['profile']});}
  }catch(e){set({error:(e as Error).message});}finally{set({busy:false});}
 },
 resume:(mission)=>{setAccountPointer(mission.id);set({mission,mode:'account',error:null,notice:'Server mission loaded.'});},
 restoreAccount:async()=>{const id=accountPointer();if(!id||get().mode==='account'||get().busy)return;set({busy:true});try{const mission=await api<Envelope>(`/missions/${id}/state`);set({mission,mode:'account',error:null});}catch(e){setAccountPointer(null);set({error:(e as Error).message});}finally{set({busy:false});}},
 loadGuest:()=>{setAccountPointer(null);const saved=readSaved();set({mission:saved?.mission??null,history:saved?.history??[],mode:'guest',error:null,notice:'Guest save loaded.'});},
 save:async()=>{const {mission,mode}=get();if(!mission)return;set({busy:true,error:null});try{if(mode==='account'){const latest=await api<Envelope>(`/missions/${mission.id}/save`,{});set({mission:latest,notice:'Saved mission synchronized with the server.'});}else if(persist(mission,get().history,set))set({notice:'Guest mission saved on this device.'});}catch(e){set({error:(e as Error).message});}finally{set({busy:false});}},
 clearError:()=>set({error:null,notice:null})
}));
function persist(mission:Envelope,history:Envelope[],set:(state:Partial<Store>)=>void){try{localStorage.setItem(key,JSON.stringify({mission,history}));return true;}catch{set({error:'This browser cannot save progress. Keep this tab open to continue playing.'});return false;}}
