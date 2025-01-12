import { chromium, Page } from '@playwright/test';
import { TestCase, TestResult } from './types';

export class TestRunner {
  constructor(private url: string) {}

  private async measurePerformance(page: Page): Promise<{[key: string]: number}> {
    const metrics = await page.evaluate(() => {
      const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
      const paint = performance.getEntriesByType('paint');
      const fcp = paint.find(entry => entry.name === 'first-contentful-paint');
      
      const loadTime = Math.max(0, navigation.loadEventEnd - navigation.requestStart);
      const ttfb = Math.max(0, navigation.responseStart - navigation.requestStart);
      const fcpTime = fcp ? Math.max(0, fcp.startTime) : 0;
      
      return {
        ttfb: ttfb,
        fcp: fcpTime,
        loadTime: loadTime
      };
    });
    
    return metrics;
  }

  async runTest(test: TestCase): Promise<TestResult> {
    const startTime = Date.now();
    let lastError: Error | null = null;
    const maxRetries = test.retries || 0;
    let browser;
    
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        browser = await chromium.launch();
        const page = await browser.newPage();
        
        console.log(`\n🔄 Running test: ${test.title}`);
        if (attempt > 0) {
          console.log(`   Retry attempt ${attempt + 1}/${maxRetries + 1}`);
        }
        
        // Configura timeout para navegação
        page.setDefaultNavigationTimeout(test.threshold || 30000);
        page.setDefaultTimeout(test.threshold || 30000);
        
        // Inicia medição
        console.log('   ⏳ Navigating to page...');
        await page.goto(this.url, { waitUntil: 'domcontentloaded' });
        
        if (test.selector) {
          console.log(`   🔍 Waiting for element: ${test.selector}`);
          // Espera o elemento estar presente no DOM
          await page.waitForSelector(test.selector, { state: 'attached' });
          
          // Se for um botão ou link, espera estar clicável
          const element = await page.$(test.selector);
          const tagName = await element?.evaluate(el => el.tagName.toLowerCase());
          if (tagName === 'button' || tagName === 'a') {
            await page.waitForSelector(test.selector, { state: 'visible' });
          }
        }
        
        // Coleta métricas de performance
        console.log('   📊 Collecting performance metrics...');
        const metrics = await this.measurePerformance(page);
        await browser.close();
        browser = null;
        
        const result: TestResult = {
          title: test.title,
          status: 'passed',
          duration: Date.now() - startTime,
          metrics: metrics
        };

        if (test.threshold && metrics.loadTime > test.threshold) {
          result.warning = `Performance threshold of ${test.threshold}ms exceeded (took ${metrics.loadTime}ms)`;
          console.log(`   ⚠️  ${result.warning}`);
        }
        
        console.log(`   ✅ Test completed successfully`);
        console.log(`      Load Time: ${metrics.loadTime}ms`);
        console.log(`      TTFB: ${metrics.ttfb}ms`);
        console.log(`      FCP: ${metrics.fcp}ms`);
        
        return result;
        
      } catch (error) {
        if (browser) {
          await browser.close();
          browser = null;
        }
        
        lastError = error as Error;
        const errorMsg = error instanceof Error ? error.message : 'Unknown error';
        console.log(`   ❌ Test failed: ${errorMsg}`);
        
        if (attempt < maxRetries) {
          console.log(`   ⏳ Retrying in 2 seconds...`);
          await new Promise(resolve => setTimeout(resolve, 2000));
          continue;
        }
      }
    }
    
    return {
      title: test.title,
      status: 'failed',
      duration: Date.now() - startTime,
      error: lastError?.message || 'Unknown error',
      metrics: {
        ttfb: 0,
        fcp: 0,
        loadTime: 0
      }
    };
  }

  // Método para executar todos os testes
  async runAllTests(testCases: TestCase[]): Promise<TestResult[]> {
    console.log('\n📋 Starting test execution...');
    console.log(`   Total tests: ${testCases.length}\n`);
    
    const results: TestResult[] = [];
    for (const test of testCases) {
      const result = await this.runTest(test);
      results.push(result);
    }
    
    // Print summary
    const passed = results.filter(r => r.status === 'passed').length;
    const failed = results.filter(r => r.status === 'failed').length;
    const warnings = results.filter(r => r.warning).length;
    
    console.log('\n📊 Test Execution Summary:');
    console.log(`   ✅ Passed: ${passed}`);
    console.log(`   ❌ Failed: ${failed}`);
    if (warnings > 0) {
      console.log(`   ⚠️  Tests with warnings: ${warnings}`);
    }
    console.log('');
    
    try {
      // Força o encerramento de qualquer browser que possa ter ficado aberto
      const browserServer = await chromium.launchServer();
      await browserServer.close();
    } catch (error) {
      console.error('Error cleaning up browsers:', error);
    }
    
    return results;
  }
} 