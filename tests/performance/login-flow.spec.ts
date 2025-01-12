import { test, expect } from '@playwright/test';
import { LoginPage } from '../../src/pages/login.page';

test.describe('Stably Login Flow Performance', () => {
  let loginPage: LoginPage;

  test.beforeEach(async ({ page }) => {
    loginPage = new LoginPage(page);
  });

  test('measure complete login flow performance', async ({ page }) => {
    // Start from main site
    console.log('Step 1: Loading main site...');
    const mainStart = Date.now();
    const mainResponse = await page.goto('https://www.stably.ai');
    const mainTiming = await loginPage.getNavigationTiming();
    console.log('Main site timing:', {
      ttfb: mainTiming.ttfb,
      fcp: mainTiming.fcp,
      lcp: mainTiming.lcp,
      total: Date.now() - mainStart
    });

    // Click login and measure first redirect
    console.log('Step 2: Clicking login button...');
    const appStart = Date.now();
    await page.click('a:has-text("Log in")');
    await page.waitForURL('https://app.stably.ai/**');
    const appTiming = await loginPage.getNavigationTiming();
    console.log('App redirect timing:', {
      ttfb: appTiming.ttfb,
      fcp: appTiming.fcp,
      lcp: appTiming.lcp,
      total: Date.now() - appStart
    });

    // Measure final redirect to auth page
    console.log('Step 3: Redirecting to auth page...');
    const authStart = Date.now();
    await page.waitForURL('https://auth.stably.ai/en/login');
    const authTiming = await loginPage.getNavigationTiming();
    console.log('Auth page timing:', {
      ttfb: authTiming.ttfb,
      fcp: authTiming.fcp,
      lcp: authTiming.lcp,
      total: Date.now() - authStart
    });

    // Verify login form is interactive
    console.log('Step 4: Verifying login form...');
    await loginPage.waitForLoginForm();
    const formTiming = await loginPage.measureLoginFormInteraction();
    console.log('Form interaction timing:', formTiming);

    // Performance assertions
    expect(mainTiming.ttfb).toBeLessThan(800);
    expect(mainTiming.fcp).toBeLessThan(1500);
    expect(mainTiming.lcp).toBeLessThan(2500);
    
    expect(authTiming.ttfb).toBeLessThan(800);
    expect(authTiming.fcp).toBeLessThan(1500);
    expect(authTiming.lcp).toBeLessThan(2500);

    expect(formTiming.emailInputTime).toBeLessThan(1000);
    expect(formTiming.passwordInputTime).toBeLessThan(1000);
    expect(formTiming.buttonTime).toBeLessThan(1000);

    // Save all metrics for analysis
    await test.info().attach('performance-metrics', {
      body: JSON.stringify({
        mainSite: {
          timing: mainTiming,
          totalTime: Date.now() - mainStart
        },
        appRedirect: {
          timing: appTiming,
          totalTime: Date.now() - appStart
        },
        authPage: {
          timing: authTiming,
          totalTime: Date.now() - authStart,
          formTiming
        }
      }, null, 2),
      contentType: 'application/json'
    });
  });
}); 