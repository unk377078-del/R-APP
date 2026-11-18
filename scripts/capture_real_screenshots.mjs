import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const PORT = 9222;
const USER_DATA = path.join(process.env.TEMP || 'C:\\temp', 'chrome-real-screen-' + Date.now());

async function run() {
  console.log('Starting headless Chrome...');
  const chrome = spawn(CHROME_PATH, [
    `--remote-debugging-port=${PORT}`,
    `--user-data-dir=${USER_DATA}`,
    '--headless=new',
    '--disable-gpu',
    '--no-first-run',
    '--no-default-browser-check',
    'http://localhost:8081'
  ]);

  // Wait 3.5s for Chrome to launch
  await new Promise(r => setTimeout(r, 3500));

  const res = await fetch(`http://127.0.0.1:${PORT}/json`);
  const targets = await res.json();
  const page = targets.find(t => t.type === 'page');
  if (!page) throw new Error('No page target found');

  const ws = new WebSocket(page.webSocketDebuggerUrl);
  let id = 1;
  const pending = new Map();
  ws.onmessage = (event) => {
    const msg = JSON.parse(event.data);
    if (msg.id && pending.has(msg.id)) {
      pending.get(msg.id)(msg);
      pending.delete(msg.id);
    }
  };

  const send = (method, params = {}) => new Promise((resolve) => {
    const msgId = id++;
    pending.set(msgId, resolve);
    ws.send(JSON.stringify({ id: msgId, method, params }));
  });

  await new Promise(r => ws.onopen = r);
  console.log('CDP connected.');

  await send('Page.enable');
  await send('Runtime.enable');
  await send('DOM.enable');

  const tabletDir = 'C:\\Users\\lenovo\\Desktop\\tablet-screenshots';
  const phoneDir = 'C:\\Users\\lenovo\\Desktop\\store-screenshots';
  if (!fs.existsSync(tabletDir)) fs.mkdirSync(tabletDir, { recursive: true });
  if (!fs.existsSync(phoneDir)) fs.mkdirSync(phoneDir, { recursive: true });

  // 1. First, capture Mobile Welcome / Login Screen (1080x1920)
  await send('Emulation.setDeviceMetricsOverride', {
    width: 430,
    height: 932,
    deviceScaleFactor: 2.5,
    mobile: true
  });
  await new Promise(r => setTimeout(r, 3000));
  const shotLogin = await send('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync(path.join(phoneDir, 'real_phone_login.png'), Buffer.from(shotLogin.result.data, 'base64'));
  console.log('Captured real_phone_login.png');

  // 2. Click Guest button: [aria-label="المتابعة كضيف"]
  console.log('Clicking guest button...');
  const clickRes = await send('Runtime.evaluate', {
    expression: `
      (() => {
        const btn = document.querySelector('[aria-label="المتابعة كضيف"]') 
          || Array.from(document.querySelectorAll('*')).find(el => (el.textContent || '').trim() === 'المتابعة كضيف');
        if (btn) {
          btn.click();
          return 'Clicked guest successfully';
        }
        return 'Guest button not found';
      })()
    `,
    returnByValue: true
  });
  console.log('Guest click:', clickRes?.result?.value);

  // Wait 4s for Home screen to load
  await new Promise(r => setTimeout(r, 4500));

  // 3. Capture Phone Home Screen
  const shotPhoneHome = await send('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync(path.join(phoneDir, 'real_phone_home.png'), Buffer.from(shotPhoneHome.result.data, 'base64'));
  console.log('Captured real_phone_home.png');

  // 4. Click Menu/Products tab: [aria-label="القائمة"]
  await send('Runtime.evaluate', {
    expression: `
      (() => {
        const tab = document.querySelector('[aria-label="القائمة"]')
          || Array.from(document.querySelectorAll('*')).find(el => (el.textContent || '').trim() === 'القائمة');
        if (tab) tab.click();
      })()
    `
  });
  await new Promise(r => setTimeout(r, 3000));

  // 5. Capture Phone Products Screen
  const shotPhoneMenu = await send('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync(path.join(phoneDir, 'real_phone_products.png'), Buffer.from(shotPhoneMenu.result.data, 'base64'));
  console.log('Captured real_phone_products.png');

  // NOW TABLET SCREENSHOTS (1920x1080 Landscape)
  console.log('Switching to tablet dimensions (1920x1080)...');
  await send('Emulation.setDeviceMetricsOverride', {
    width: 1920,
    height: 1080,
    deviceScaleFactor: 1,
    mobile: false
  });
  await new Promise(r => setTimeout(r, 2000));

  // 6. Capture Tablet Products Screen
  const shotTabletMenu = await send('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync(path.join(tabletDir, 'real_tablet_products.png'), Buffer.from(shotTabletMenu.result.data, 'base64'));
  console.log('Captured real_tablet_products.png');

  // 7. Go to Home on Tablet
  await send('Runtime.evaluate', {
    expression: `
      (() => {
        const tab = document.querySelector('[aria-label="الرئيسية"]')
          || Array.from(document.querySelectorAll('*')).find(el => (el.textContent || '').trim() === 'الرئيسية');
        if (tab) tab.click();
      })()
    `
  });
  await new Promise(r => setTimeout(r, 3000));

  // 8. Capture Tablet Home Screen
  const shotTabletHome = await send('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync(path.join(tabletDir, 'real_tablet_home.png'), Buffer.from(shotTabletHome.result.data, 'base64'));
  console.log('Captured real_tablet_home.png');

  // 9. Go to Rewards / Offers on Tablet: [aria-label="المكافآت"]
  await send('Runtime.evaluate', {
    expression: `
      (() => {
        const tab = document.querySelector('[aria-label="المكافآت"]')
          || Array.from(document.querySelectorAll('*')).find(el => (el.textContent || '').trim() === 'المكافآت');
        if (tab) tab.click();
      })()
    `
  });
  await new Promise(r => setTimeout(r, 2500));

  // 10. Capture Tablet Rewards Screen
  const shotTabletRewards = await send('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync(path.join(tabletDir, 'real_tablet_rewards.png'), Buffer.from(shotTabletRewards.result.data, 'base64'));
  console.log('Captured real_tablet_rewards.png');

  ws.close();
  chrome.kill();
  console.log('SUCCESS: All real screenshots captured directly from live app!');
}

run().catch(err => {
  console.error('Run error:', err);
  process.exit(1);
});
