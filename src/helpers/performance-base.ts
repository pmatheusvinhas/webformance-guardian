import { Page } from 'playwright';

export class PerformanceBase {
  protected async measurePageLoad(page: Page): Promise<{ loadTime: number; ttfb: number; fcp: number }> {
    const navigationStart = Date.now();
    
    // Wait for load event
    await page.waitForLoadState('load');
    const loadTime = Date.now() - navigationStart;

    // Get TTFB and FCP from Performance API
    const metrics = await page.evaluate(() => {
      const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
      const paint = performance.getEntriesByType('paint').find(
        entry => entry.name === 'first-contentful-paint'
      );

      return {
        ttfb: navigation.responseStart - navigation.requestStart,
        fcp: paint ? paint.startTime : 0
      };
    });

    return {
      loadTime,
      ttfb: metrics.ttfb,
      fcp: metrics.fcp
    };
  }

  protected async measureInteractionTime(page: Page, selector: string): Promise<number> {
    const startTime = Date.now();
    await page.click(selector);
    return Date.now() - startTime;
  }

  protected async measureNetworkRequests(page: Page): Promise<{ count: number; totalSize: number }> {
    const requests = await page.evaluate(() => {
      const resources = performance.getEntriesByType('resource');
      return {
        count: resources.length,
        totalSize: resources.reduce((total, resource) => total + (resource as any).transferSize || 0, 0)
      };
    });

    return requests;
  }

  protected async measureMemoryUsage(page: Page): Promise<number> {
    const memory = await page.evaluate(() => {
      if ('memory' in performance) {
        return (performance as any).memory.usedJSHeapSize;
      }
      return 0;
    });

    return memory;
  }
} 