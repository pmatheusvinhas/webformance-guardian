const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 3000;

const MIME_TYPES = {
  '.html': 'text/html',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml'
};

const server = http.createServer((req, res) => {
  console.log(`📝 ${req.method} ${req.url}`);
  
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  // Handle preflight
  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  // Default to index.html for root path
  let filePath = path.join(__dirname, req.url === '/' ? 'index.html' : req.url);
  const ext = path.extname(filePath);

  // Special handling for /history endpoint
  if (req.url === '/history') {
    const historyDir = path.join(__dirname, 'history');
    if (fs.existsSync(historyDir)) {
      const files = fs.readdirSync(historyDir)
        .filter(file => file.startsWith('results-'))
        .sort()
        .reverse()
        .slice(0, 10); // Get last 10 results

      const history = files.map(file => {
        const content = fs.readFileSync(path.join(historyDir, file), 'utf8');
        return JSON.parse(content);
      });

      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(history));
      return;
    }
  }

  // Check if file exists
  fs.access(filePath, fs.constants.F_OK, (err) => {
    if (err) {
      console.error(`❌ File not found: ${filePath}`);
      res.writeHead(404);
      res.end('File not found');
      return;
    }

    // Read and serve the file
    fs.readFile(filePath, (err, content) => {
      if (err) {
        console.error(`❌ Error reading file: ${err.message}`);
        res.writeHead(500);
        res.end(`Server Error: ${err.code}`);
        return;
      }

      const contentType = MIME_TYPES[ext] || 'text/plain';
      res.writeHead(200, { 'Content-Type': contentType });
      res.end(content);
      console.log(`✅ Served ${filePath} (${contentType})`);
    });
  });
});

server.listen(PORT, () => {
  console.log(`
🚀 Server running at http://localhost:${PORT}/
📁 Serving files from: ${__dirname}
`);
}); 