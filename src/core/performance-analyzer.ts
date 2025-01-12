import fetch from 'node-fetch';

export interface PerformanceMetrics {
  mainSite: {
    timing: {
      ttfb: number;
      fcp: number;
      lcp: number;
    };
    totalTime: number;
  };
  appRedirect: {
    timing: {
      ttfb: number;
      fcp: number;
      lcp: number;
    };
    totalTime: number;
  };
  authPage: {
    timing: {
      ttfb: number;
      fcp: number;
      lcp: number;
    };
    totalTime: number;
    formTiming: {
      emailInputTime: number;
      passwordInputTime: number;
      buttonTime: number;
    };
  };
}

export interface PerformanceAnalysis {
  summary: string;
  issues: Array<{
    severity: 'critical' | 'warning' | 'info';
    message: string;
    recommendation: string;
  }>;
  insights: string[];
}

export class PerformanceAnalyzer {
  private readonly HUGGINGFACE_API = 'https://api-inference.huggingface.co/models';
  private readonly MODEL = 'google/flan-t5-large';

  constructor(private readonly apiToken: string) {}

  private async query(input: string): Promise<string> {
    const response = await fetch(`${this.HUGGINGFACE_API}/${this.MODEL}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        inputs: input,
        parameters: {
          max_new_tokens: 250,
          temperature: 0.1,
          top_p: 0.95,
          do_sample: false
        }
      })
    });

    if (!response.ok) {
      throw new Error(`Hugging Face API error: ${response.statusText}`);
    }

    const result = await response.json();
    if (!result || (!Array.isArray(result) && !result.generated_text)) {
      throw new Error('Invalid response from Hugging Face API');
    }

    return Array.isArray(result) ? result[0].generated_text : result.generated_text;
  }

  async analyzePerformance(metrics: PerformanceMetrics): Promise<PerformanceAnalysis> {
    const prompt = `Analyze these web performance metrics and provide insights:

Main Site:
- TTFB: ${metrics.mainSite.timing.ttfb}ms
- FCP: ${metrics.mainSite.timing.fcp}ms
- LCP: ${metrics.mainSite.timing.lcp}ms
- Total Time: ${metrics.mainSite.totalTime}ms

App Redirect:
- TTFB: ${metrics.appRedirect.timing.ttfb}ms
- FCP: ${metrics.appRedirect.timing.fcp}ms
- LCP: ${metrics.appRedirect.timing.lcp}ms
- Total Time: ${metrics.appRedirect.totalTime}ms

Auth Page:
- TTFB: ${metrics.authPage.timing.ttfb}ms
- FCP: ${metrics.authPage.timing.fcp}ms
- LCP: ${metrics.authPage.timing.lcp}ms
- Total Time: ${metrics.authPage.totalTime}ms
- Email Input Time: ${metrics.authPage.formTiming.emailInputTime}ms
- Password Input Time: ${metrics.authPage.formTiming.passwordInputTime}ms
- Button Time: ${metrics.authPage.formTiming.buttonTime}ms

Provide analysis in this format:

SUMMARY
[One paragraph summary of overall performance]

ISSUES
Critical:
- [Issue]: [Recommendation]

Warning:
- [Issue]: [Recommendation]

Info:
- [Issue]: [Recommendation]

INSIGHTS
- [Key insight 1]
- [Key insight 2]
- [Key insight 3]`;

    const response = await this.query(prompt);
    return this.parseAnalysis(response);
  }

  private parseAnalysis(text: string): PerformanceAnalysis {
    const sections = text.split('\n\n');
    const summary = sections.find(s => s.startsWith('SUMMARY'))?.replace('SUMMARY\n', '') || '';
    
    const issues: PerformanceAnalysis['issues'] = [];
    const issuesSection = sections.find(s => s.startsWith('ISSUES'));
    if (issuesSection) {
      let currentSeverity: 'critical' | 'warning' | 'info' | null = null;
      const lines = issuesSection.split('\n').map(line => line.trim());
      
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        if (line === 'ISSUES') continue;
        
        if (line === 'Critical:') {
          currentSeverity = 'critical';
        } else if (line === 'Warning:') {
          currentSeverity = 'warning';
        } else if (line === 'Info:') {
          currentSeverity = 'info';
        } else if (currentSeverity && line.startsWith('- ')) {
          const [message, recommendation] = line.slice(2).split(': ').map(s => s.trim());
          if (message && recommendation) {
            issues.push({ severity: currentSeverity, message, recommendation });
          }
        }
      }
    }

    const insightsSection = sections.find(s => s.startsWith('INSIGHTS'));
    const insights = insightsSection
      ? insightsSection
          .split('\n')
          .filter(line => line.trim().startsWith('- '))
          .map(line => line.trim().slice(2))
      : [];

    return { summary: summary.trim(), issues, insights };
  }
} 