const { useState, useEffect, useRef } = React;

function EmptyState({ message }) {
  return (
    <div className="empty-state">
      <p>{message}</p>
      <p className="hint">Run 'npm run report:stably' to generate performance data</p>
    </div>
  );
}

function PerformanceChart({ data }) {
  const chartRef = useRef(null);
  const [chart, setChart] = useState(null);

  useEffect(() => {
    if (!chartRef.current || !data || data.length === 0) return;

    const ctx = chartRef.current.getContext('2d');
    
    if (chart) {
      chart.destroy();
    }

    // Prepara os dados para o gráfico
    const sortedData = [...data]
      .filter(d => d && d.metrics?.mainSite?.timing) // Filtra dados inválidos
      .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

    if (sortedData.length === 0) {
      console.log('No valid data for chart');
      return;
    }

    const formatDate = (timestamp) => {
      const date = new Date(timestamp);
      return `${date.toLocaleDateString()} ${date.toLocaleTimeString()}`;
    };

    // Função auxiliar para extrair métricas com segurança
    const safeMetricExtractor = (d, metricPath) => {
      try {
        const value = d.metrics.mainSite.timing[metricPath].average;
        return typeof value === 'number' && !isNaN(value) ? value : 0;
      } catch (error) {
        console.warn(`Failed to extract metric ${metricPath} from data point:`, d);
        return 0;
      }
    };

    const newChart = new Chart(ctx, {
      type: 'line',
      data: {
        labels: sortedData.map(d => formatDate(d.timestamp)),
        datasets: [
          {
            label: 'TTFB (avg)',
            data: sortedData.map(d => safeMetricExtractor(d, 'ttfb')),
            borderColor: '#1a73e8',
            backgroundColor: 'rgba(26, 115, 232, 0.1)',
            tension: 0.4,
            fill: true
          },
          {
            label: 'FCP (avg)',
            data: sortedData.map(d => safeMetricExtractor(d, 'fcp')),
            borderColor: '#4CAF50',
            backgroundColor: 'rgba(76, 175, 80, 0.1)',
            tension: 0.4,
            fill: true
          },
          {
            label: 'Load Time (avg)',
            data: sortedData.map(d => safeMetricExtractor(d, 'loadTime')),
            borderColor: '#FFC107',
            backgroundColor: 'rgba(255, 193, 7, 0.1)',
            tension: 0.4,
            fill: true
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: {
          mode: 'index',
          intersect: false
        },
        plugins: {
          title: {
            display: true,
            text: 'Performance Metrics Over Time',
            font: {
              size: 16,
              weight: 'bold'
            }
          },
          tooltip: {
            mode: 'index',
            intersect: false,
            callbacks: {
              label: function(context) {
                const value = Math.round(context.raw);
                return `${context.dataset.label}: ${value}ms`;
              }
            }
          },
          legend: {
            position: 'top',
            labels: {
              usePointStyle: true,
              padding: 20
            }
          }
        },
        scales: {
          x: {
            grid: {
              display: false
            },
            ticks: {
              maxRotation: 45,
              minRotation: 45
            }
          },
          y: {
            beginAtZero: true,
            title: {
              display: true,
              text: 'Time (ms)'
            },
            grid: {
              color: 'rgba(0, 0, 0, 0.1)'
            }
          }
        }
      }
    });

    setChart(newChart);

    return () => {
      if (newChart) {
        newChart.destroy();
      }
    };
  }, [data]);

  if (!data || data.length === 0) {
    return (
      <div className="empty-state">
        <p>No historical data available</p>
        <p className="hint">Run tests multiple times to see performance trends</p>
      </div>
    );
  }

  return (
    <div style={{ height: '400px', width: '100%' }}>
      <canvas ref={chartRef} />
    </div>
  );
}

function MetricCard({ title, value, unit = 'ms', min, max }) {
  return (
    <div className="metric-card">
      <h3>{title}</h3>
      <div className="metric-value">
        {typeof value === 'number' ? Math.round(value) : value}{unit}
      </div>
      {(min !== undefined && max !== undefined) && (
        <div className="metric-range">
          <span>Range: {Math.round(min)}{unit} - {Math.round(max)}{unit}</span>
        </div>
      )}
    </div>
  );
}

function HistorySection({ onSelectTimestamp }) {
  const [history, setHistory] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('history-index.json')
      .then(res => res.ok ? res.json() : { timestamps: [] })
      .then(data => {
        setHistory(data);
        setLoading(false);
      })
      .catch(() => {
        setHistory({ timestamps: [] });
        setLoading(false);
      });
  }, []);

  if (loading) return <div>Loading history...</div>;
  if (!history?.timestamps?.length) return null;

  return (
    <section className="history-section">
      <h2>Test History</h2>
      <div className="history-list">
        {history.timestamps.map(timestamp => (
          <button
            key={timestamp}
            className="history-item"
            onClick={() => onSelectTimestamp(timestamp)}
          >
            {new Date(timestamp).toLocaleString()}
          </button>
        ))}
      </div>
    </section>
  );
}

