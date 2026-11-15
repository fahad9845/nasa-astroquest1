import express,{type Request,type Response,type NextFunction} from 'express';
import helmet from 'helmet';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import rateLimit from 'express-rate-limit';
import {z,ZodError} from 'zod';
import type {PrismaClient} from '@prisma/client';
import {initialState,transition,evaluate,isTerminal,sites,type MissionState} from '../../../packages/simulation-engine';
import {sources,lessons} from '../../../packages/shared-config/science';
import terrain from '../../web/src/data/nasa/processed/terrain.json';
import {hashPassword,verifyPassword,tokenHash,newToken} from './services/auth';

const optionsSchema=z.object({seed:z.number().int().min(0).max(2147483647).default(42),difficulty:z.enum(['cadet','commander']).default('cadet'),siteId:z.enum(['aurora','horizon','farpoint']).default('aurora')}).strict();
const commandSchema=z.discriminatedUnion('type',[
 z.object({type:z.literal('decide'),choiceId:z.string().min(1).max(50)}).strict(),
 z.object({type:z.literal('learn'),eventId:z.string().min(1).max(50)}).strict(),
 z.object({type:z.literal('activity'),activity:z.enum(['survey','maintenance','conserve','rest','tend','harvest'])}).strict(),
 z.object({type:z.enum(['advance','pause','resume','abort','restart'])}).strict()
]);
const commandInput=z.object({revision:z.number().int().min(0),command:commandSchema}).strict();
class HttpError extends Error {constructor(public status:number,message:string){super(message);}}
const asyncRoute=(fn:(req:Request,res:Response)=>Promise<unknown>)=>(req:Request,res:Response,next:NextFunction)=>{Promise.resolve(fn(req,res)).catch(next);};
const publicUser=(user:{id:string;email:string;profile:{displayName:string}|null})=>({id:user.id,email:user.email,displayName:user.profile?.displayName??'Commander'});
const payload=(mission:{id:string;revision:number;state:string})=>({id:mission.id,revision:mission.revision,state:JSON.parse(mission.state)});

