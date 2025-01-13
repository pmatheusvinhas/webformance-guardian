import { ReportGenerator } from '../../src/core/report-generator';
import { TestResult, PerformanceAnalysis } from '../../src/core/types';
import fs from 'fs/promises';
import path from 'path';

jest.mock('fs/promises');
jest.mock('path', () => ({
  join: (...args: string[]) => args.join('/')
}));

describe('ReportGenerator', () => {
  let generator: ReportGenerator;
  const mockOutputDir = './test-reports';

  beforeEach(() => {
    generator = new ReportGenerator('test-token', mockOutputDir, true);
    jest.clearAllMocks();
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

  describe('generateReport', () => {
    it('should generate and save reports successfully', async () => {
      await generator.generateReport(mockTestResults);

      // Verify directory creation
      expect(fs.mkdir).toHaveBeenCalledWith(mockOutputDir, { recursive: true });
      expect(fs.mkdir).toHaveBeenCalledWith(`${mockOutputDir}/history`, { recursive: true });

      // Verify file writes (results.json, analysis.json, history-index.json, and detailed report in history folder)
      expect(fs.writeFile).toHaveBeenCalledTimes(4);
      
      // Verify specific file writes
      const writeFileCalls = (fs.writeFile as jest.Mock).mock.calls;
      const writtenFiles = writeFileCalls.map((call: any[]) => call[0]);

      expect(writtenFiles).toContain(`${mockOutputDir}/results.json`);
      expect(writtenFiles).toContain(`${mockOutputDir}/analysis.json`);
      expect(writtenFiles).toContain(`${mockOutputDir}/history-index.json`);
      expect(writtenFiles.some((file: string) => file.includes('report-'))).toBe(true);
    });

    it('should handle errors gracefully', async () => {
      const mockError = new Error('Failed to write file');
      (fs.writeFile as jest.Mock).mockRejectedValue(mockError);

      await expect(generator.generateReport(mockTestResults))
        .rejects
        .toThrow();
    });
  });

  describe('generateMarkdownReport', () => {
    it('should generate markdown report with correct format', async () => {
      const mockReport = {
        timestamp: '2024-01-12T00:00:00.000Z',
        results: mockTestResults,
        analysis: {
          summary: 'Test summary',
          issues: [{
            severity: 'warning' as const,
            message: 'Test issue',
            recommendation: 'Test recommendation'
          }],
          insights: ['Test insight']
        } as PerformanceAnalysis
      };

      const markdown = await generator.generateMarkdownReport(mockReport);

      expect(markdown).toContain('# Performance Test Report');
      expect(markdown).toContain('Test summary');
      expect(markdown).toContain('Test issue');
      expect(markdown).toContain('Test insight');
      expect(markdown).toContain('Main Site Performance');
    });
  });
}); 