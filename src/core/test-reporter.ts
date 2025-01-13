import { TestResult, TestMetrics } from './types';

export interface Report {
  summary: string;
  metrics: TestMetrics;
  totalTests: number;
  passedTests: number;
}

export class TestReporter {
  constructor(private outputDir: string = './reports') {}

  generateReport(results: TestResult[]): Report {
    const totalTests = results.length;
    const passedTests = results.filter(r => r.passed).length;

    return {
      summary: this.generateSummary(totalTests, passedTests),
      metrics: this.calculateAverageMetrics(results),
      totalTests,
      passedTests
    };
  }

  private generateSummary(total: number, passed: number): string {
    return `${passed}/${total} tests passed`;
  }

  private calculateAverageMetrics(results: TestResult[]): TestMetrics {
    const metrics: TestMetrics = {
      loadTime: undefined,
      ttfb: undefined,
      fcp: undefined
    };
    
    if (results.length === 0) return metrics;

    const validResults = results.filter(r => r.metrics);
    if (validResults.length === 0) return metrics;

    // Calculate average for each metric type
    const calculateAverage = (metricKey: keyof TestMetrics) => {
      const values = validResults
        .filter(r => r.metrics && typeof r.metrics[metricKey] === 'number')
        .map(r => r.metrics![metricKey]!);
      
      if (values.length > 0) {
        metrics[metricKey] = values.reduce((a, b) => (a || 0) + (b || 0), 0) / values.length;
      }
    };

    calculateAverage('loadTime');
    calculateAverage('ttfb');
    calculateAverage('fcp');

    return metrics;
  }
} 