/**
 * api/ticket.js — Vercel Serverless Function
 * Relaie le formulaire de contact vers Discord via webhook sécurisé.
 *
 * Variable d'environnement requise dans Vercel Dashboard :
 *   DISCORD_WEBHOOK_URL = https://discord.com/api/webhooks/...
 */

export default async function handler(req, res) {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', 'https://website-yonnix.vercel.app');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const WEBHOOK_URL = process.env.DISCORD_WEBHOOK_URL;
  if (!WEBHOOK_URL) {
    console.error('[ticket] DISCORD_WEBHOOK_URL not set');
    return res.status(500).json({ error: 'Webhook not configured' });
  }

  const { name, discord, email, type, message } = req.body ?? {};

  // Validation
  if (!name || !discord || !message) {
    return res.status(400).json({ error: 'Missing required fields' });
  }
  if (message.length > 2000 || name.length > 100 || discord.length > 100) {
    return res.status(400).json({ error: 'Field too long' });
  }

  // Sanitize : empêche les pings @everyone / @here
  const safe = (str = '') =>
    String(str).replace(/@(everyone|here)/gi, '[@$1]').slice(0, 1024);

  const payload = {
    embeds: [{
      title: '\uD83C\uDFAB Nouveau Ticket',
      color: 0xfbbf24,
      fields: [
        { name: '\uD83D\uDC64 Pseudo / Nom',   value: safe(name),    inline: true  },
        { name: '\uD83D\uDCAC Discord',        value: safe(discord), inline: true  },
        { name: '\uD83D\uDCE7 Email',          value: safe(email) || '_non renseigné_', inline: false },
        { name: '\uD83D\uDEE0\uFE0F Service',  value: safe(type)  || '_non renseigné_', inline: true  },
        { name: '\uD83D\uDCDD Message',        value: safe(message) },
      ],
      footer: { text: 'yonn_ix \u00b7 website-yonnix.vercel.app' },
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
