import type { VercelRequest, VercelResponse } from '@vercel/node';

const ACE_API_KEY = process.env.ACE_API_KEY ?? '';
const ACE_CHAT_URL = 'https://api.acedata.cloud/openai/chat/completions';

function fallback(headline: string, body: string) {
  return {
    headlines: [
      `${headline}: The Smart Choice for Modern Life`,
      `Why ${headline} Is Taking the Market by Storm`,
      `Introducing ${headline} — Built Different`
    ],
    hooks: [
      `Tired of settling for less? ${headline} changes everything.`,
      `What if ${body.slice(0, 60)}... could be this simple?`,
      `Stop scrolling. ${headline} is what you've been looking for.`
    ],
    ctas: [
      'Try it free today',
      'See it in action',
      'Get started now'
    ]
  };
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { headline = '', body = '' } = req.body ?? {};
  if (!headline || !body) return res.status(400).json({ error: 'headline and body required' });

  if (!ACE_API_KEY) {
    return res.status(200).json(fallback(headline, body));
  }

  try {
    const prompt = `You are an expert ad copywriter. Given a product, generate JSON with exactly 3 headlines, 3 hooks, and 3 CTAs.\n\nProduct: ${headline}\nDescription: ${body}\n\nRespond ONLY with valid JSON: {"headlines":[...],"hooks":[...],"ctas":[...]}`;
    const aceRes = await fetch(ACE_CHAT_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${ACE_API_KEY}` },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.8
      }),
    });

    if (!aceRes.ok) {
      return res.status(200).json(fallback(headline, body));
    }

    const data = await aceRes.json();
    const raw = data?.choices?.[0]?.message?.content ?? '';
    let parsed: { headlines?: string[]; hooks?: string[]; ctas?: string[] };
    try {
      parsed = JSON.parse(raw.replace(/```json\n?|```/g, '').trim());
    } catch {
      return res.status(200).json(fallback(headline, body));
    }
    return res.status(200).json({
      headlines: parsed.headlines ?? [],
      hooks: parsed.hooks ?? [],
      ctas: parsed.ctas ?? [],
    });
  } catch (e: unknown) {
    console.error('[optimize] error:', e);
    return res.status(200).json(fallback(headline, body));
  }
}
