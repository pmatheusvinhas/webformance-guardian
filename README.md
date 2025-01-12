# Webformance Guardian

A web performance monitoring tool with AI-powered analysis. This project demonstrates automated performance testing and analysis using Playwright, TypeScript, and AI models for generating insights.

## Features

- 🚀 Automated performance testing with Playwright
- 🧠 AI-powered test generation and analysis
- 📊 Interactive dashboard for visualizing results
- 📈 Historical performance tracking
- 🔄 Daily automated testing via GitHub Actions

## Prerequisites

- Node.js 16+
- npm or yarn
- A Hugging Face API token

## Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/web-performance-guardian.git
cd web-performance-guardian
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file based on `.env.example`:
```bash
cp .env.example .env
```

4. Add your Hugging Face API token to `.env`:
```
HUGGINGFACE_API_TOKEN=your_token_here
```

## Usage

### Running Performance Tests

To run performance tests for a specific site:

```bash
npm run report:stably
```

This will:
1. Generate and run performance tests
2. Analyze the results using AI
3. Save the results and analysis
4. Update the dashboard

### Viewing Results

Start the UI server:

```bash
npm run ui:serve
```

Then open `http://localhost:3000` in your browser to view the dashboard.

## Project Structure

```
├── src/
│   ├── core/           # Core functionality
│   │   ├── ai-analyzer.ts
│   │   ├── performance-analyzer.ts
│   │   ├── test-reporter.ts
│   │   └── types.ts
│   ├── sites/         # Site-specific configurations
│   └── ui/            # Dashboard interface
├── tests/
│   ├── performance/   # Performance tests
│   └── unit/         # Unit tests
└── .github/
    └── workflows/    # GitHub Actions workflows
```

## Testing

Run unit tests:
```bash
npm test
```

Run tests with coverage:
```bash
npm run test:coverage
```

## CI/CD

The project uses GitHub Actions for:
- Running unit tests
- Daily performance testing
- Updating the dashboard
- Deploying to GitHub Pages

## Technical Details

### AI Models

We use the following models from Hugging Face:
- `mistralai/Mistral-7B-Instruct-v0.1` for test generation and analysis
- Chosen for its strong performance in structured output generation and natural language understanding

### Performance Metrics

The tool measures:
- Time to First Byte (TTFB)
- First Contentful Paint (FCP)
- Largest Contentful Paint (LCP)
- Custom metrics as needed

## Contributing

1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details. 