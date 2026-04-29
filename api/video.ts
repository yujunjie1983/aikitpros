import type { VercelRequest, VercelResponse } from '@vercel/node';

const ACE_API = 'https://api.acedata.cloud/wan/videos';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { prompt, action = 'text2video', model = 'wan2.6-t2v' } = req.body || {};
  if (!prompt) return res.status(400).json({ error: 'prompt is required' });

  const token = process.env.ACE_API_KEY;
  if (!token) {
    return res.status(200).json({
      success: true,
      demo: true,
      task_id: 'demo-' + Date.now(),
      state: 'completed',
      video_url: 'https://www.w3schools.com/html/mov_bbb.mp4',
      message: 'Demo mode - no API key configured'
    });
  }

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 30000);

    const response = await fetch(ACE_API, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify({ action, prompt, model }),
      signal: controller.signal,
    });

    clearTimeout(timeout);
    const data = await response.json();

    return res.status(200).json({
      success: true,
      task_id: data.task_id,
      state: data.state,
      video_url: data.video_url || null,
      video_id: data.video_id || null,
      prompt: data.prompt || prompt,
    });
  } catch (err: any) {
    return res.status(200).json({
      success: false,
      error: err.message || 'Video generation failed',
      demo: true,
      task_id: 'demo-' + Date.now(),
      state: 'completed',
      video_url: 'https://www.w3schools.com/html/mov_bbb.mp4',
    });
  }
}
