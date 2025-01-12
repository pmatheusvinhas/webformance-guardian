import fetch from 'node-fetch';

interface PageInfo {
  url: string;
  title?: string;
  forms: string[];
  buttons: string[];
  clickableElements: string[];
}

export class SiteCrawler {
  private visitedUrls = new Set<string>();
  private readonly maxPages = 10;

  constructor(private readonly baseUrl: string) {}

  async crawl(): Promise<PageInfo[]> {
    console.log(`Starting crawl from ${this.baseUrl}`);
    const pages: PageInfo[] = [];
    await this.crawlPage(this.baseUrl, pages);
    return pages;
  }

  private async crawlPage(url: string, pages: PageInfo[]): Promise<void> {
    if (this.visitedUrls.has(url) || pages.length >= this.maxPages) {
      return;
    }

    this.visitedUrls.add(url);
    console.log(`Crawling ${url}...`);

    try {
      const response = await fetch(url);
      const html = await response.text();

      // Extract page info
      const pageInfo: PageInfo = {
        url,
        forms: this.extractForms(html),
        buttons: this.extractButtons(html),
        clickableElements: this.extractClickableElements(html)
      };

      // Try to extract title
      const titleMatch = html.match(/<title>(.*?)<\/title>/i);
      if (titleMatch) {
        pageInfo.title = titleMatch[1];
      }

      pages.push(pageInfo);

      // Extract and follow links
      const links = this.extractLinks(html, url);
      for (const link of links) {
        if (this.shouldCrawl(link)) {
          await this.crawlPage(link, pages);
        }
      }
    } catch (error) {
      console.error(`Error crawling ${url}:`, error);
    }
  }

  private extractForms(html: string): string[] {
    const forms: string[] = [];
    const formMatches = html.match(/<form[^>]*>/gi) || [];
    
    for (const form of formMatches) {
      // Try by ID
      const idMatch = form.match(/id=["']([^"']+)["']/i);
      if (idMatch) {
        forms.push(`form#${idMatch[1]}`);
        continue;
      }
      
      // Try by name
      const nameMatch = form.match(/name=["']([^"']+)["']/i);
      if (nameMatch) {
        forms.push(`form[name="${nameMatch[1]}"]`);
        continue;
      }
      
      // Try by action
      const actionMatch = form.match(/action=["']([^"']+)["']/i);
      if (actionMatch) {
        forms.push(`form[action*="${actionMatch[1]}"]`);
        continue;
      }
      
      // Last resort: any form
      forms.push('form');
    }
    
    return forms;
  }

  private extractButtons(html: string): string[] {
    const buttons: string[] = [];
    const buttonMatches = html.match(/<button[^>]*>.*?<\/button>|<input[^>]*type=["'](?:button|submit)["'][^>]*>/gi) || [];
    
    for (const button of buttonMatches) {
      // Try by ID
      const idMatch = button.match(/id=["']([^"']+)["']/i);
      if (idMatch) {
        buttons.push(`button#${idMatch[1]}, input#${idMatch[1]}`);
        continue;
      }
      
      // Try by name
      const nameMatch = button.match(/name=["']([^"']+)["']/i);
      if (nameMatch) {
        buttons.push(`button[name="${nameMatch[1]}"], input[name="${nameMatch[1]}"]`);
        continue;
      }
      
      // Try by text content
      const textMatch = button.match(/>([^<]+)</i);
      if (textMatch) {
        const text = textMatch[1].trim();
        if (text) {
          buttons.push(`button:has-text("${text}"), input[value="${text}"]`);
          continue;
        }
      }
      
      // Try by aria-label
      const ariaMatch = button.match(/aria-label=["']([^"']+)["']/i);
      if (ariaMatch) {
        buttons.push(`button[aria-label="${ariaMatch[1]}"], input[aria-label="${ariaMatch[1]}"]`);
        continue;
      }
      
      // Last resort: role or type
      buttons.push('button[role="button"], input[type="button"], input[type="submit"]');
    }
    
    return buttons;
  }

  private extractClickableElements(html: string): string[] {
    const elements: string[] = [];
    
    // Match elements with onClick/onclick handlers
    const clickableMatches = html.match(/<[^>]+(?:onClick|onclick)=["'][^"']+["'][^>]*>/gi) || [];
    
    for (const element of clickableMatches) {
      // Try by ID
      const idMatch = element.match(/id=["']([^"']+)["']/i);
      if (idMatch) {
        elements.push(`[id="${idMatch[1]}"]`);
        continue;
      }
      
      // Try by role
      const roleMatch = element.match(/role=["']([^"']+)["']/i);
      if (roleMatch) {
        elements.push(`[role="${roleMatch[1]}"]`);
        continue;
      }
      
      // Try by data-testid (common in React)
      const testIdMatch = element.match(/data-testid=["']([^"']+)["']/i);
      if (testIdMatch) {
        elements.push(`[data-testid="${testIdMatch[1]}"]`);
        continue;
      }
      
      // Try by class that indicates clickable (common patterns)
      const classMatch = element.match(/class=["']([^"']*(?:btn|button|clickable)[^"']*)["']/i);
      if (classMatch) {
        elements.push(`.${classMatch[1].replace(/\s+/g, '.')}`);
        continue;
      }
      
      // Last resort: element with onClick
      const tagMatch = element.match(/<(\w+)/i);
      if (tagMatch) {
        elements.push(`${tagMatch[1]}[onclick]`);
      }
    }
    
    return elements;
  }

  private extractLinks(html: string, baseUrl: string): string[] {
    const links: string[] = [];
    const linkMatches = html.match(/href=["']([^"']+)["']/gi) || [];
    
    for (const link of linkMatches) {
      const href = link.match(/href=["']([^"']+)["']/i)?.[1];
      if (href) {
        try {
          const absoluteUrl = new URL(href, baseUrl).toString();
          if (absoluteUrl.startsWith(this.baseUrl)) {
            links.push(absoluteUrl);
          }
        } catch (error) {
          // Invalid URL, skip it
        }
      }
    }
    
    return links;
  }

  private shouldCrawl(url: string): boolean {
    // Skip non-HTML and resource files
    const skipExtensions = [
      '.css', '.js', '.png', '.jpg', '.jpeg', '.gif', '.svg', '.ico',
      '.woff', '.woff2', '.ttf', '.eot', '.pdf', '.doc', '.docx',
      '.mp4', '.webm', '.mp3', '.wav', '.zip', '.tar', '.gz'
    ];
    
    // Skip URLs with query parameters or fragments
    if (url.includes('?') || url.includes('#')) {
      return false;
    }
    
    if (skipExtensions.some(ext => url.toLowerCase().endsWith(ext))) {
      return false;
    }

    // Only crawl pages under the base URL
    return url.startsWith(this.baseUrl) && !this.visitedUrls.has(url);
  }
} 