import { ReportGenerator } from '../../src/core/report-generator';
import { PerformanceAnalyzer } from '../../src/core/performance-analyzer';
import * as fs from 'fs';
import * as path from 'path';

jest.mock('../../src/core/performance-analyzer');
jest.mock('fs');
jest.mock('path');

describe('ReportGenerator', () => {
  const mockApiToken = 'test-token';
  const mockOutputDir = 'test-reports';
  let generator: ReportGenerator;
  
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

  const mockAnalysis = {
    summary: 'Test summary',
    issues: [
      {
        severity: 'critical',
        message: 'Test issue',
        recommendation: 'Test recommendation'
      }
    ],
    insights: ['Test insight']
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (PerformanceAnalyzer as jest.MockedClass<typeof PerformanceAnalyzer>).mockImplementation(() => ({
      analyzePerformance: jest.fn().mockResolvedValue(mockAnalysis)
    } as any));
    generator = new ReportGenerator(mockApiToken, mockOutputDir);
  });

  describe('constructor', () => {
    it('should create output directory if it does not exist', () => {
      expect(fs.existsSync).toHaveBeenCalledWith(mockOutputDir);
      expect(fs.mkdirSync).toHaveBeenCalledWith(mockOutputDir, { recursive: true });
    });
  });

  describe('generateReport', () => {
    beforeEach(() => {
      (path.join as jest.Mock).mockImplementation((...args) => args.join('/'));
    });

    it('should generate and save reports', async () => {
      await generator.generateReport(mockMetrics);

      // Check if files were written
      expect(fs.writeFileSync).toHaveBeenCalledWith(
        'test-reports/performance-report.json',
        expect.any(String)
      );
      expect(fs.writeFileSync).toHaveBeenCalledWith(
        'test-reports/performance-report.md',
        expect.any(String)
      );

      // Verify JSON content
      const jsonContent = (fs.writeFileSync as jest.Mock).mock.calls.find(
        call => call[0] === 'test-reports/performance-report.json'
      )[1];
      const parsedJson = JSON.parse(jsonContent);
      expect(parsedJson).toMatchObject({
        metrics: mockMetrics,
        analysis: mockAnalysis
      });

      // Verify markdown content
      const mdContent = (fs.writeFileSync as jest.Mock).mock.calls.find(
        call => call[0] === 'test-reports/performance-report.md'
      )[1];
      expect(mdContent).toContain('# Performance Analysis Report');
      expect(mdContent).toContain(mockAnalysis.summary);
      expect(mdContent).toContain('Test issue');
      expect(mdContent).toContain('Test insight');
    });

    it('should handle errors during report generation', async () => {
      const mockError = new Error('Analysis failed');
      (PerformanceAnalyzer as jest.MockedClass<typeof PerformanceAnalyzer>)
        .mockImplementationOnce(() => ({
          analyzePerformance: jest.fn().mockRejectedValueOnce(mockError)
        } as any));

      const generator = new ReportGenerator(mockApiToken, mockOutputDir);
      await expect(generator.generateReport(mockMetrics))
        .rejects
        .toThrow('Analysis failed');
    });
  });
}); 