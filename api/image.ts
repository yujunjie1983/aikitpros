import type { VercelRequest, VercelResponse } from '@vercel/node';

const ACE_API = 'https://api.acedata.cloud/flux/images';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { prompt, size = '1024x1024', model = 'flux-dev' } = req.body || {};
  if (!prompt) return res.status(400).json({ error: 'prompt is required' });

  const token = process.env.ACE_API_KEY;
  if (!token) return res.status(500).json({ error: 'ACE_API_KEY not configured' });

  try {
    const response = await fetch(ACE_API, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify({ action: 'generate', prompt, size, model }),
    });
    const data = await response.json();
    if (!response.ok) return res.status(response.status).json(data);

    // Async task
    if (data.id && !data.data) {
      return res.status(202).json({ task_id: data.id, status: 'processing' });
    }
    return res.status(200).json({ success: true, images: data.data || [] });
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Internal server error' });
  }
}
