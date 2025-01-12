import { Page } from '@playwright/test';
import { SiteTestBase, ElementValidationResult, LinkValidationResult } from '../../core/site-test-base';

export class StablySite extends SiteTestBase {
  // Common selectors across the site
  readonly selectors = {
    navigation: {
      howItWorks: 'a:has-text("How It Works"), a[href*="howitworks"]',
      pricing: 'a:has-text("Pricing"), a[href*="pricing"]',
      blogs: 'a:has-text("Blog"), a[href*="blog"]',
      docs: 'a:has-text("Docs"), a[href*="docs"]',
      careers: 'a:has-text("Career"), a[href*="career"]',
      getStarted: 'a:has-text("Get Started"), button:has-text("Get Started")',
      login: 'a:has-text("Log in"), button:has-text("Log in")'
    },
    footer: {
      features: 'a:has-text("Features"), a[href*="features"]',
      blog: 'a:has-text("Blog"), a[href*="blog"]',
      linkedin: 'a[href*="linkedin.com"]',
      twitter: 'a[href*="twitter.com"]',
      contact: 'a:has-text("Contact")',
      privacy: 'a:has-text("Privacy"), a[href*="privacy"]',
      terms: 'a:has-text("Terms"), a[href*="terms"]'
    },
    homepage: {
      heroTitle: 'h1:has-text("Ship faster"), div:has-text("Ship faster")',
      startTrial: 'a:has-text("Start free trial"), button:has-text("Start free trial")',
      bookDemo: 'a:has-text("Book Demo"), button:has-text("Book Demo")'
    }
  };

  constructor(page: Page) {
    super(page, 'https://www.stably.ai', {
      maxDepth: 3,
      includeExternal: false,
      ignorePaths: ['/api', '/auth']
    });
  }

  async waitForPageLoad(): Promise<void> {
    await this.page.waitForLoadState('domcontentloaded');
    await this.page.waitForLoadState('networkidle');
  }

  async validateNavigation(): Promise<ElementValidationResult[]> {
    await this.waitForPageLoad();
    return this.validateAllElements(Object.values(this.selectors.navigation));
  }

  async validateFooter(): Promise<ElementValidationResult[]> {
    await this.waitForPageLoad();
    return this.validateAllElements(Object.values(this.selectors.footer));
  }

  async validateHomepage(): Promise<ElementValidationResult[]> {
    await this.waitForPageLoad();
    return this.validateAllElements(Object.values(this.selectors.homepage));
  }

  async validateAllComponents(): Promise<{
    navigation: ElementValidationResult[];
    footer: ElementValidationResult[];
    homepage: ElementValidationResult[];
  }> {
    await this.page.goto(this.baseUrl);
    await this.waitForPageLoad();
    
    return {
      navigation: await this.validateNavigation(),
      footer: await this.validateFooter(),
      homepage: await this.validateHomepage()
    };
  }

  async captureFullSiteMetrics(): Promise<{
    components: {
      navigation: ElementValidationResult[];
      footer: ElementValidationResult[];
      homepage: ElementValidationResult[];
    };
    links: LinkValidationResult[];
    performance: any;
  }> {
    await this.waitForPageLoad();
    const components = await this.validateAllComponents();
    const links = await this.crawlSite();
    const performance = await this.captureNavigationMetrics();

    return {
      components,
      links,
      performance
    };
  }
} 