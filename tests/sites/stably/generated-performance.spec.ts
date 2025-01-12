import { test, expect } from '@playwright/test';

test.describe('Performance Tests', () => {
  
  // Verifies the load time and performance metrics of the homepage
  test('Homepage Load Performance', async ({ page }) => {
    const startTime = Date.now();
    const response = await page.goto('https://stably.ai');
    expect(response?.status()).toBe(200);
    
    
    
    const performanceTime = Date.now() - startTime;
    expect(performanceTime).toBeLessThan(30000);
  });

  // Verifies the performance and interactivity of the How It Works button
  test('How It Works Button Performance', async ({ page }) => {
    const startTime = Date.now();
    const response = await page.goto('https://stably.ai');
    expect(response?.status()).toBe(200);
    
    
    const element = page.locator("text="How It Works"");
    await element.waitFor({ state: 'visible' });
    await expect(element).toBeEnabled();
    
    const performanceTime = Date.now() - startTime;
    expect(performanceTime).toBeLessThan(30000);
  });

  // Verifies the performance and interactivity of the Pricing button
  test('Pricing Button Performance', async ({ page }) => {
    const startTime = Date.now();
    const response = await page.goto('https://stably.ai');
    expect(response?.status()).toBe(200);
    
    
    const element = page.locator("text="Pricing"");
    await element.waitFor({ state: 'visible' });
    await expect(element).toBeEnabled();
    
    const performanceTime = Date.now() - startTime;
    expect(performanceTime).toBeLessThan(30000);
  });

  // Verifies the performance and interactivity of the Blogs button
  test('Blogs Button Performance', async ({ page }) => {
    const startTime = Date.now();
    const response = await page.goto('https://stably.ai');
    expect(response?.status()).toBe(200);
    
    
    const element = page.locator("text="Blogs"");
    await element.waitFor({ state: 'visible' });
    await expect(element).toBeEnabled();
    
    const performanceTime = Date.now() - startTime;
    expect(performanceTime).toBeLessThan(30000);
  });

  // Verifies the performance and interactivity of the Docs button
  test('Docs Button Performance', async ({ page }) => {
    const startTime = Date.now();
    const response = await page.goto('https://stably.ai');
    expect(response?.status()).toBe(200);
    
    
    const element = page.locator("text="Docs"");
    await element.waitFor({ state: 'visible' });
    await expect(element).toBeEnabled();
    
    const performanceTime = Date.now() - startTime;
    expect(performanceTime).toBeLessThan(30000);
  });

  // Verifies the performance and interactivity of the Career button
  test('Career Button Performance', async ({ page }) => {
    const startTime = Date.now();
    const response = await page.goto('https://stably.ai');
    expect(response?.status()).toBe(200);
    
    
    const element = page.locator("text="Career"");
    await element.waitFor({ state: 'visible' });
    await expect(element).toBeEnabled();
    
    const performanceTime = Date.now() - startTime;
    expect(performanceTime).toBeLessThan(30000);
  });

  // Verifies the performance and interactivity of the Get Started button
  test('Get Started Button Performance', async ({ page }) => {
    const startTime = Date.now();
    const response = await page.goto('https://stably.ai');
    expect(response?.status()).toBe(200);
    
    
    const element = page.locator("text="Get Started"");
    await element.waitFor({ state: 'visible' });
    await expect(element).toBeEnabled();
    
    const performanceTime = Date.now() - startTime;
    expect(performanceTime).toBeLessThan(30000);
  });

  // Verifies the performance and interactivity of the Log in button
  test('Log in Button Performance', async ({ page }) => {
    const startTime = Date.now();
    const response = await page.goto('https://stably.ai');
    expect(response?.status()).toBe(200);
    
    
    const element = page.locator("text="Log in"");
    await element.waitFor({ state: 'visible' });
    await expect(element).toBeEnabled();
    
    const performanceTime = Date.now() - startTime;
    expect(performanceTime).toBeLessThan(30000);
  });

  // Verifies the performance and interactivity of the Get Started button
  test('Get Started Button Performance', async ({ page }) => {
    const startTime = Date.now();
    const response = await page.goto('https://stably.ai');
    expect(response?.status()).toBe(200);
    
    
    const element = page.locator("text="Get Started"");
    await element.waitFor({ state: 'visible' });
    await expect(element).toBeEnabled();
    
    const performanceTime = Date.now() - startTime;
    expect(performanceTime).toBeLessThan(30000);
  });

  // Verifies the performance and interactivity of the Book Demo button
  test('Book Demo Button Performance', async ({ page }) => {
    const startTime = Date.now();
    const response = await page.goto('https://stably.ai');
    expect(response?.status()).toBe(200);
    
    
    const element = page.locator("text="Book Demo"");
    await element.waitFor({ state: 'visible' });
    await expect(element).toBeEnabled();
    
    const performanceTime = Date.now() - startTime;
    expect(performanceTime).toBeLessThan(30000);
  });

  // Verifies the performance and interactivity of the Start 30-day free trial -> button
  test('Start 30-day free trial -> Button Performance', async ({ page }) => {
    const startTime = Date.now();
    const response = await page.goto('https://stably.ai');
    expect(response?.status()).toBe(200);
    
    
    const element = page.locator("text="Start 30-day free trial ->"");
    await element.waitFor({ state: 'visible' });
    await expect(element).toBeEnabled();
    
    const performanceTime = Date.now() - startTime;
    expect(performanceTime).toBeLessThan(30000);
  });

  // Verifies the performance and interactivity of the Meet AI test runner -> button
  test('Meet AI test runner -> Button Performance', async ({ page }) => {
    const startTime = Date.now();
    const response = await page.goto('https://stably.ai');
    expect(response?.status()).toBe(200);
    
    
    const element = page.locator("text="Meet AI test runner ->"");
    await element.waitFor({ state: 'visible' });
    await expect(element).toBeEnabled();
    
    const performanceTime = Date.now() - startTime;
    expect(performanceTime).toBeLessThan(30000);
  });

  // Verifies the performance and interactivity of the Try zero-flake testing -> button
  test('Try zero-flake testing -> Button Performance', async ({ page }) => {
    const startTime = Date.now();
    const response = await page.goto('https://stably.ai');
    expect(response?.status()).toBe(200);
    
    
    const element = page.locator("text="Try zero-flake testing ->"");
    await element.waitFor({ state: 'visible' });
    await expect(element).toBeEnabled();
    
    const performanceTime = Date.now() - startTime;
    expect(performanceTime).toBeLessThan(30000);
  });

  // Verifies the performance and interactivity of the Explore auto-maintenance -> button
  test('Explore auto-maintenance -> Button Performance', async ({ page }) => {
    const startTime = Date.now();
    const response = await page.goto('https://stably.ai');
    expect(response?.status()).toBe(200);
    
    
    const element = page.locator("text="Explore auto-maintenance ->"");
    await element.waitFor({ state: 'visible' });
    await expect(element).toBeEnabled();
    
    const performanceTime = Date.now() - startTime;
    expect(performanceTime).toBeLessThan(30000);
  });

  // Verifies the performance and interactivity of the Authentication button
  test('Authentication Button Performance', async ({ page }) => {
    const startTime = Date.now();
    const response = await page.goto('https://stably.ai');
    expect(response?.status()).toBe(200);
    
    
    const element = page.locator("text="Authentication"");
    await element.waitFor({ state: 'visible' });
    await expect(element).toBeEnabled();
    
    const performanceTime = Date.now() - startTime;
    expect(performanceTime).toBeLessThan(30000);
  });

  // Verifies the performance and interactivity of the Payment button
  test('Payment Button Performance', async ({ page }) => {
    const startTime = Date.now();
    const response = await page.goto('https://stably.ai');
    expect(response?.status()).toBe(200);
    
    
    const element = page.locator("text="Payment"");
    await element.waitFor({ state: 'visible' });
    await expect(element).toBeEnabled();
    
    const performanceTime = Date.now() - startTime;
    expect(performanceTime).toBeLessThan(30000);
  });

  // Verifies the performance and interactivity of the Components button
  test('Components Button Performance', async ({ page }) => {
    const startTime = Date.now();
    const response = await page.goto('https://stably.ai');
    expect(response?.status()).toBe(200);
    
    
    const element = page.locator("text="Components"");
    await element.waitFor({ state: 'visible' });
    await expect(element).toBeEnabled();
    
    const performanceTime = Date.now() - startTime;
    expect(performanceTime).toBeLessThan(30000);
  });

  // Verifies the performance and interactivity of the Advanced assertions button
  test('Advanced assertions Button Performance', async ({ page }) => {
    const startTime = Date.now();
    const response = await page.goto('https://stably.ai');
    expect(response?.status()).toBe(200);
    
    
    const element = page.locator("text="Advanced assertions"");
    await element.waitFor({ state: 'visible' });
    await expect(element).toBeEnabled();
    
    const performanceTime = Date.now() - startTime;
    expect(performanceTime).toBeLessThan(30000);
  });

  // Verifies the performance and interactivity of the What is Stably? button
  test('What is Stably? Button Performance', async ({ page }) => {
    const startTime = Date.now();
    const response = await page.goto('https://stably.ai');
    expect(response?.status()).toBe(200);
    
    
    const element = page.locator("text="What is Stably?"");
    await element.waitFor({ state: 'visible' });
    await expect(element).toBeEnabled();
    
    const performanceTime = Date.now() - startTime;
    expect(performanceTime).toBeLessThan(30000);
  });

  // Verifies the performance and interactivity of the How does Stably work with Playwright / Selenium / Cypress? button
  test('How does Stably work with Playwright / Selenium / Cypress? Button Performance', async ({ page }) => {
    const startTime = Date.now();
    const response = await page.goto('https://stably.ai');
    expect(response?.status()).toBe(200);
    
    
    const element = page.locator("text="How does Stably work with Playwright / Selenium / Cypress?"");
    await element.waitFor({ state: 'visible' });
    await expect(element).toBeEnabled();
    
    const performanceTime = Date.now() - startTime;
    expect(performanceTime).toBeLessThan(30000);
  });

  // Verifies the performance and interactivity of the What kind of companies use Stably? button
  test('What kind of companies use Stably? Button Performance', async ({ page }) => {
    const startTime = Date.now();
    const response = await page.goto('https://stably.ai');
    expect(response?.status()).toBe(200);
    
    
    const element = page.locator("text="What kind of companies use Stably?"");
    await element.waitFor({ state: 'visible' });
    await expect(element).toBeEnabled();
    
    const performanceTime = Date.now() - startTime;
    expect(performanceTime).toBeLessThan(30000);
  });

  // Verifies the performance and interactivity of the Who on my team should use Stably? button
  test('Who on my team should use Stably? Button Performance', async ({ page }) => {
    const startTime = Date.now();
    const response = await page.goto('https://stably.ai');
    expect(response?.status()).toBe(200);
    
    
    const element = page.locator("text="Who on my team should use Stably?"");
    await element.waitFor({ state: 'visible' });
    await expect(element).toBeEnabled();
    
    const performanceTime = Date.now() - startTime;
    expect(performanceTime).toBeLessThan(30000);
  });

  // Verifies the performance and interactivity of the What common bugs can I prevent with Stably? button
  test('What common bugs can I prevent with Stably? Button Performance', async ({ page }) => {
    const startTime = Date.now();
    const response = await page.goto('https://stably.ai');
    expect(response?.status()).toBe(200);
    
    
    const element = page.locator("text="What common bugs can I prevent with Stably?"");
    await element.waitFor({ state: 'visible' });
    await expect(element).toBeEnabled();
    
    const performanceTime = Date.now() - startTime;
    expect(performanceTime).toBeLessThan(30000);
  });

  // Verifies the performance and interactivity of the Start free trial button
  test('Start free trial Button Performance', async ({ page }) => {
    const startTime = Date.now();
    const response = await page.goto('https://stably.ai');
    expect(response?.status()).toBe(200);
    
    
    const element = page.locator("text="Start free trial"");
    await element.waitFor({ state: 'visible' });
    await expect(element).toBeEnabled();
    
    const performanceTime = Date.now() - startTime;
    expect(performanceTime).toBeLessThan(30000);
  });
});