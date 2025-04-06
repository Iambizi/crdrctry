import * as cheerio from 'cheerio';
import axios from 'axios';
import * as fs from 'fs';
import * as path from 'path';
import fashionGenealogyData from '../src/data/fashionGenealogy';

// TYPES
interface FashionData {
  brands: Array<{ id: string; name: string }>;
  designers: Array<{ id: string; name: string }>;
  tenures: Array<{ brandId: string; designerId: string }>;
}

interface EnrichmentSource {
  name: string;
  url: string;
}

interface ExtractedData {
  role?: string;
  startYear?: number;
  endYear?: number;
  confidence: number;
}

interface EnrichmentSuggestion {
  type: 'brand_association' | 'tenure';
  brandName?: string;
  designerName?: string;
  role?: string;
  startYear?: number;
  endYear?: number;
  confidence: number;
  sources: (EnrichmentSource & ExtractedData)[];
}

interface EnrichmentStatus {
  entityId: string;
  entityName: string;
  entityType: 'brand' | 'designer';
  status: 'verified' | 'pending' | 'failed';
  lastChecked: string;
  sourcesChecked: string[];
  failureReason?: string;
}

interface EnrichedRelationship {
  brandId: string;
  brandName: string;
  tenures: Array<{
    designerId: string;
    designerName: string;
    role: string;
    startYear: number;
    endYear?: number;
    confidence: number;
    sources: (EnrichmentSource & ExtractedData)[];
    verificationStatus: 'verified' | 'pending' | 'failed';
  }>;
}

interface ScraperSelectors {
  title: string[];
  content: string[];
  date: string[];
  role: string[];
}

interface Scraper {
  name: string;
  url: (name: string) => string;
  selectors: ScraperSelectors;
  extractContent: ($: cheerio.CheerioAPI) => string;
}

// FILE PATHS
const PATHS = {
  statusTracker: './scripts/statusTracker.json',
  knowledgeBase: './scripts/enrichedRelationships.json',
};

// TEXT PROCESSING
const ROLE_PATTERNS = [
  /(?:appointed|named|became|joined|serves? as|worked as|current|former)\s+((?:creative|artistic|design|fashion|chief)\s+(?:director|designer|head|officer))/i,
  /((?:creative|artistic|design|fashion|chief)\s+(?:director|designer|head|officer))\s+(?:at|for|of)/i,
  /(?:lead|head)\s+(?:designer|creative)/i,
  /(?:founder|co-founder|founding)\s+(?:and\s+)?(?:creative\s+)?(?:director|designer)/i
];

const DATE_PATTERNS = [
  /(?:from|since|in)\s+(\d{4})(?:\s*(?:to|until|-)?\s*(\d{4}|\bpresent\b))?/i,
  /(\d{4})\s*(?:-|to|until)\s*(\d{4}|\bpresent\b)/i,
  /(\d{4})\s*:\s*[^.;,]*(?:joined|appointed|became)/i,
  /(?:started|founded|launched|established)\s+(?:in\s+)?(\d{4})/i
];

