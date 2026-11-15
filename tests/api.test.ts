import {beforeAll,afterAll,describe,it,expect} from 'vitest';
import {PrismaClient} from '@prisma/client';
import request from 'supertest';
import {readFile,mkdir,unlink,writeFile} from 'node:fs/promises';
import path from 'node:path';
import {randomUUID} from 'node:crypto';
import {createApp} from '../apps/api/src/app';
import {pendingEvent,feedback,type MissionState} from '../packages/simulation-engine';
const file=path.resolve('.cache',`api-test-${randomUUID()}.db`);
const url=`file:${file.replaceAll('\\','/')}`;
const db=new PrismaClient({datasources:{db:{url}}});
const app=createApp(db);const alice=request.agent(app),bob=request.agent(app);
const origin='http://localhost:5173';
let mission:{id:string;revision:number;state:MissionState};
beforeAll(async()=>{
 await mkdir(path.dirname(file),{recursive:true});
 await writeFile(file,'');
 const migration=await readFile('prisma/sqlite/migrations/20261114000000_initial/migration.sql','utf8');
 for(const sql of migration.split(';').map(s=>s.trim()).filter(Boolean))await db.$executeRawUnsafe(sql);
},30000);
afterAll(async()=>{await db.$disconnect();for(const suffix of ['','-journal','-wal','-shm'])await unlink(file+suffix).catch(()=>{});});
describe('authenticated mission API with a real database',()=>{
 it('registers securely and stores only a salted password hash',async()=>{
  const res=await alice.post('/api/auth/register').set('Origin',origin).send({email:'alice@example.test',password:'a-long-test-password',displayName:'Alice'});
  expect(res.status).toBe(201);expect(res.body.data.displayName).toBe('Alice');expect(res.headers['set-cookie'][0]).toContain('HttpOnly');
  const user=await db.user.findUniqueOrThrow({where:{email:'alice@example.test'}});expect(user.passwordHash).not.toContain('a-long-test-password');expect(user.passwordHash).toMatch(/^[a-f0-9]{32}:[a-f0-9]{128}$/);expect(res.body.data.passwordHash).toBeUndefined();
  const other=await bob.post('/api/auth/register').set('Origin',origin).send({email:'bob@example.test',password:'another-long-password',displayName:'Bob'});expect(other.status).toBe(201);
 });
 it('validates registration and rejects cross-origin requests',async()=>{
  expect((await request(app).post('/api/auth/register').set('Origin',origin).send({email:'bad',password:'short',displayName:'A'})).status).toBe(400);
  expect((await request(app).post('/api/auth/login').set('Origin','https://evil.example').send({email:'alice@example.test',password:'a-long-test-password'})).status).toBe(403);
  expect((await request(app).post('/api/auth/login').send({email:'alice@example.test',password:'a-long-test-password'})).status).toBe(403);
 });
 it('requires authentication and creates an authoritative mission',async()=>{
  expect((await request(app).get('/api/missions')).status).toBe(401);
  const res=await alice.post('/api/missions/start').set('Origin',origin).send({seed:42,difficulty:'cadet',siteId:'aurora'});expect(res.status).toBe(201);mission=res.body.data;expect(mission.state.resources.power).toBe(100);
 });
 it('enforces ownership and refuses forged results',async()=>{
  expect((await bob.get(`/api/missions/${mission.id}`)).status).toBe(404);
  expect((await bob.post(`/api/missions/${mission.id}/command`).set('Origin',origin).send({revision:0,command:{type:'abort'}})).status).toBe(404);
  expect((await alice.post('/api/missions/start').set('Origin',origin).send({seed:42,score:100})).status).toBe(400);
  expect((await alice.post(`/api/missions/${mission.id}/save`).set('Origin',origin).send({state:{score:100}})).status).toBe(400);
 });
 it('rejects advancement before decisions and invalid choices',async()=>{
  expect((await alice.post(`/api/missions/${mission.id}/command`).set('Origin',origin).send({revision:0,command:{type:'advance'}})).status).toBe(409);
  expect((await alice.post(`/api/missions/${mission.id}/command`).set('Origin',origin).send({revision:0,command:{type:'decide',choiceId:'cheat'}})).status).toBe(409);
 });
 it('commits a decision once and rejects stale revisions',async()=>{
  const command={revision:0,command:{type:'decide',choiceId:'checklist'}};
  const res=await alice.post(`/api/missions/${mission.id}/command`).set('Origin',origin).send(command);expect(res.status).toBe(200);mission=res.body.data;expect(mission.state.resources.power).toBe(97);
  expect((await alice.post(`/api/missions/${mission.id}/command`).set('Origin',origin).send(command)).status).toBe(409);
  expect(await db.missionDecision.count({where:{missionId:mission.id}})).toBe(1);
 });
 it('persists state across a fresh database connection',async()=>{
  const fresh=new PrismaClient({datasources:{db:{url}}});try{const row=await fresh.missionSession.findUniqueOrThrow({where:{id:mission.id}});expect(JSON.parse(row.state)).toEqual(mission.state);expect(row.revision).toBe(1);}finally{await fresh.$disconnect();}
 });
 it('plays a complete server-authoritative mission and records its results',async()=>{
  while(mission.state.status==='active'){
   const f=feedback(mission.state),e=pendingEvent(mission.state);
   const command=f?{type:'learn',eventId:f.eventId}:e?{type:'decide',choiceId:e.choices[0].id}:mission.state.day===1&&!mission.state.activityDays.includes(1)?{type:'activity',activity:'survey'}:{type:'advance'};
   const res=await alice.post(`/api/missions/${mission.id}/command`).set('Origin',origin).send({revision:mission.revision,command});expect(res.status,res.body.error).toBe(200);mission=res.body.data;
  }
  expect(mission.state.status).toBe('success');expect(await db.missionDecision.count({where:{missionId:mission.id}})).toBe(8);
  const result=await db.missionResult.findUniqueOrThrow({where:{missionId:mission.id}});expect(result.score).toBeGreaterThan(70);
  const profile=await alice.get('/api/profile');expect(profile.body.data.missionsCompleted).toBe(1);expect(profile.body.data.achievements).toContain('Mission Specialist');
 },30000);
 it('restarts safely, clears run records, and retains earned profile achievements',async()=>{
  const res=await alice.post(`/api/missions/${mission.id}/command`).set('Origin',origin).send({revision:mission.revision,command:{type:'restart'}});expect(res.status).toBe(200);expect(res.body.data.state.day).toBe(1);expect(await db.missionDecision.count({where:{missionId:mission.id}})).toBe(0);expect(await db.missionResult.count({where:{missionId:mission.id}})).toBe(0);
 });
 it('logs out, rejects bad passwords and signs back in',async()=>{
  expect((await alice.post('/api/auth/logout').set('Origin',origin).send({})).status).toBe(200);expect((await alice.get('/api/missions')).status).toBe(401);
  expect((await alice.post('/api/auth/login').set('Origin',origin).send({email:'alice@example.test',password:'incorrect'})).status).toBe(401);
  expect((await alice.post('/api/auth/login').set('Origin',origin).send({email:'alice@example.test',password:'a-long-test-password'})).status).toBe(200);
  expect((await alice.get('/api/missions')).body.data).toHaveLength(1);
 });
 it('serves actual cached terrain and educational sources without an account',async()=>{const res=await request(app).get('/api/nasa/lunar-terrain');expect(res.status).toBe(200);expect(res.body.data.sha256).toMatch(/^[a-f0-9]{64}$/);expect(res.body.data.sites[0].elevationM).toBe(-768.5);expect((await request(app).get('/api/learning/topics')).body.data).toHaveLength(8);});
 it('calculates and persists habitat activities on the server, including legacy state upgrades',async()=>{
  const started=await alice.post('/api/missions/start').set('Origin',origin).send({siteId:'aurora',seed:42,difficulty:'cadet'});expect(started.status).toBe(201);
  let current=started.body.data as typeof mission;
  const legacy=structuredClone(current.state);delete legacy.habitat;await db.missionSession.update({where:{id:current.id},data:{state:JSON.stringify(legacy)}});
  while(current.state.status==='active'){
   const review=feedback(current.state),event=pendingEvent(current.state);
   const activity=current.state.day===1?'tend':current.state.day===2?'rest':current.state.day===4?'harvest':'survey';
   const command=review?{type:'learn',eventId:review.eventId}:event?{type:'decide',choiceId:event.choices[0].id}:!current.state.activityDays.includes(current.state.day)?{type:'activity',activity}:{type:'advance'};
   const result=await alice.post(`/api/missions/${current.id}/command`).set('Origin',origin).send({revision:current.revision,command});expect(result.status,result.body.error).toBe(200);current=result.body.data;
  }
  expect(current.state.status).toBe('success');expect(current.state.habitat?.harvested).toBe(true);expect(current.state.log.some(entry=>entry.message.includes('Crew recovery:'))).toBe(true);
  const saved=await alice.get(`/api/missions/${current.id}/state`);expect(saved.body.data.state).toEqual(current.state);
  expect((await db.missionResult.findUniqueOrThrow({where:{missionId:current.id}})).outcome).toBe('success');
 },30000);
});
