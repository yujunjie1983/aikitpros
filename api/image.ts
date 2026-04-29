import type { VercelRequest, VercelResponse } from '@vercel/node';

const ACE_API = 'https://api.acedata.cloud/flux/images';
const ACE_TASKS_API = 'https://api.acedata.cloud/flux/tasks';

// Fallback: keyword-based stock images from Unsplash
function getFallbackUrl(prompt: string): string {
  const keywords = encodeURIComponent(prompt.split(' ').slice(0, 3).join(' '));
  return `https://source.unsplash.com/1024x1024/?${keywords}`;
}

async function pollTask(taskId: string, token: string, maxWait = 7000): Promise<any> {
  const start = Date.now();
  while (Date.now() - start < maxWait) {
    await new Promise(r => setTimeout(r, 2000));
    try {
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
    } catch (e) { /* continue polling */ }
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
  if (!token) {
    // No API key - use fallback
    return res.status(200).json({
      success: true,
      images: [{ image_url: getFallbackUrl(prompt), fallback: true }]
    });
  }

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

    // Sync result
    if (data.data && data.data.length > 0) {
      return res.status(200).json({ success: true, images: data.data });
    }

    // Async task - poll
    const taskId = data.task_id || data.id;
    if (taskId) {
      const images = await pollTask(taskId, token);
      if (images) {
        return res.status(200).json({ success: true, images });
      }
      // Fallback: return AI-themed stock image
      return res.status(200).json({
        success: true,
        images: [{ image_url: getFallbackUrl(prompt), fallback: true, task_id: taskId }]
      });
    }

    // Fallback for any other case
    return res.status(200).json({
      success: true,
      images: [{ image_url: getFallbackUrl(prompt), fallback: true }]
    });
  } catch (err: any) {
    // Even on error, return a fallback image
    return res.status(200).json({
      success: true,
      images: [{ image_url: getFallbackUrl(prompt), fallback: true }]
    });
  }
}
