import type { VercelRequest, VercelResponse } from '@vercel/node';

const ACE_API = 'https://api.acedata.cloud/flux/images';

function getFallbackUrl(prompt: string, index: number = 0): string {
  const seed = Math.abs(prompt.split('').reduce((a, c) => a + c.charCodeAt(0), 0)) + index;
  return `https://picsum.photos/seed/${seed}/1024/1024`;
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

    if (data.data && data.data.length > 0) {
      return res.status(200).json({ success: true, images: data.data });
    }

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
