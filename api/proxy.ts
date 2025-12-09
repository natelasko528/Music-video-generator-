// Vercel Serverless Function - API Proxy
// This keeps API keys server-side and never exposes them to the client

export default async function handler(req: any, res: any) {
    // CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
        return res.status(500).json({ error: 'API key not configured' });
    }

    try {
        const { action, payload } = req.body;

        if (!action) {
            return res.status(400).json({ error: 'Action required' });
        }

        // For now, we'll pass through to the Google GenAI SDK
        // In production, you'd want to validate and sanitize inputs here
        const { GoogleGenAI } = await import('@google/genai');
        const ai = new GoogleGenAI({ apiKey });

        let result;
        switch (action) {
            case 'generateContent':
                result = await ai.models.generateContent(payload);
                break;
            case 'generateVideos':
                result = await ai.models.generateVideos(payload);
                break;
            case 'generateImages':
                result = await ai.models.generateImages(payload);
                break;
            case 'getVideosOperation':
                result = await ai.operations.getVideosOperation(payload);
                break;
            default:
                return res.status(400).json({ error: 'Invalid action' });
        }

        return res.status(200).json(result);
    } catch (error) {
        console.error('Proxy error:', error);
        return res.status(500).json({ 
            error: 'Internal server error',
            message: error instanceof Error ? error.message : 'Unknown error'
        });
    }
}
