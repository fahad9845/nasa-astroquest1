import {z} from 'zod';
const resources=z.object({oxygen:z.number().min(0).max(100),water:z.number().min(0).max(100),food:z.number().min(0).max(100),power:z.number().min(0).max(100),shielding:z.number().min(0).max(100),health:z.number().min(0).max(100),equipment:z.number().min(0).max(100)});
export const stateSchema=z.object({
 habitat:z.object({fatigue:z.number().min(0).max(100),cropGrowth:z.number().min(0).max(100),cropCondition:z.number().min(0).max(100),harvested:z.boolean()}).optional(),
 version:z.literal(1),options:z.object({seed:z.number().int().min(0).max(2147483647),difficulty:z.enum(['cadet','commander']),siteId:z.enum(['aurora','horizon','farpoint'])}),day:z.number().int().min(1).max(5),completedDays:z.number().int().min(0).max(5),status:z.enum(['active','paused','success','failed','aborted']),resources,previous:resources,
 decisions:z.array(z.object({eventId:z.string(),choiceId:z.string(),day:z.number(),label:z.string(),explanation:z.string(),effects:z.object({oxygen:z.number(),water:z.number(),food:z.number(),power:z.number(),shielding:z.number(),health:z.number(),equipment:z.number()}).partial(),points:z.number()})).max(8),
 learned:z.array(z.string()).max(8),surveys:z.number().int().min(0).max(5),activityDays:z.array(z.number()).max(5),history:z.array(z.object({day:z.number(),resources})).max(6),log:z.array(z.object({day:z.number(),message:z.string()})).max(60),failureReason:z.string().nullable()
});
