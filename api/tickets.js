import { kv } from '@vercel/kv';

export default async function handler(req, res) {
  if (req.method === 'GET') {
    const tickets = await kv.get('tickets') || [];
    return res.json(tickets);
  }
  if (req.method === 'PATCH') {
    const { id, status } = req.body;
    const tickets = await kv.get('tickets') || [];
    const t = tickets.find(t => t.id === id);
    if (t) t.status = status;
    await kv.set('tickets', tickets);
    return res.json({ ok: true });
  }
  if (req.method === 'DELETE') {
    const { id } = req.body;
    let tickets = await kv.get('tickets') || [];
    tickets = tickets.filter(t => t.id !== id);
    await kv.set('tickets', tickets);
    return res.json({ ok: true });
  }
}
