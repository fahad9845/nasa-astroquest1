import {test,expect,type Page} from '@playwright/test';
import {readFile} from 'node:fs/promises';
import {events} from '../../packages/simulation-engine/events';
import type {MissionState} from '../../packages/simulation-engine/types';
import {lessons} from '../../packages/shared-config/science';

const runtimeErrors=new WeakMap<Page,string[]>();
test.beforeEach(({page})=>{const errors:string[]=[];runtimeErrors.set(page,errors);page.on('pageerror',error=>errors.push(error.message));});
test.afterEach(({page})=>{expect(runtimeErrors.get(page)).toEqual([]);});

async function start(page:Page){await page.goto('/briefing');await page.getByRole('button',{name:'INITIALIZE MISSION'}).click();await expect(page.getByRole('heading',{name:/A little home/})).toBeVisible();}
async function choose(page:Page,label:string){await page.getByRole('button',{name:new RegExp(`^${label}`)}).click();await page.getByRole('button',{name:'Acknowledge & continue'}).click();}
async function noOverflow(page:Page){expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1)).toBe(true);}
async function guestState(page:Page):Promise<MissionState>{return page.evaluate(()=>JSON.parse(localStorage.getItem('astroquest.guest.v1')!).mission.state);}

test('NASA loading, authentic fallback, retry, provenance, and image recovery',async({page})=>{
 let release!:()=>void;const gate=new Promise<void>(resolve=>{release=resolve;});
 await page.route('**/api/nasa/lunar-terrain',async route=>{await gate;await route.fulfill({status:503,body:'Unavailable'});});
 await page.route('**/nasa/south-pole-illumination.jpg',route=>route.abort());
 await page.goto('/science');
 await expect(page.getByText('Checking server copy; showing bundled NASA data.')).toBeVisible();
 release();await expect(page.getByText('Server copy unavailable or invalid; using verified bundled NASA data.')).toBeVisible();
 await page.getByRole('button',{name:'Horizon Station',exact:true}).click();await expect(page.getByText('-3,768 m',{exact:true})).toBeVisible();
 await page.getByText('Dataset provenance & mission effect',{exact:true}).click();
 await expect(page.getByText(/Reference sphere radius: 1,737,400 m/)).toBeVisible();
 await expect(page.getByText(/Horizon Station starts at 99% equipment integrity/)).toBeVisible();
 await expect(page.getByRole('link',{name:'Original NASA PDS label',exact:true})).toHaveAttribute('href',/pds-geosciences\.wustl\.edu\/.*ldem_4.lbl$/);
 await noOverflow(page);
 await page.unroute('**/api/nasa/lunar-terrain');await page.getByRole('button',{name:'Retry data connection'}).click();
 await expect(page.getByText('Server copy matches the reviewed NASA dataset.')).toBeVisible();
 await page.getByRole('heading',{name:'Where the sunlight falls'}).scrollIntoViewIfNeeded();await expect(page.getByText(/NASA visualization unavailable/)).toBeVisible();
 await page.unroute('**/nasa/south-pole-illumination.jpg');await page.getByRole('button',{name:'Retry image'}).click();
 const image=page.getByRole('img',{name:/NASA scientific visualization/});await expect(image).toBeVisible();
 await expect.poll(()=>image.evaluate((img:HTMLImageElement)=>img.complete&&img.naturalWidth>0)).toBe(true);
 await expect(page.getByText('Loading NASA illumination visualization…')).toHaveCount(0);
});

