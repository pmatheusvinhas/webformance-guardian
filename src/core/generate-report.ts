import { TestRunner } from './test-runner';
import { AIAnalyzer } from './ai-analyzer';
import { TestResult } from './types';
import fs from 'fs/promises';
import path from 'path';
import dotenv from 'dotenv';
import { ReportGenerator } from './report-generator';

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

    // Generate report
    const reporter = new ReportGenerator({
      apiKey: groqApiKey,
      outputDir,
      useMock: false
    });

    await reporter.generateReport(results);
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