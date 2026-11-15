import 'dotenv/config';
import express from 'express';
import path from 'node:path';
import {db} from './services/database';
import {createApp} from './app';
const app=createApp(db);
if(process.env.NODE_ENV==='production'){
 app.use(express.static(path.resolve('dist/client')));
 app.get('*',(_req,res)=>res.sendFile(path.resolve('dist/client/index.html')));
}
const server=app.listen(Number(process.env.PORT??3001),process.env.NODE_ENV==='production'?'0.0.0.0':'127.0.0.1',()=>console.log(`AstroQuest API: http://127.0.0.1:${process.env.PORT??3001}`));
for(const signal of ['SIGINT','SIGTERM'])process.on(signal,()=>{server.close(()=>{void db.$disconnect().then(()=>process.exit(0));});});
