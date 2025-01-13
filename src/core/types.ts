export type TestStatus = 'passed' | 'failed' | 'skipped';

export interface TestMetrics {
  loadTime?: number;
  ttfb?: number;
  fcp?: number;
}

export interface TestResult {
  title: string;
  passed: boolean;
  duration: number;
  metrics?: PerformanceMetrics;
}

export interface PerformanceMetrics {
  loadTime: number;
  ttfb: number;
  fcp: number;
  count?: number;
}

export interface PageMetrics {
  timing: {
    ttfb: number;
    fcp: number;
    lcp: number;
  };
  totalTime: number;
}

export interface FormTiming {
  emailInputTime: number;
  passwordInputTime: number;
  buttonTime: number;
}

export interface PerformanceAnalysis {
  summary: string;
  issues: PerformanceIssue[];
  insights: string[];
}

export interface TestCase {
  title: string;
  description: string;
  steps: string[];
  url?: string;
  selector?: string;
  threshold?: number;
  retries?: number;
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

export interface PerformanceIssue {
  severity: 'critical' | 'warning' | 'info';
  message: string;
  recommendation: string;
} 