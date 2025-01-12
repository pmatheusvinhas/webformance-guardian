import { PerformanceAnalyzer } from '../../src/core/performance-analyzer';
import fetch from 'node-fetch';

// Mock node-fetch
jest.mock('node-fetch');
const mockedFetch = fetch as jest.MockedFunction<typeof fetch>;

describe('PerformanceAnalyzer', () => {
  const mockApiToken = 'test-token';
  let analyzer: PerformanceAnalyzer;

  beforeEach(() => {
    analyzer = new PerformanceAnalyzer(mockApiToken);
    jest.clearAllMocks();
  });

  const mockMetrics = {
    mainSite: {
      timing: { ttfb: 100, fcp: 500, lcp: 1200 },
      totalTime: 1500
    },
    appRedirect: {
      timing: { ttfb: 80, fcp: 400, lcp: 900 },
      totalTime: 1000
    },
    authPage: {
      timing: { ttfb: 90, fcp: 450, lcp: 1000 },
      totalTime: 1200,
      formTiming: {
        emailInputTime: 50,
        passwordInputTime: 45,
        buttonTime: 40
      }
    }
  };

  describe('analyzePerformance', () => {
    it('should make correct API call to Hugging Face', async () => {
      const mockResponse = {
        generated_text: `SUMMARY
Performance is within acceptable ranges.

ISSUES
Critical:
- High LCP on main site: Optimize image loading

Warning:
- TTFB could be improved: Consider CDN

Info:
- Form interactions are good: Monitor for changes

INSIGHTS
- Main site LCP needs attention
- Redirect chain is optimized
- Auth page performs well`
      };

      mockedFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse)
      } as any);

      await analyzer.analyzePerformance(mockMetrics);

      expect(mockedFetch).toHaveBeenCalledWith(
        'https://api-inference.huggingface.co/models/google/flan-t5-large',
        expect.objectContaining({
          method: 'POST',
          headers: {
            'Authorization': 'Bearer test-token',
            'Content-Type': 'application/json'
          }
        })
      );
    });

    it('should parse analysis response correctly', async () => {
      const mockResponse = {
        generated_text: `SUMMARY
Performance is within acceptable ranges.

ISSUES
Critical:
- High LCP on main site: Optimize image loading
Warning:
- TTFB could be improved: Consider CDN
Info:
- Form interactions are good: Monitor for changes

INSIGHTS
- Main site LCP needs attention
- Redirect chain is optimized
- Auth page performs well`
      };

      mockedFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse)
      } as any);

      const result = await analyzer.analyzePerformance(mockMetrics);

      expect(result).toEqual({
        summary: 'Performance is within acceptable ranges.',
        issues: [
          {
            severity: 'critical',
            message: 'High LCP on main site',
            recommendation: 'Optimize image loading'
          },
          {
            severity: 'warning',
            message: 'TTFB could be improved',
            recommendation: 'Consider CDN'
          },
          {
            severity: 'info',
            message: 'Form interactions are good',
            recommendation: 'Monitor for changes'
          }
        ],
        insights: [
          'Main site LCP needs attention',
          'Redirect chain is optimized',
          'Auth page performs well'
        ]
      });

      expect(mockedFetch).toHaveBeenCalledWith(
        'https://api-inference.huggingface.co/models/google/flan-t5-large',
        expect.objectContaining({
          method: 'POST',
          headers: {
            'Authorization': 'Bearer test-token',
            'Content-Type': 'application/json'
          }
        })
      );
    });

    it('should handle API errors gracefully', async () => {
      mockedFetch.mockResolvedValueOnce({
        ok: false,
        statusText: 'Service Unavailable'
      } as any);

      await expect(analyzer.analyzePerformance(mockMetrics))
        .rejects
        .toThrow('Hugging Face API error: Service Unavailable');
    });

    it('should handle malformed API responses', async () => {
      const mockResponse = {
        generated_text: 'Invalid format response'
      };

      mockedFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse)
      } as any);

      const result = await analyzer.analyzePerformance(mockMetrics);

      expect(result).toEqual({
        summary: '',
        issues: [],
        insights: []
      });
    });
  });
}); 