import { test, expect } from '@playwright/test';
import { StablySite } from '../../../src/sites/stably/stably-site';

test.describe('Stably Website Tests', () => {
  let stablySite: StablySite;

  test.beforeEach(async ({ page }) => {
    stablySite = new StablySite(page);
  });

  test('should validate all navigation links', async () => {
    const results = await stablySite.validateNavigation();
    
    console.log('Navigation Validation Results:', results);
    
    for (const result of results) {
      expect(result.visible, `${result.selector} should be visible`).toBe(true);
      expect(result.interactive, `${result.selector} should be interactive`).toBe(true);
      expect(result.loadTime).toBeLessThan(2000);
    }
  });

  test('should validate footer elements', async () => {
    const results = await stablySite.validateFooter();
    
    console.log('Footer Validation Results:', results);
    
    for (const result of results) {
      expect(result.visible, `${result.selector} should be visible`).toBe(true);
      expect(result.loadTime).toBeLessThan(2000);
    }
  });

  test('should validate homepage elements', async () => {
    const results = await stablySite.validateHomepage();
    
    console.log('Homepage Validation Results:', results);
    
    for (const result of results) {
      expect(result.visible, `${result.selector} should be visible`).toBe(true);
      expect(result.interactive, `${result.selector} should be interactive`).toBe(true);
      expect(result.loadTime).toBeLessThan(2000);
    }
  });

  test('should crawl entire site and validate all links', async () => {
    const results = await stablySite.crawlSite();
    
    console.log('Site Crawl Results:', results);
    
    // Log any broken links
    const brokenLinks = results.filter(r => r.status !== 200);
    if (brokenLinks.length > 0) {
      console.warn('Broken Links Found:', brokenLinks);
    }

    // Log slow loading pages
    const slowPages = results.filter(r => r.loadTime > 3000);
    if (slowPages.length > 0) {
      console.warn('Slow Loading Pages:', slowPages);
    }

    // Assertions
    for (const result of results) {
      if (!result.isExternal) {
        expect(result.status, `${result.url} should return 200`).toBe(200);
        expect(result.loadTime, `${result.url} should load quickly`).toBeLessThan(5000);
      }
    }
  });

  test('should capture full site metrics', async () => {
    const metrics = await stablySite.captureFullSiteMetrics();
    
    console.log('Full Site Metrics:', {
      componentsValidated: {
        navigation: metrics.components.navigation.length,
        footer: metrics.components.footer.length,
        homepage: metrics.components.homepage.length
      },
      totalLinks: metrics.links.length,
      performance: metrics.performance
    });

    // Performance assertions
    expect(metrics.performance.serverResponse).toBeLessThan(2000);
    expect(metrics.performance.domLoad).toBeLessThan(3000);
    expect(metrics.performance.fullPageLoad).toBeLessThan(5000);

    // Save metrics to file for analysis
    await test.info().attach('site-metrics', {
      body: JSON.stringify(metrics, null, 2),
      contentType: 'application/json'
    });
  });

  test('should validate responsive design', async ({ page }) => {
    const viewports = [
      { width: 1920, height: 1080 }, // Desktop
      { width: 1024, height: 768 },  // Tablet Landscape
      { width: 768, height: 1024 },  // Tablet Portrait
      { width: 375, height: 812 }    // Mobile
    ];

    for (const viewport of viewports) {
      await page.setViewportSize(viewport);
      await page.goto('https://www.stably.ai');
      await stablySite.waitForNetworkIdle();

      // Capture screenshot for this viewport
      await stablySite.captureScreenshot(
        `./test-results/responsive-${viewport.width}x${viewport.height}.png`
      );

      // Validate critical elements are visible
      const results = await stablySite.validateAllComponents();
      
      // Check navigation elements visibility
      for (const result of results.navigation) {
        expect(result.visible, 
          `${result.selector} should be visible at ${viewport.width}x${viewport.height}`
        ).toBe(true);
      }
    }
  });
}); 