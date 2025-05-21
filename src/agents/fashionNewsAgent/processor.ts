import { NewsItem, FashionUpdate } from './types';

export async function processUpdate(item: NewsItem, mode: 'live' | 'historical'): Promise<FashionUpdate> {
  return {
    designerName: 'Sample Designer',
    brandName: 'Sample Brand',
    role: 'Creative Director',
    startYear: 2024,
    sourceUrl: item.link,
    mode,
  };
}
