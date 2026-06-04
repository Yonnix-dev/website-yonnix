import { kv } from '@vercel/kv';

export default async function handler(req, res) {
  if (req.method === 'GET') {
    return res.json(await kv.get('services_status') || null);
  }
  if (req.method === 'POST') {
    await kv.set('services_status', req.body);
    return res.json({ ok: true });
  }
}
