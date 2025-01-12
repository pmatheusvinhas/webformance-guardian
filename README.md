# WebFormance Guardian

[Demo](https://pmatheusvinhas.github.io/webformance-guardian/)

A continuous web performance monitoring project developed as part of the application process for Stably AI.

## 🎯 Project Status

[![CI/CD](https://github.com/pmatheusvinhas/webformance-guardian/actions/workflows/main.yml/badge.svg)](https://github.com/pmatheusvinhas/webformance-guardian/actions/workflows/main.yml)
[![Performance Tests](https://github.com/pmatheusvinhas/webformance-guardian/actions/workflows/performance.yml/badge.svg)](https://github.com/pmatheusvinhas/webformance-guardian/actions/workflows/performance.yml)

## 📝 Objective

Demonstrate the capability to create a complete web performance monitoring solution that:
- Executes automated tests periodically
- Collects crucial performance metrics
- Analyzes results using AI
- Presents actionable insights
- Maintains performance history

## 🚀 Features

- **Automated Testing**
  - Runs every 5 hours via GitHub Actions
  - Performance tests using Playwright
  - Metrics collection: Load Time, TTFB, FCP

- **AI Analysis**
  - Automatic analysis using Groq API (Mixtral 8x7B)
  - Actionable insights generation
  - Critical issues identification
  - Optimization recommendations

- **Interactive Dashboard**
  - Real-time metrics visualization
  - Interactive charts with Chart.js
  - GitHub Actions status
  - 6-day performance history
  - Modern UI with Tailwind CSS

## 🛠 Technologies

- **Frontend**: Next.js, TypeScript, Tailwind CSS
- **Testing**: Playwright
- **Visualization**: Chart.js
- **CI/CD**: GitHub Actions
- **AI**: Groq API (Mixtral 8x7B)
- **Deploy**: GitHub Pages

## 📊 Collected Metrics

- **Load Time**: Total page load time
- **TTFB (Time To First Byte)**: Initial server response
- **FCP (First Contentful Paint)**: First content rendering

## 🤖 AI Analysis

We use Groq AI's Mixtral 8x7B model to:
- Analyze performance trends
- Identify critical issues
- Generate technical recommendations
- Prioritize optimizations

## 📝 License

MIT 