import fetch from 'node-fetch';
import { TestResult } from './types';

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
    console.log('Sending request to Hugging Face API...');
    
    try {
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
            temperature: 0.3,
            top_p: 0.95,
            do_sample: true,
            return_full_text: false
          }
        })
      });

      if (!response.ok) {
        throw new Error(`Hugging Face API error: ${response.statusText} (${response.status})`);
      }

      const result = await response.json();
      console.log('Raw API Response:', JSON.stringify(result, null, 2));

      if (!Array.isArray(result)) {
        throw new Error('Invalid response from Hugging Face API');
      }

      return result[0].generated_text || 'No analysis generated';
    } catch (error) {
      console.error('Error querying Hugging Face API:', error);
      throw error;
    }
  }

  async analyzePerformance(results: TestResult[]): Promise<PerformanceAnalysis> {
    console.log('Generating analysis prompt...');
    const prompt = this.generateAnalysisPrompt(results);
    console.log('Analysis Prompt:', prompt);

    try {
      const response = await this.query(prompt);
      console.log('Parsing analysis response...');
      return this.parseAnalysis(response);
    } catch (error) {
      console.error('Error analyzing performance:', error);
      return {
        summary: 'Failed to generate analysis due to an error.',
        issues: [{
          severity: 'critical',
          message: 'Analysis generation failed',
          recommendation: 'Please check the API token and try again.'
        }],
        insights: []
      };
    }
  }

  private generateAnalysisPrompt(results: TestResult[]): string {
    const passedTests = results.filter(r => r.passed);
    const failedTests = results.filter(r => !r.passed);
    
    const avgMetrics = results.reduce((acc, r) => {
      if (r.metrics) {
        acc.loadTime += r.metrics.loadTime || 0;
        acc.ttfb += r.metrics.ttfb || 0;
        acc.fcp += r.metrics.fcp || 0;
        acc.count++;
      }
      return acc;
    }, { loadTime: 0, ttfb: 0, fcp: 0, count: 0 });

    return `You are a performance analysis expert. Analyze these web performance test results and provide a detailed analysis following the exact format below. Be specific and technical in your analysis.

Test Results:
- Success Rate: ${((passedTests.length/results.length)*100).toFixed(1)}% (${passedTests.length}/${results.length})
- Average TTFB: ${avgMetrics.count ? Math.round(avgMetrics.ttfb / avgMetrics.count) : 0}ms
- Average FCP: ${avgMetrics.count ? Math.round(avgMetrics.fcp / avgMetrics.count) : 0}ms
- Average Load Time: ${avgMetrics.count ? Math.round(avgMetrics.loadTime / avgMetrics.count) : 0}ms
${failedTests.length > 0 ? `\nFailed Tests:\n${failedTests.map(t => `- ${t.title}`).join('\n')}` : ''}

Required Response Format:

SUMMARY
The website demonstrates [overall performance assessment]. TTFB averages at [X]ms which is [evaluation]. FCP at [X]ms indicates [implication]. Load times averaging [X]ms suggest [conclusion].

ISSUES
Critical:
- [Specific critical issue found]: [Concrete recommendation]

Warning:
- [Specific warning level issue]: [Actionable recommendation]

Info:
- [Specific informational point]: [Helpful recommendation]

INSIGHTS
- [Specific insight about performance metrics]
- [Specific observation about test results]
- [Specific pattern or trend identified]

Note: Replace all text in brackets with specific analysis based on the test results. Be technical and precise.`;
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