import { Page } from '@playwright/test';
import { PerformanceBase } from '../helpers/performance-base';

export interface LinkValidationResult {
  url: string;
  status: number;
  loadTime: number;
  isExternal: boolean;
}

export interface ElementValidationResult {
  selector: string;
  visible: boolean;
  interactive: boolean;
  loadTime: number;
}

export class SiteTestBase extends PerformanceBase {
  constructor(
    protected page: Page,
    protected baseUrl: string,
    protected options: {
      ignorePaths?: string[];
      maxDepth?: number;
      includeExternal?: boolean;
    } = {}
  ) {
    super(page);
  }

  async getAllLinks(): Promise<string[]> {
    return await this.page.evaluate(() => {
      return Array.from(document.querySelectorAll('a'))
        .map(a => a.href)
        .filter(href => href && !href.startsWith('javascript:') && !href.startsWith('#'));
    });
  }

  async validateLink(url: string): Promise<LinkValidationResult> {
    const startTime = Date.now();
    const response = await this.page.request.get(url).catch(() => null);
    const loadTime = Date.now() - startTime;

    return {
      url,
      status: response?.status() ?? 0,
      loadTime,
      isExternal: !url.startsWith(this.baseUrl)
    };
  }

  async validateElement(selector: string): Promise<ElementValidationResult> {
    const startTime = Date.now();
    const element = this.page.locator(selector);
    
    const visible = await element.isVisible().catch(() => false);
    const enabled = await element.isEnabled().catch(() => false);
    
    return {
      selector,
      visible,
      interactive: visible && enabled,
      loadTime: Date.now() - startTime
    };
  }

  async crawlSite(startUrl: string = this.baseUrl): Promise<LinkValidationResult[]> {
    const visited = new Set<string>();
    const results: LinkValidationResult[] = [];
    const queue: { url: string; depth: number }[] = [{ url: startUrl, depth: 0 }];

    while (queue.length > 0) {
      const { url, depth } = queue.shift()!;
      
      if (visited.has(url) || 
          (this.options.maxDepth && depth > this.options.maxDepth) ||
          (!this.options.includeExternal && !url.startsWith(this.baseUrl))) {
        continue;
      }

      visited.add(url);
      const result = await this.validateLink(url);
      results.push(result);

      if (result.status === 200 && !result.isExternal) {
        await this.page.goto(url);
        const newLinks = await this.getAllLinks();
        
        for (const link of newLinks) {
          if (!visited.has(link)) {
            queue.push({ url: link, depth: depth + 1 });
          }
        }
      }
    }

    return results;
  }

  async validateAllElements(selectors: string[]): Promise<ElementValidationResult[]> {
    const results: ElementValidationResult[] = [];
    
    for (const selector of selectors) {
      const result = await this.validateElement(selector);
      results.push(result);
    }

    return results;
  }

  async captureScreenshot(path: string): Promise<void> {
    await this.page.screenshot({ path, fullPage: true });
  }
} 