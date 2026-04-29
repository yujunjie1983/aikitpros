import type { VercelRequest, VercelResponse } from '@vercel/node';

const ACE_API = 'https://api.acedata.cloud/suno/audios';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { prompt, action = 'generate', model = 'chirp-v4', style, lyric, custom } = req.body || {};
  if (!prompt) return res.status(400).json({ error: 'prompt is required' });

  const token = process.env.ACE_API_KEY;
  if (!token) {
    return res.status(200).json({
      success: true,
      demo: true,
      task_id: 'demo-music-' + Date.now(),
      state: 'completed',
      audios: [{
        audio_url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3',
        title: 'Demo Ad Jingle',
        duration: 30,
        fallback: true
      }],
      message: 'Demo mode - no API key configured'
    });
  }

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 60000);

    const payload: any = { action, prompt, model };
    if (style) payload.style = style;
    if (lyric) payload.lyric = lyric;
    if (custom !== undefined) payload.custom = custom;

    const response = await fetch(ACE_API, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });

    clearTimeout(timeout);
    const data = await response.json();

    return res.status(200).json({
      success: true,
      task_id: data.task_id || null,
      state: data.state || 'processing',
      audios: data.data || [],
    });
  } catch (err: any) {
    return res.status(200).json({
      success: false,
      error: err.message || 'Music generation failed',
      demo: true,
      task_id: 'demo-music-' + Date.now(),
      state: 'completed',
      audios: [{
        audio_url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3',
        title: 'Demo Ad Jingle',
        duration: 30,
        fallback: true
      }]
    });
  }
}
