import { TestReporter } from '../../src/core/test-reporter';
import * as fs from 'fs';
import * as path from 'path';

jest.mock('fs');
const mockedFs = fs as jest.Mocked<typeof fs>;

describe('TestReporter', () => {
  let reporter: TestReporter;
  const outputDir = '/test/output';

  beforeEach(() => {
    jest.clearAllMocks();
    reporter = new TestReporter(outputDir);
  });

  describe('generateReports', () => {
    it('should generate JSON reports', () => {
      reporter.addResult({
        title: 'Test Case',
        status: 'passed',
        duration: 1000,
        metrics: {
          ttfb: 100,
          fcp: 200,
          lcp: 300
        }
      });

      reporter.generateReports();
      
      // Verify number of calls
      expect(mockedFs.writeFileSync).toHaveBeenCalledTimes(2);

      // Get the actual calls
      const calls = (mockedFs.writeFileSync as jest.Mock).mock.calls;
      
      // Find results.json call
      const resultsCall = calls.find(call => call[0].includes('results.json'));
      expect(resultsCall).toBeTruthy();
      const resultsJson = JSON.parse(resultsCall![1]);
      expect(resultsJson.tests[0].title).toBe('Test Case');
      expect(resultsJson.tests[0].status).toBe('passed');
      
      // Find analysis.json call
      const analysisCall = calls.find(call => call[0].includes('analysis.json'));
      expect(analysisCall).toBeTruthy();
      const analysisJson = JSON.parse(analysisCall![1]);
      expect(analysisJson.performance).toBeDefined();
      expect(analysisJson.issues).toBeDefined();
    });

    it('should handle empty results', () => {
      reporter.generateReports();
      
      // Verify number of calls
      expect(mockedFs.writeFileSync).toHaveBeenCalledTimes(2);

      // Get the actual calls
      const calls = (mockedFs.writeFileSync as jest.Mock).mock.calls;
      
      // Find results.json call
      const resultsCall = calls.find(call => call[0].includes('results.json'));
      expect(resultsCall).toBeTruthy();
      const resultsJson = JSON.parse(resultsCall![1]);
      expect(resultsJson.tests).toEqual([]);
      
      // Find analysis.json call
      const analysisCall = calls.find(call => call[0].includes('analysis.json'));
      expect(analysisCall).toBeTruthy();
      const analysisJson = JSON.parse(analysisCall![1]);
      expect(analysisJson.performance).toBeDefined();
      expect(analysisJson.issues).toEqual([]);
    });

    it('should create output directory if it does not exist', () => {
      mockedFs.existsSync.mockReturnValue(false);
      
      reporter.generateReports();
      
      expect(mockedFs.mkdirSync).toHaveBeenCalledWith(outputDir, { recursive: true });
      expect(mockedFs.writeFileSync).toHaveBeenCalledTimes(2);
    });

    it('should calculate performance score correctly', () => {
      // Add mix of passed and failed tests
      reporter.addResult({
        title: 'Fast Test',
        status: 'passed',
        duration: 1000
      });
      reporter.addResult({
        title: 'Slow Test',
        status: 'passed',
        duration: 4000
      });
      reporter.addResult({
        title: 'Failed Test',
        status: 'failed',
        duration: 2000,
        error: 'Test error'
      });

      reporter.generateReports();

      const calls = (mockedFs.writeFileSync as jest.Mock).mock.calls;
      const analysisCall = calls.find(call => call[0].includes('analysis.json'));
      const analysisJson = JSON.parse(analysisCall![1]);

      expect(analysisJson.performance.score).toBeGreaterThan(0);
      expect(Math.round(analysisJson.performance.metrics.pass_rate * 100) / 100).toBe(66.67);
      expect(Math.round(analysisJson.performance.metrics.average_response_time * 100) / 100).toBe(2333.33);
    });

    it('should handle skipped tests', () => {
      reporter.addResult({
        title: 'Skipped Test',
        status: 'skipped',
        duration: 0
      });

      reporter.generateReports();

      const calls = (mockedFs.writeFileSync as jest.Mock).mock.calls;
      const analysisCall = calls.find(call => call[0].includes('analysis.json'));
      const analysisJson = JSON.parse(analysisCall![1]);

      expect(analysisJson.issues).toContainEqual(
        expect.objectContaining({
          severity: 'info',
          message: expect.stringContaining('Test Coverage Gap')
        })
      );
    });

    it('should analyze performance issues', () => {
      reporter.addResult({
        title: 'Very Slow Test',
        status: 'passed',
        duration: 5000
      });

      reporter.generateReports();

      const calls = (mockedFs.writeFileSync as jest.Mock).mock.calls;
      const analysisCall = calls.find(call => call[0].includes('analysis.json'));
      const analysisJson = JSON.parse(analysisCall![1]);

      expect(analysisJson.issues).toContainEqual(
        expect.objectContaining({
          severity: 'critical',
          message: expect.stringContaining('Performance Degradation')
        })
      );
    });

    it('should handle tests with error details', () => {
      const error = new Error('Test failure');
      reporter.addResult({
        title: 'Failed Test',
        status: 'failed',
        duration: 1000,
        error: error.message,
        metrics: {
          ttfb: 100
        }
      });

      reporter.generateReports();

      const calls = (mockedFs.writeFileSync as jest.Mock).mock.calls;
      const resultsCall = calls.find(call => call[0].includes('results.json'));
      const resultsJson = JSON.parse(resultsCall![1]);

      expect(resultsJson.tests[0].error).toBe('Test failure');
      expect(resultsJson.tests[0].metrics).toEqual({ ttfb: 100 });
    });

    it('should handle multiple test runs', () => {
      // First run
      reporter.addResult({
        title: 'Test 1',
        status: 'passed',
        duration: 1000
      });

      reporter.generateReports();

      // Second run
      reporter.addResult({
        title: 'Test 2',
        status: 'passed',
        duration: 2000
      });

      reporter.generateReports();

      const calls = (mockedFs.writeFileSync as jest.Mock).mock.calls;
      const lastResultsCall = calls.filter(call => call[0].includes('results.json')).pop();
      const resultsJson = JSON.parse(lastResultsCall![1]);

      expect(resultsJson.tests).toHaveLength(2);
      expect(resultsJson.tests[1].title).toBe('Test 2');
    });
  });
}); 