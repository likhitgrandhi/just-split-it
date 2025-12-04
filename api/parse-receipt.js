// import { GoogleGenAI, Type, Schema } from "@google/genai";

/**
 * Vercel Serverless Function to parse receipt images using Gemini API
 * This keeps the API key secure on the server side
 */
export default async function handler(req, res) {
    // console.log('API Request received:', req.method);
    // console.log('Environment check - GEMINI_API_KEY exists:', !!process.env.GEMINI_API_KEY);

    // Enable CORS for your frontend
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    // Handle preflight requests
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    // Only allow POST requests
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const { base64Data, mimeType } = req.body;

        // Validate input
        if (!base64Data || !mimeType) {
            return res.status(400).json({
                error: 'Missing required fields: base64Data and mimeType'
            });
        }

        // Manual .env.local loading fallback for local dev
        if (!process.env.GEMINI_API_KEY) {
            try {
                const fs = await import('fs');
                const path = await import('path');
                const envPath = path.resolve(process.cwd(), '.env.local');
                if (fs.existsSync(envPath)) {
                    // console.log('Loading .env.local manually');
                    const envContent = fs.readFileSync(envPath, 'utf8');
                    const lines = envContent.split('\n');
                    for (const line of lines) {
                        const match = line.match(/^([^=]+)=(.*)$/);
                        if (match) {
                            const key = match[1].trim();
                            const value = match[2].trim();
                            if (key === 'GEMINI_API_KEY') {
                                process.env.GEMINI_API_KEY = value;
                                break;
                            }
                        }
                    }
                }
            } catch (e) {
                console.error('Failed to load .env.local', e);
            }
        }

        // Get API key from environment variable (server-side only)
        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) {
            console.error('GEMINI_API_KEY not found in environment variables');
            return res.status(500).json({
                error: 'Server configuration error'
            });
        }

        // Initialize the Gemini AI client
        const { GoogleGenAI, Type, Schema } = await import("@google/genai");
        const ai = new GoogleGenAI({ apiKey });
        const modelId = 'gemini-2.5-flash-lite-preview-09-2025';

        // Define the response schema
        const responseSchema = {
            type: Type.ARRAY,
            items: {
                type: Type.OBJECT,
                properties: {
                    name: {
                        type: Type.STRING,
                        description: "The name of the item on the bill.",
                    },
                    price: {
                        type: Type.NUMBER,
                        description: "The TOTAL price of the item (quantity * unit price). Do not include currency symbols.",
                    },
                    quantity: {
                        type: Type.NUMBER,
                        description: "The quantity of this item. Default to 1 if not specified on the receipt.",
                    },
                },
                required: ["name", "price", "quantity"],
                propertyOrdering: ["name", "price", "quantity"]
            },
        };

        // Call Gemini API
        const response = await ai.models.generateContent({
            model: modelId,
            contents: {
                parts: [
                    {
                        inlineData: {
                            mimeType: mimeType,
                            data: base64Data,
                        },
                    },
                    {
                        text: "Analyze this receipt. Extract all line items with their prices and quantities. For each item: 1) Extract the quantity (default to 1 if not shown), 2) Extract the TOTAL price (quantity * unit price), NOT the unit price. Ignore subtotal, tax, and total lines unless they are specific service charges. Return a JSON array.",
                    },
                ],
            },
            config: {
                responseMimeType: "application/json",
                responseSchema: responseSchema,
                temperature: 0.1, // Low temperature for factual extraction
            },
        });

        let jsonText = response.text;
        if (typeof jsonText === 'function') {
            jsonText = jsonText();
        }

        if (!jsonText) {
            return res.status(500).json({
                error: 'No data returned from Gemini API'
            });
        }

        const data = JSON.parse(jsonText);

        // Return the extracted items
        return res.status(200).json({ items: data });

    } catch (error) {
        console.error('Error parsing receipt with Gemini:', error);
        return res.status(500).json({
            error: 'Failed to parse receipt',
            message: error.message
        });
    }
}
