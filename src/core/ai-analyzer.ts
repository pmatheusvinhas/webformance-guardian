import { chromium, ElementHandle } from '@playwright/test';
import fetch from 'node-fetch';

interface TestCase {
  title: string;
  description: string;
  selector?: string;
  steps: string[];
  threshold?: number;
  retries?: number;
}

interface AnalysisReport {
  summary: string;
  issues: Array<{
    severity: 'critical' | 'warning' | 'info';
    message: string;
    suggestion: string;
  }>;
  performance: {
    score: number;
    metrics: {
      average_response_time: number;
      pass_rate: number;
      total_duration: number;
    };
  };
}

export class AIAnalyzer {
  private readonly apiKey: string;
  private readonly analysisModel: string;
  private modelId = 'google/flan-t5-large';
  private apiUrl = 'https://api-inference.huggingface.co/models/';

  constructor(apiKey: string) {
    this.apiKey = apiKey;
    this.analysisModel = 'google/flan-t5-large';
  }

  async checkModelAvailability(): Promise<void> {
    const response = await fetch(`${this.apiUrl}${this.modelId}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ inputs: 'test' })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`API request failed: ${JSON.stringify(error)}`);
    }
  }

  async generateTestCases(url: string): Promise<TestCase[]> {
    console.log('Extracting content from site using Playwright...');
    const testCases: TestCase[] = [];
    
    try {
      const browser = await chromium.launch();
      const page = await browser.newPage();
      await page.goto(url);

      // Espera o carregamento do conteúdo principal
      await page.waitForLoadState('domcontentloaded');

      // Gera caso de teste para performance geral
      testCases.push({
        title: 'Homepage Load Performance',
        description: 'Verifies the load time and performance metrics of the homepage',
        steps: ['Navigate to homepage', 'Wait for page load', 'Measure performance metrics'],
        threshold: 30000,  // 30 segundos
        retries: 2  // Adiciona 2 retentativas
      });

      // Coleta elementos interativos
      const buttons = await page.$$('button, a.btn, .button, [role="button"]');
      const forms = await page.$$('form');

      // Gera casos de teste para botões importantes
      for (const button of buttons) {
        const text = await button.textContent() || '';
        const selector = await this.generateSelector(button);
        if (text.trim() && selector) {
          testCases.push({
            title: `${text.trim()} Button Performance`,
            description: `Verifies the performance and interactivity of the ${text.trim()} button`,
            selector: selector,
            steps: ['Navigate to homepage', 'Wait for button to be visible', 'Verify button is clickable'],
            threshold: 30000,  // 30 segundos
            retries: 2  // Adiciona 2 retentativas
          });
        }
      }

      // Gera casos de teste para formulários
      for (const form of forms) {
        const selector = await this.generateSelector(form);
        if (selector) {
          testCases.push({
            title: 'Form Interaction Performance',
            description: 'Verifies the performance of form interactions',
            selector: selector,
            steps: ['Navigate to homepage', 'Wait for form to be visible', 'Verify form is interactive'],
            threshold: 30000,  // 30 segundos
            retries: 2  // Adiciona 2 retentativas
          });
        }
      }

      await browser.close();
      console.log(`Generated ${testCases.length} test cases based on page content`);
      return testCases;

    } catch (error) {
      console.error('Error during site analysis:', error);
      return this.getDefaultTestCases();
    }
  }

  private async generateSelector(element: ElementHandle<SVGElement | HTMLElement>): Promise<string | null> {
    try {
      // Tenta encontrar um data-testid
      const testId = await element.getAttribute('data-testid');
      if (testId) {
        return `[data-testid="${testId}"]`;
      }

      // Tenta usar o texto do elemento
      const text = await element.textContent();
      if (text?.trim()) {
        return `text="${text.trim()}"`;
      }

      // Tenta usar role + texto
      const role = await element.getAttribute('role');
      if (role && text?.trim()) {
        return `role=${role}[text="${text.trim()}"]`;
      }

      // Tenta usar uma combinação de tag + classe que não seja dinâmica
      const tag = await element.evaluate((el: SVGElement | HTMLElement) => el.tagName.toLowerCase());
      const classList = await element.evaluate((el: SVGElement | HTMLElement) => 
        Array.from(el.classList).filter((c: string) => !c.includes('mantine') && !c.includes('_'))
      );
      
      if (classList.length > 0) {
        return `${tag}.${classList.join('.')}`;
      }

      // Se nada funcionar, usa o texto do elemento pai + índice do filho
      const parentText = await element.evaluate((el: SVGElement | HTMLElement) => el.parentElement?.textContent?.trim());
      if (parentText) {
        const index = await element.evaluate((el: SVGElement | HTMLElement) => 
          Array.from(el.parentElement?.children || []).indexOf(el)
        );
        return `text="${parentText}" >> nth=${index}`;
      }

      return null;
    } catch (error) {
      console.error('Error generating selector:', error);
      return null;
    }
  }

  async generateTestCode(testCases: TestCase[]): Promise<string> {
    return `import { test, expect } from '@playwright/test';

test.describe('Performance Tests', () => {
  ${testCases.map(testCase => `
  // ${testCase.description}
  test('${testCase.title}', async ({ page }) => {
    const startTime = Date.now();
    const response = await page.goto('${process.env.SITE_URL || 'https://www.stably.ai'}');
    expect(response?.status()).toBe(200);
    
    ${testCase.selector ? `
    const element = page.locator("${testCase.selector}");
    await element.waitFor({ state: 'visible' });
    await expect(element).toBeEnabled();` : ''}
    
    const performanceTime = Date.now() - startTime;
    expect(performanceTime).toBeLessThan(${testCase.threshold || 7000});
  });`).join('\n')}
});`;
  }

  async analyzeTestResults(results: any): Promise<AnalysisReport> {
    try {
      const prompt = this.generateAnalysisPrompt(results);
      const response = await this.query(this.analysisModel, prompt);
      
      const generatedText = response[0]?.generated_text;
      if (!generatedText) {
        return this.getDefaultAnalysis('No analysis available');
      }

      return this.parseAnalysis(generatedText);
    } catch (error) {
      console.error('Analysis failed:', error);
      return this.getDefaultAnalysis('Analysis failed due to an error');
    }
  }

  private generateAnalysisPrompt(results: any): string {
    return `Analyze these test results and provide insights:
${JSON.stringify(results, null, 2)}

Provide analysis in this format:
SUMMARY:
[Overall summary of test results]

ISSUES:
Critical:
- [Critical issue]
Suggestion: [How to fix]

Warning:
- [Warning issue]
Suggestion: [How to fix]

PERFORMANCE:
Score: [0-100]
[Performance insights]`;
  }

  private async query(model: string, prompt: string): Promise<any> {
    const response = await fetch(`https://api-inference.huggingface.co/models/${model}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        inputs: prompt,
        parameters: {
          max_new_tokens: 250,
          temperature: 0.7,
          top_p: 0.95
        }
      })
    });

    if (!response.ok) {
      throw new Error(`API request failed: ${await response.text()}`);
    }

    return response.json();
  }

  private getDefaultTestCases(): TestCase[] {
    return [
      {
        title: 'Homepage Load Performance',
        description: 'Verifies the load time and performance metrics of the homepage',
        steps: ['Navigate to homepage', 'Wait for page load', 'Measure performance metrics'],
        threshold: 30000,  // 30 segundos
        retries: 2  // Adiciona 2 retentativas
      },
      {
        title: 'Basic Interaction Performance',
        description: 'Verifies the performance of basic page interactions',
        steps: ['Navigate to homepage', 'Wait for content', 'Verify interactivity'],
        threshold: 30000,  // 30 segundos
        retries: 2  // Adiciona 2 retentativas
      }
    ];
  }

  private getDefaultAnalysis(summary: string): AnalysisReport {
    return {
      summary,
      issues: [],
      performance: {
        score: 0,
        metrics: {
          average_response_time: 0,
          pass_rate: 0,
          total_duration: 0
        }
      }
    };
  }

  private parseAnalysis(text: string): AnalysisReport {
    try {
      const summary = text.match(/SUMMARY:\s*(.*?)(?=\n\n|\n[A-Z]|$)/s)?.[1]?.trim() || 'No analysis available';
      
      const issues: AnalysisReport['issues'] = [];
      
      // Extrai issues críticas
      const criticalMatch = text.match(/Critical:\s*((?:.*\n)*?)(?=\n\n|\n[A-Z]|$)/s);
      if (criticalMatch) {
        const criticalIssues = criticalMatch[1].split('\n-').filter(Boolean);
        criticalIssues.forEach(issue => {
          const [message, suggestion] = issue.split('\nSuggestion:').map(s => s.trim());
          if (message) {
            issues.push({
              severity: 'critical',
              message,
              suggestion: suggestion || 'No suggestion provided'
            });
          }
        });
      }

      // Extrai warnings
      const warningMatch = text.match(/Warning:\s*((?:.*\n)*?)(?=\n\n|\n[A-Z]|$)/s);
      if (warningMatch) {
        const warningIssues = warningMatch[1].split('\n-').filter(Boolean);
        warningIssues.forEach(issue => {
          const [message, suggestion] = issue.split('\nSuggestion:').map(s => s.trim());
          if (message) {
            issues.push({
              severity: 'warning',
              message,
              suggestion: suggestion || 'No suggestion provided'
            });
          }
        });
      }

      // Extrai score e métricas
      const performanceMatch = text.match(/PERFORMANCE:\s*(.*?)(?=\n\n|\n[A-Z]|$)/s)?.[1];
      const scoreMatch = performanceMatch?.match(/Score:\s*(\d+)/);
      const score = scoreMatch ? parseInt(scoreMatch[1], 10) : 0;

      return {
        summary,
        issues,
        performance: {
          score,
          metrics: {
            average_response_time: 0,
            pass_rate: 0,
            total_duration: 0
          }
        }
      };
    } catch (error) {
      return this.getDefaultAnalysis('Failed to parse analysis');
    }
  }

  private async queryWithRetry(
    prompt: string,
    maxRetries: number = 5,
    initialDelay: number = 2000
  ): Promise<string> {
    let lastError: Error | null = null;
    
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        const response = await fetch(
          `https://api-inference.huggingface.co/models/google/flan-t5-large`,
          {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${process.env.HUGGINGFACE_API_TOKEN}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              inputs: prompt,
              parameters: {
                max_new_tokens: 250,
                temperature: 0.7,
                top_p: 0.9,
                do_sample: true
              }
            }),
          }
        );

        const data = await response.json();

        // Se o modelo ainda está carregando, espera e tenta novamente
        if (data.error && data.error.includes('is currently loading')) {
          const waitTime = data.estimated_time ? Math.ceil(data.estimated_time * 1000) : initialDelay * Math.pow(2, attempt);
          console.log(`Model is loading. Waiting ${waitTime/1000} seconds before retry...`);
          await new Promise(resolve => setTimeout(resolve, waitTime));
          continue;
        }

        // Se houver outro tipo de erro na resposta
        if (data.error) {
          throw new Error(`API request failed: ${JSON.stringify(data)}`);
        }

        return Array.isArray(data) ? data[0].generated_text : data.generated_text;

      } catch (error) {
        lastError = error as Error;
        if (attempt < maxRetries) {
          const delay = initialDelay * Math.pow(2, attempt);
          console.log(`API request failed. Retrying in ${delay/1000} seconds...`);
          await new Promise(resolve => setTimeout(resolve, delay));
          continue;
        }
      }
    }

    throw lastError || new Error('Maximum retries exceeded');
  }
} 