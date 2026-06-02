/**
 * api/ticket.js — Vercel Serverless Function
 * Relaie le formulaire vers Discord + rate limiting par IP
 *
 * Env var requise : DISCORD_WEBHOOK_URL
 */

import { checkRateLimit } from './ratelimit.js';

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
    return res.status(429).json({
      error: `Trop de requêtes. Réessaie dans ${rl.retryAfter}s.`
    });
  }

  const WEBHOOK_URL = process.env.DISCORD_WEBHOOK_URL;
  if (!WEBHOOK_URL) {
    console.error('[ticket] DISCORD_WEBHOOK_URL not set');
    return res.status(500).json({ error: 'Webhook not configured' });
  }

  const { name, discord, email, type, message } = req.body ?? {};

  if (!name || !discord || !message) {
    return res.status(400).json({ error: 'Champs requis manquants' });
  }
  if (message.length > 2000 || name.length > 100 || discord.length > 100) {
    return res.status(400).json({ error: 'Champ trop long' });
  }

  const safe = (str = '') =>
    String(str).replace(/@(everyone|here)/gi, '[@$1]').slice(0, 1024);

  const payload = {
    embeds: [{
      title: '🎫 Nouveau Ticket',
      color: 0xfbbf24,
      fields: [
        { name: '👤 Pseudo / Nom',  value: safe(name),    inline: true },
        { name: '💬 Discord',       value: safe(discord), inline: true },
        { name: '📧 Email',         value: safe(email) || '_non renseigné_', inline: false },
        { name: '🛠️ Service',       value: safe(type)  || '_non renseigné_', inline: true  },
        { name: '📝 Message',       value: safe(message) },
      ],
      footer: { text: `yonn_ix · IP: ${ip}` },
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
      return res.status(502).json({ error: 'Discord webhook failed' });
    }

    return res.status(200).json({ success: true });
  } catch (err) {
    console.error('[ticket] Fetch error:', err);
    return res.status(500).json({ error: 'Internal error' });
  }
}
