import {defineConfig,devices} from '@playwright/test';
// Windows/OneDrive can retain handles to prior browser artifacts. Never reuse a run directory.
const runDirectory=`outputs/playwright/${Date.now()}-${process.pid}`;
export default defineConfig({
 testDir:'tests/e2e',timeout:90000,expect:{timeout:10000},fullyParallel:false,workers:1,
 outputDir:`${runDirectory}/results`,
 reporter:[['list'],['html',{open:'never',outputFolder:`${runDirectory}/report`}]],
 use:{baseURL:'http://127.0.0.1:5173',trace:'retain-on-failure',screenshot:'only-on-failure',reducedMotion:'reduce'},
 projects:[{name:'desktop',use:{...devices['Desktop Chrome'],channel:'msedge',viewport:{width:1440,height:1000}}},{name:'mobile',use:{...devices['Pixel 7'],defaultBrowserType:'chromium',channel:'msedge'}}],
 webServer:{command:'npm run dev',url:'http://127.0.0.1:5173',reuseExistingServer:!process.env.CI,timeout:60000}
});
