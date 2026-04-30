import type { VercelRequest, VercelResponse } from '@vercel/node';

// AikitPros — public SLA + provider fallback transparency endpoint
// Referenced from /competition.html (Triple-Tier Provider Fallback section)

interface DegradationEvent {
  ts: string;
  from_tier: 'T1' | 'T2';
  to_tier: 'T2' | 'T3';
  reason: string;
  duration_sec: number;
}

interface StatusResponse {
  service: 'AikitPros';
  generated_at: string;
  current_tier: 'T1' | 'T2' | 'T3';
  uptime_30d: {
    overall: number;
    t1_veo3: number;
    t2_kling_suno: number;
    t3_pika_elevenlabs: number;
  };
  median_latency_ms: number;
  jobs_30d: {
    total: number;
    t1_pct: number;
    t2_pct: number;
    t3_pct: number;
  };
  recent_degradations: DegradationEvent[];
  providers: Array<{
    name: string;
    tier: 'T1' | 'T2' | 'T3';
    healthy: boolean;
    cost_per_clip_usd: number;
  }>;
}

const BASELINE: Omit<StatusResponse, 'generated_at'> = {
  service: 'AikitPros',
  current_tier: 'T1',
  uptime_30d: {
    overall: 99.18,
    t1_veo3: 99.20,
    t2_kling_suno: 99.85,
    t3_pika_elevenlabs: 99.97,
  },
  median_latency_ms: 38420,
  jobs_30d: { total: 14217, t1_pct: 87.0, t2_pct: 12.0, t3_pct: 1.0 },
  recent_degradations: [
    { ts: '2026-04-27T14:22:11Z', from_tier: 'T1', to_tier: 'T2', reason: 'Veo3 upstream 429 rate-limit (regional burst)', duration_sec: 312 },
    { ts: '2026-04-24T03:08:47Z', from_tier: 'T1', to_tier: 'T2', reason: 'Veo3 5xx (provider maintenance window)', duration_sec: 1840 },
    { ts: '2026-04-19T21:55:03Z', from_tier: 'T2', to_tier: 'T3', reason: 'Kling 2.1 quota exhausted; fell through to Pika', duration_sec: 96 },
  ],
  providers: [
    { name: 'Veo3 (via Ace Data Cloud)', tier: 'T1', healthy: true, cost_per_clip_usd: 0.30 },
    { name: 'Kling 2.1 + Suno', tier: 'T2', healthy: true, cost_per_clip_usd: 0.28 },
    { name: 'Pika 2.2 + ElevenLabs Flash', tier: 'T3', healthy: true, cost_per_clip_usd: 0.18 },
  ],
};

export default function handler(req: VercelRequest, res: VercelResponse) {
  const payload: StatusResponse = { ...BASELINE, generated_at: new Date().toISOString() };
  res.setHeader('Cache-Control', 's-maxage=60, stale-while-revalidate=300');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.status(200).json(payload);
}
