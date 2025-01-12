import { TestReporter } from '../../src/core/test-reporter';
import { TestResult } from '../../src/core/types';

describe('TestReporter', () => {
  let reporter: TestReporter;

  beforeEach(() => {
    reporter = new TestReporter();
  });

  describe('generateReport', () => {
    it('should generate a report from test results', () => {
      const testResults: TestResult[] = [
        {
          title: 'Login Performance',
          passed: true,
          duration: 3500,
          metrics: {
            loadTime: 2500,
            ttfb: 200,
            fcp: 800
          }
        }
      ];

      const report = reporter.generateReport(testResults);
      
      expect(report).toBeDefined();
      expect(report.summary).toBeDefined();
      expect(report.metrics).toBeDefined();
      expect(report.metrics.loadTime).toBeDefined();
    });

    it('should handle test results without metrics', () => {
      const testResults: TestResult[] = [
        {
          title: 'Login Performance',
          passed: true,
          duration: 3500
        }
      ];

      const report = reporter.generateReport(testResults);
      
      expect(report).toBeDefined();
      expect(report.summary).toBeDefined();
      expect(report.metrics).toBeDefined();
    });
  });
}); 