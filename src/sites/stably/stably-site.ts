import { Page } from 'playwright';
import { SiteTestBase, LinkValidationResult } from '../../core/site-test-base';

export class StablySite extends SiteTestBase {
  // Common selectors across the site
  private readonly selectors = {
    navigation: 'nav',
    footer: 'footer',
    mainContent: 'main',
    loginButton: '[data-testid="login-button"]',
    signupButton: '[data-testid="signup-button"]',
    loginForm: '#login-form',
    signupForm: '#signup-form'
  };

  constructor(page: Page) {
    super(page);
  }

  async runTests(): Promise<void> {
    // Navigate to homepage
    await this.page.goto('https://www.stably.io');

    // Measure initial page load
    const metrics = await this.getPerformanceMetrics();
    console.log('Initial page load metrics:', metrics);

    // Validate navigation links
    const navLinks = await this.validateLinks(this.selectors.navigation);
    console.log('Navigation links validation:', navLinks);

    // Measure interaction with login button
    const loginInteractionTime = await this.measureInteraction(this.selectors.loginButton);
    console.log('Login button interaction time:', loginInteractionTime);

    // Measure form interaction
    const formInteractionTime = await this.measureFormInteraction(
      this.selectors.loginForm,
      '[type="submit"]'
    );
    console.log('Login form interaction time:', formInteractionTime);

    // Final performance check
    const finalMetrics = await this.getPerformanceMetrics();
    console.log('Final performance metrics:', finalMetrics);
  }
} 