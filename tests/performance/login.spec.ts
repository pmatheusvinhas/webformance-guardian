import { test, expect } from '@playwright/test';
import { LoginPage } from '../../src/pages/login.page';

test.describe('Login Page Performance Tests', () => {
  let loginPage: LoginPage;

  test.beforeEach(async ({ page }) => {
    loginPage = new LoginPage(page);
  });

  test('should load login page within acceptable time', async () => {
    const loadTime = await loginPage.measureLoadTime(loginPage.url);
    console.log(`Login page load time: ${loadTime}ms`);
    expect(loadTime).toBeLessThan(3000);
  });

  test('should measure form interaction times', async () => {
    await loginPage.goto();
    const metrics = await loginPage.measureLoginFormInteraction();
    
    console.log('Form Interaction Metrics:', metrics);
    
    // Assert reasonable interaction times
    expect(metrics.emailInputTime).toBeLessThan(2000);
    expect(metrics.passwordInputTime).toBeLessThan(2000);
    expect(metrics.buttonTime).toBeLessThan(2000);
  });

  test('should capture detailed performance metrics', async () => {
    const metrics = await loginPage.performFullLoginFlow('test@example.com', 'password123');
    
    console.log('Full Login Flow Metrics:', {
      loadTime: metrics.loadTime,
      interactionMetrics: metrics.interactionMetrics,
      navigationMetrics: metrics.navigationMetrics
    });

    // Assert performance thresholds
    expect(metrics.loadTime).toBeLessThan(3000);
    expect(metrics.navigationMetrics.serverResponse).toBeLessThan(2000);
    expect(metrics.navigationMetrics.domLoad).toBeLessThan(3000);
    expect(metrics.navigationMetrics.fullPageLoad).toBeLessThan(5000);
  });

  test('should measure resource loading performance', async () => {
    await loginPage.goto();
    await loginPage.waitForNetworkIdle();
    
    const resourceMetrics = await loginPage.captureResourceMetrics();
    
    console.log('Resource Loading Metrics:', resourceMetrics);
    
    // Log slow-loading resources (over 1s)
    const slowResources = resourceMetrics.filter(r => r.duration > 1000);
    if (slowResources.length > 0) {
      console.warn('Slow loading resources:', slowResources);
    }
    
    // Assert no extremely slow resources
    for (const resource of resourceMetrics) {
      expect(resource.duration).toBeLessThan(5000);
    }
  });
}); 