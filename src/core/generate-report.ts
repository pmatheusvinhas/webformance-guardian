import 'dotenv/config';
import { TestReporter } from './test-reporter';
import { AIAnalyzer } from './ai-analyzer';
import { TestRunner } from './test-runner';
import { TestResult, TestAnalysis } from './types';
import * as path from 'path';
import * as fs from 'fs';

function validateEnvironment() {
  if (!process.env.HUGGINGFACE_API_TOKEN) {
    throw new Error('HUGGINGFACE_API_TOKEN environment variable is required');
  }
  if (!process.env.SITE_URL) {
    throw new Error('SITE_URL environment variable is required');
  }
}

async function cleanup(site: string) {
  // Clean up temporary directories
  const cleanupDirs = [
    'test-results',    // Playwright temp results
    'playwright-report' // Playwright temp report
  ];

  // Clean up generated test files
  const testFile = path.join('tests', 'sites', site, 'generated-performance.spec.ts');

  // Clean directories
  for (const dir of cleanupDirs) {
    if (fs.existsSync(dir)) {
      fs.rmSync(dir, { recursive: true, force: true });
      console.log(`Cleaned directory: ${dir}`);
    }
  }

  // Clean files
  if (fs.existsSync(testFile)) {
    fs.unlinkSync(testFile);
    console.log(`Cleaned file: ${testFile}`);
  }
}

async function waitForModelAvailability(analyzer: AIAnalyzer, maxAttempts = 5): Promise<void> {
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      await analyzer.checkModelAvailability();
      return;
    } catch (error) {
      if (error instanceof Error && error.message.includes('currently loading')) {
        const waitTime = Math.min(attempt * 10, 30); // Exponential backoff, max 30 seconds
        console.log(`\n⏳ AI model is still loading. Waiting ${waitTime} seconds before retry (attempt ${attempt}/${maxAttempts})...`);
        await new Promise(resolve => setTimeout(resolve, waitTime * 1000));
      } else {
        throw error;
      }
    }
  }
  throw new Error('AI model failed to load after maximum retry attempts');
}

async function generateReport(site: string) {
  console.log('\n🔍 Environment check:');
  validateEnvironment();

  const siteUrl = process.env.SITE_URL;
  if (!siteUrl) {
    throw new Error('SITE_URL environment variable is required');
  }

  console.log('\n🧹 Cleaning up temporary files...');
  await cleanup(site);

  console.log(`\n🤖 Generating test cases for ${site}...`);
  const analyzer = new AIAnalyzer(process.env.HUGGINGFACE_API_TOKEN!);
  const testCases = await analyzer.generateTestCases(siteUrl);
  
  console.log(`\n✨ Generated ${testCases.length} test cases`);
  testCases.forEach(test => console.log(`   • ${test.title}`));

  console.log('\n📝 Generating test code...');
  const testCode = await analyzer.generateTestCode(testCases);
  const testFilePath = path.join(process.cwd(), 'tests', 'sites', site, 'generated-performance.spec.ts');
  await fs.promises.writeFile(testFilePath, testCode);
  console.log(`   💾 Test code saved to: ${testFilePath}`);

  console.log('\n🚀 Running generated tests...');
  const runner = new TestRunner(siteUrl);
  const results = await runner.runAllTests(testCases);

  // Verifica se há resultados
  if (!results || results.length === 0) {
    console.error('\n❌ No test results generated.');
    process.exit(1);
  }

  // Análise dos resultados dos testes
  const passedTests = results.filter(r => r.status === 'passed');
  const failedTests = results.filter(r => r.status === 'failed');
  const criticalFailures = failedTests.filter(result => 
    result.error?.toLowerCase().includes('timeout')
  );

  // Log detalhado dos resultados
  console.log('\n📊 Test Results Analysis:');
  console.log(`   ✅ Passed Tests: ${passedTests.length}`);
  console.log(`   ❌ Failed Tests: ${failedTests.length}`);
  if (criticalFailures.length > 0) {
    console.log(`   ⚠️  Critical Failures: ${criticalFailures.length}`);
  }

  // Verifica condições para prosseguir
  if (failedTests.length === results.length) {
    console.error('\n❌ All tests failed. Not generating reports.');
    console.error('Please check your network connection and try again.');
    process.exit(1);
  }

  if (criticalFailures.length > testCases.length / 2) {
    console.error('\n❌ Too many critical failures detected. Not generating reports.');
    console.error('Failed tests:');
    criticalFailures.forEach(failure => {
      console.error(`   • ${failure.title}: ${failure.error}`);
    });
    process.exit(1);
  }

  // Gera relatórios usando o TestReporter
  console.log('\n💾 Saving results...');
  const reporter = new TestReporter(site);
  results.forEach(result => reporter.addResult(result));
  reporter.generateReports();

  // Só prossegue com análise AI se houver testes bem-sucedidos
  if (passedTests.length > 0) {
    console.log('\n🧠 Analyzing test results...');
    try {
      // Aguarda disponibilidade do modelo antes de prosseguir
      await waitForModelAvailability(analyzer);
      const analysis = await analyzer.analyzeTestResults(results);
      console.log('   ✅ Analysis completed successfully');
    } catch (error) {
      console.error('\n⚠️  AI Analysis failed:', error instanceof Error ? error.message : 'Unknown error');
      console.log('   📝 Proceeding with basic report generation...');
    }
  }

  console.log('\n✨ Reports generated successfully!');
  console.log(`   💻 You can now run "npm run ui:serve" to view the results for ${site}.`);
}

// Execute report generation
const site = process.argv[2];
if (!site) {
  console.error('Please provide a site name as an argument');
  process.exit(1);
}

generateReport(site).catch(error => {
  console.error('Error generating report:', error);
  process.exit(1);
}); 