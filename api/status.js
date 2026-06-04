import { Redis } from '@upstash/redis';
const redis = Redis.fromEnv();

export default async function handler(req, res) {
  if (req.method === 'GET') {
    const data = await redis.get('services_status');
    return res.json(data || null);
  }
  if (req.method === 'POST') {
    // req.body est déjà parsé en objet par Vercel, on le re-stringify pour Redis
    const payload = typeof req.body === 'string' ? req.body : JSON.stringify(req.body);
    await redis.set('services_status', payload);
    return res.json({ ok: true });
  }
  return res.status(405).json({ error: 'Method not allowed' });
}