function App() {
  const [results, setResults] = useState(null);
  const [analysis, setAnalysis] = useState(null);
  const [historicalData, setHistoricalData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadHistoricalData = async () => {
      setLoading(true);
      try {
        // Carrega o índice do histórico
        const historyIndex = await fetch('history-index.json')
          .then(res => res.ok ? res.json() : { timestamps: [] });

        // Carrega os dados mais recentes
        const [currentResults, currentAnalysis] = await Promise.all([
          fetch('results.json').then(res => res.ok ? res.json() : null),
          fetch('analysis.json').then(res => res.ok ? res.json() : null)
        ]);

        // Carrega os dados históricos
        const historicalResults = await Promise.all(
          historyIndex.timestamps.map(timestamp =>
            fetch(`history/results-${timestamp}.json`)
              .then(res => res.ok ? res.json() : null)
          )
        );

        // Combina dados atuais com histórico
        const allData = [currentResults, ...historicalResults].filter(Boolean);
        
        setResults(currentResults);
        setAnalysis(currentAnalysis);
        setHistoricalData(allData);
        setError(null);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    loadHistoricalData();
  }, []);

  if (loading) {
    return <div className="loading">Loading performance data...</div>;
  }

  if (error) {
    return <div className="error">Error loading data: {error}</div>;
  }

  if (!results || !analysis) {
    return <div className="empty-state">No performance data available</div>;
  }

  // Ensure we have all required data structures
  const metrics = results.metrics?.mainSite?.timing || {
    ttfb: { average: 0, min: 0, max: 0 },
    fcp: { average: 0, min: 0, max: 0 },
    loadTime: { average: 0, min: 0, max: 0 }
  };
  
  const tests = results.tests || [];
  const passedTests = tests.filter(t => t.status === 'passed').length;
  const failedTests = tests.filter(t => t.status === 'failed').length;
  const totalTests = tests.length;
  const passRate = totalTests > 0 ? (passedTests / totalTests * 100).toFixed(1) : '0.0';

  return (
    <div className="container">
      <header>
        <h1>Web Performance Guardian</h1>
        <p>Performance monitoring and analysis dashboard</p>
      </header>

      <div className="metrics-grid">
        <MetricCard 
          title="Time to First Byte" 
          value={metrics.ttfb.average}
          min={metrics.ttfb.min}
          max={metrics.ttfb.max}
        />
        <MetricCard 
          title="First Contentful Paint" 
          value={metrics.fcp.average}
          min={metrics.fcp.min}
          max={metrics.fcp.max}
        />
        <MetricCard 
          title="Page Load Time" 
          value={metrics.loadTime.average}
          min={metrics.loadTime.min}
          max={metrics.loadTime.max}
        />
        <MetricCard 
          title="Pass Rate" 
          value={passRate}
          unit="%"
        />
      </div>

      <section className="chart-section">
        <h2>Performance Trends</h2>
        <PerformanceChart data={historicalData} />
      </section>

      <section className="test-results-section">
        <h2>Test Results</h2>
        <div className="test-summary">
          <div className="summary-item passed">
            <span className="count">{passedTests}</span>
            <span className="label">Passed</span>
          </div>
          <div className="summary-item failed">
            <span className="count">{failedTests}</span>
            <span className="label">Failed</span>
          </div>
          <div className="summary-item total">
            <span className="count">{totalTests}</span>
            <span className="label">Total</span>
          </div>
        </div>
        <div className="test-details">
          {tests.map((test, index) => (
            <div key={index} className={`test-item ${test.status}`}>
              <div className="test-header">
                <span className={`status-badge ${test.status}`}>
                  {test.status === 'passed' ? '✓' : '✗'}
                </span>
                <span className="test-title">{test.title}</span>
              </div>
              {test.error && (
                <div className="test-error">{test.error}</div>
              )}
              {test.metrics && (
                <div className="test-metrics">
                  {test.metrics.loadTime >= 0 && <span>Load Time: {Math.round(test.metrics.loadTime)}ms</span>}
                  {test.metrics.ttfb >= 0 && <span>TTFB: {Math.round(test.metrics.ttfb)}ms</span>}
                  {test.metrics.fcp >= 0 && <span>FCP: {Math.round(test.metrics.fcp)}ms</span>}
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      <section className="issues-section">
        <h2>Performance Issues</h2>
        {!analysis.issues ? (
          <EmptyState message="No performance analysis available" />
        ) : analysis.issues.length === 0 ? (
          <div className="issues-placeholder">No issues detected</div>
        ) : (
          analysis.issues.map((issue, index) => (
            <div key={index} className={`issue-item ${issue.severity}`}>
              <span className="severity">{issue.severity}</span>
              <div className="message">{issue.message}</div>
              <div className="suggestion">{issue.suggestion}</div>
            </div>
          ))
        )}
      </section>

      <section className="insights-section">
        <h2>AI Insights</h2>
        {!analysis.ai_insights ? (
          <EmptyState message="No AI insights available" />
        ) : (
          <>
            <div className="patterns">
              <h3>Detected Patterns</h3>
              <ul>
                {analysis.ai_insights.patterns.map((pattern, index) => (
                  <li key={index}>{pattern}</li>
                ))}
              </ul>
            </div>
            <div className="recommendations">
              <h3>Recommendations</h3>
              <ul>
                {analysis.ai_insights.recommendations.map((recommendation, index) => (
                  <li key={index}>{recommendation}</li>
                ))}
              </ul>
            </div>
          </>
        )}
      </section>

      <footer>
        <p>Powered by Web Performance Guardian</p>
        <p>Using Hugging Face API for AI-powered analysis</p>
      </footer>
    </div>
  );
}

ReactDOM.render(<App />, document.getElementById('root')); 