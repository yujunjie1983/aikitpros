import type { VercelRequest, VercelResponse } from '@vercel/node';

const ACE_API = 'https://api.acedata.cloud/suno/audios';

function demoResponse() {
  return {
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
  };
}

async function pollForCompletion(taskId: string, token: string, maxWait: number = 240000): Promise<any> {
  const start = Date.now();
  const interval = 5000;
  while (Date.now() - start < maxWait) {
    await new Promise(r => setTimeout(r, interval));
    const resp = await fetch('https://api.acedata.cloud/suno/audios', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({ action: 'status', task_id: taskId })
    });
    const data = await resp.json();
    if (data.data && data.data.length > 0 && data.data[0].audio_url) {
      return data;
    }
    if (data.state === 'completed' || data.status === 'completed') {
      return data;
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

  const { prompt, action = 'generate', model = 'chirp-v4', style, lyric, custom } = req.body || {};
  if (!prompt) return res.status(400).json({ error: 'prompt is required' });

  const token = process.env.ACE_API_KEY;
  if (!token) {
    return res.status(200).json(demoResponse());
  }

  try {
    const payload: any = { action, prompt, model };
    if (style) payload.style = style;
    if (lyric) payload.lyric = lyric;
    if (custom !== undefined) payload.custom = custom;

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 240000);

    const response = await fetch(ACE_API, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });

    clearTimeout(timeout);
    const data = await response.json();

    // If Suno returned audio directly
    if (data.data && data.data.length > 0 && data.data[0].audio_url) {
      return res.status(200).json({
        success: true,
        task_id: data.task_id || null,
        state: 'completed',
        audios: data.data,
      });
    }

    // If task_id returned but no audio yet, poll
    if (data.task_id) {
      const result = await pollForCompletion(data.task_id, token);
      if (result && result.data && result.data.length > 0) {
        return res.status(200).json({
          success: true,
          task_id: data.task_id,
          state: 'completed',
          audios: result.data,
        });
      }
    }

    // Return whatever we got
    return res.status(200).json({
      success: true,
      task_id: data.task_id || null,
      state: data.state || 'processing',
      audios: data.data || [],
    });
  } catch (err: any) {
    return res.status(200).json(demoResponse());
  }
}
