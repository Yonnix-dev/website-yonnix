import { Redis } from '@upstash/redis';
const redis = Redis.fromEnv();

export default async function handler(req, res) {
  if (req.method === 'GET') {
    return res.json(await redis.get('services_status') || null);
  }
  if (req.method === 'POST') {
    await redis.set('services_status', req.body);
    return res.json({ ok: true });
  }
}
