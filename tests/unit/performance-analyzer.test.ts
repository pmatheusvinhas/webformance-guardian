import { PerformanceAnalyzer } from '../../src/core/performance-analyzer';
import { TestResult } from '../../src/core/types';

describe('PerformanceAnalyzer', () => {
  let analyzer: PerformanceAnalyzer;

  beforeEach(() => {
    analyzer = new PerformanceAnalyzer('test-token', true);
  });

  const mockTestResults: TestResult[] = [
    {
      title: 'Main Site Performance',
      passed: true,
      duration: 3000,
      metrics: {
        loadTime: 2500,
        ttfb: 200,
        fcp: 800
      }
    },
    {
      title: 'App Redirect Performance',
      passed: true,
      duration: 2500,
      metrics: {
        loadTime: 2000,
        ttfb: 150,
        fcp: 600
      }
    },
    {
      title: 'Auth Page Performance',
      passed: true,
      duration: 4000,
      metrics: {
        loadTime: 3500,
        ttfb: 250,
        fcp: 1000
      }
    }
  ];

  describe('analyzePerformance', () => {
    it('should analyze performance metrics and return insights', async () => {
      const result = await analyzer.analyzePerformance(mockTestResults);
      
      expect(result).toBeDefined();
      expect(result.summary).toBeDefined();
      expect(result.issues).toBeDefined();
      expect(result.insights).toBeDefined();
    });

    it('should identify performance issues when metrics exceed thresholds', async () => {
      const slowTestResults: TestResult[] = [
        {
          title: 'Slow Page Load',
          passed: false,
          duration: 8000,
          metrics: {
            loadTime: 7500,
            ttfb: 1500,
            fcp: 3000
          }
        }
      ];

      const result = await analyzer.analyzePerformance(slowTestResults);
      
      expect(result.issues.length).toBeGreaterThan(0);
      expect(result.issues[0].severity).toBe('warning');
    });

    it('should handle missing metrics gracefully', async () => {
      const incompleteResults: TestResult[] = [
        {
          title: 'Incomplete Test',
          passed: true,
          duration: 1000
        }
      ];

      const result = await analyzer.analyzePerformance(incompleteResults);
      
      expect(result).toBeDefined();
      expect(result.summary).toBeDefined();
    });
  });
}); 