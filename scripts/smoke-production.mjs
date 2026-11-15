import {spawn} from 'node:child_process';
import path from 'node:path';
import {chromium} from '@playwright/test';
const origin='http://127.0.0.1:3002';
const server=spawn(process.execPath,['dist/api/index.js'],{env:{...process.env,NODE_ENV:'production',DATABASE_URL:`file:${path.resolve('prisma/sqlite/astroquest.db').replaceAll('\\','/')}`,PORT:'3002',WEB_ORIGIN:origin},stdio:'pipe',windowsHide:true});
let browser;
try{
 let ready=false;
 for(let i=0;i<40;i++){
  try{const response=await fetch(origin+'/api/health');if(response.ok){ready=true;break;}}catch{/* startup */}
  await new Promise(resolve=>setTimeout(resolve,250));
 }
 if(!ready)throw new Error('Production server did not become healthy');
 browser=await chromium.launch({channel:'msedge',headless:true});const page=await browser.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto(origin);await page.getByRole('link',{name:'BEGIN YOUR MISSION',exact:true}).click();await page.getByRole('button',{name:'INITIALIZE MISSION'}).click();await page.getByRole('button',{name:/^Use the onboard checklist/}).click();await page.getByRole('heading',{name:'How did your decision affect the mission?'}).waitFor();
 await page.goto(origin+'/science');await page.getByRole('heading',{name:'Curiosity is your best equipment.'}).waitFor();
 await page.goto(origin+'/profile');await page.getByRole('heading',{name:/Your commander’s log\.|Your next chapter starts here\./}).waitFor();
 if(errors.length)throw new Error(errors.join('\n'));
 console.log('Production bundle: health, SPA deep routes, guest initialization, decision feedback, science and profile passed.');
}finally{await browser?.close();server.kill();}
