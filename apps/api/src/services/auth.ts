import {randomBytes,scrypt as scryptCallback,timingSafeEqual,createHash} from 'node:crypto';
import {promisify} from 'node:util';
const scrypt=promisify(scryptCallback);
export async function hashPassword(password:string){const salt=randomBytes(16).toString('hex');return `${salt}:${(await scrypt(password,salt,64) as Buffer).toString('hex')}`;}
export async function verifyPassword(password:string,hash:string){const [salt,value]=hash.split(':');const actual=await scrypt(password,salt,64) as Buffer;const expected=Buffer.from(value,'hex');return expected.length===actual.length&&timingSafeEqual(expected,actual);}
export const tokenHash=(token:string)=>createHash('sha256').update(token).digest('hex');
export const newToken=()=>randomBytes(32).toString('hex');
