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
    const analysisPath = path.join(process.cwd(), 'src', 'ui', 'analysis.json');
    
    if (!fs.existsSync(analysisPath)) {
      return res.status(404).json({ message: 'No analysis available' });
    }

    const analysis = JSON.parse(fs.readFileSync(analysisPath, 'utf-8'));
    res.status(200).json(analysis);
  } catch (error) {
    console.error('Error reading analysis:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
} 