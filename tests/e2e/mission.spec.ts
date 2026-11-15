import {test,expect,type Page} from '@playwright/test';
import {PrismaClient} from '@prisma/client';
import {randomUUID} from 'node:crypto';
import path from 'node:path';
async function launch(page:Page){await page.goto('/');await expect(page.getByRole('heading',{name:/A NEW HOME/})).toBeVisible();await page.getByRole('link',{name:'BEGIN YOUR MISSION',exact:true}).click();await expect(page.getByRole('heading',{name:'First Light',exact:true})).toBeVisible();await page.getByRole('button',{name:'INITIALIZE MISSION'}).click();await expect(page.getByRole('heading',{name:/A little home/})).toBeVisible();}
const dailyChoices=[['Use the onboard checklist','Replace the filter'],['Repair the recovery loop','Clean the array'],['Move the crew into shelter'],['Isolate and repair the circuit','Restore the coolant pump'],['Repair and restart electrolysis']];
test('complete mission, save/load, science debrief, results, and restart',async({page})=>{
 const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));
 await launch(page);
 await page.getByRole('button',{name:'Pause',exact:true}).click();await expect(page.getByRole('button',{name:/Use the onboard checklist/})).toBeDisabled();await page.getByRole('button',{name:'Resume',exact:true}).click();
 for(let day=1;day<=5;day++){
  for(const name of dailyChoices[day-1]){await page.getByRole('button',{name:new RegExp(`^${name}`)}).click();await expect(page.getByRole('heading',{name:'How did your decision affect the mission?'})).toBeVisible();await page.getByRole('button',{name:'Acknowledge & continue'}).click();}
  if(day===1){await page.getByRole('navigation',{name:'Habitat rooms'}).getByRole('button',{name:'Rover Garage',exact:true}).click();await page.getByRole('button',{name:/^Terrain survey/}).click();await page.getByRole('button',{name:'Save mission',exact:true}).click();await page.reload();await expect(page.getByText('Today’s crew activity is complete.',{exact:true})).toBeVisible();}
  if(day<5)await page.getByRole('button',{name:`ADVANCE TO DAY ${day+1}`}).click();else await page.getByRole('button',{name:'COMPLETE MISSION',exact:true}).click();
 }
 await expect(page).toHaveURL(/results/);await expect(page.getByRole('heading',{name:'A small step. A mission accomplished.'})).toBeVisible();await expect(page.getByText('Mission Specialist',{exact:true}).first()).toBeVisible();
 await page.getByRole('button',{name:'Replay mission',exact:true}).click();await expect(page).toHaveURL(/mission/);await expect(page.getByRole('heading',{name:'Earth link interrupted'})).toBeVisible();expect(errors).toEqual([]);
});
test('NASA data explorer and responsive controls remain usable',async({page})=>{
 await page.goto('/science');await page.getByRole('button',{name:'Horizon Station',exact:true}).click();await expect(page.getByText('-3,768 m',{exact:true})).toBeVisible();await page.getByRole('button',{name:'Water recycling',exact:true}).click();await expect(page.getByRole('heading',{name:'Every drop has another mission'})).toBeVisible();
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth+1)).toBe(true);
 await launch(page);expect(await page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth+1)).toBe(true);
 await page.getByRole('button',{name:'Mission settings',exact:true}).click();await expect(page.getByRole('dialog')).toBeVisible();await page.getByRole('button',{name:'End mission',exact:true}).click();await page.getByRole('dialog').getByRole('button',{name:'End mission',exact:true}).click();await expect(page.getByRole('heading',{name:'Mission ended by the commander.'})).toBeVisible();
});
test('guest mission works with the API unavailable',async({page})=>{
 await page.route('**/api/**',route=>route.abort());await launch(page);await page.getByRole('button',{name:/^Use the onboard checklist/}).click();await expect(page.getByRole('heading',{name:'How did your decision affect the mission?'})).toBeVisible();
});
test('account registration, server mission, refresh, profile load and logout',async({page})=>{
 const email=`qa-${randomUUID()}@example.test`;
 const db=new PrismaClient({datasources:{db:{url:`file:${path.resolve('prisma/sqlite/astroquest.db').replaceAll('\\','/')}`}}});
 try{
  await page.goto('/profile');await page.getByRole('button',{name:'New commander? Create an account'}).click();
  await page.getByLabel('Display name').fill('Test Commander');await page.getByLabel('Email address').fill(email);await page.getByLabel(/Password/).fill('Training-only-123!');await page.getByRole('button',{name:'Create account',exact:true}).click();await expect(page.getByRole('heading',{name:'Commander Test Commander',exact:true})).toBeVisible();
  await page.getByRole('link',{name:'Mission briefing',exact:true}).click();await page.getByLabel('Save to Test Commander’s account').check();await page.getByRole('button',{name:'INITIALIZE MISSION'}).click();await page.getByRole('button',{name:/^Use the onboard checklist/}).click();await page.getByRole('button',{name:'Acknowledge & continue'}).click();
  await page.reload();await expect(page.getByRole('heading',{name:'Air-loop maintenance due'})).toBeVisible();await page.getByRole('link',{name:'Commander profile',exact:true}).click();await expect(page.getByRole('button',{name:'Load mission',exact:true})).toBeVisible();await page.getByRole('button',{name:'Load mission',exact:true}).click();await expect(page.getByRole('heading',{name:'Air-loop maintenance due'})).toBeVisible();
  await page.getByRole('button',{name:'Save mission',exact:true}).click();await expect(page.getByRole('status').filter({hasText:'Saved mission synchronized with the server.'})).toBeVisible();await page.getByRole('button',{name:'Dismiss message'}).click();
  await page.getByRole('link',{name:'Commander profile',exact:true}).click();await page.getByRole('button',{name:'Refresh',exact:true}).click();await expect(page.getByRole('button',{name:'Load mission',exact:true})).toBeVisible();
  await page.getByRole('button',{name:'Sign out',exact:true}).click();await expect(page.getByRole('heading',{name:'Welcome back, Commander'})).toBeVisible();
  await page.getByLabel('Email address').fill(email);await page.getByLabel(/Password/).fill('Incorrect-password');await page.getByRole('button',{name:'Sign in',exact:true}).click();await expect(page.getByRole('alert')).toContainText('Email or password is incorrect');
  await page.getByLabel(/Password/).fill('Training-only-123!');await page.getByRole('button',{name:'Sign in',exact:true}).click();await expect(page.getByRole('heading',{name:'Commander Test Commander',exact:true})).toBeVisible();
  await page.getByRole('button',{name:'Load mission',exact:true}).click();await expect(page.getByRole('heading',{name:'Air-loop maintenance due'})).toBeVisible();await page.getByRole('link',{name:'Commander profile',exact:true}).click();await page.getByRole('button',{name:'Sign out',exact:true}).click();
 }finally{await db.user.deleteMany({where:{email}});await db.$disconnect();}
});
