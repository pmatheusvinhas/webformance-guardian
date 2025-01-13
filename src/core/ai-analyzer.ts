import { TestResult } from './types';
import Groq from 'groq-sdk';

export interface AIAnalysisResult {
  summary: string;
  recommendations: string[];
}

export class AIAnalyzer {
  private client: Groq;
  private isMock: boolean;

  constructor(apiKey: string, isMock: boolean = false) {
    this.client = new Groq({ apiKey });
    this.isMock = isMock;
  }

  async analyzeResults(results: TestResult[]): Promise<AIAnalysisResult> {
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
      console.error('Error analyzing results:', error);
      if (this.isMock) {
        return this.getMockAnalysis(results);
      }
      throw new Error('Failed to analyze test results');
    }
  }

  private getMockAnalysis(results: TestResult[]): AIAnalysisResult {
    const failedTests = results.filter(r => !r.passed);
    const slowTests = results.filter(r => r.duration > 5000);
    
    const recommendations = [];
    if (failedTests.length > 0) {
      recommendations.push('Fix failing tests to ensure application stability');
    }
    if (slowTests.length > 0) {
      recommendations.push('Optimize slow tests to improve performance');
    }

    return {
      summary: 'Mock analysis for testing purposes',
      recommendations: recommendations.length > 0 ? recommendations : ['All tests are performing well']
    };
  }

  private generatePrompt(results: TestResult[]): string {
    return `Analyze these test results and provide insights:
${JSON.stringify(results, null, 2)}

Format your response exactly like this:
SUMMARY
[One paragraph summary of test results]

RECOMMENDATIONS
- [Recommendation 1]
- [Recommendation 2]
- [Recommendation 3]`;
  }

  private parseAnalysis(response: string): AIAnalysisResult {
    try {
      const sections = response.split('\n\n');
      const summary = sections[1]?.trim() || '';
      const recommendations: string[] = [];

      let isRecommendations = false;
      for (const line of response.split('\n')) {
        if (line.startsWith('RECOMMENDATIONS')) {
          isRecommendations = true;
        } else if (isRecommendations && line.trim().startsWith('-')) {
          recommendations.push(line.replace('-', '').trim());
        }
      }

      return {
        summary,
        recommendations
      };
    } catch (error) {
      console.error('Error parsing analysis:', error);
      return {
        summary: '',
        recommendations: []
      };
    }
  }
} 