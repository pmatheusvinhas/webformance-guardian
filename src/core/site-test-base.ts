import { Page } from 'playwright';
import { PerformanceBase } from '../helpers/performance-base';

export interface LinkValidationResult {
  url: string;
  valid: boolean;
  error?: string;
}

export abstract class SiteTestBase extends PerformanceBase {
  constructor(protected readonly page: Page) {
    super();
  }

  abstract runTests(): Promise<void>;

  protected async validateLinks(selector: string): Promise<LinkValidationResult[]> {
    const results: LinkValidationResult[] = [];
    const links = await this.page.$$(selector);

    for (const link of links) {
      const href = await link.getAttribute('href');
      if (!href) continue;

      try {
        const response = await fetch(href);
        results.push({
          url: href,
          valid: response.ok
        });
      } catch (error) {
        results.push({
          url: href,
          valid: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }

    return results;
  }

  protected async measureInteraction(selector: string): Promise<number> {
    return this.measureInteractionTime(this.page, selector);
  }

  protected async measureFormInteraction(formSelector: string, submitSelector: string): Promise<number> {
    const startTime = Date.now();
    await this.page.fill(`${formSelector} input[type="email"]`, 'test@example.com');
    await this.page.fill(`${formSelector} input[type="password"]`, 'password123');
    await this.page.click(submitSelector);
    return Date.now() - startTime;
  }

  protected async getPerformanceMetrics() {
    const loadMetrics = await this.measurePageLoad(this.page);
    const networkMetrics = await this.measureNetworkRequests(this.page);
    const memoryUsage = await this.measureMemoryUsage(this.page);

    return {
      ...loadMetrics,
      networkRequests: networkMetrics.count,
      networkSize: networkMetrics.totalSize,
      memoryUsage
    };
  }
} 