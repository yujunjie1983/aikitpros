import type { VercelRequest, VercelResponse } from '@vercel/node';

const ACE_API_KEY = process.env.ACE_API_KEY ?? '';
const ACE_CHAT_URL = 'https://api.acedata.cloud/openai/chat/completions';

// Fallback EN
function fallbackEN(headline: string, body: string) {
  return {
    instagram: { headline: `${headline}: The Smart Choice`, body: `Tired of settling for less? ${headline} changes everything.`, cta: 'Try it free today' },
    facebook: { headline: `Why ${headline} Is Taking the Market by Storm`, body: `Meet the product that adapts to your needs. ${body.slice(0,80)}`, cta: 'See it in action' },
    google: { headline: `${headline} | Built Different`, description: `Ultra-responsive. Free shipping on orders over $99.`, cta: 'Shop now' },
    tiktok: { hook: `POV: You just found the thing that changes everything.`, script: `3 reasons ${headline} is taking over...`, cta: 'Link in bio' },
    headlines: [`${headline}: The Smart Choice for Modern Life`, `Why ${headline} Is Taking the Market by Storm`, `Introducing ${headline} — Built Different`],
    hooks: [`Tired of settling for less? ${headline} changes everything.`, `What if ${body.slice(0,60)}... could be this simple?`, `Stop scrolling. ${headline} is what you've been looking for.`],
    ctas: ['Try it free today', 'See it in action', 'Get started now']
  };
}

// Fallback ZH
function fallbackZH(headline: string, body: string) {
  return {
    xiaohongshu: { headline: `这个${headline}真的适合打工人 🙌`, body: `用了一周，真实测评！${body.slice(0,60)}。百分百平替。`, cta: '点链接了解' },
    weibo: { headline: `【真实测评】${headline}逃不过了`, body: `${body.slice(0,80)}，百分百实用！`, cta: '点这里买' },
    douyin: { hook: `等一下！这个${headline}让我没想到`, script: `${headline}的 3 个优点，第 3 个直接维权…`, cta: '主页有链接' },
    wechat: { headline: `啊！${headline}现在有优惠`, body: `限时活动，按量付费。${body.slice(0,60)}`, cta: '扫码了解' },
    headlines: [`这个${headline}真的适合打工人`, `【真实测评】${headline}逃不过了`, `啊！${headline}现在有优惠`],
    hooks: [`等一下，这个东西让我没想到`, `用了一周真实测评`, `迎头一啦，这个真没想到`],
    ctas: ['点链接了解', '扫码购买', '限时免费领取']
  };
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const lang = (req.query?.lang as string) ?? 'en';
  const isZh = lang === 'zh';
  const { headline = '', body = '' } = req.body ?? {};
  if (!headline) return res.status(400).json({ error: 'headline required' });

  const enPrompt = `You are an expert ad copywriter. Given a product, generate structured ad copy for 4 platforms.

Product: ${headline}
Description: ${body}

Respond ONLY with valid JSON in this exact shape:
{"instagram":{"headline":"...","body":"...","cta":"..."},"facebook":{"headline":"...","body":"...","cta":"..."},"google":{"headline":"...","description":"...","cta":"..."},"tiktok":{"hook":"...","script":"...","cta":"..."},"headlines":["...","...","..."],"hooks":["...","...","..."],"ctas":["...","...","..."]}`;

  const zhPrompt = `你是一个跨境广告文案专家。将以下产品信息生成针对小红书、微博、抖音、微信朋友圈四个平台的中文广告文案，风格口语化、跨境风。

产品：${headline}
描述：${body}

仅返回 JSON，格式如下：
{"xiaohongshu":{"headline":"标题","body":"正文","cta":"行动号召"},"weibo":{"headline":"","body":"","cta":""},"douyin":{"hook":"开场钉","script":"内容","cta":""},"wechat":{"headline":"","body":"","cta":""},"headlines":["","",""],"hooks":["","",""],"ctas":["","",""]}`;

  let parsed: Record<string, unknown>;
  try {
    const aceRes = await fetch(ACE_CHAT_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${ACE_API_KEY}` },
      body: JSON.stringify({ model: 'gpt-4o', messages: [{ role: 'user', content: isZh ? zhPrompt : enPrompt }], temperature: 0.8 }),
    });
    const data = await aceRes.json();
    const raw = data?.choices?.[0]?.message?.content ?? '';
    parsed = JSON.parse(raw.replace(/```json\n?|```/g, '').trim());
  } catch {
    parsed = isZh ? fallbackZH(headline, body) : fallbackEN(headline, body);
  }

  return res.status(200).json({ lang, ...parsed });
}
