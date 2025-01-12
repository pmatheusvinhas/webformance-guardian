import { NextApiRequest, NextApiResponse } from 'next';
import fs from 'fs';
import path from 'path';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const resultsPath = path.join(process.cwd(), 'src', 'ui', 'results.json');
    
    if (!fs.existsSync(resultsPath)) {
      return res.status(404).json({ message: 'No test results available' });
    }

    const results = JSON.parse(fs.readFileSync(resultsPath, 'utf-8'));
    res.status(200).json(results);
  } catch (error) {
    console.error('Error reading test results:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
} 