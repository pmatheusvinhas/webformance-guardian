import { TestRunner } from './test-runner';
import { AIAnalyzer } from './ai-analyzer';
import { TestResult } from './types';
import fs from 'fs/promises';
import path from 'path';
import dotenv from 'dotenv';

dotenv.config();

interface GenerateReportOptions {
  site: string;
  outputDir?: string;
  apiKey?: string;
}

export async function generateReport({ site, outputDir = './public/data', apiKey }: GenerateReportOptions): Promise<void> {
  try {
    // Validate environment
    const groqApiKey = apiKey || process.env.GROQ_API_KEY;
    if (!groqApiKey) {
      throw new Error('GROQ_API_KEY is required in environment variables');
    }

    // Initialize components
    const runner = new TestRunner(site);
    const analyzer = new AIAnalyzer(groqApiKey);

    // Run tests
    console.log(`Running performance tests for ${site}...`);
    const results = await runner.runTests();

    // Analyze results
    console.log('Analyzing test results...');
    const analysis = await analyzer.analyzeResults(results);

    // Ensure output directory exists
    await fs.mkdir(outputDir, { recursive: true });

    // Save results
    const timestamp = new Date().toISOString();
    const report = {
      timestamp,
      site,
      results,
      analysis
    };

    await fs.writeFile(
      path.join(outputDir, 'results.json'),
      JSON.stringify(results, null, 2)
    );

    await fs.writeFile(
      path.join(outputDir, 'analysis.json'),
      JSON.stringify(analysis, null, 2)
    );

    // Update history
    const historyFile = path.join(outputDir, 'history-index.json');
    let history: Array<{ timestamp: string; site: string; summary: string }> = [];

    try {
      const historyData = await fs.readFile(historyFile, 'utf-8');
      history = JSON.parse(historyData);
    } catch (error) {
      console.log('Starting new history file');
    }

    history.push({
      timestamp,
      site,
      summary: analysis.summary
    });

    // Keep only last 6 days of history
    const sixDaysAgo = new Date();
    sixDaysAgo.setDate(sixDaysAgo.getDate() - 6);
    history = history.filter(entry => new Date(entry.timestamp) > sixDaysAgo);

    await fs.writeFile(historyFile, JSON.stringify(history, null, 2));

    // Save detailed report
    const historyDir = path.join(outputDir, 'history');
    await fs.mkdir(historyDir, { recursive: true });

    await fs.writeFile(
      path.join(historyDir, `report-${timestamp.replace(/[:.]/g, '-')}.json`),
      JSON.stringify(report, null, 2)
    );

    console.log('Report generated successfully');
  } catch (error) {
    console.error('Failed to generate report:', error);
    throw error;
  }
}

// Se executado diretamente
if (require.main === module) {
  const site = process.argv[2] || 'stably';
  generateReport({ site }).catch(error => {
    console.error('Failed to generate report:', error);
    process.exit(1);
  });
} 