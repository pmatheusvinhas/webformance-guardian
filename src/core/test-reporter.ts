import { TestResult, TestStatus, TestMetrics } from './types';
import * as fs from 'fs';
import * as path from 'path';

interface TestReport {
  timestamp: string;
  tests: TestResult[];
  metrics: {
    mainSite: {
      timing: {
        ttfb: {
          average: number;
          min: number;
          max: number;
        };
        fcp: {
          average: number;
          min: number;
          max: number;
        };
        loadTime: {
          average: number;
          min: number;
          max: number;
        };
      };
    };
  };
}

interface AnalysisReport {
  timestamp: string;
  performance: {
    score: number;
    metrics: {
      average_response_time: number;
      pass_rate: number;
      total_duration: number;
    };
  };
  issues: Array<{
    severity: 'critical' | 'warning' | 'info';
    message: string;
    suggestion: string;
  }>;
  ai_insights: {
    patterns: string[];
    recommendations: string[];
  };
}

export class TestReporter {
  private results: TestResult[] = [];
  private outputDir: string;
  private readonly MAX_HISTORY_FILES = 10;  // Mantém apenas os 10 últimos relatórios

  constructor(site: string) {
    this.outputDir = path.join(process.cwd(), 'src', 'ui');
    this.ensureDirectoryExists(this.outputDir);
  }

  private ensureDirectoryExists(dir: string) {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  }

  addResult(result: TestResult) {
    this.results.push(result);
  }

  private calculateMetrics() {
    const validResults = this.results.filter(r => r.metrics && r.status === 'passed');
    
    const calculateStats = (metric: keyof TestMetrics) => {
      const values = validResults
        .map(r => r.metrics[metric])
        .filter((v): v is number => typeof v === 'number' && !isNaN(v) && v >= 0);
      
      if (values.length === 0) return { average: 0, min: 0, max: 0 };
      
      const sum = values.reduce((a, b) => a + b, 0);
      const avg = sum / values.length;
      const min = Math.min(...values);
      const max = Math.max(...values);
      
      console.log(`Calculating ${metric}:`, {
        values: values.length,
        sum,
        avg,
        min,
        max
      });
      
      return {
        average: avg,
        min: min,
        max: max
      };
    };

    const metrics = {
      ttfb: calculateStats('ttfb'),
      fcp: calculateStats('fcp'),
      loadTime: calculateStats('loadTime')
    };

    console.log('\nCalculated metrics:', JSON.stringify(metrics, null, 2));
    return metrics;
  }

  private calculatePerformanceScore(): number {
    const weights = {
      passRate: 0.4,
      responseTime: 0.3,
      errorRate: 0.3
    };

    const passRate = this.results.filter(r => r.status === 'passed').length / this.results.length;
    const metrics = this.calculateMetrics();
    const avgResponseTime = metrics.loadTime.average;
    const errorRate = this.results.filter(r => r.status === 'failed').length / this.results.length;

    const normalizedResponseTime = Math.max(0, 1 - (avgResponseTime / 5000));

    const score = (
      (passRate * weights.passRate) +
      (normalizedResponseTime * weights.responseTime) +
      ((1 - errorRate) * weights.errorRate)
    ) * 100;

    return Math.round(score);
  }

  private analyzeIssues(): AnalysisReport['issues'] {
    const issues: AnalysisReport['issues'] = [];
    const metrics = this.calculateMetrics();

    // Analyze performance issues
    if (metrics.loadTime.average > 3000) {
      issues.push({
        severity: 'critical',
        message: 'High Average Load Time',
        suggestion: `Average load time is ${Math.round(metrics.loadTime.average)}ms. Consider optimizing page load performance.`
      });
    }

    if (metrics.ttfb.average > 200) {
      issues.push({
        severity: 'warning',
        message: 'High Time to First Byte',
        suggestion: `Average TTFB is ${Math.round(metrics.ttfb.average)}ms. Consider server-side optimizations.`
      });
    }

    // Analyze error patterns
    const failedTests = this.results.filter(r => r.status === 'failed');
    if (failedTests.length > 0) {
      issues.push({
        severity: 'warning',
        message: 'Test Failures Detected',
        suggestion: `${failedTests.length} tests failed. Review error messages and consider implementing retry mechanisms.`
      });
    }

    return issues;
  }

