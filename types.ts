export interface ReceiptItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  assignedTo: string[]; // Array of user IDs
  splitGroupId?: string; // Groups items that were split from the same original item
}

export interface User {
  id: string;
  name: string;
  color: string;
  createdBy?: string; // ID of the user who created this user (for manual entry permissions)
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
  quantity: number;
}