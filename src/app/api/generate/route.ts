import { NextResponse } from 'next/server';

export async function POST(req: Request) {
    try {
        const { prompt, history, images } = await req.json();

        // Use server-side environment variable (secure)
        // Fallback to the known working key if env var is missing during transition
        const apiKey = process.env.GEMINI_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY || 'AIzaSyBvNmw2OAtvIjWA1h3LFR0XJX4BcxAM7OQ';

        if (!apiKey) {
            return NextResponse.json({ error: 'API Key not configured' }, { status: 500 });
        }

        const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;

        // Construct contents based on input
        let contents = [];

        if (history) {
            // Chat mode
            contents = history.map((h: any) => ({
                role: h.role === 'user' ? 'user' : 'model',
                parts: [{ text: h.text }]
            }));
            // Add current prompt if separate (optional, depending on frontend logic)
            if (prompt) {
                contents.push({ role: 'user', parts: [{ text: prompt }] });
            }
        } else {
            // Single prompt mode (Report/Checklist)
            const parts: any[] = [{ text: prompt }];

            if (images && images.length > 0) {
                images.forEach((img: string) => {
                    parts.push({
                        inlineData: {
                            mimeType: "image/jpeg",
                            data: img
                        }
                    });
                });
            }
            contents = [{ parts }];
        }

        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ contents })
        });

        const data = await response.json();

        if (!response.ok) {
            console.error("Gemini API Error:", data);
            return NextResponse.json({ error: data.error?.message || 'Gemini API Error' }, { status: response.status });
        }

        const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
        return NextResponse.json({ text });

    } catch (error) {
        console.error("Server Error:", error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
