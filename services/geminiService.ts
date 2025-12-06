import { ExtractedItem } from '../types';

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
 * Parses a receipt image using our secure backend API endpoint.
 * The API key is kept secure on the server side.
 */
export const parseReceiptImage = async (base64Data: string, mimeType: string): Promise<ExtractedItem[]> => {
  try {
    // Call our backend API endpoint instead of Gemini directly
    const response = await fetch('/api/parse-receipt', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        base64Data,
        mimeType,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
      throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
    }

    const data = await response.json();

    if (!data.items || !Array.isArray(data.items)) {
      throw new Error("Invalid response format from API");
    }

    return data.items as ExtractedItem[];

  } catch (error) {
    console.error("Error parsing receipt:", error);
    throw error;
  }
};