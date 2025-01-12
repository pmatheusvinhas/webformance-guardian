import { AIAnalyzer } from '../../src/core/ai-analyzer';
import fetch from 'node-fetch';
import { chromium } from 'playwright';

// Mock node-fetch
jest.mock('node-fetch');
const mockedFetch = fetch as jest.MockedFunction<typeof fetch>;

// Mock playwright
jest.mock('playwright', () => ({
  chromium: {
    launch: jest.fn().mockResolvedValue({
      newPage: jest.fn().mockResolvedValue({
        goto: jest.fn().mockResolvedValue(null),
        waitForLoadState: jest.fn().mockResolvedValue(null),
        evaluate: jest.fn().mockResolvedValue('Mocked content'),
        close: jest.fn().mockResolvedValue(null)
      }),
      close: jest.fn().mockResolvedValue(null)
    })
  }
}));

describe('AIAnalyzer', () => {
  let analyzer: AIAnalyzer;
  
  beforeEach(() => {
    jest.clearAllMocks();
    analyzer = new AIAnalyzer('test-token', 3, 0);
  });

  describe('generateTestCases', () => {
    it('should extract content and generate test cases', async () => {
      const mockResponse = {
        ok: true,
        json: jest.fn().mockResolvedValue([{
          generated_text: JSON.stringify([
            {
              title: 'Homepage Load Performance',
              description: 'Verifies the load time and performance metrics of the homepage',
              steps: ['Navigate to homepage', 'Wait for page load', 'Measure performance metrics']
            },
            {
              title: 'Login Button Interactivity',
              description: 'Checks if the login button is visible and clickable',
              steps: ['Navigate to homepage', 'Wait for login button', 'Verify button is clickable']
            }
          ])
        }])
      };
      mockedFetch.mockResolvedValue(mockResponse as any);
      
      const testCases = await analyzer.generateTestCases('https://example.com');
      
      expect(testCases).toHaveLength(2);
      expect(testCases[0]).toHaveProperty('title');
      expect(testCases[0]).toHaveProperty('description');
      expect(mockedFetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Authorization': 'Bearer test-token'
          })
        })
      );
    });

    it('should return default test cases on error', async () => {
      mockedFetch.mockRejectedValue(new Error('API Error'));
      
      const testCases = await analyzer.generateTestCases('https://example.com');
      
      expect(testCases).toHaveLength(2);
      expect(testCases[0].title).toBe('Homepage Load Performance');
    }, 30000);

    it('should handle invalid JSON response', async () => {
      const mockResponse = {
        ok: true,
        json: jest.fn().mockResolvedValue([{
          generated_text: 'Invalid JSON'
        }])
      };
      mockedFetch.mockResolvedValue(mockResponse as any);

      const testCases = await analyzer.generateTestCases('https://example.com');
      
      expect(testCases).toHaveLength(2); // Should return default cases
      expect(testCases[0].title).toBe('Homepage Load Performance');
    }, 10000);

    it('should handle empty response', async () => {
      const mockResponse = {
        ok: true,
        json: jest.fn().mockResolvedValue([])
      };
      mockedFetch.mockResolvedValue(mockResponse as any);

      const testCases = await analyzer.generateTestCases('https://example.com');
      
      expect(testCases).toHaveLength(2); // Should return default cases
      expect(testCases[0].title).toBe('Homepage Load Performance');
    }, 10000);
  });

  describe('generateTestCode', () => {
    it('should generate valid Playwright test code', async () => {
      const testCases = [{
        title: 'Test Case',
        selector: '#button',
        metricType: 'pageLoad',
        threshold: 1000
      }];

      const code = await analyzer.generateTestCode(testCases);
      
      expect(code).toContain('import { test, expect }');
      expect(code).toContain('Test Case');
      expect(code).toContain('#button');
    });

    it('should handle test cases without optional fields', async () => {
      const testCases = [{
        title: 'Basic Test',
        steps: ['Step 1']
      }];

      const code = await analyzer.generateTestCode(testCases);
      
      expect(code).toContain('Basic Test');
      expect(code).toContain('No description provided');
      expect(code).toContain('performanceTime');
      expect(code).toContain('toBeLessThan(3000)');
    });
  });

  describe('analyzeTestResults', () => {
    it('should analyze test results and return formatted analysis', async () => {
      const mockResponse = {
        ok: true,
        json: jest.fn().mockResolvedValue([{
          generated_text: `
SUMMARY:
All tests passed

ISSUES:
Critical:
- Issue 1
Suggestion: Fix 1

PERFORMANCE:
Score: 95
Insights:
- Good performance
          `
        }])
      };
      mockedFetch.mockResolvedValue(mockResponse as any);

      const analysis = await analyzer.analyzeTestResults({
        tests: [{ title: 'Test', status: 'passed', duration: 1000 }]
      });
      
      expect(analysis.summary).toBeTruthy();
      expect(analysis.issues).toBeDefined();
      expect(analysis.performance.score).toBe(95);
    });

    it('should handle invalid analysis response', async () => {
      const mockResponse = {
        ok: true,
        json: jest.fn().mockResolvedValue([{
          generated_text: ''
        }])
      };
      mockedFetch.mockResolvedValue(mockResponse as any);

      const analysis = await analyzer.analyzeTestResults({
        tests: [{ title: 'Test', status: 'failed', duration: 1000 }]
      });
      
      expect(analysis.summary).toBe('No analysis available');
      expect(analysis.issues).toHaveLength(0);
      expect(analysis.performance.score).toBe(0);
    });

    it('should handle API errors', async () => {
      mockedFetch.mockRejectedValue(new Error('API Error'));

      const analysis = await analyzer.analyzeTestResults({
        tests: [{ title: 'Test', status: 'failed', duration: 1000 }]
      });
      
      expect(analysis.summary).toBe('No analysis available');
      expect(analysis.issues).toHaveLength(0);
      expect(analysis.performance.score).toBe(0);
      expect(mockedFetch).toHaveBeenCalledTimes(3); // Verifica que tentou 3 vezes
    });

    it('should handle malformed API response', async () => {
      const mockResponse = {
        ok: true,
        json: jest.fn().mockResolvedValue([{
          generated_text: 'Invalid JSON'
        }])
      };
      mockedFetch.mockResolvedValue(mockResponse as any);

      const analysis = await analyzer.analyzeTestResults({
        tests: [{ title: 'Test', status: 'failed', duration: 1000 }]
      });
      
      expect(analysis.summary).toBe('No analysis available');
      expect(analysis.issues).toHaveLength(0);
      expect(analysis.performance.score).toBe(0);
    });

    it('should handle empty API response', async () => {
      const mockResponse = {
        ok: true,
        json: jest.fn().mockResolvedValue([])
      };
      mockedFetch.mockResolvedValue(mockResponse as any);

      const analysis = await analyzer.analyzeTestResults({
        tests: [{ title: 'Test', status: 'failed', duration: 1000 }]
      });
      
      expect(analysis.summary).toBe('No analysis available');
      expect(analysis.issues).toHaveLength(0);
      expect(analysis.performance.score).toBe(0);
    });
  });
}); 