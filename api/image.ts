import type { VercelRequest, VercelResponse } from '@vercel/node';

const ACE_API = 'https://api.acedata.cloud/flux/images';
const ACE_TASKS_API = 'https://api.acedata.cloud/flux/tasks';

async function pollTask(taskId: string, token: string, maxWait = 7000): Promise<any> {
  const start = Date.now();
  while (Date.now() - start < maxWait) {
    await new Promise(r => setTimeout(r, 3000));
    const resp = await fetch(ACE_TASKS_API, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ id: taskId, action: 'retrieve' }),
    });
    const result = await resp.json();
    if (result.response?.data?.length > 0) {
      return result.response.data;
    }
  }
  return null;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
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

    // Sync result with images
    if (data.data && data.data.length > 0) {
      return res.status(200).json({ success: true, images: data.data });
    }

    // Async task - poll until complete
    const taskId = data.task_id || data.id;
    if (taskId) {
      const images = await pollTask(taskId, token);
      if (images) {
        return res.status(200).json({ success: true, images });
      }
      // Still not ready, return task_id for client-side polling
      return res.status(200).json({ task_id: taskId, status: 'processing' });
    }

    // Pass through any other response
    return res.status(200).json(data);
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Internal server error' });
  }
}
