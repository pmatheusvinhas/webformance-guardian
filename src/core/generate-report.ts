import { TestRunner } from './test-runner';
import { AIAnalyzer } from './ai-analyzer';
import { TestResult } from './types';
import * as fs from 'fs';
import * as path from 'path';
import dotenv from 'dotenv';

dotenv.config();

async function saveToUI(results: TestResult[], analysis: any) {
  const uiDir = path.join(process.cwd(), 'public', 'data');
  
  // Ensure directory exists
  if (!fs.existsSync(uiDir)) {
    fs.mkdirSync(uiDir, { recursive: true });
  }

  // Save current results and analysis
  fs.writeFileSync(path.join(uiDir, 'results.json'), JSON.stringify(results, null, 2));
  fs.writeFileSync(path.join(uiDir, 'analysis.json'), JSON.stringify(analysis, null, 2));

  // Save to history with timestamp
  const historyDir = path.join(uiDir, 'history');
  if (!fs.existsSync(historyDir)) {
    fs.mkdirSync(historyDir, { recursive: true });
  }

  const timestamp = new Date().toISOString().replace(/:/g, '-');
  fs.writeFileSync(
    path.join(historyDir, `results-${timestamp}.json`),
    JSON.stringify(results, null, 2)
  );
  fs.writeFileSync(
    path.join(historyDir, `analysis-${timestamp}.json`),
    JSON.stringify(analysis, null, 2)
  );

  // Update history index
  const historyIndexPath = path.join(uiDir, 'history-index.json');
  let historyIndex = [];
  
  if (fs.existsSync(historyIndexPath)) {
    try {
      historyIndex = JSON.parse(fs.readFileSync(historyIndexPath, 'utf-8'));
    } catch (error) {
      console.warn('Failed to parse history index, starting fresh');
    }
  }

  const passedTests = results.filter(r => r.passed).length;
  historyIndex.push({
    timestamp,
    totalTests: results.length,
    passedTests,
    failedTests: results.length - passedTests,
    averageMetrics: calculateAverageMetrics(results)
  });

  // Keep only last 30 days of history
  historyIndex = historyIndex.slice(-144); // 144 = 24 * 6 (6 dias de dados a cada 5 horas)
  
  fs.writeFileSync(historyIndexPath, JSON.stringify(historyIndex, null, 2));
}

function calculateAverageMetrics(results: TestResult[]) {
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

export async function generateReport(site: string = 'stably') {
  console.log(`Generating performance report for ${site}...`);

  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    throw new Error('GROQ_API_KEY is required');
  }

  const baseUrl = site === 'stably' ? 'https://stably.ai' : `https://${site}`;

  try {
    // Run tests
    const runner = new TestRunner(baseUrl);
    const results = await runner.runTests();
    console.log(`Completed ${results.length} tests`);

    // Analyze results
    const analyzer = new AIAnalyzer(apiKey);
    const analysis = await analyzer.analyzePerformance(results);
    console.log('Analysis completed');

    // Save results
    await saveToUI(results, analysis);
    console.log('Results saved');

    return { results, analysis };
  } catch (error) {
    console.error('Error generating report:', error);
    throw error;
  }
}

// Se executado diretamente
if (require.main === module) {
  const site = process.argv[2] || 'stably';
  generateReport(site).catch(error => {
    console.error('Failed to generate report:', error);
    process.exit(1);
  });
} 