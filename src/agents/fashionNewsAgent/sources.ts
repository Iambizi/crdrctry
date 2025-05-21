// Import rss-parser in a way that works with both CommonJS and ES modules
import * as ParserModule from 'rss-parser';
const Parser = ParserModule.default || ParserModule;
import { NewsItem } from './types';

// Define interface for RSS feed items
interface RSSFeedItem {
  title?: string;
  link?: string;
  contentSnippet?: string;
  pubDate?: string;
  sourceName?: string;
}

// Create a new parser instance
const parser = new Parser();

/**
 * Extract a readable source name from a feed URL
 */
function getSourceNameFromUrl(url: string): string {
  const domainMap: Record<string, string> = {
    'wwd.com': 'WWD',
    'businessoffashion.com': 'Business of Fashion',
    'fashionista.com': 'Fashionista',
    'vogue.com': 'Vogue',
    'highsnobiety.com': 'Highsnobiety',
    'hypebeast.com': 'Hypebeast',
    'dazeddigital.com': 'Dazed',
    'thefashionlaw.com': 'The Fashion Law'
  };
  
  // Extract domain from URL
  try {
    const domain = new URL(url).hostname.replace('www.', '');
    return domainMap[domain] || domain;
  } catch {
    // Ignore parsing errors and return a default value
    return 'Unknown Source';
  }
}

export async function fetchSources(mode: 'live' | 'historical'): Promise<NewsItem[]> {
  // Different sources based on mode
  const sources = {
    live: [
      'https://wwd.com/feed/', // Women's Wear Daily
      'https://www.businessoffashion.com/feed/', // Business of Fashion
      'https://fashionista.com/feed/atom', // Fashionista
      'https://www.vogue.com/feed/rss', // Vogue
      'https://www.highsnobiety.com/feed/', // Highsnobiety
      'https://hypebeast.com/feed', // Hypebeast
      'https://www.dazeddigital.com/rss', // Dazed
      'https://www.thefashionlaw.com/feed/' // The Fashion Law
    ],
    historical: [
      'https://wwd.com/feed/', // Current feed can have some historical announcements
      'https://www.businessoffashion.com/feed/', // BoF often covers historical context
      'https://www.vogue.com/feed/rss', // Vogue archives
      'https://www.thefashionlaw.com/feed/' // The Fashion Law has good historical coverage
    ]
  };
  
  const feedUrls = sources[mode];
  let allItems: RSSFeedItem[] = [];
  
  // Fetch from all sources for the given mode
  for (const url of feedUrls) {
    try {
      console.log(`Fetching from ${url}...`);
      const feed = await parser.parseURL(url);
      
      // Add source information to each item based on URL
      const sourceName = getSourceNameFromUrl(url);
      const sourceItems = feed.items.map(item => ({
        ...item,
        sourceName
      }));
      
      allItems = [...allItems, ...sourceItems];
      console.log(`Successfully fetched ${sourceItems.length} items from ${sourceName}`);
    } catch (error) {
      console.error(`Error fetching from ${url}:`, error);
      // Continue with other sources even if one fails
    }
  }
  
  return allItems.map((item: RSSFeedItem) => ({
    source: item.sourceName ?? 'Unknown',
    title: item.title ?? '',
    link: item.link ?? '',
    content: item.contentSnippet ?? '',
    publishedAt: item.pubDate ?? '',
  }));
}