export function createApp(db:PrismaClient){
 const app=express();
 const production=process.env.NODE_ENV==='production';
 const allowedOrigins=(process.env.WEB_ORIGIN??'http://localhost:5173,http://127.0.0.1:5173').split(',').map(v=>v.trim());
 if(production)app.set('trust proxy',1);
 app.use(helmet());
 app.use(cors({origin:(origin,cb)=>cb(null,!origin||allowedOrigins.includes(origin)),credentials:true}));
 app.use(express.json({limit:'16kb'}),cookieParser());
 app.use('/api',rateLimit({windowMs:60000,limit:180,standardHeaders:'draft-7',legacyHeaders:false}));
 app.use('/api',(req,res,next)=>{
  res.setHeader('Cache-Control','no-store');
  if(!['GET','HEAD','OPTIONS'].includes(req.method)&&(!req.headers.origin||!allowedOrigins.includes(req.headers.origin)))return next(new HttpError(403,'Request origin is not allowed'));
  next();
 });
 const cookieOptions={httpOnly:true,secure:production,sameSite:(process.env.COOKIE_SAME_SITE==='none'?'none':'lax') as 'none'|'lax',path:'/api',maxAge:7*86400000};
 async function currentUser(req:Request){
  const token=req.cookies.aq_session;if(typeof token!=='string'||token.length!==64)return null;
  const session=await db.authSession.findUnique({where:{tokenHash:tokenHash(token)},include:{user:{include:{profile:true}}}});
  return session&&session.expiresAt>new Date()?session.user:null;
 }
 async function requireUser(req:Request){const user=await currentUser(req);if(!user)throw new HttpError(401,'Please sign in');return user;}
 async function ownedMission(req:Request){const user=await requireUser(req);const mission=await db.missionSession.findFirst({where:{id:String(req.params.id),userId:user.id}});if(!mission)throw new HttpError(404,'Mission not found');return {user,mission};}
 async function loginSession(res:Response,userId:string){const token=newToken();await db.authSession.create({data:{tokenHash:tokenHash(token),userId,expiresAt:new Date(Date.now()+7*86400000)}});res.cookie('aq_session',token,cookieOptions);}
 app.get('/api/health',asyncRoute(async(_req,res)=>{await db.$queryRaw`SELECT 1`;res.json({data:{status:'ok',database:'connected'}});}));
 const authLimit=rateLimit({windowMs:15*60000,limit:30,standardHeaders:'draft-7',legacyHeaders:false});
 app.post('/api/auth/register',authLimit,asyncRoute(async(req,res)=>{
  const input=z.object({email:z.string().email().max(254).transform(v=>v.toLowerCase().trim()),password:z.string().min(10).max(128),displayName:z.string().trim().min(2).max(40)}).strict().parse(req.body);
  const user=await db.user.create({data:{email:input.email,passwordHash:await hashPassword(input.password),profile:{create:{displayName:input.displayName}}},include:{profile:true}});
  await loginSession(res,user.id);res.status(201).json({data:publicUser(user)});
 }));
 app.post('/api/auth/login',authLimit,asyncRoute(async(req,res)=>{
  const input=z.object({email:z.string().email().max(254).transform(v=>v.toLowerCase().trim()),password:z.string().min(1).max(128)}).strict().parse(req.body);
  const user=await db.user.findUnique({where:{email:input.email},include:{profile:true}});
  // Keep password derivation work comparable for unknown accounts.
  const valid=await verifyPassword(input.password,user?.passwordHash??`${'0'.repeat(32)}:${'0'.repeat(128)}`);
  if(!user||!valid)throw new HttpError(401,'Email or password is incorrect');
  await loginSession(res,user.id);res.json({data:publicUser(user)});
 }));
 app.post('/api/auth/logout',asyncRoute(async(req,res)=>{if(req.cookies.aq_session)await db.authSession.deleteMany({where:{tokenHash:tokenHash(req.cookies.aq_session)}});res.clearCookie('aq_session',{httpOnly:true,secure:production,sameSite:cookieOptions.sameSite,path:'/api'});res.json({data:{ok:true}});}));
 app.get('/api/auth/me',asyncRoute(async(req,res)=>{const user=await currentUser(req);res.json({data:user?publicUser(user):null});}));
 app.get('/api/missions',asyncRoute(async(req,res)=>{const user=await requireUser(req);const missions=await db.missionSession.findMany({where:{userId:user.id},orderBy:{updatedAt:'desc'},take:50,include:{result:true}});res.json({data:missions.map(m=>({...payload(m),updatedAt:m.updatedAt,result:m.result}))});}));
 app.post('/api/missions/start',asyncRoute(async(req,res)=>{const user=await requireUser(req);const state=initialState(optionsSchema.parse(req.body));const mission=await db.missionSession.create({data:{userId:user.id,state:JSON.stringify(state)}});res.status(201).json({data:payload(mission)});}));
 app.get(['/api/missions/:id','/api/missions/:id/state'],asyncRoute(async(req,res)=>{const {mission}=await ownedMission(req);res.json({data:payload(mission)});}));
 app.post('/api/missions/:id/save',asyncRoute(async(req,res)=>{z.object({}).strict().parse(req.body);const {mission}=await ownedMission(req);res.json({data:payload(mission)});}));
 app.post('/api/missions/:id/command',asyncRoute(async(req,res)=>{
  const {user,mission}=await ownedMission(req);const input=commandInput.parse(req.body);
  if(mission.revision!==input.revision)throw new HttpError(409,'Mission changed in another tab. Reload the saved state.');
  let next:MissionState;try{next=transition(JSON.parse(mission.state),input.command as Parameters<typeof transition>[1]);}catch(error){throw new HttpError(409,(error as Error).message);}
  const updated=await db.$transaction(async tx=>{
   const changed=await tx.missionSession.updateMany({where:{id:mission.id,userId:user.id,revision:input.revision},data:{state:JSON.stringify(next),revision:{increment:1}}});
   if(changed.count!==1)throw new HttpError(409,'Mission changed in another tab. Reload the saved state.');
   if(input.command.type==='restart'){await tx.missionDecision.deleteMany({where:{missionId:mission.id}});await tx.missionResult.deleteMany({where:{missionId:mission.id}});}
   if(input.command.type==='decide'){const d=next.decisions.at(-1)!;await tx.missionDecision.create({data:{missionId:mission.id,eventId:d.eventId,choiceId:d.choiceId,day:d.day}});}
   if(isTerminal(next)){
    const result=evaluate(next);await tx.missionResult.upsert({where:{missionId:mission.id},create:{missionId:mission.id,score:result.score,outcome:next.status,summary:JSON.stringify(result)},update:{score:result.score,outcome:next.status,summary:JSON.stringify(result)}});
    for(const achievementId of result.achievements){await tx.achievement.upsert({where:{id:achievementId},create:{id:achievementId},update:{}});await tx.userAchievement.upsert({where:{userId_achievementId:{userId:user.id,achievementId}},create:{userId:user.id,achievementId},update:{}});}
   }
   return tx.missionSession.findUniqueOrThrow({where:{id:mission.id}});
  });res.json({data:payload(updated)});
 }));
 app.get('/api/profile',asyncRoute(async(req,res)=>{const user=await requireUser(req);const achievements=await db.userAchievement.findMany({where:{userId:user.id}});const results=await db.missionResult.findMany({where:{mission:{userId:user.id}}});res.json({data:{...publicUser(user),achievements:achievements.map(a=>a.achievementId),missionsCompleted:results.filter(r=>r.outcome==='success').length,bestScore:Math.max(0,...results.map(r=>r.score))}});}));
 app.get('/api/nasa/sources',(_req,res)=>res.json({data:sources}));
 app.get('/api/nasa/lunar-terrain',(_req,res)=>res.json({data:{...terrain,sites}}));
 app.get('/api/nasa/illumination',(_req,res)=>res.json({data:{source:sources.find(s=>s.id==='illumination'),image:'/nasa/south-pole-illumination.jpg',kind:'visualization',numericIrradianceAvailable:false,schedulesAreSimulated:true}}));
 app.get('/api/learning/topics',(_req,res)=>res.json({data:lessons}));
 app.get('/api/learning/:topicId',(req,res)=>{const lesson=lessons.find(t=>t.id===req.params.topicId);res.status(lesson?200:404).json(lesson?{data:lesson}:{error:'Lesson not found'});});
 app.use('/api',(_req,res)=>res.status(404).json({error:'API route not found'}));
 app.use((error:unknown,_req:Request,res:Response,_next:NextFunction)=>{
  if(error instanceof ZodError)return res.status(400).json({error:'Invalid input',issues:error.issues.map(i=>({path:i.path.join('.'),message:i.message}))});
  if(error instanceof HttpError)return res.status(error.status).json({error:error.message});
  if((error as {code?:string}).code==='P2002')return res.status(409).json({error:'This account or record already exists'});
  if(error instanceof SyntaxError)return res.status(400).json({error:'Invalid JSON'});
  console.error('API error:',error instanceof Error?error.name:'Unknown error');return res.status(500).json({error:'The mission service is unavailable. Guest missions remain available.'});
 });
 return app;
}
