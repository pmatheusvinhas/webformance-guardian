import React from 'react';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

interface TestResultsProps {
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

export const TestResults: React.FC<TestResultsProps> = ({ results, analysis }) => {
  const chartData = {
    labels: results.map(r => r.title),
    datasets: [
      {
        label: 'Load Time (ms)',
        data: results.map(r => r.metrics?.loadTime || 0),
        borderColor: 'rgb(75, 192, 192)',
        tension: 0.1,
      },
      {
        label: 'TTFB (ms)',
        data: results.map(r => r.metrics?.ttfb || 0),
        borderColor: 'rgb(255, 99, 132)',
        tension: 0.1,
      },
      {
        label: 'FCP (ms)',
        data: results.map(r => r.metrics?.fcp || 0),
        borderColor: 'rgb(53, 162, 235)',
        tension: 0.1,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: true,
        text: 'Performance Metrics',
      },
    },
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'bg-red-100 border-red-500 text-red-700';
      case 'warning':
        return 'bg-yellow-100 border-yellow-500 text-yellow-700';
      case 'info':
        return 'bg-blue-100 border-blue-500 text-blue-700';
      default:
        return 'bg-gray-100 border-gray-500 text-gray-700';
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header with GitHub Actions Status */}
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Performance Test Results</h1>
        <a
          href="https://github.com/paulo-eduardo/demoSelenium/actions/workflows/performance.yml"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center"
        >
          <img
            src="https://github.com/paulo-eduardo/demoSelenium/actions/workflows/performance.yml/badge.svg"
            alt="Performance Tests Status"
            className="h-6"
          />
        </a>
      </div>

      {/* Summary Section with AI Badge */}
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-4">
          <h2 className="text-2xl font-bold">Analysis Summary</h2>
          <span className="px-2 py-1 bg-purple-100 text-purple-800 text-xs font-medium rounded-full">
            Powered by Groq AI (Mixtral 8x7B)
          </span>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-gray-700">{analysis.summary}</p>
        </div>
      </div>

      {/* Performance Chart */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold mb-4">Performance Metrics</h2>
        <div className="bg-white rounded-lg shadow p-6">
          <Line options={chartOptions} data={chartData} />
        </div>
      </div>

      {/* Test Results */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold mb-4">Test Results</h2>
        <div className="grid gap-4">
          {results.map((result, index) => (
            <div
              key={index}
              className={`p-4 rounded-lg border ${
                result.passed
                  ? 'bg-green-100 border-green-500'
                  : 'bg-red-100 border-red-500'
              }`}
            >
              <h3 className="font-bold mb-2">{result.title}</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium">Status</p>
                  <p className={result.passed ? 'text-green-700' : 'text-red-700'}>
                    {result.passed ? 'Passed' : 'Failed'}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium">Duration</p>
                  <p>{result.duration}ms</p>
                </div>
                {result.error && (
                  <div className="col-span-2">
                    <p className="text-sm font-medium">Error</p>
                    <p className="text-red-700">{result.error}</p>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Issues with AI Badge */}
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-4">
          <h2 className="text-2xl font-bold">Issues</h2>
          <span className="px-2 py-1 bg-purple-100 text-purple-800 text-xs font-medium rounded-full">
            AI Analysis
          </span>
        </div>
        <div className="grid gap-4">
          {analysis.issues.map((issue, index) => (
            <div
              key={index}
              className={`p-4 rounded-lg border ${getSeverityColor(
                issue.severity
              )}`}
            >
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-bold">{issue.message}</h3>
                <span className="px-2 py-1 rounded text-sm capitalize">
                  {issue.severity}
                </span>
              </div>
              <p className="text-sm">{issue.recommendation}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Insights with AI Badge */}
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-4">
          <h2 className="text-2xl font-bold">Insights</h2>
          <span className="px-2 py-1 bg-purple-100 text-purple-800 text-xs font-medium rounded-full">
            AI Generated
          </span>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <ul className="list-disc pl-5 space-y-2">
            {analysis.insights.map((insight, index) => (
              <li key={index} className="text-gray-700">
                {insight}
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Footer */}
      <div className="text-center text-sm text-gray-500">
        Last updated: {new Date().toLocaleString()}
      </div>
    </div>
  );
}; 