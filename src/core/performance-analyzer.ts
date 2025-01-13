import { TestResult, PerformanceAnalysis } from './types';
import Groq from 'groq-sdk';

export class PerformanceAnalyzer {
  private client: Groq;
  private isMock: boolean;

  constructor(apiKey: string, isMock: boolean = false) {
    this.client = new Groq({ apiKey });
    this.isMock = isMock;
  }

  async analyzePerformance(results: TestResult[]): Promise<PerformanceAnalysis> {
    try {
      if (this.isMock) {
        return this.getMockAnalysis(results);
      }

      const prompt = this.generatePrompt(results);
      const completion = await this.client.chat.completions.create({
        messages: [{ role: 'user', content: prompt }],
        model: 'mixtral-8x7b-32768',
        temperature: 0.3,
        max_tokens: 1000,
      });

      return this.parseAnalysis(completion.choices[0]?.message?.content || '');
    } catch (error) {
      console.error('Error analyzing performance:', error);
      if (this.isMock) {
        return this.getMockAnalysis(results);
      }
      throw new Error('Failed to analyze performance metrics');
    }
  }

  private getMockAnalysis(results: TestResult[]): PerformanceAnalysis {
    const hasSlowTests = results.some(r => r.duration > 5000);
    
    return {
      summary: 'Mock analysis for testing purposes',
      issues: hasSlowTests ? [{
        severity: 'warning',
        message: 'Slow page load detected',
        recommendation: 'Optimize page load performance'
      }] : [],
      insights: [
        'Test mock insight 1',
        'Test mock insight 2'
      ]
    };
  }

  private generatePrompt(results: TestResult[]): string {
    return `Analyze these web performance test results and provide insights:
${JSON.stringify(results, null, 2)}

Format your response exactly like this:
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
  }

  private parseAnalysis(response: string): PerformanceAnalysis {
    try {
      const sections = response.split('\n\n');
      const summary = sections[1]?.trim() || '';
      
      const issues: PerformanceAnalysis['issues'] = [];
      const insights: string[] = [];

      let currentSection = '';
      for (const line of response.split('\n')) {
        if (line.startsWith('SUMMARY')) {
          currentSection = 'summary';
        } else if (line.startsWith('ISSUES')) {
          currentSection = 'issues';
        } else if (line.startsWith('INSIGHTS')) {
          currentSection = 'insights';
        } else if (line.trim().startsWith('-')) {
          const content = line.replace('-', '').trim();
          if (currentSection === 'insights') {
            insights.push(content);
          } else if (currentSection === 'issues') {
            const [message, recommendation] = content.split(':').map(s => s.trim());
            const severity = this.determineSeverity(line);
            if (message && recommendation) {
              issues.push({ severity, message, recommendation });
            }
          }
        }
      }

      return {
        summary,
        issues,
        insights
      };
    } catch (error) {
      console.error('Error parsing analysis:', error);
      return {
        summary: '',
        issues: [],
        insights: []
      };
    }
  }

  private determineSeverity(line: string): 'critical' | 'warning' | 'info' {
    const lowerLine = line.toLowerCase();
    if (lowerLine.includes('critical')) return 'critical';
    if (lowerLine.includes('warning')) return 'warning';
    return 'info';
  }
} 