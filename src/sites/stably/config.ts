export const config = {
  baseUrl: 'https://www.stably.ai',
  routes: {
    home: '/',
    login: '/login',
    dashboard: '/dashboard'
  },
  performanceThresholds: {
    pageLoad: 3000,    // 3 seconds
    interactivity: 5000, // 5 seconds
    ttfb: 800,         // 800ms
    fcp: 1500,         // 1.5 seconds
    lcp: 2500          // 2.5 seconds
  },
  selectors: {
    loginButton: 'a:has-text("Log In")',
    navigationMenu: 'nav',
    contactForm: 'form[name="contact"]'
  }
}; 