import React from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';
import { Line } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

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
  }>;
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

export interface TestResultsProps {
  data?: TestData;
}

export function TestResults({ data }: TestResultsProps) {
  if (!data) {
    return <div>No test results available</div>;
  }

  const { results, analysis } = data;

  const chartData = {
    labels: results.map(result => result.title),
    datasets: [
      {
        label: 'Load Time (ms)',
        data: results.map(result => result.metrics?.loadTime || 0),
        borderColor: 'rgb(75, 192, 192)',
        tension: 0.1
      },
      {
        label: 'TTFB (ms)',
        data: results.map(result => result.metrics?.ttfb || 0),
        borderColor: 'rgb(255, 99, 132)',
        tension: 0.1
      },
      {
        label: 'FCP (ms)',
        data: results.map(result => result.metrics?.fcp || 0),
        borderColor: 'rgb(53, 162, 235)',
        tension: 0.1
      }
    ]
  };

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: true,
        text: 'Performance Metrics'
      }
    },
    scales: {
      y: {
        beginAtZero: true
      }
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 py-6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <h2 className="text-2xl font-bold mb-4">Performance Analysis</h2>
          <p className="text-gray-700 mb-4">{analysis.summary}</p>
          
          <div className="mb-6">
            <h3 className="text-xl font-semibold mb-3">Performance Issues</h3>
            {analysis.issues.map((issue, index) => (
              <div key={index} className={`p-4 rounded-lg mb-3 ${
                issue.severity === 'critical' ? 'bg-red-100' :
                issue.severity === 'warning' ? 'bg-yellow-100' :
                'bg-blue-100'
              }`}>
                <p className="font-semibold mb-2">{issue.message}</p>
                <p className="text-sm text-gray-700">Recommendation: {issue.recommendation}</p>
              </div>
            ))}
          </div>

          <div className="mb-6">
            <h3 className="text-xl font-semibold mb-3">Insights</h3>
            <ul className="list-disc pl-5">
              {analysis.insights.map((insight, index) => (
                <li key={index} className="text-gray-700 mb-2">{insight}</li>
              ))}
            </ul>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-lg p-6">
          <h3 className="text-xl font-semibold mb-4">Performance Metrics</h3>
          <div className="h-96">
            <Line options={chartOptions} data={chartData} />
          </div>
        </div>
      </div>
    </div>
  );
} 