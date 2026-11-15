import 'dotenv/config';
import {PrismaClient} from '@prisma/client';
// Zero-credential local mode. Production must explicitly supply DATABASE_URL.
if(!process.env.DATABASE_URL){
 if(process.env.NODE_ENV==='production')throw new Error('DATABASE_URL is required in production');
 process.env.DATABASE_URL='file:./astroquest.db';
}
export const db=new PrismaClient();
