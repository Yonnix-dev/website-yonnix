/**
 * api/tickets.js — CRUD tickets via Upstash Redis
 * GET    → liste tous les tickets
 * PATCH  → change le status d'un ticket  { id, status }
 * DELETE → supprime un ticket            { id }
 */
import { Redis } from '@upstash/redis';
const redis = Redis.fromEnv();
const KEY = 'tickets_list';

async function getTickets() {
  const raw = await redis.get(KEY);
  if (!raw) return [];
  try { return typeof raw === 'string' ? JSON.parse(raw) : raw; }
  catch { return []; }
}

async function saveTickets(tickets) {
  await redis.set(KEY, JSON.stringify(tickets));
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', 'https://website-yonnix.vercel.app');
  res.setHeader('Access-Control-Allow-Methods', 'GET, PATCH, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(204).end();

  // GET — liste
  if (req.method === 'GET') {
    const tickets = await getTickets();
    return res.json(tickets);
  }

  // PATCH — changer le statut
  if (req.method === 'PATCH') {
    const { id, status } = req.body ?? {};
    if (!id || !status) return res.status(400).json({ error: 'id et status requis' });
    const tickets = await getTickets();
    const t = tickets.find(t => t.id === id);
    if (!t) return res.status(404).json({ error: 'Ticket introuvable' });
    t.status = status;
    await saveTickets(tickets);
    return res.json({ ok: true });
  }

  // DELETE — supprimer
  if (req.method === 'DELETE') {
    const { id } = req.body ?? {};
    if (!id) return res.status(400).json({ error: 'id requis' });
    const tickets = await getTickets();
    const filtered = tickets.filter(t => t.id !== id);
    await saveTickets(filtered);
    return res.json({ ok: true });
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
