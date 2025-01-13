import React from 'react';
import { TestResults } from '../components/TestResults';
import fs from 'fs/promises';
import path from 'path';

interface TestData {
  results: any[];
  analysis: {
    summary: string;
    issues: Array<{
      severity: 'warning' | 'critical' | 'info';
      message: string;
      recommendation: string;
    }>;
    insights: string[];
  };
}

interface HomeProps {
  data?: TestData;
  error?: string;
  siteUrl?: string;
}

export default function Home({ data, error, siteUrl }: HomeProps) {
  if (error) {
    return (
      <div className="min-h-screen bg-gray-100 py-6 flex flex-col justify-center sm:py-12">
        <div className="relative py-3 sm:max-w-xl sm:mx-auto">
          <div className="relative px-4 py-10 bg-white shadow-lg sm:rounded-3xl sm:p-20">
            <div className="max-w-md mx-auto">
              <div className="divide-y divide-gray-200">
                <div className="py-8 text-base leading-6 space-y-4 text-gray-700 sm:text-lg sm:leading-7">
                  <p className="text-red-600">Error loading test results: {error}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return <TestResults data={data} siteUrl={siteUrl} />;
}

export async function getStaticProps() {
  try {
    const dataDir = path.join(process.cwd(), 'public', 'data');
    const resultsPath = path.join(dataDir, 'results.json');
    const analysisPath = path.join(dataDir, 'analysis.json');

    const [resultsData, analysisData] = await Promise.all([
      fs.readFile(resultsPath, 'utf8'),
      fs.readFile(analysisPath, 'utf8')
    ]);

    const results = JSON.parse(resultsData);
    const analysis = JSON.parse(analysisData);

    return {
      props: {
        data: {
          results,
          analysis
        },
        siteUrl: process.env.SITE_URL || 'https://stably.ai'
      }
    };
  } catch (error) {
    console.error('Error loading data:', error);
    return {
      props: {
        error: 'Failed to load test results. Please try again later.'
      }
    };
  }
} 