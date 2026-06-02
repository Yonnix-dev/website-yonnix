export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', 'https://website-yonnix.vercel.app');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const WEBHOOK_URL = process.env.DISCORD_WEBHOOK_URL;
  if (!WEBHOOK_URL) return res.status(500).json({ error: 'Webhook not configured' });

  const { name, discord, email, type, message } = req.body || {};

  if (!name || !discord || !message) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  // Basic anti-spam: validate field lengths
  if (message.length > 2000 || name.length > 100 || discord.length > 100) {
    return res.status(400).json({ error: 'Field too long' });
  }

  const payload = {
    embeds: [{
      title: '🎫 Nouveau Ticket',
      color: 0xfbbf24,
      fields: [
        { name: 'Pseudo', value: name, inline: true },
        { name: 'Discord', value: discord, inline: true },
        { name: 'Email', value: email || '—', inline: false },
        { name: 'Type de service', value: type || '—', inline: true },
        { name: 'Message', value: message, inline: false }
      ],
      footer: { text: 'website-yonnix.vercel.app' },
      timestamp: new Date().toISOString()
    }]
  };

  try {
    const response = await fetch(WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Discord webhook error:', response.status, errorText);
      return res.status(502).json({ error: 'Discord error', status: response.status });
    }

    return res.status(200).json({ success: true });
  } catch (err) {
    console.error('Ticket send error:', err);
    return res.status(500).json({ error: 'Internal error' });
  }
}
