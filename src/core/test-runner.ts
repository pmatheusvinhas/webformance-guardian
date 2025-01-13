import { chromium, Browser, Page } from 'playwright';
import { TestResult, PerformanceMetrics } from './types';

export class TestRunner {
  private baseUrl: string;

  constructor(site: string) {
    this.baseUrl = process.env.SITE_URL || (site === 'stably' ? 'https://stably.ai' : `https://${site}`);
  }

  async runTests(): Promise<TestResult[]> {
    const browser = await chromium.launch();
    try {
      const results: TestResult[] = [];

      // Test main page load
      results.push(await this.testPageLoad(browser, '/', 'Homepage Load'));

      // Test key pages based on site
      if (this.baseUrl.includes('stably')) {
        // Stably-specific routes
        results.push(await this.testPageLoad(browser, '/pricing', 'Pricing Page'));
        results.push(await this.testPageLoad(browser, '/blog', 'Blog Page'));
        results.push(await this.testPageLoad(browser, '/docs', 'Documentation Page'));
      } else {
        // Generic routes for other sites
        results.push(await this.testPageLoad(browser, '/features', 'Features Page'));
        results.push(await this.testPageLoad(browser, '/products', 'Products Page'));
      }

      return results;
    } finally {
      await browser.close();
    }
  }

  private async testPageLoad(browser: Browser, path: string, title: string): Promise<TestResult> {
    const page = await browser.newPage();
    const startTime = Date.now();
    let passed = true;
    let metrics: PerformanceMetrics | undefined;

    try {
      // Navigate to page
      const response = await page.goto(`${this.baseUrl}${path}`, {
        waitUntil: 'networkidle',
        timeout: 30000
      });

      if (!response || !response.ok()) {
        throw new Error(`Failed to load page: ${response?.status()}`);
      }

      // Collect performance metrics
      const navigationTiming = await page.evaluate(() => {
        const timing = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
        return {
          ttfb: timing.responseStart - timing.requestStart,
          fcp: performance.getEntriesByName('first-contentful-paint')[0]?.startTime || 0,
          loadTime: timing.loadEventEnd - timing.requestStart
        };
      });

      metrics = {
        loadTime: navigationTiming.loadTime,
        ttfb: navigationTiming.ttfb,
        fcp: navigationTiming.fcp
      };

    } catch (error) {
      console.error(`Error testing ${path}:`, error);
      passed = false;
    } finally {
      await page.close();
    }

    return {
      title,
      passed,
      duration: Date.now() - startTime,
      metrics
    };
  }
} 