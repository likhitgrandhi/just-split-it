import { GoogleGenAI, Type, Schema } from "@google/genai";
import { ExtractedItem } from '../types';

// Initialize the client lazily to prevent top-level crashes
let ai: GoogleGenAI | null = null;

const getAiClient = () => {
  if (!ai) {
    const apiKey = process.env.API_KEY;
    if (!apiKey) {
      console.error("Gemini API Key is missing!");
      throw new Error("Gemini API Key is missing");
    }
    ai = new GoogleGenAI({ apiKey });
  }
  return ai;
};

/**
 * Helper to convert a File object to a Base64 string.
 */
export const fileToGenerativePart = async (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = reader.result as string;
      // Remove the data URL prefix (e.g., "data:image/jpeg;base64,")
      const base64Data = base64String.split(',')[1];
      resolve(base64Data);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

/**
 * Parses a receipt image using Gemini 2.5 Flash to extract items and prices.
 */
export const parseReceiptImage = async (base64Data: string, mimeType: string): Promise<ExtractedItem[]> => {
  try {
    const modelId = 'gemini-2.5-flash-lite-preview-09-2025';

    const responseSchema: Schema = {
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

    const response = await getAiClient().models.generateContent({
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

    const jsonText = response.text;
    if (!jsonText) {
      throw new Error("No data returned from Gemini.");
    }

    const data = JSON.parse(jsonText) as ExtractedItem[];
    return data;

  } catch (error) {
    console.error("Error parsing receipt with Gemini:", error);
    throw error;
  }
};