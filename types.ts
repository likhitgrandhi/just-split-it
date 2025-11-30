export interface ReceiptItem {
  id: string;
  name: string;
  price: number;
  assignedTo: string[]; // Array of user IDs
  billName?: string; // Optional bill name for grouping
}

export interface User {
  id: string;
  name: string;
  color: string;
}

export interface SplitResult {
  userId: string;
  total: number;
}

export enum AppStep {
  UPLOAD = 'UPLOAD',
  USERS = 'USERS',
  SPLIT = 'SPLIT',
  SHARE = 'SHARE'
}

// Gemini API Response Schema Type
export interface ExtractedItem {
  name: string;
  price: number;
}

// Uploaded Bill Type for multiple bill management
export interface UploadedBill {
  id: string;
  fileName: string;
  items: ReceiptItem[];
  uploadedAt: Date;
  imagePreview: string; // Base64 or blob URL for thumbnail
}