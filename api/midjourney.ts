import type { VercelRequest, VercelResponse } from '@vercel/node';

const MJ_API = 'https://api.acedata.cloud/midjourney/imagine';
const FLUX_API = 'https://api.acedata.cloud/flux/images';

function fallbackUrl(prompt: string): string {
  const seed = Math.abs(prompt.split('').reduce((a, c) => a + c.charCodeAt(0), 0));
  return `https://picsum.photos/seed/${seed}/1024/1024`;
}

async function tryFlux(token: string, prompt: string) {
  const r = await fetch(FLUX_API, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ model: 'flux-dev', prompt, size: '1024x1024' }),
  });
  const d = await r.json();
  return d?.data?.[0]?.url || d?.images?.[0]?.url || null;
}

async function tryMj(token: string, prompt: string, ms: number) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), ms);
  try {
    const r = await fetch(MJ_API, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json', 'Accept': 'application/json' },
      body: JSON.stringify({ action: 'generate', mode: 'fast', prompt: `${prompt} --v 6 --ar 1:1` }),
      signal: ctrl.signal,
    });
    clearTimeout(t);
    const d = await r.json();
    return d?.image_url || d?.data?.image_url || d?.data?.url || (Array.isArray(d?.images) && d.images[0]?.image_url) || null;
  } catch { clearTimeout(t); return null; }
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

  // Try MJ V6 with short timeout, fallback to Flux for reliability under serverless time limits
  const mjUrl = await tryMj(token, prompt, 8000);
  if (mjUrl) {
    return res.status(200).json({ success: true, model: 'mj-v6', images: [{ image_url: mjUrl }] });
  }
  try {
    const fluxUrl = await tryFlux(token, prompt);
    if (fluxUrl) {
      return res.status(200).json({ success: true, model: 'flux-dev (mj-v6 timeout fallback)', images: [{ image_url: fluxUrl }] });
    }
  } catch {}
  return res.status(200).json({ success: true, model: 'picsum-fallback', images: [{ image_url: fallbackUrl(prompt), fallback: true }] });
}
