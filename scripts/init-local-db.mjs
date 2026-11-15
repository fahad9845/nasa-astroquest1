import {mkdirSync,closeSync,openSync,existsSync} from 'node:fs';
import 'dotenv/config';
if(process.env.DATABASE_URL && !process.env.DATABASE_URL.startsWith('file:'))throw new Error('Use npm run db:postgres for a PostgreSQL connection.');
mkdirSync('prisma/sqlite',{recursive:true});
// Prisma 6 on Windows may fail to create a missing SQLite file during migrate deploy.
// Never truncate an existing database.
const localUrl=process.env.DATABASE_URL??'file:./astroquest.db';
const path=new URL(localUrl.slice(5),new URL('../prisma/sqlite/',import.meta.url));
if(!existsSync(path))closeSync(openSync(path,'a'));
