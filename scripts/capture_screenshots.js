const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

(async () => {
  const browser = await puppeteer.launch({
    headless: "new",
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  const page = await browser.newPage();
  
  // Set viewport to a reasonable desktop size
  await page.setViewport({ width: 1280, height: 1024 });

  const baseUrl = 'http://localhost:3000';
  const screenshotsDir = path.join(process.cwd(), 'screenshots');
  
  if (!fs.existsSync(screenshotsDir)){
      fs.mkdirSync(screenshotsDir);
  }

  try {
    console.log('Navigating to login...');
    await page.goto(`${baseUrl}/login`, { waitUntil: 'networkidle0' });

    // Ensure we are on the login page
    await page.waitForSelector('input[type="email"]');

    // Capture Login Page
    console.log('Capturing login page...');
    await page.screenshot({ path: path.join(screenshotsDir, 'login.png'), fullPage: true });

    // Switch to Sign Up
    console.log('Switching to Sign Up...');
    // Find the button that toggles to Sign Up
    const buttons = await page.$$('button');
    let clicked = false;
    for (const btn of buttons) {
        const text = await page.evaluate(el => el.textContent, btn);
        if (text && text.includes('Sign Up')) {
            await btn.click();
            clicked = true;
            break;
        }
    }

    if (clicked) {
        // Wait for the Name input to appear which is present only in Sign Up
        await page.waitForSelector('input[placeholder="Enter your name"]');
        // specific wait for animation
        await new Promise(r => setTimeout(r, 1000));
        
        console.log('Capturing signup page...');
        await page.screenshot({ path: path.join(screenshotsDir, 'signup.png'), fullPage: true });
        
        // Reload to get back to clean login state
        await page.reload({ waitUntil: 'networkidle0' });
    } else {
        console.error('Could not find Sign Up toggle button');
    }

    console.log('Entering credentials...');
    await page.type('input[type="email"]', 'honestlyjatin@gmail.com');
    await page.type('input[type="password"]', 'Jatin@123');

    console.log('Clicking Sign In...');
    await page.click('button[type="submit"]');

    // Wait for navigation to dashboard.
    // We wait for the URL to change or a specific element on the dashboard.
    // A simple waitForNavigation might be flaky if the app is SPA and uses client-side routing,
    // but since we are submitting a form (even if handled by JS), there should be some transition.
    // The login code uses router.push('/').
    await page.waitForFunction(() => window.location.pathname === '/');
    console.log('Logged in successfully.');

    // Give it a moment to load initial dashboard data
    await new Promise(r => setTimeout(r, 3000));
    
    // Capture Dashboard
    console.log('Capturing dashboard...');
    await page.screenshot({ path: path.join(screenshotsDir, 'dashboard.png'), fullPage: true });

    const pagesToCapture = [
      { path: '/goals', name: 'goals' },
      { path: '/habits', name: 'habits' },
      { path: '/inbox', name: 'inbox' },
      { path: '/resources', name: 'resources' },
      { path: '/settings', name: 'settings' },
      { path: '/tasks', name: 'tasks' }
    ];

    for (const p of pagesToCapture) {
        console.log(`Navigating to ${p.name}...`);
        await page.goto(`${baseUrl}${p.path}`, { waitUntil: 'networkidle0' });
        // Wait for content to load - maybe wait for a common element or just time
        await new Promise(r => setTimeout(r, 2000)); 
        const screenshotPath = path.join(screenshotsDir, `${p.name}.png`);
        await page.screenshot({ path: screenshotPath, fullPage: true });
        console.log(`Captured ${p.name} to ${screenshotPath}`);
    }

    console.log('All screenshots captured.');

  } catch (error) {
    console.error('Error during screenshot capture:', error);
    // Take a screenshot of the error state
    await page.screenshot({ path: path.join(screenshotsDir, 'error_state.png'), fullPage: true });
  } finally {
    await browser.close();
  }
})();
