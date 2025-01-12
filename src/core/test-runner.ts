import { chromium, Page } from '@playwright/test';
import { TestResult } from './types';

export class TestRunner {
  private readonly baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  async runTests(): Promise<TestResult[]> {
    const browser = await chromium.launch();
    const results: TestResult[] = [];

    try {
      const context = await browser.newContext();
      const page = await context.newPage();

      // Test 1: Homepage Load
      results.push(await this.testPageLoad(page, '/', 'Homepage Load'));

      // Test 2: Navigation Performance
      results.push(await this.testPageLoad(page, '/pricing', 'Pricing Page Load'));
      results.push(await this.testPageLoad(page, '/blog', 'Blog Page Load'));

      // Test 3: Interactive Elements
      results.push(await this.testInteractiveElement(page, '/', 'button[type="submit"]', 'CTA Button Click'));
      results.push(await this.testInteractiveElement(page, '/contact', 'form', 'Contact Form Interaction'));

    } catch (error) {
      console.error('Error running tests:', error);
    } finally {
      await browser.close();
    }

    return results;
  }

  private async testPageLoad(page: Page, path: string, title: string): Promise<TestResult> {
    const startTime = Date.now();
    let metrics = {};
    let error = undefined;
    let passed = true;

    try {
      const response = await page.goto(`${this.baseUrl}${path}`);
      if (!response?.ok()) {
        throw new Error(`Failed to load page: ${response?.status()}`);
      }

      // Coletar métricas de performance
      const timing = await page.evaluate(() => {
        const perf = window.performance;
        const pageNav = perf.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
        return {
          ttfb: pageNav.responseStart - pageNav.requestStart,
          fcp: perf.getEntriesByName('first-contentful-paint')[0]?.startTime || 0,
          loadTime: pageNav.loadEventEnd - pageNav.requestStart
        };
      });

      metrics = timing;
    } catch (e) {
      error = e instanceof Error ? e.message : 'Unknown error';
      passed = false;
    }

    return {
      title,
      passed,
      duration: Date.now() - startTime,
      error,
      metrics: metrics as { loadTime: number; ttfb: number; fcp: number }
    };
  }

  private async testInteractiveElement(page: Page, path: string, selector: string, title: string): Promise<TestResult> {
    const startTime = Date.now();
    let metrics = {};
    let error = undefined;
    let passed = true;

    try {
      await page.goto(`${this.baseUrl}${path}`);
      await page.waitForSelector(selector);

      const interactionStart = Date.now();
      await page.click(selector);
      const interactionTime = Date.now() - interactionStart;

      metrics = {
        loadTime: interactionTime,
        ttfb: 0, // Não aplicável para interações
        fcp: 0   // Não aplicável para interações
      };
    } catch (e) {
      error = e instanceof Error ? e.message : 'Unknown error';
      passed = false;
    }

    return {
      title,
      passed,
      duration: Date.now() - startTime,
      error,
      metrics: metrics as { loadTime: number; ttfb: number; fcp: number }
    };
  }
} 