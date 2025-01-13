import { TestResult, PerformanceAnalysis } from './types';
import { PerformanceAnalyzer } from './performance-analyzer';
import fs from 'fs/promises';
import path from 'path';

export interface ReportGeneratorOptions {
  apiKey: string;
  outputDir?: string;
  useMock?: boolean;
}

export class ReportGenerator {
  private analyzer: PerformanceAnalyzer;
  private outputDir: string;

  constructor(options: ReportGeneratorOptions) {
    const { apiKey, outputDir = './public/data', useMock = false } = options;
    this.analyzer = new PerformanceAnalyzer(apiKey, useMock);
    this.outputDir = outputDir;
  }

  async generateReport(results: TestResult[]): Promise<void> {
    try {
      const analysis = await this.analyzer.analyzePerformance(results);
      const report = {
        timestamp: new Date().toISOString(),
        results,
        analysis
      };

      await this.saveReport(report);
      await this.updateHistory(report);
    } catch (error) {
      console.error('Error generating report:', error);
      throw error;
    }
  }

  private async saveReport(report: { timestamp: string; results: TestResult[]; analysis: PerformanceAnalysis }): Promise<void> {
    await fs.mkdir(this.outputDir, { recursive: true });

    // Save results and analysis separately
    await fs.writeFile(
      path.join(this.outputDir, 'results.json'),
      JSON.stringify(report.results, null, 2)
    );

    await fs.writeFile(
      path.join(this.outputDir, 'analysis.json'),
      JSON.stringify(report.analysis, null, 2)
    );
  }

  private async updateHistory(report: { timestamp: string; results: TestResult[]; analysis: PerformanceAnalysis }): Promise<void> {
    const historyFile = path.join(this.outputDir, 'history-index.json');
    let history: Array<{ timestamp: string; summary: string }> = [];

    try {
      const historyData = await fs.readFile(historyFile, 'utf-8');
      history = JSON.parse(historyData);
    } catch (error) {
      // If file doesn't exist or is invalid, start with empty history
      console.log('Starting new history file');
    }

    // Add new entry
    history.push({
      timestamp: report.timestamp,
      summary: report.analysis.summary
    });

    // Keep only last 6 days of history
    const sixDaysAgo = new Date();
    sixDaysAgo.setDate(sixDaysAgo.getDate() - 6);
    history = history.filter(entry => new Date(entry.timestamp) > sixDaysAgo);

    // Save updated history
    await fs.writeFile(historyFile, JSON.stringify(history, null, 2));

    // Save detailed report in history folder
    const historyDir = path.join(this.outputDir, 'history');
    await fs.mkdir(historyDir, { recursive: true });

    const reportFile = path.join(
      historyDir,
      `report-${report.timestamp.replace(/[:.]/g, '-')}.json`
    );

    await fs.writeFile(reportFile, JSON.stringify(report, null, 2));
  }

  async generateMarkdownReport(report: { timestamp: string; results: TestResult[]; analysis: PerformanceAnalysis }): Promise<string> {
    const markdown = `# Performance Test Report
Generated: ${new Date(report.timestamp).toLocaleString()}

## Summary
${report.analysis.summary}

## Performance Issues
${report.analysis.issues.map(issue => `### ${issue.severity.toUpperCase()}
- **Issue**: ${issue.message}
- **Recommendation**: ${issue.recommendation}
`).join('\n')}

## Insights
${report.analysis.insights.map(insight => `- ${insight}`).join('\n')}

## Test Results
${report.results.map(test => `### ${test.title}
- Status: ${test.passed ? '✅ Passed' : '❌ Failed'}
- Duration: ${test.duration}ms
${test.metrics ? `- Load Time: ${test.metrics.loadTime}ms
- TTFB: ${test.metrics.ttfb}ms
- FCP: ${test.metrics.fcp}ms` : '- No metrics available'}
`).join('\n')}`;

    return markdown;
  }
} 