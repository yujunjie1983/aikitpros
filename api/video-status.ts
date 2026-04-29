import type { VercelRequest, VercelResponse } from '@vercel/node';

const ACE_TASKS_API = 'https://api.acedata.cloud/wan/tasks';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { task_id } = req.body || {};
  if (!task_id) return res.status(400).json({ error: 'task_id is required' });

  // Demo mode
  if (task_id.startsWith('demo-')) {
    return res.status(200).json({
      success: true,
      state: 'completed',
      task_id,
      video_url: 'https://www.w3schools.com/html/mov_bbb.mp4',
      demo: true
    });
  }

  const token = process.env.ACE_API_KEY;
  if (!token) return res.status(500).json({ error: 'ACE_API_KEY not configured' });

  try {
    const response = await fetch(ACE_TASKS_API, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify({ task_id, action: 'retrieve' }),
    });
    const data = await response.json();
    return res.status(200).json({
      success: true,
      state: data.state,
      task_id: data.task_id,
      video_url: data.video_url || null,
      video_id: data.video_id || null,
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Failed to check video status' });
  }
}
