/**
 * api/ticket.js — Relaie le formulaire vers Discord + sauvegarde dans Redis
 *
 * Env vars requises : DISCORD_WEBHOOK_URL
 */
import { checkRateLimit } from './ratelimit.js';
import { Redis } from '@upstash/redis';

const redis = Redis.fromEnv();
const TICKETS_KEY = 'tickets_list';

async function getTickets() {
  const raw = await redis.get(TICKETS_KEY);
  if (!raw) return [];
  try { return typeof raw === 'string' ? JSON.parse(raw) : raw; }
  catch { return []; }
}

function generateId(tickets) {
  if (!tickets.length) return 'TK-001';
  const nums = tickets.map(t => parseInt(t.id.replace('TK-', ''), 10)).filter(n => !isNaN(n));
  const next = Math.max(...nums) + 1;
  return 'TK-' + String(next).padStart(3, '0');
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', 'https://website-yonnix.vercel.app');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  // Rate limiting
  const ip =
    req.headers['x-forwarded-for']?.split(',')[0].trim() ||
    req.headers['x-real-ip'] ||
    req.socket?.remoteAddress ||
    'unknown';

  const rl = checkRateLimit(ip);
  res.setHeader('X-RateLimit-Remaining', rl.remaining);
  if (!rl.allowed) {
    res.setHeader('Retry-After', rl.retryAfter);
    return res.status(429).json({ error: `Trop de requêtes. Réessaie dans ${rl.retryAfter}s.` });
  }

  const WEBHOOK_URL = process.env.DISCORD_WEBHOOK_URL;
  if (!WEBHOOK_URL) {
    console.error('[ticket] DISCORD_WEBHOOK_URL not set');
    return res.status(500).json({ error: 'Webhook not configured' });
  }

  const { name, discord, email, type, message } = req.body ?? {};

  if (!name || !discord || !message)
    return res.status(400).json({ error: 'Champs requis manquants' });
  if (message.length > 2000 || name.length > 100 || discord.length > 100)
    return res.status(400).json({ error: 'Champ trop long' });

  const safe = (str = '') =>
    String(str).replace(/@(everyone|here)/gi, '[@$1]').slice(0, 1024);

  // ── 1. Sauvegarder dans Redis ──────────────────────────────────────────
  const tickets = await getTickets();
  const newTicket = {
    id:      generateId(tickets),
    name:    safe(name),
    discord: safe(discord),
    email:   safe(email) || '',
    type:    safe(type)  || 'Contact',
    msg:     safe(message),
    date:    new Date().toLocaleDateString('fr-FR'),
    status:  'open',
  };
  tickets.unshift(newTicket); // plus récent en premier
  await redis.set(TICKETS_KEY, JSON.stringify(tickets));

  // ── 2. Envoyer sur Discord ─────────────────────────────────────────────
  const payload = {
    embeds: [{
      title: `🎫 Nouveau Ticket — ${newTicket.id}`,
      color: 0xfbbf24,
      fields: [
        { name: '👤 Pseudo / Nom',  value: safe(name),    inline: true },
        { name: '💬 Discord',       value: safe(discord), inline: true },
        { name: '📧 Email',         value: safe(email) || '_non renseigné_', inline: false },
        { name: '🛠️ Service',       value: safe(type)  || '_non renseigné_', inline: true  },
        { name: '📝 Message',       value: safe(message) },
      ],
      footer: { text: `yonn_ix · ${newTicket.id} · IP: ${ip}` },
      timestamp: new Date().toISOString(),
    }],
  };

  try {
    const response = await fetch(WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!response.ok) {
      const errorText = await response.text();
      console.error('[ticket] Discord error:', response.status, errorText);
      // On retourne quand même succès car le ticket est déjà sauvé dans Redis
    }
  } catch (err) {
    console.error('[ticket] Discord fetch error:', err);
  }

  return res.status(200).json({ success: true, id: newTicket.id });
}
