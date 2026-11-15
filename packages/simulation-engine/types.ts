import type { SourceId } from '../shared-config/science';
export const resourceKeys = ['oxygen','water','food','power','shielding','health','equipment'] as const;
export type Resource = typeof resourceKeys[number];
export type Resources = Record<Resource,number>;
export type MissionOptions = { seed:number; difficulty:'cadet'|'commander'; siteId:string };
export type Decision = {id:string;label:string;description:string;effects:Partial<Resources>;points:number;explanation:string};
export type MissionEvent = {id:string;title:string;description:string;day:number;severity:'advisory'|'warning'|'critical';source:SourceId;science:string;choices:Decision[]};
export type DecisionRecord = {eventId:string;choiceId:string;day:number;label:string;explanation:string;effects:Partial<Resources>;points:number};
export type HabitatState = {fatigue:number;cropGrowth:number;cropCondition:number;harvested:boolean};
export type CrewActivity = 'survey'|'maintenance'|'conserve'|'rest'|'tend'|'harvest';
export type MissionState = {
  version:1; options:MissionOptions; day:number; completedDays:number;
  status:'active'|'paused'|'success'|'failed'|'aborted'; resources:Resources;
  previous:Resources; decisions:DecisionRecord[]; learned:string[]; surveys:number;
  activityDays:number[]; history:{day:number;resources:Resources}[];
  log:{day:number;message:string}[]; failureReason:string|null;
  habitat?:HabitatState;
};
export type Command = {type:'advance'|'pause'|'resume'|'abort'|'restart'} | {type:'decide';choiceId:string} | {type:'learn';eventId:string} | {type:'activity';activity:CrewActivity};