  private generateAIInsights(): AnalysisReport['ai_insights'] {
    const patterns: string[] = [];
    const recommendations: string[] = [];
    const metrics = this.calculateMetrics();

    // Analyze performance patterns
    if (metrics.loadTime.max > metrics.loadTime.average * 2) {
      patterns.push('High variance in load times detected');
      recommendations.push('Investigate elements with inconsistent load times');
    }

    if (metrics.ttfb.average > 100) {
      patterns.push('Server response times are higher than optimal');
      recommendations.push('Consider implementing server-side caching or optimizing API responses');
    }

    if (metrics.fcp.average > 500) {
      patterns.push('First Contentful Paint times are high');
      recommendations.push('Optimize critical rendering path and reduce initial bundle size');
    }

    return { patterns, recommendations };
  }

  private cleanupOldHistory() {
    const historyDir = path.join(this.outputDir, 'history');
    if (!fs.existsSync(historyDir)) return;

    const files = fs.readdirSync(historyDir)
      .filter(f => f.startsWith('results-'))
      .sort((a, b) => b.localeCompare(a));  // Ordena do mais recente para o mais antigo

    // Remove arquivos excedentes
    if (files.length > this.MAX_HISTORY_FILES) {
      files.slice(this.MAX_HISTORY_FILES).forEach(file => {
        const baseName = file.replace('results-', '').replace('.json', '');
        fs.unlinkSync(path.join(historyDir, `results-${baseName}.json`));
        fs.unlinkSync(path.join(historyDir, `analysis-${baseName}.json`));
      });
    }
  }

  private saveHistoricalCopy(testReport: TestReport, analysisReport: AnalysisReport) {
    const historyDir = path.join(this.outputDir, 'history');
    this.ensureDirectoryExists(historyDir);
    
    const dateStr = new Date().toISOString().replace(/[:.]/g, '-');
    
    // Salva os novos arquivos
    fs.writeFileSync(
      path.join(historyDir, `results-${dateStr}.json`),
      JSON.stringify(testReport, null, 2)
    );
    fs.writeFileSync(
      path.join(historyDir, `analysis-${dateStr}.json`),
      JSON.stringify(analysisReport, null, 2)
    );

    // Limpa arquivos antigos
    this.cleanupOldHistory();

    // Gera índice do histórico
    const historyIndex = this.generateHistoryIndex();
    fs.writeFileSync(
      path.join(this.outputDir, 'history-index.json'),
      JSON.stringify(historyIndex, null, 2)
    );
  }

  private generateHistoryIndex(): { timestamps: string[] } {
    const historyDir = path.join(this.outputDir, 'history');
    if (!fs.existsSync(historyDir)) return { timestamps: [] };

    const timestamps = fs.readdirSync(historyDir)
      .filter(f => f.startsWith('results-'))
      .map(f => f.replace('results-', '').replace('.json', ''))
      .sort((a, b) => b.localeCompare(a))  // Mais recente primeiro
      .slice(0, this.MAX_HISTORY_FILES);    // Limita ao máximo de arquivos

    return { timestamps };
  }

  generateReports() {
    const timestamp = new Date().toISOString();
    console.log('\nGenerating reports with', this.results.length, 'results');
    console.log('Passed tests:', this.results.filter(r => r.status === 'passed').length);
    
    const metrics = this.calculateMetrics();

    // Generate test results report
    const testReport: TestReport = {
      timestamp,
      tests: this.results,
      metrics: {
        mainSite: {
          timing: metrics
        }
      }
    };

    // Generate analysis report
    const analysisReport: AnalysisReport = {
      timestamp,
      performance: {
        score: this.calculatePerformanceScore(),
        metrics: {
          average_response_time: metrics.loadTime.average,
          pass_rate: (this.results.filter(r => r.status === 'passed').length / this.results.length) * 100,
          total_duration: this.results.reduce((acc, r) => acc + r.duration, 0)
        }
      },
      issues: this.analyzeIssues(),
      ai_insights: this.generateAIInsights()
    };

    // Write current reports
    const resultsPath = path.join(this.outputDir, 'results.json');
    const analysisPath = path.join(this.outputDir, 'analysis.json');
    
    fs.writeFileSync(resultsPath, JSON.stringify(testReport, null, 2));
    fs.writeFileSync(analysisPath, JSON.stringify(analysisReport, null, 2));
    
    console.log('Reports saved to:', this.outputDir);
    console.log('Results file:', resultsPath);
    console.log('Analysis file:', analysisPath);

    // Save historical copy and manage history
    this.saveHistoricalCopy(testReport, analysisReport);
  }
} 