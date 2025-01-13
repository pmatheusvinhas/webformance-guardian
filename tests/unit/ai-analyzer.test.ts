import { AIAnalyzer } from '../../src/core/ai-analyzer';
import { TestResult } from '../../src/core/types';

describe('AIAnalyzer', () => {
  let analyzer: AIAnalyzer;

  beforeEach(() => {
    analyzer = new AIAnalyzer('test-token', true); // Enable mock mode
  });

  const mockTestResults: TestResult[] = [
    {
      title: 'Main Page Load',
      passed: false,
      duration: 6000,
      metrics: {
        loadTime: 5500,
        ttfb: 800,
        fcp: 2000
      }
    },
    {
      title: 'API Response',
      passed: true,
      duration: 300,
      metrics: {
        loadTime: 250,
        ttfb: 100,
        fcp: 200
      }
    }
  ];

  describe('analyzeResults', () => {
    it('should analyze test results and provide insights', async () => {
      const analysis = await analyzer.analyzeResults(mockTestResults);
      
      expect(analysis).toBeDefined();
      expect(analysis.summary).toBeDefined();
      expect(analysis.recommendations).toBeInstanceOf(Array);
    });

    it('should handle failed tests appropriately', async () => {
      const failedTests: TestResult[] = [
        {
          title: 'Failed Test',
          passed: false,
          duration: 6000,
          metrics: {
            loadTime: 5500,
            ttfb: 800,
            fcp: 2000
          }
        }
      ];

      const analysis = await analyzer.analyzeResults(failedTests);
      expect(analysis.recommendations.length).toBeGreaterThan(0);
    });

    it('should handle missing metrics gracefully', async () => {
      const incompleteTest: TestResult[] = [
        {
          title: 'Incomplete Test',
          passed: true,
          duration: 1000
        }
      ];

      const analysis = await analyzer.analyzeResults(incompleteTest);
      expect(analysis).toBeDefined();
      expect(analysis.summary).toBeDefined();
    });
  });
}); 