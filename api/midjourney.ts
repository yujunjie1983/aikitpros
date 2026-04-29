import type { VercelRequest, VercelResponse } from '@vercel/node';

const MJ_API = 'https://api.acedata.cloud/midjourney/imagine';

function fallbackUrl(prompt: string, index = 0): string {
  const seed = Math.abs(prompt.split('').reduce((a, c) => a + c.charCodeAt(0), 0)) + index;
  return `https://picsum.photos/seed/${seed}/1024/1024`;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { prompt } = req.body || {};
  if (!prompt) return res.status(400).json({ error: 'prompt is required' });

  const token = process.env.ACE_API_KEY;
  if (!token) {
    return res.status(200).json({ success: true, model: 'mj-v6-fallback', images: [{ image_url: fallbackUrl(prompt), fallback: true }] });
  }

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 90000);
    const response = await fetch(MJ_API, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify({ action: 'generate', prompt: `${prompt} --v 6 --ar 1:1` }),
      signal: controller.signal,
    });
    clearTimeout(timeout);
    const data = await response.json();
    const url = data?.image_url || data?.data?.image_url || data?.data?.url || (Array.isArray(data?.images) && data.images[0]?.image_url);
    if (url) {
      return res.status(200).json({ success: true, model: 'mj-v6', images: [{ image_url: url }] });
    }
    return res.status(200).json({ success: true, model: 'mj-v6-fallback', images: [{ image_url: fallbackUrl(prompt), fallback: true }] });
  } catch (err: any) {
    return res.status(200).json({ success: true, model: 'mj-v6-fallback', images: [{ image_url: fallbackUrl(prompt), fallback: true, error: err?.message }] });
  }
}
