import {test,expect} from '@playwright/test';

test('observatory preview links to real rooms and preserves telemetry and mission status',async({page})=>{
 const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto('/');
 const greenhouse=page.getByRole('button',{name:'Open Greenhouse',exact:true});
 await greenhouse.focus();await page.keyboard.press('Enter');
 await expect(page.locator('.landing-room-preview')).toContainText('Greenhouse');
 await expect(page.locator('.landing-room-preview')).toContainText('cannot feed the crew by itself');
 if((page.viewportSize()?.width??0)<=700){
  const rooms=page.getByRole('navigation',{name:'Preview habitat rooms'});
  await expect(rooms.getByRole('button')).toHaveCount(8);
  await rooms.getByRole('button',{name:'Power Station',exact:true}).click();
  await expect(page.locator('.landing-room-preview')).toContainText('Power Station');
  expect((await rooms.getByRole('button',{name:'Power Station',exact:true}).boundingBox())!.height).toBeGreaterThanOrEqual(44);
 }
 await page.getByRole('link',{name:'Prepare your mission',exact:true}).click();
 await expect(page).toHaveURL(/briefing/);await page.getByRole('button',{name:'INITIALIZE MISSION'}).click();
 await expect(page.getByRole('status',{name:'Mission status: active'})).toBeVisible();
 await expect(page.getByRole('img',{name:'Power history: 100, 100 percent. Daily snapshots followed by the current reading.'})).toBeVisible();
 await page.getByRole('button',{name:/^Use the onboard checklist/}).click();
 await expect(page.getByRole('img',{name:'Power history: 100, 97 percent. Daily snapshots followed by the current reading.'})).toBeVisible();
 await expect(page.locator('.mission-feed')).toContainText('Use the onboard checklist');
 await page.getByRole('button',{name:'Pause',exact:true}).click();
 await expect(page.getByRole('status',{name:'Mission status: paused'})).toBeVisible();
 await page.getByRole('button',{name:'Resume',exact:true}).click();
 await page.getByRole('link',{name:'AstroQuest overview',exact:true}).click();
 await page.getByRole('button',{name:'Open Laboratory',exact:true}).click();
 await page.getByRole('link',{name:'Inspect this room',exact:true}).click();
 await expect(page.getByRole('heading',{name:'Laboratory',exact:true})).toBeVisible();
 await expect(page.getByRole('meter',{name:'Power',exact:true})).toHaveAttribute('aria-valuenow','97');
 expect(errors).toEqual([]);
});

test('reduced motion, contrast, and viewport layouts remain usable',async({page})=>{
 await page.goto('/');
 await page.emulateMedia({reducedMotion:'reduce'});
 await expect(page.locator('.lunar-dust')).toHaveCSS('animation-name','none');
 const scene=page.locator('.habitat-scene');
 await scene.dispatchEvent('pointermove',{pointerType:'mouse',clientX:200,clientY:500});
 await expect(page.locator('.terrain-parallax')).toHaveCSS('transform','none');
 for(const width of [320,390,768,1024,1440]){
  await page.setViewportSize({width,height:900});
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1)).toBe(true);
  await expect(page.getByRole('link',{name:'BEGIN YOUR MISSION',exact:true})).toBeVisible();
 }
 const colors=await page.evaluate(()=>({background:getComputedStyle(document.body).backgroundColor,text:getComputedStyle(document.querySelector('h1')!).color}));
 expect(colors).toEqual({background:'rgb(7, 11, 18)',text:'rgb(245, 248, 255)'});
 await page.emulateMedia({reducedMotion:'no-preference'});
 await scene.scrollIntoViewIfNeeded();
 const bounds=(await scene.boundingBox())!;
 await page.mouse.move(bounds.x+10,bounds.y+10);
 expect(await scene.evaluate(el=>el.style.getPropertyValue('--look-x'))).not.toBe('0px');
 await page.mouse.move(0,0);
 expect(await scene.evaluate(el=>el.style.getPropertyValue('--look-x'))).toBe('0px');
});