test('map keyboard selection, briefing options, all lessons and narrow layouts',async({page})=>{
 await page.goto('/briefing');
 for(const site of ['Farpoint Base','Aurora Ridge','Horizon Station']){await page.getByRole('button',{name:`Select ${site}`,exact:true}).click();await expect(page.getByRole('button',{name:site,exact:true})).toHaveAttribute('aria-pressed','true');}
 const horizon=page.getByRole('button',{name:'Horizon Station',exact:true});await horizon.focus();await page.keyboard.press('Enter');await expect(horizon).toHaveAttribute('aria-pressed','true');
 await page.getByLabel('Training difficulty').selectOption('commander');await page.getByLabel(/Mission seed/).fill('43');
 await page.getByRole('button',{name:'INITIALIZE MISSION'}).click();
 await expect(page.locator('.mission-overview').getByRole('meter',{name:'Equipment integrity',exact:true})).toHaveAttribute('aria-valuenow','99');
 await expect(page.getByRole('heading',{name:'Air-loop maintenance due'})).toBeVisible();
 await page.getByRole('button',{name:'Mission settings'}).click();await expect(page.getByRole('dialog')).toContainText('commander');await expect(page.getByRole('dialog')).toContainText('43');await page.keyboard.press('Escape');
 await choose(page,'Replace the filter');await choose(page,'Use the onboard checklist');
 await page.getByRole('navigation',{name:'Habitat rooms'}).getByRole('button',{name:'Rover Garage',exact:true}).click();
 await expect(page.getByRole('button',{name:/^Terrain survey/})).toContainText('−5 power');await page.getByRole('button',{name:/^Terrain survey/}).click();
 await expect(page.locator('.mission-overview').getByRole('meter',{name:'Power',exact:true})).toHaveAttribute('aria-valuenow','87');
 await page.getByRole('link',{name:'Science Center',exact:true}).click();
 for(const lesson of lessons){await page.getByRole('navigation',{name:'Science topics'}).getByRole('button',{name:lesson.topic,exact:true}).click();await expect(page.getByRole('heading',{name:lesson.title,exact:true})).toBeVisible();await expect(page).toHaveURL(new RegExp(`topic=${lesson.id}`));}
 for(const width of [320,390,768,1024,1440]){await page.setViewportSize({width,height:900});await page.getByText('Dataset provenance & mission effect',{exact:true}).evaluate((summary:HTMLElement)=>{(summary.parentElement as HTMLDetailsElement).open=true;});await noOverflow(page);}
 await page.getByRole('link',{name:'Lunar Habitat',exact:true}).click();await expect(page.getByText('Today’s crew activity is complete.',{exact:true})).toBeVisible();
});

test('system controls, resource help, activities, log, save, restart confirmation and navigation',async({page})=>{
 await start(page);
 for(const room of ['Crew Quarters','Life Support','Greenhouse','Power Station','Rover Garage','Laboratory','Equipment Storage','Airlock']){await page.getByRole('navigation',{name:'Habitat rooms'}).getByRole('button',{name:room,exact:true}).click();await expect(page.getByRole('heading',{name:room,exact:true})).toBeVisible();}
 for(const resource of ['Oxygen','Water','Food','Power','Crew health','Radiation protection','Equipment integrity']){
  await page.locator('.mission-overview').getByRole('button',{name:`About ${resource}`,exact:true}).click();await expect(page.getByRole('dialog',{name:resource,exact:true})).toBeVisible();await expect(page.getByRole('dialog')).toContainText('not a NASA operational measurement');await page.getByRole('button',{name:'Close dialog'}).click();
 }
 await choose(page,'Use the onboard checklist');await choose(page,'Replace the filter');
 await page.getByRole('navigation',{name:'Habitat rooms'}).getByRole('button',{name:'Power Station',exact:true}).click();
 await page.getByRole('button',{name:/^Maintain equipment/}).click();await expect(page.locator('.mission-overview').getByRole('meter',{name:'Power',exact:true})).toHaveAttribute('aria-valuenow','86');await expect(page.getByRole('button',{name:/^Conserve power/})).toBeDisabled();
 await page.getByRole('button',{name:'Full log',exact:true}).click();await expect(page.getByRole('dialog')).toContainText('Crew assignment completed: maintenance.');await page.getByRole('button',{name:'Close dialog'}).click();
 await page.getByRole('button',{name:'Save mission',exact:true}).click();await expect(page.getByRole('status').filter({hasText:'Guest mission saved'})).toBeVisible();await page.getByRole('button',{name:'Dismiss message'}).click();
 await page.getByRole('button',{name:'ADVANCE TO DAY 2'}).click();await choose(page,'Repair the recovery loop');await choose(page,'Clean the array');
 const power=Number(await page.locator('.mission-overview').getByRole('meter',{name:'Power',exact:true}).getAttribute('aria-valuenow'));
 await page.getByRole('button',{name:/^Conserve power/}).click();await expect(page.locator('.mission-overview').getByRole('meter',{name:'Power',exact:true})).toHaveAttribute('aria-valuenow',String(Math.min(100,Math.round((power+5)*10)/10)));
 await page.getByRole('button',{name:'Mission settings'}).click();await page.getByRole('button',{name:'Restart mission',exact:true}).click();await page.getByRole('button',{name:'Keep playing'}).click();await expect(page.getByText('Day 2 of 5',{exact:true})).toBeVisible();
 await page.getByRole('button',{name:'Mission settings'}).click();await page.getByRole('button',{name:'Restart mission',exact:true}).click();await page.getByRole('dialog').getByRole('button',{name:'Restart mission',exact:true}).click();await expect(page.getByText('Day 1 of 5',{exact:true})).toBeVisible();await expect(page.locator('.mission-overview').getByRole('meter',{name:'Power',exact:true})).toHaveAttribute('aria-valuenow','100');
 await page.getByRole('link',{name:'AstroQuest overview',exact:true}).click();await page.getByRole('link',{name:/Resume your saved mission/}).click();await expect(page).toHaveURL(/mission/);
 await page.getByRole('link',{name:'Commander profile',exact:true}).click();await page.getByRole('button',{name:'Load guest save'}).click();await expect(page.getByRole('heading',{name:'Earth link interrupted'})).toBeVisible();
});

