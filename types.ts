export interface ReceiptItem {
  id: string;
  name: string;
  price: number;
  assignedTo: string[]; // Array of user IDs
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