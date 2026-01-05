
export interface ProcessedImage {
  previewUrl: string;
  base64Data: string;
  mimeType: string;
}

export interface EditResult {
  imageUrl?: string;
  text?: string;
}

export interface EditHistoryItem {
  id: string;
  imageUrl: string;
  prompt: string;
  timestamp: number;
}

export enum AppStatus {
  IDLE = 'IDLE',
  PROCESSING = 'PROCESSING',
  SUCCESS = 'SUCCESS',
  ERROR = 'ERROR',
  OFFLINE = 'OFFLINE'
}

export type Resolution = '1K' | '2K' | '4K';