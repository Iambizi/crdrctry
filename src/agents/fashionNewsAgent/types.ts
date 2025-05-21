export interface NewsItem {
  source: string;
  title: string;
  link: string;
  content: string;
  publishedAt: string;
}

export interface FashionUpdate {
  designerName: string;
  brandName: string;
  role: string;
  startYear: number;
  sourceUrl: string;
  mode: 'live' | 'historical';
}

export interface VerificationResult {
  isValid: boolean;
  confidenceScore: number;
}
