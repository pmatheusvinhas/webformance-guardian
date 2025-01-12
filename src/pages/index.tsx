import React from 'react';
import { GetStaticProps } from 'next';
import fs from 'fs';
import path from 'path';
import { TestResults } from '../components/TestResults';

interface TestData {
  results: Array<{
    title: string;
    passed: boolean;
    duration: number;
    metrics?: {
      loadTime: number;
      ttfb: number;
      fcp: number;
    };
    error?: string;
  }>;
  analysis: {
    summary: string;
    issues: Array<{
      severity: 'critical' | 'warning' | 'info';
      message: string;
      recommendation: string;
    }>;
    insights: string[];
  };
}

export const getStaticProps: GetStaticProps = async () => {
  try {
    const resultsPath = path.join(process.cwd(), 'public/data/results.json');
    const analysisPath = path.join(process.cwd(), 'public/data/analysis.json');

    const resultsData = JSON.parse(fs.readFileSync(resultsPath, 'utf8'));
    const analysisData = JSON.parse(fs.readFileSync(analysisPath, 'utf8'));

    return {
      props: {
        results: resultsData,
        analysis: analysisData,
      },
      revalidate: 300, // Revalidate every 5 minutes
    };
  } catch (error) {
    console.error('Error loading test data:', error);
    return {
      props: {
        error: 'Failed to load test data',
      },
    };
  }
}

const Home: React.FC<{ results?: any; analysis?: any; error?: string }> = ({
  results,
  analysis,
  error,
}) => {
  if (error) {
    return (
      <div className="min-h-screen bg-gray-100 py-6 flex flex-col justify-center sm:py-12">
        <div className="relative py-3 sm:max-w-xl sm:mx-auto">
          <div className="relative px-4 py-10 bg-white shadow-lg sm:rounded-3xl sm:p-20">
            <div className="max-w-md mx-auto">
              <div className="divide-y divide-gray-200">
                <div className="py-8 text-base leading-6 space-y-4 text-gray-700 sm:text-lg sm:leading-7">
                  <p className="text-red-600">{error}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <TestResults results={results} analysis={analysis} />
    </div>
  );
};

export default Home; 