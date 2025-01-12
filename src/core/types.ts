export type TestStatus = 'passed' | 'failed' | 'skipped';

export interface TestMetrics {
  ttfb?: number;
  fcp?: number;
  lcp?: number;
  [key: string]: number | undefined;
}

export interface TestResult {
  title: string;
  status: TestStatus;
  duration: number;
  error?: string;
  warning?: string;
  metrics: TestMetrics;
}

export interface TestAnalysis {
  summary: string;
  issues: Array<{
    severity: 'critical' | 'warning' | 'info';
    message: string;
    suggestion: string;
  }>;
  performance: {
    score: number;
    insights: string[];
  };
}

export interface TestCase {
  title: string;
  description: string;
  selector?: string;
  steps: string[];
  threshold?: number;
  retries?: number;
} 