// SCRAPERS
const scrapers: Scraper[] = [
  {
    name: 'Business of Fashion',
    url: (name: string) => `https://www.businessoffashion.com/search/?q=${encodeURIComponent(name)}`,
    selectors: {
      title: ['.article-card__title', '.article__title', '.article__headline', '.search-result__title'],
      content: ['.article-card__description', '.article__body p', '.article__content p', '.search-result__excerpt'],
      date: ['.article-card__meta time', '.article__meta time', '.article__date', '.search-result__date'],
      role: ['.article-card__tag', '.article__tag', '.article__category', '.search-result__tag']
    } as ScraperSelectors,
    extractContent: function($: cheerio.CheerioAPI): string {
      const titles = this.selectors.title.map((selector: string) => 
        $(selector).map((_, el) => $(el).text()).get()
      ).flat();
      
      const content = this.selectors.content.map((selector: string) =>
        $(selector).map((_, el) => $(el).text()).get()
      ).flat();

      const dates = this.selectors.date.map((selector: string) =>
        $(selector).map((_, el) => $(el).text()).get()
      ).flat();

      const roles = this.selectors.role.map((selector: string) =>
        $(selector).map((_, el) => $(el).text()).get()
      ).flat();

      return [...titles, ...content, ...dates, ...roles].join('\n');
    },
  },
  {
    name: 'Vogue',
    url: (name: string) => `https://www.vogue.com/search?q=${encodeURIComponent(name)}`,
    selectors: {
      title: ['.summary-item__hed', '.article__title', '.headline', '.search-result__title'],
      content: ['.summary-item__dek', '.article__body p', '.article__content p', '.search-result__excerpt'],
      date: ['.summary-item__timestamp', '.article__date', '.publish-date', '.search-result__date'],
      role: ['.summary-item__tag', '.article__tag', '.category-tag', '.search-result__tag']
    } as ScraperSelectors,
    extractContent: function($: cheerio.CheerioAPI): string {
      const titles = this.selectors.title.map((selector: string) => 
        $(selector).map((_, el) => $(el).text()).get()
      ).flat();
      
      const content = this.selectors.content.map((selector: string) =>
        $(selector).map((_, el) => $(el).text()).get()
      ).flat();

      const dates = this.selectors.date.map((selector: string) =>
        $(selector).map((_, el) => $(el).text()).get()
      ).flat();

      const roles = this.selectors.role.map((selector: string) =>
        $(selector).map((_, el) => $(el).text()).get()
      ).flat();

      return [...titles, ...content, ...dates, ...roles].join('\n');
    },
  },
  {
    name: 'WWD',
    url: (name: string) => `https://wwd.com/search/${encodeURIComponent(name)}/`,
    selectors: {
      title: ['.article-title', '.headline', '.search-result__title', '.article__headline'],
      content: ['.article-excerpt', '.article-content p', '.search-result__excerpt', '.article__content p'],
      date: ['.article-date', '.publish-date', '.search-result__date', '.article__date'],
      role: ['.article-tag', '.category-tag', '.search-result__tag', '.article__category']
    } as ScraperSelectors,
    extractContent: function($: cheerio.CheerioAPI): string {
      const titles = this.selectors.title.map((selector: string) => 
        $(selector).map((_, el) => $(el).text()).get()
      ).flat();
      
      const content = this.selectors.content.map((selector: string) =>
        $(selector).map((_, el) => $(el).text()).get()
      ).flat();

      const dates = this.selectors.date.map((selector: string) =>
        $(selector).map((_, el) => $(el).text()).get()
      ).flat();

      const roles = this.selectors.role.map((selector: string) =>
        $(selector).map((_, el) => $(el).text()).get()
      ).flat();

      return [...titles, ...content, ...dates, ...roles].join('\n');
    },
  }
];

// REQUEST HANDLING
interface RequestQueueItem {
  url: string;
  retryCount: number;
  lastAttempt: number;
}

class RequestQueue {
  private queue: Map<string, RequestQueueItem> = new Map();
  private maxRetries = 3;
  private baseDelay = 5000; // 5 seconds base delay

  async fetch(url: string): Promise<string> {
    const queueItem = this.queue.get(url) || { url, retryCount: 0, lastAttempt: 0 };
    
    // Check if we need to wait based on rate limiting
    const now = Date.now();
    const timeSinceLastAttempt = now - queueItem.lastAttempt;
    const delay = Math.max(0, this.getDelay(queueItem.retryCount) - timeSinceLastAttempt);
    
    if (delay > 0) {
      await new Promise(resolve => setTimeout(resolve, delay));
    }

    try {
      queueItem.lastAttempt = Date.now();
      const response = await axios.get(url);
      this.queue.delete(url); // Success, remove from queue
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.status === 429 && queueItem.retryCount < this.maxRetries) {
        queueItem.retryCount++;
        this.queue.set(url, queueItem);
        console.log(`Rate limited for ${url}, retry ${queueItem.retryCount} of ${this.maxRetries}`);
        return this.fetch(url); // Retry with exponential backoff
      }
      throw error;
    }
  }

  private getDelay(retryCount: number): number {
    return this.baseDelay * Math.pow(2, retryCount); // Exponential backoff
  }
}

const requestQueue = new RequestQueue();

// DATA FETCHING
async function fetchContent(url: string): Promise<string> {
  try {
    const html = await requestQueue.fetch(url);
    const $ = cheerio.load(html);
    return $('body').html() || '';
  } catch (error) {
    if (axios.isAxiosError(error)) {
      console.error(`Failed to fetch content from ${url}:`, error.message);
    } else {
      console.error(`Unexpected error while fetching ${url}:`, error);
    }
    return '';
  }
}