test('unsafe decisions lead to failure, a truthful export, and a clean restart',async({page})=>{
 const errors:string[]=[];page.on('pageerror',error=>errors.push(error.message));
 await start(page);let state=await guestState(page);
 for(let step=0;state.status==='active'&&step<40;step++){
  const review=state.decisions.find(decision=>!state.learned.includes(decision.eventId)),event=events.find(event=>event.day===state.day&&!state.decisions.some(decision=>decision.eventId===event.id));
  if(review)await page.getByRole('button',{name:'Acknowledge & continue'}).click();
  else if(event){const choice=event.choices.at(-1)!;await page.getByRole('heading',{name:event.title,exact:true}).waitFor();await page.getByRole('button',{name:new RegExp(`^${choice.label}`)}).click();}
  else await page.getByRole('button',{name:state.day===5?'COMPLETE MISSION':`ADVANCE TO DAY ${state.day+1}`,exact:true}).click();
  state=await guestState(page);
 }
 expect(state.status).toBe('failed');expect(state.day).toBe(4);expect(state.resources.health).toBe(0);await expect(page.getByRole('heading',{name:'Every mission teaches us something.'})).toBeVisible();await expect(page.getByText(state.failureReason!,{exact:true})).toBeVisible();
 const downloaded=page.waitForEvent('download');await page.getByRole('button',{name:'Export debrief'}).click();const file=await downloaded;expect(file.suggestedFilename()).toBe('astroquest-mission-debrief.json');
 const report=JSON.parse(await readFile((await file.path())!,'utf8'));expect(report.mission).toEqual(state);expect(report.result.score).toBeLessThanOrEqual(49);expect(report.result.achievements).toEqual([]);
 await noOverflow(page);await page.getByRole('button',{name:'Replay mission',exact:true}).click();await expect(page.locator('.mission-overview').getByRole('meter',{name:'Crew health',exact:true})).toHaveAttribute('aria-valuenow','100');expect(errors).toEqual([]);
});

test('corrupt and unavailable guest storage do not crash gameplay',async({page})=>{
 await page.addInitScript(()=>{localStorage.setItem('astroquest.guest.v1','{"mission":{"state":{"broken":true}}}');});
 await page.goto('/mission');await expect(page.getByRole('heading',{name:'Every great mission starts with a briefing.'})).toBeVisible();
 await page.evaluate(()=>{Storage.prototype.setItem=function(){throw new DOMException('Storage unavailable','QuotaExceededError');};});
 await page.getByRole('link',{name:'View mission briefing',exact:true}).click();await page.getByRole('button',{name:'INITIALIZE MISSION'}).click();
 await expect(page.getByRole('alert')).toContainText('This browser cannot save progress');await choose(page,'Use the onboard checklist');await expect(page.getByRole('heading',{name:'Air-loop maintenance due'})).toBeVisible();
});

test('all routes fit a narrow screen and empty states provide working navigation',async({page})=>{
 await page.setViewportSize({width:320,height:740});
 await page.goto('/results');await expect(page.getByRole('heading',{name:'Your mission story is still being written.'})).toBeVisible();await noOverflow(page);
 await page.getByRole('link',{name:'Begin a mission',exact:true}).click();await expect(page).toHaveURL(/briefing/);await noOverflow(page);
 await page.getByRole('button',{name:'INITIALIZE MISSION'}).click();await noOverflow(page);
 await page.goto('/results');await page.getByRole('link',{name:'Return to mission',exact:true}).click();await expect(page).toHaveURL(/mission/);
 await page.getByRole('link',{name:'Commander profile',exact:true}).click();await noOverflow(page);
 await page.goto('/missing-route');await expect(page.getByRole('heading',{name:'Outside mission boundaries'})).toBeVisible();await page.getByRole('link',{name:'Return to base'}).click();await expect(page).toHaveURL('/');await noOverflow(page);
});
