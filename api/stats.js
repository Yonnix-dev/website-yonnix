export default async function handler(req, res) {
    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const response = await fetch(
            `https://api.vercel.com/v1/analytics/timeseries?projectId=prj_OWVGeh9fxLPNMz0MOkleMaUsfj7A&limit=30`,
            {
                headers: {
                    'Authorization': `Bearer ${process.env.VERCEL_TOKEN}`,
                    'Content-Type': 'application/json'
                }
            }
        );

        if (!response.ok) {
            throw new Error(`Vercel API error: ${response.status}`);
        }

        const data = await response.json();
        res.status(200).json(data);
    } catch (error) {
        console.error('Stats fetch error:', error);
        res.status(500).json({ 
            error: 'Failed to fetch stats',
            message: error.message 
        });
    }
}
