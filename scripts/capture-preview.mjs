import {chromium} from '@playwright/test';
import {mkdir} from 'node:fs/promises';
await mkdir('docs/screenshots',{recursive:true});
const browser=await chromium.launch({channel:'msedge',headless:true});
async function settle(page){
 await page.waitForFunction(()=>Array.from(document.querySelectorAll('#main>div, .resource-value>strong, #mission-event>div, .results-hero, .score-number')).every(el=>getComputedStyle(el).opacity==='1'));
}
try{
 for(const [name,viewport] of [['desktop',{width:1440,height:1000}],['mobile',{width:390,height:844}]]){
  const context=await browser.newContext({viewport,reducedMotion:'reduce'});const page=await context.newPage();
  await page.goto('http://127.0.0.1:5173/');await page.getByRole('heading',{name:/A NEW HOME/}).waitFor();await page.evaluate(()=>document.fonts.ready);await page.waitForFunction(()=>getComputedStyle(document.querySelector('#main>div')).opacity==='1');
  await page.screenshot({path:`docs/screenshots/landing-${name}.png`,fullPage:true});
  await page.getByRole('link',{name:'BEGIN YOUR MISSION',exact:true}).click();await page.getByRole('button',{name:'INITIALIZE MISSION'}).click();await page.getByRole('heading',{name:/A little home/}).waitFor();
  await settle(page);await page.evaluate(()=>window.scrollTo(0,0));await page.screenshot({path:`docs/screenshots/mission-${name}.png`,fullPage:true});
  await page.goto('http://127.0.0.1:5173/science');await page.getByRole('heading',{name:'Curiosity is your best equipment.'}).waitFor();
  await page.getByText('Dataset provenance & mission effect',{exact:true}).click();
  await page.getByRole('heading',{name:'Where the sunlight falls'}).scrollIntoViewIfNeeded();
  await page.waitForFunction(()=>{const image=document.querySelector('.nasa-image img');return image?.complete&&image.naturalWidth>0;});
  await page.evaluate(()=>window.scrollTo(0,0));await page.screenshot({path:`docs/screenshots/science-${name}.png`,fullPage:true});
  await page.goto('http://127.0.0.1:5173/mission');
  const daily=[['Use the onboard checklist','Replace the filter'],['Repair the recovery loop','Clean the array'],['Move the crew into shelter'],['Isolate and repair the circuit','Restore the coolant pump'],['Repair and restart electrolysis']];
  for(let day=1;day<=5;day++){
   if(day===3){await page.locator('.mission-alert').waitFor();await settle(page);await page.evaluate(()=>window.scrollTo(0,0));await page.screenshot({path:`docs/screenshots/critical-${name}.png`,fullPage:true});}
   for(const choice of daily[day-1]){await page.getByRole('button',{name:new RegExp(`^${choice}`)}).click();await page.getByRole('button',{name:'Acknowledge & continue'}).click();}
   await page.getByRole('button',{name:day===5?'COMPLETE MISSION':`ADVANCE TO DAY ${day+1}`,exact:true}).click();
  }
  await page.getByRole('heading',{name:'A small step. A mission accomplished.'}).waitFor();
  await page.waitForFunction(()=>getComputedStyle(document.querySelector('#main>div')).opacity==='1'&&getComputedStyle(document.querySelector('.results-hero')).opacity==='1');
  await page.evaluate(()=>window.scrollTo(0,0));await page.screenshot({path:`docs/screenshots/results-${name}.png`,fullPage:true});
  await page.getByRole('link',{name:'Review mission journal',exact:true}).click();
  await page.getByRole('heading',{name:'Our days on the Moon.'}).waitFor();
  await page.waitForFunction(()=>getComputedStyle(document.querySelector('#main>div')).opacity==='1');
  await page.screenshot({path:`docs/screenshots/journal-${name}.png`,fullPage:true});
  console.log(`${name}: ${await page.title()}, viewport ${viewport.width}px, document ${await page.evaluate(()=>document.documentElement.scrollWidth)}px`);
  await context.close();
 }
}finally{await browser.close();}
