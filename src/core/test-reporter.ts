import { TestResult, TestMetrics } from './types';

export interface Report {
  summary: string;
  metrics: TestMetrics;
}

export class TestReporter {
  constructor(private outputDir: string = './reports') {}

  generateReport(results: TestResult[]): Report {
    const report: Report = {
      summary: this.generateSummary(results),
      metrics: this.calculateAverageMetrics(results)
    };

    return report;
  }

  private generateSummary(results: TestResult[]): string {
    const totalTests = results.length;
    const passedTests = results.filter(r => r.passed).length;
    return `${passedTests}/${totalTests} tests passed`;
  }

  private calculateAverageMetrics(results: TestResult[]): TestMetrics {
    const metrics: TestMetrics = {};
    
    if (results.length === 0) return metrics;

    const validResults = results.filter(r => r.metrics);
    if (validResults.length === 0) return metrics;

    // Calculate average for each metric type
    const calculateAverage = (metricKey: keyof TestMetrics) => {
      const values = validResults
        .filter(r => r.metrics && r.metrics[metricKey])
        .map(r => r.metrics![metricKey]!);
      
      if (values.length > 0) {
        metrics[metricKey] = values.reduce((a, b) => a + b, 0) / values.length;
      }
    };

    calculateAverage('loadTime');
    calculateAverage('ttfb');
    calculateAverage('fcp');

    return metrics;
  }
} 