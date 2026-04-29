import type { VercelRequest, VercelResponse } from '@vercel/node';

const ACE_API = 'https://api.acedata.cloud/flux/images';

function getFallbackUrl(prompt: string): string {
  const keywords = encodeURIComponent(prompt.split(' ').slice(0, 3).join(' '));
  return `https://source.unsplash.com/1024x1024/?${keywords}`;
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
    return res.status(200).json({
      success: true,
      images: [{ image_url: getFallbackUrl(prompt), fallback: true }]
    });
  }

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);
    const response = await fetch(ACE_API, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify({ action: 'generate', prompt, size, model }),
      signal: controller.signal,
    });
    clearTimeout(timeout);
    const data = await response.json();

    // Sync result with images
    if (data.data && data.data.length > 0) {
      return res.status(200).json({ success: true, images: data.data });
    }

    // Async task - return fallback immediately
    return res.status(200).json({
      success: true,
      images: [{ image_url: getFallbackUrl(prompt), fallback: true }]
    });
  } catch (err: any) {
    return res.status(200).json({
      success: true,
      images: [{ image_url: getFallbackUrl(prompt), fallback: true }]
    });
  }
}
