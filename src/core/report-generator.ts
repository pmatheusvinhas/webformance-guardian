import { PerformanceAnalyzer, PerformanceMetrics, PerformanceAnalysis } from './performance-analyzer';
import * as fs from 'fs';
import * as path from 'path';

interface Report {
  timestamp: string;
  metrics: PerformanceMetrics;
  analysis: PerformanceAnalysis;
}

export class ReportGenerator {
  private readonly outputDir: string;
  private readonly analyzer: PerformanceAnalyzer;

  constructor(apiToken: string, outputDir: string = 'reports') {
    this.outputDir = outputDir;
    this.analyzer = new PerformanceAnalyzer(apiToken);
    this.ensureDirectoryExists();
  }

  private ensureDirectoryExists(): void {
    if (!fs.existsSync(this.outputDir)) {
      fs.mkdirSync(this.outputDir, { recursive: true });
    }
  }

  async generateReport(metrics: PerformanceMetrics): Promise<void> {
    try {
      console.log('Analyzing performance metrics...');
      const analysis = await this.analyzer.analyzePerformance(metrics);

      const report: Report = {
        timestamp: new Date().toISOString(),
        metrics,
        analysis
      };

      // Save full report as JSON
      const jsonPath = path.join(this.outputDir, 'performance-report.json');
      fs.writeFileSync(jsonPath, JSON.stringify(report, null, 2));
      console.log(`Full report saved to: ${jsonPath}`);

      // Generate markdown report
      const markdown = this.generateMarkdown(report);
      const mdPath = path.join(this.outputDir, 'performance-report.md');
      fs.writeFileSync(mdPath, markdown);
      console.log(`Markdown report saved to: ${mdPath}`);

      // Log summary to console
      console.log('\nPerformance Analysis Summary:');
      console.log('-'.repeat(50));
      console.log(analysis.summary);
      console.log('\nKey Issues:');
      analysis.issues.forEach(issue => {
        console.log(`${issue.severity.toUpperCase()}: ${issue.message}`);
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to generate report';
      throw new Error(errorMessage);
    }
  }

  private generateMarkdown(report: Report): string {
    return `# Performance Analysis Report
Generated: ${new Date(report.timestamp).toLocaleString()}

## Summary
${report.analysis.summary}

## Performance Metrics

### Main Site
- TTFB: ${report.metrics.mainSite.timing.ttfb}ms
- FCP: ${report.metrics.mainSite.timing.fcp}ms
- LCP: ${report.metrics.mainSite.timing.lcp}ms
- Total Time: ${report.metrics.mainSite.totalTime}ms

### App Redirect
- TTFB: ${report.metrics.appRedirect.timing.ttfb}ms
- FCP: ${report.metrics.appRedirect.timing.fcp}ms
- LCP: ${report.metrics.appRedirect.timing.lcp}ms
- Total Time: ${report.metrics.appRedirect.totalTime}ms

### Auth Page
- TTFB: ${report.metrics.authPage.timing.ttfb}ms
- FCP: ${report.metrics.authPage.timing.fcp}ms
- LCP: ${report.metrics.authPage.timing.lcp}ms
- Total Time: ${report.metrics.authPage.totalTime}ms

#### Form Interaction Times
- Email Input: ${report.metrics.authPage.formTiming.emailInputTime}ms
- Password Input: ${report.metrics.authPage.formTiming.passwordInputTime}ms
- Submit Button: ${report.metrics.authPage.formTiming.buttonTime}ms

## Issues

${report.analysis.issues.map(issue => `### ${issue.severity.toUpperCase()}
**${issue.message}**
${issue.recommendation}
`).join('\n')}

## Insights
${report.analysis.insights.map(insight => `- ${insight}`).join('\n')}
`;
  }
} 