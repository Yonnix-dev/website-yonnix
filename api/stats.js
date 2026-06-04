export default async function handler(req, res) {
  // CORS ouvert sur toutes les origines Vercel + local
  const origin = req.headers['origin'] || '';
  const allowed = [
    'https://website-yonnix.vercel.app',
    'http://localhost:3000',
    'http://localhost:5500',
  ];
  if (allowed.includes(origin) || origin.endsWith('.vercel.app')) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  } else {
    res.setHeader('Access-Control-Allow-Origin', 'https://website-yonnix.vercel.app');
  }
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Access-Control-Allow-Credentials', 'true');

  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  const authHeader = req.headers['authorization'];
  const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;

  if (!ADMIN_PASSWORD) {
    // Pas de password configuré → retourne quand même 200 avec données vides
    // pour ne pas bloquer l'accès admin
    return res.status(200).json({
      last30days: null,
      last7days: null,
      topPages: null,
      fetchedAt: new Date().toISOString(),
      warning: 'ADMIN_PASSWORD not set'
    });
  }

  if (authHeader !== `Bearer ${ADMIN_PASSWORD}`) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const VERCEL_TOKEN = process.env.VERCEL_TOKEN;
  const PROJECT_ID = 'prj_OWVGeh9fxLPNMz0MOkleMaUsfj7A';

  if (!VERCEL_TOKEN) return res.status(200).json({
    last30days: null, last7days: null, topPages: null,
    fetchedAt: new Date().toISOString(),
    warning: 'VERCEL_TOKEN not configured'
  });

  try {
    const now = new Date();
    const from30d = new Date(now - 30 * 24 * 60 * 60 * 1000).toISOString();
    const from7d  = new Date(now - 7  * 24 * 60 * 60 * 1000).toISOString();
    const headers = {
      'Authorization': `Bearer ${VERCEL_TOKEN}`,
      'Content-Type': 'application/json'
    };
    const [web30, web7, pageviews] = await Promise.allSettled([
      fetch(`https://api.vercel.com/v1/analytics/timeseries?projectId=${PROJECT_ID}&from=${from30d}&limit=30`, { headers }),
      fetch(`https://api.vercel.com/v1/analytics/timeseries?projectId=${PROJECT_ID}&from=${from7d}&limit=7`, { headers }),
      fetch(`https://api.vercel.com/v1/analytics/pages?projectId=${PROJECT_ID}&limit=10`, { headers })
    ]);
    const parse = async (result) => {
      if (result.status === 'rejected') return null;
      const r = result.value;
      if (!r.ok) return null;
      return r.json().catch(() => null);
    };
    const [data30, data7, pagesData] = await Promise.all([parse(web30), parse(web7), parse(pageviews)]);
    res.status(200).json({ last30days: data30, last7days: data7, topPages: pagesData, fetchedAt: new Date().toISOString() });
  } catch (err) {
    console.error('Stats error:', err);
    res.status(500).json({ error: 'Failed to fetch stats', message: err.message });
  }
}