// FILE UTILITIES
function loadJsonFile<T>(filepath: string, defaultValue: T): T {
  try {
    const content = fs.readFileSync(filepath, 'utf-8');
    return JSON.parse(content) as T;
  } catch {
    return defaultValue;
  }
}

function saveJsonFile<T>(filepath: string, data: T): void {
  const dir = path.dirname(filepath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  fs.writeFileSync(filepath, JSON.stringify(data, null, 2));
}

// FETCH UTILITIES
async function fetchWithFallback(name: string, scraper: Scraper): Promise<{ content: string; data: ExtractedData } | null> {
  try {
    const html = await fetchContent(scraper.url(name));
    const $ = cheerio.load(html) as cheerio.CheerioAPI;
    
    // Get all content pieces
    const content = scraper.extractContent($);
    const validContent = content.trim();

    if (!validContent) {
      console.warn(`[${scraper.name}] No relevant content found for "${name}". Selectors may be outdated.`);
      return null;
    }

    // Extract structured data
    const data = extractStructuredData(validContent);
    return { content: validContent, data };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.warn(`[${scraper.name}] Failed to fetch data for "${name}":`, errorMessage);
    return null;
  }
}

// ENRICHMENT GENERATOR
async function generateEnrichmentSuggestions(): Promise<EnrichmentSuggestion[]> {
  const suggestions: EnrichmentSuggestion[] = [];
  const { brands, designers, tenures } = fashionGenealogyData as FashionData;

  // Load existing status and relationships
  const statusTracker = loadJsonFile<EnrichmentStatus[]>(PATHS.statusTracker, []);
  const knowledgeBase = loadJsonFile<EnrichedRelationship[]>(PATHS.knowledgeBase, []);

  const processEntity = async (
    type: 'brand_association' | 'tenure',
    name: string,
    id: string
  ): Promise<EnrichmentSuggestion | null> => {
    // Check if already processed
    const existingStatus = statusTracker.find(s => s.entityId === id);
    if (existingStatus?.status === 'verified') {
      console.log(`✓ ${name} already verified, skipping...`);
      return null;
    }

    console.log(`\n🔍 Processing ${type === 'tenure' ? 'designer' : 'brand'}: ${name}`);
    
    const sourceResults = await Promise.all(
      scrapers.map(async scraper => {
        const result = await fetchWithFallback(name, scraper);
        return result ? {
          name: scraper.name,
          url: scraper.url(name),
          role: result.data.role,
          startYear: result.data.startYear,
          endYear: result.data.endYear,
          confidence: result.data.confidence
        } : null;
      })
    );

    const validSources = sourceResults.filter(Boolean) as (EnrichmentSource & ExtractedData)[];
    
    // Calculate overall confidence and aggregate data
    const overallConfidence = validSources.reduce((acc, src) => acc + src.confidence, 0) / scrapers.length;
    const mostConfidentSource = validSources.sort((a, b) => b.confidence - a.confidence)[0];

    const newStatus: EnrichmentStatus = {
      entityId: id,
      entityName: name,
      entityType: type === 'tenure' ? 'designer' : 'brand',
      status: validSources.length > 0 ? 'pending' : 'failed',
      lastChecked: new Date().toISOString(),
      sourcesChecked: scrapers.map(s => s.name),
      failureReason: validSources.length === 0 ? 'No valid sources found' : undefined
    };

    // Update status tracker
    const statusIndex = statusTracker.findIndex(s => s.entityId === id);
    if (statusIndex >= 0) {
      statusTracker[statusIndex] = newStatus;
    } else {
      statusTracker.push(newStatus);
    }

    if (validSources.length > 0) {
      const suggestion: EnrichmentSuggestion = {
        type,
        ...(type === 'brand_association' ? { brandName: name } : { designerName: name }),
        role: mostConfidentSource?.role,
        startYear: mostConfidentSource?.startYear,
        endYear: mostConfidentSource?.endYear,
        confidence: overallConfidence,
        sources: validSources
      };

      // Update knowledge base if it's a brand
      if (type === 'brand_association') {
        const relationship: EnrichedRelationship = {
          brandId: id,
          brandName: name,
          tenures: []
        };
        
        if (mostConfidentSource?.role && mostConfidentSource?.startYear) {
          relationship.tenures.push({
            designerId: '', // To be filled when we find matching designer
            designerName: '', // To be filled when we find matching designer
            role: mostConfidentSource.role,
            startYear: mostConfidentSource.startYear,
            endYear: mostConfidentSource.endYear,
            confidence: mostConfidentSource.confidence,
            sources: [mostConfidentSource],
            verificationStatus: 'pending'
          });
        }
        
        const existingIndex = knowledgeBase.findIndex(r => r.brandId === id);
        if (existingIndex >= 0) {
          knowledgeBase[existingIndex] = relationship;
        } else {
          knowledgeBase.push(relationship);
        }
      }

      return suggestion;
    }
    return null;
  };

  // Process brands with no known tenure
  for (const brand of brands) {
    const hasTenure = tenures.some(t => t.brandId === brand.id);
    if (!hasTenure) {
      const suggestion = await processEntity('brand_association', brand.name, brand.id);
      if (suggestion) suggestions.push(suggestion);
    }
  }

  // Process designers with no known tenure
  for (const designer of designers) {
    const hasTenure = tenures.some(t => t.designerId === designer.id);
    if (!hasTenure) {
      const suggestion = await processEntity('tenure', designer.name, designer.id);
      if (suggestion) suggestions.push(suggestion);
    }
  }

  // Save updated tracking data
  saveJsonFile(PATHS.statusTracker, statusTracker);
  saveJsonFile(PATHS.knowledgeBase, knowledgeBase);

  return suggestions;
}

// STRUCTURED DATA EXTRACTION
function extractStructuredData(text: string): ExtractedData {
  const result: ExtractedData = { confidence: 0 };
  
  // Extract role with regex patterns
  for (const pattern of ROLE_PATTERNS) {
    const match = text.match(pattern);
    if (match) {
      result.role = match[1].toLowerCase();
      result.confidence += 0.4; // Increased from 0.3
      break;
    }
  }

  // Extract years with regex patterns
  for (const pattern of DATE_PATTERNS) {
    const match = text.match(pattern);
    if (match) {
      result.startYear = parseInt(match[1], 10);
      result.endYear = match[2] && match[2].toLowerCase() !== 'present' ? parseInt(match[2], 10) : undefined;
      result.confidence += 0.4; // Increased from 0.3
      break;
    }
  }

  // Adjust confidence based on data completeness
  if (result.role && result.startYear) {
    result.confidence += 0.2;
  }

  // Add base confidence for any match
  if (result.role || result.startYear) {
    result.confidence += 0.1; // Add a small base confidence
  }

  return result;
}

// RUN + EXPORT
generateEnrichmentSuggestions().then(suggestions => {
  console.log('\n✅ Enrichment Completed');
  
  // Group suggestions by status
  const statusTracker = loadJsonFile<EnrichmentStatus[]>(PATHS.statusTracker, []);
  const verified = statusTracker.filter(s => s.status === 'verified').length;
  const pending = statusTracker.filter(s => s.status === 'pending').length;
  const failed = statusTracker.filter(s => s.status === 'failed').length;

  console.log(`\n📊 Status Summary:`);
  console.log(`Verified: ${verified}`);
  console.log(`Pending: ${pending}`);
  console.log(`Failed: ${failed}`);

  // Group by confidence level
  const highConfidence = suggestions.filter(s => s.confidence >= 0.7);
  const mediumConfidence = suggestions.filter(s => s.confidence >= 0.4 && s.confidence < 0.7);
  const lowConfidence = suggestions.filter(s => s.confidence < 0.4);

  console.log(`\n🎯 Confidence Levels:`);
  console.log(`High (>70%): ${highConfidence.length}`);
  console.log(`Medium (40-70%): ${mediumConfidence.length}`);
  console.log(`Low (<40%): ${lowConfidence.length}`);

  suggestions.forEach(s => {
    const entity = s.type === 'tenure' ? s.designerName : s.brandName;
    console.log(`\n${entity} (${Math.round(s.confidence * 100)}% confidence)`);
    if (s.role) console.log(`Role: ${s.role}`);
    if (s.startYear) console.log(`Period: ${s.startYear} - ${s.endYear || 'present'}`);
    s.sources.forEach(src => console.log(`- ${src.name}: ${src.url}`));
  });

  console.log('\n💾 Files saved:');
  console.log(`- Status Tracker: ${PATHS.statusTracker}`);
  console.log(`- Knowledge Base: ${PATHS.knowledgeBase}`);
}).catch(err => {
  console.error('❌ Error during enrichment:', err.message || err);
});
