import type { VercelRequest, VercelResponse } from '@vercel/node';

const DIFY_API_URL = 'https://api.dify.ai/v1/workflows/run';
const DIFY_API_KEY = process.env.DIFY_API_KEY ?? '';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  if (!DIFY_API_KEY) return res.status(500).json({ error: 'Optimizer not configured' });

  const { mode = 'copy', headline = '', body = '', brand_voice = '', audience = '', hero_image_url = '' } = req.body ?? {};
  if (!headline || !body) return res.status(400).json({ error: 'headline and body required' });

  try {
    const difyRes = await fetch(DIFY_API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${DIFY_API_KEY}` },
      body: JSON.stringify({
        inputs: { mode, headline, body, brand_voice, audience, hero_image_url },
        response_mode: 'blocking',
        user: 'aikitpros-optimizer',
      }),
    });

    if (!difyRes.ok) {
      const err = await difyRes.text();
      return res.status(502).json({ error: 'Upstream error', detail: err });
    }

    const data = await difyRes.json();
    const raw: string = data?.data?.outputs?.variants_json ?? '{}';

    let parsed: { headlines?: string[]; hooks?: string[]; ctas?: string[] };
    try {
      parsed = JSON.parse(raw);
    } catch {
      parsed = JSON.parse(raw.replace(/```json\n?|```/g, '').trim());
    }

    return res.status(200).json({
      headlines: parsed.headlines ?? [],
      hooks: parsed.hooks ?? [],
      ctas: parsed.ctas ?? [],
    });
  } catch (e: unknown) {
    console.error('[optimize] error:', e);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
