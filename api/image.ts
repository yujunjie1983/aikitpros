import type { VercelRequest, VercelResponse } from '@vercel/node';

const ACE_API = 'https://api.acedata.cloud/flux/images';
const ACE_TASKS_API = 'https://api.acedata.cloud/flux/tasks';

async function pollForResult(taskId: string, token: string, maxAttempts = 3, delay = 2000): Promise<any> {
  for (let i = 0; i < maxAttempts; i++) {
    await new Promise(r => setTimeout(r, delay));
    const resp = await fetch(ACE_TASKS_API, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify({ ids: [taskId], action: 'retrieve_batch' }),
    });
    const result = await resp.json();
    // Check if task completed
    const tasks = result?.data || result;
    if (Array.isArray(tasks)) {
      for (const t of tasks) {
        if (t.id === taskId && t.data && t.data.length > 0) {
          return { success: true, images: t.data };
        }
      }
    }
  }
  return { success: false, error: 'Image generation timed out' };
}

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

    // If sync result
    if (data.data && data.data.length > 0) {
      return res.status(200).json({ success: true, images: data.data });
    }

    // Async task - poll until complete
    if (data.id) {
      const result = await pollForResult(data.id, token);
      return res.status(200).json(result);
    }

    return res.status(200).json({ success: true, images: data.data || [] });
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Internal server error' });
  }
}
