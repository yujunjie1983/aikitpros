import type { VercelRequest, VercelResponse } from '@vercel/node';

const VEO_API = 'https://api.acedata.cloud/veo/videos';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { prompt, image_url, model = 'veo3-fast' } = req.body || {};
  if (!prompt) return res.status(400).json({ error: 'prompt is required' });

  const token = process.env.ACE_API_KEY;
  if (!token) {
    return res.status(200).json({ success: true, model: 'veo-fallback', video_url: null, message: 'ACE_API_KEY missing; client should fall back to /api/video' });
  }

  try {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), 8000);
    const body: any = { action: image_url ? 'image2video' : 'text2video', model, prompt };
    if (image_url) body.image_urls = [image_url];
    const r = await fetch(VEO_API, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json', 'Accept': 'application/json' },
      body: JSON.stringify(body),
      signal: ctrl.signal,
    });
    clearTimeout(t);
    const data = await r.json();
    const videoUrl = data?.data?.video_url || data?.video_url || null;
    const taskId = data?.data?.id || data?.id || null;
    return res.status(200).json({ success: true, model, task_id: taskId, video_url: videoUrl });
  } catch (err: any) {
    return res.status(200).json({ success: true, model: 'veo-timeout', video_url: null, error: err?.message, fallback: '/api/video' });
  }
}
