import { Groq } from "groq-sdk";
import { TestResult, PerformanceMetrics } from './types';

export interface AnalysisResult {
  summary: string;
  issues: Array<{
    severity: 'critical' | 'warning' | 'info';
    message: string;
    recommendation: string;
  }>;
  insights: string[];
}

export class AIAnalyzer {
  private groq: Groq;
  private model = 'llama-3.3-70b-versatile';

  constructor(apiKey: string) {
    this.groq = new Groq({ apiKey });
  }

  async analyzePerformance(results: TestResult[]): Promise<AnalysisResult> {
    try {
      const prompt = this.generateAnalysisPrompt(results);
      const completion = await this.groq.chat.completions.create({
        messages: [
          {
            role: "system",
            content: "You are a web performance expert. Analyze the test results and provide actionable insights."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        model: this.model,
        temperature: 0.3,
        max_tokens: 1000,
      });

      return this.parseAnalysis(completion.choices[0]?.message?.content || '');
    } catch (error) {
      console.error('Error analyzing performance:', error);
      return this.getDefaultAnalysis('Analysis failed due to an error');
    }
  }

  private generateAnalysisPrompt(results: TestResult[]): string {
    const metrics = this.calculateAverageMetrics(results);
    const passedTests = results.filter(r => r.passed).length;
    const failedTests = results.length - passedTests;

    return `Analyze these web performance test results and provide insights:

Test Results Summary:
- Total Tests: ${results.length}
- Passed Tests: ${passedTests}
- Failed Tests: ${failedTests}
- Average Load Time: ${metrics.loadTime}ms
- Average TTFB: ${metrics.ttfb}ms
- Average FCP: ${metrics.fcp}ms

Failed Tests:
${results.filter(r => !r.passed).map(t => `- ${t.title}: ${t.error || 'Unknown error'}`).join('\n')}

Please provide analysis in this format:

SUMMARY
[Provide a concise summary of the overall performance]

ISSUES
Critical:
- [List critical performance issues]
Recommendation: [How to fix]

Warning:
- [List warning level issues]
Recommendation: [How to fix]

Info:
- [List informational points]
Recommendation: [Suggestions for improvement]

INSIGHTS
- [Key performance insights]
- [Patterns or trends]
- [Recommendations for improvement]`;
  }

  private calculateAverageMetrics(results: TestResult[]): PerformanceMetrics {
    const metrics = results.reduce((acc, r) => {
      if (r.metrics) {
        acc.loadTime += r.metrics.loadTime || 0;
        acc.ttfb += r.metrics.ttfb || 0;
        acc.fcp += r.metrics.fcp || 0;
        acc.count++;
      }
      return acc;
    }, { loadTime: 0, ttfb: 0, fcp: 0, count: 0 });

    return {
      loadTime: metrics.count ? Math.round(metrics.loadTime / metrics.count) : 0,
      ttfb: metrics.count ? Math.round(metrics.ttfb / metrics.count) : 0,
      fcp: metrics.count ? Math.round(metrics.fcp / metrics.count) : 0
    };
  }

  private parseAnalysis(text: string): AnalysisResult {
    try {
      const summary = text.match(/SUMMARY\n([\s\S]*?)(?=\n\n|$)/)?.[1]?.trim() || 'No analysis available';
      const issues: AnalysisResult['issues'] = [];
      const insights: string[] = [];

      // Parse issues
      const issuesMatch = text.match(/ISSUES\n([\s\S]*?)(?=\n\nINSIGHTS|$)/);
      if (issuesMatch) {
        const issuesText = issuesMatch[1];
        
        ['Critical:', 'Warning:', 'Info:'].forEach(severity => {
          const severityMatch = new RegExp(`${severity}\\n([\\s\\S]*?)(?=\\n\\n|$)`).exec(issuesText);
          if (severityMatch) {
            const items = severityMatch[1].split('\n-').filter(Boolean);
            items.forEach(item => {
              const [message, recommendation] = item.split('Recommendation:').map(s => s.trim());
              if (message) {
                issues.push({
                  severity: severity.toLowerCase().replace(':', '') as 'critical' | 'warning' | 'info',
                  message,
                  recommendation: recommendation || 'No recommendation provided'
                });
              }
            });
          }
        });
      }

      // Parse insights
      const insightsMatch = text.match(/INSIGHTS\n([\s\S]*?)(?=\n\n|$)/);
      if (insightsMatch) {
        insights.push(...insightsMatch[1].split('\n-')
          .map(s => s.trim())
          .filter(Boolean));
      }

      return { summary, issues, insights };
    } catch (error) {
      return this.getDefaultAnalysis('Failed to parse analysis');
    }
  }

  private getDefaultAnalysis(summary: string): AnalysisResult {
    return {
      summary,
      issues: [],
      insights: []
    };
  }
} 