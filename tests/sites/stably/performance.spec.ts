import { test, expect } from '@playwright/test';
import { config } from '../../../src/sites/stably/config';

test.describe('Stably.ai Performance Tests', () => {
  test('homepage performance', async ({ page }) => {
    const startTime = Date.now();
    
    // Navigate to homepage
    const response = await page.goto(config.baseUrl);
    expect(response?.status()).toBe(200);

    // Get performance metrics
    const ttfb = Date.now() - startTime;
    const [fcp, lcp] = await Promise.all([
      page.evaluate(() => performance.getEntriesByName('first-contentful-paint')[0]?.startTime || 0),
      page.evaluate(() => performance.getEntriesByName('largest-contentful-paint')[0]?.startTime || 0)
    ]);

    // Verify metrics against thresholds
    expect(ttfb).toBeLessThan(config.performanceThresholds.ttfb);
    expect(fcp).toBeLessThan(config.performanceThresholds.fcp);
    expect(lcp).toBeLessThan(config.performanceThresholds.lcp);
  });

  test('login button interactivity', async ({ page }) => {
    await page.goto(config.baseUrl);
    
    const startTime = Date.now();
    await page.waitForSelector(config.selectors.loginButton, { state: 'visible' });
    const timeToInteractive = Date.now() - startTime;

    expect(timeToInteractive).toBeLessThan(config.performanceThresholds.interactivity);
  });

  test('navigation menu visibility', async ({ page }) => {
    await page.goto(config.baseUrl);
    
    const navVisible = await page.waitForSelector(config.selectors.navigationMenu, { 
      state: 'visible',
      timeout: config.performanceThresholds.pageLoad 
    });

    expect(navVisible).toBeTruthy();
  });
}); 