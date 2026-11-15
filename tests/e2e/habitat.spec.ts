import {test,expect,type Page} from '@playwright/test';
async function room(page:Page,name:string){await page.getByRole('navigation',{name:'Habitat rooms'}).getByRole('button',{name,exact:true}).click();}
async function choose(page:Page,name:string){await page.getByRole('button',{name:new RegExp(`^${name}`)}).click();await page.getByRole('button',{name:'Acknowledge & continue'}).click();}
const daily=[['Use the onboard checklist','Replace the filter'],['Repair the recovery loop','Clean the array'],['Move the crew into shelter'],['Isolate and repair the circuit','Restore the coolant pump'],['Repair and restart electrolysis']];
test('room-based mission: tend, rest, harvest, journal, explorer and archived habitat',async({page})=>{
 const errors:string[]=[];page.on('pageerror',error=>errors.push(error.message));
 await page.goto('/');await expect(page.getByRole('heading',{name:/A NEW HOME/})).toBeVisible();await page.getByRole('link',{name:'BEGIN YOUR MISSION',exact:true}).click();await page.getByRole('button',{name:'INITIALIZE MISSION'}).click();
 const greenhouse=page.getByRole('button',{name:'Open Greenhouse',exact:true});await greenhouse.focus();await page.keyboard.press('Enter');await expect(page.getByRole('heading',{name:'Greenhouse',exact:true})).toBeVisible();await expect(page.getByRole('button',{name:/Tend the crop/})).toBeDisabled();
 await page.getByRole('button',{name:'Open journal event',exact:true}).click();await expect(page.locator('#mission-event')).toBeFocused();
 for(let day=1;day<=5;day++){
  if(day===3){await expect(page.locator('.mission-alert')).toContainText('Solar particle storm warning');await page.getByRole('button',{name:'Review situation',exact:true}).click();await expect(page.locator('#mission-event')).toBeFocused();await expect(page.locator('#mission-event')).toHaveClass(/is-critical/);}

  for(const name of daily[day-1])await choose(page,name);
  if(day===1){await room(page,'Greenhouse');await page.getByRole('button',{name:/Tend the crop/}).click();await expect(page.locator('.crop-readings')).toContainText('85%');await expect(page.locator('.mission-overview').getByRole('meter',{name:'Water',exact:true})).toHaveAttribute('aria-valuenow','96');await page.reload();await expect(page.locator('.crop-readings')).toContainText('85%');}
  if(day===2){await room(page,'Crew Quarters');await expect(page.locator('.room-reading')).toContainText('8%');await page.getByRole('button',{name:/Rest & recover/}).click();await expect(page.locator('.room-reading')).toContainText('0%');}
  if(day===3){await room(page,'Rover Garage');await page.getByRole('button',{name:/Terrain survey/}).click();}
  if(day===4){await room(page,'Greenhouse');await expect(page.getByRole('button',{name:/Harvest fresh food/})).toBeEnabled();await page.getByRole('button',{name:/Harvest fresh food/}).click();await expect(page.locator('.crop-readings')).toContainText('Harvested');}
  await page.getByRole('button',{name:day===5?'COMPLETE MISSION':`ADVANCE TO DAY ${day+1}`,exact:true}).click();
 }
 await expect(page).toHaveURL(/results/);await expect(page.getByRole('heading',{name:'A small step. A mission accomplished.'})).toBeVisible();
 await page.getByRole('link',{name:'Review mission journal',exact:true}).click();await expect(page.getByText(/Greenhouse harvest: \+/)).toBeVisible();await expect(page.getByText(/Crew recovery: fatigue 0%/)).toBeVisible();await expect(page.locator('.journal-learning')).toHaveCount(8);await expect(page.locator('.journal-snapshot').last()).toContainText('Crew health');await expect(page.locator('.journal-achievements')).toContainText('Final shared crew health:');await expect(page.locator('.journal-achievements li').first()).toBeVisible();
 await page.getByRole('link',{name:'Return to habitat',exact:true}).click();await expect(page.getByText(/Your habitat is preserved/)).toBeVisible();await room(page,'Greenhouse');await expect(page.getByRole('button',{name:/Harvest fresh food/})).toBeDisabled();
 await page.getByRole('link',{name:'Lunar Explorer',exact:true}).click();await page.getByRole('button',{name:'Horizon Station',exact:true}).click();await expect(page.getByText('-3,768 m',{exact:true})).toBeVisible();await page.getByRole('link',{name:'Plan a mission here'}).click();await expect(page.getByRole('button',{name:'Horizon Station',exact:true})).toHaveAttribute('aria-pressed','true');
 expect(errors).toEqual([]);
});

test('all eight illustrated rooms select the matching real subsystem',async({page})=>{
 await page.goto('/briefing');await page.getByRole('button',{name:'INITIALIZE MISSION'}).click();
 for(const name of ['Crew Quarters','Life Support','Greenhouse','Power Station','Rover Garage','Laboratory','Equipment Storage','Airlock']){
  const button=page.getByRole('button',{name:`Open ${name}`,exact:true});await button.click();await expect(button).toHaveAttribute('aria-pressed','true');await expect(page.getByRole('heading',{name,exact:true})).toBeVisible();await expect(page.locator('.science-insight a')).toHaveAttribute('href',/^https:\/\//);
 }
 for(const width of [320,390,768,1024,1440]){await page.setViewportSize({width,height:900});expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1)).toBe(true);}
 await room(page,'Laboratory');await page.getByRole('link',{name:'Open discovery journal'}).click();await expect(page.getByRole('heading',{name:'Our days on the Moon.'})).toBeVisible();
});
