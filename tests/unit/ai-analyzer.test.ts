import { AIAnalyzer } from '../../src/core/ai-analyzer';
import { TestResult } from '../../src/core/types';
import dotenv from 'dotenv';

// Carrega as variáveis de ambiente do arquivo .env
dotenv.config();

describe('AIAnalyzer', () => {
  let analyzer: AIAnalyzer;
  const apiKey = process.env.GROQ_API_KEY;

  beforeAll(() => {
    if (!apiKey) {
      console.warn('GROQ_API_KEY não encontrada no arquivo .env. Os testes podem falhar.');
    }
  });

  beforeEach(() => {
    analyzer = new AIAnalyzer(apiKey || '');
  });

  it('should analyze performance results', async () => {
    // Pula o teste se não houver chave da API
    if (!apiKey) {
      console.warn('Pulando teste pois GROQ_API_KEY não está definida');
      return;
    }

    const testResults: TestResult[] = [
      {
        title: 'Homepage Load Test',
        passed: true,
        duration: 1500,
        metrics: {
          loadTime: 1200,
          ttfb: 200,
          fcp: 800
        }
      },
      {
        title: 'Button Click Test',
        passed: false,
        duration: 2000,
        error: 'Response time exceeded threshold',
        metrics: {
          loadTime: 2500,
          ttfb: 300,
          fcp: 1200
        }
      }
    ];

    const analysis = await analyzer.analyzePerformance(testResults);

    expect(analysis).toBeDefined();
    expect(analysis.summary).toBeDefined();
    expect(analysis.issues).toBeDefined();
    expect(analysis.insights).toBeDefined();
    expect(Array.isArray(analysis.issues)).toBe(true);
    expect(Array.isArray(analysis.insights)).toBe(true);
  });
}); 