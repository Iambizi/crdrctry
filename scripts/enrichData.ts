import axios from 'axios';
import * as cheerio from 'cheerio';
import * as fs from 'fs';
import * as path from 'path';
import OpenAI from 'openai';
import dotenv from 'dotenv';
import fashionGenealogyData from '../src/data/fashionGenealogy';

// Load environment variables
dotenv.config();

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

// TYPES
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

interface LLMExtractedData {
  designer: string;
  brand: string;
  role: string;
  startYear: number;
  endYear: number | 'present';
  confidence: number;
  note?: string;
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

// REQUEST HANDLING
interface RequestQueueItem {
  url: string;
  retryCount: number;
  lastAttempt: number;
}

class RequestQueue {
  private queue: Map<string, RequestQueueItem> = new Map();
  private maxRetries = 2;
  private baseDelay = 3000;
  private maxConcurrent = 2;
  private activeRequests = 0;
  private domainDelays: Map<string, number> = new Map();

  async fetch(url: string): Promise<string> {
    const domain = new URL(url).hostname;
    const queueItem = this.queue.get(url) || { url, retryCount: 0, lastAttempt: 0 };
    
    // Wait if too many concurrent requests
    while (this.activeRequests >= this.maxConcurrent) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    // Check if we need to wait based on rate limiting
    const now = Date.now();
    const timeSinceLastAttempt = now - queueItem.lastAttempt;
    const domainDelay = this.domainDelays.get(domain) || this.baseDelay;
    const delay = Math.max(0, domainDelay - timeSinceLastAttempt);
    
    if (delay > 0) {
      await new Promise(resolve => setTimeout(resolve, delay));
    }

    try {
      this.activeRequests++;
      queueItem.lastAttempt = Date.now();
      const response = await axios.get(url);
      this.queue.delete(url); // Success, remove from queue
      
      // Reset domain delay on success
      this.domainDelays.set(domain, this.baseDelay);
      
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.status === 429 && queueItem.retryCount < this.maxRetries) {
        queueItem.retryCount++;
        this.queue.set(url, queueItem);
        
        // Increase delay for this domain
        const currentDelay = this.domainDelays.get(domain) || this.baseDelay;
        this.domainDelays.set(domain, currentDelay * 2);
        
        console.log(`Rate limited for ${domain}, increasing delay to ${this.domainDelays.get(domain)}ms`);
        return this.fetch(url); // Retry with increased delay
      }
      throw error;
    } finally {
      this.activeRequests--;
    }
  }

  private getDelay(retryCount: number): number {
    return this.baseDelay * Math.pow(1.5, retryCount);
  }
}

const requestQueue = new RequestQueue();

// SCRAPERS
const scrapers: Scraper[] = [
  {
    name: 'WWD',
    url: (name: string) => `https://wwd.com/search/${encodeURIComponent(name)}/`,
    selectors: {
      title: ['.search-result h2 a'],
      content: ['.search-result .excerpt'],
      date: ['.search-result .entry-date'],
      role: ['.search-result .category', '.search-result .tag']
    },
    extractContent: function($: cheerio.CheerioAPI): string {
      const titles = this.selectors.title.map(selector => 
        $(selector).map((_, el) => $(el).text().trim()).get()
      ).flat();
      
      const content = this.selectors.content.map(selector =>
        $(selector).map((_, el) => $(el).text().trim()).get()
      ).flat();

      const dates = this.selectors.date.map(selector =>
        $(selector).map((_, el) => $(el).text().trim()).get()
      ).flat();

      const roles = this.selectors.role.map(selector =>
        $(selector).map((_, el) => $(el).text().trim()).get()
      ).flat();

      return [...titles, ...content, ...dates, ...roles].filter(Boolean).join('\n');
    }
  },
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
      const titles = this.selectors.title.map(selector => 
        $(selector).map((_, el) => $(el).text().trim()).get()
      ).flat();
      
      const content = this.selectors.content.map(selector =>
        $(selector).map((_, el) => $(el).text().trim()).get()
      ).flat();

      const dates = this.selectors.date.map(selector =>
        $(selector).map((_, el) => $(el).text().trim()).get()
      ).flat();

      const roles = this.selectors.role.map(selector =>
        $(selector).map((_, el) => $(el).text().trim()).get()
      ).flat();

      return [...titles, ...content, ...dates, ...roles].filter(Boolean).join('\n');
    }
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
      const titles = this.selectors.title.map(selector => 
        $(selector).map((_, el) => $(el).text().trim()).get()
      ).flat();
      
      const content = this.selectors.content.map(selector =>
        $(selector).map((_, el) => $(el).text().trim()).get()
      ).flat();

      const dates = this.selectors.date.map(selector =>
        $(selector).map((_, el) => $(el).text().trim()).get()
      ).flat();

      const roles = this.selectors.role.map(selector =>
        $(selector).map((_, el) => $(el).text().trim()).get()
      ).flat();

      return [...titles, ...content, ...dates, ...roles].filter(Boolean).join('\n');
    }
  }
];

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
    
    // Skip early if no content found
    if (!content.trim()) {
      console.log(`[${scraper.name}] No relevant content found for "${name}". Selectors may be outdated.`);
      return null;
    }

    // Extract structured data
    const data = await enhancedDataExtraction(content);
    
    // Log warning if no structured data found
    if (data.confidence === 0) {
      console.log(`[${scraper.name}] Found content but no structured data for "${name}".`);
    }

    return { content, data };
  } catch (error) {
    if (axios.isAxiosError(error)) {
      console.error(`[${scraper.name}] Failed to fetch data for "${name}": ${error.message}`);
    } else {
      console.error(`[${scraper.name}] Unexpected error while fetching data for "${name}":`, error);
    }
    return null;
  }
}

// MAIN ENRICHMENT FUNCTION
async function generateEnrichmentSuggestions(): Promise<EnrichmentSuggestion[]> {
  const suggestions: EnrichmentSuggestion[] = [];
  const { brands, designers } = fashionGenealogyData;
  
  // Load existing status and relationships
  const statusTracker = loadJsonFile<EnrichmentStatus[]>(PATHS.statusTracker, []);
  const knowledgeBase = loadJsonFile<EnrichedRelationship[]>(PATHS.knowledgeBase, []);

  // Process in smaller batches
  const batchSize = 3;
  const entities = [...brands, ...designers];
  
  console.log(`Processing ${entities.length} entities in batches of ${batchSize}...`);

  for (let i = 0; i < entities.length; i += batchSize) {
    const batch = entities.slice(i, i + batchSize);
    console.log(`\nBatch ${Math.floor(i/batchSize) + 1}/${Math.ceil(entities.length/batchSize)}`);
    
    const batchPromises = batch.map(async entity => {
      console.log(`🔍 Processing ${entity.name}`);
      
      // Skip if recently checked
      const existingStatus = statusTracker.find(s => s.entityId === entity.id);
      if (existingStatus && isRecentlyChecked(existingStatus.lastChecked)) {
        console.log(`Skipping ${entity.name} - recently checked`);
        return;
      }

      // Add small random delay between entities in batch
      await new Promise(resolve => setTimeout(resolve, Math.random() * 1000));

      const results = await Promise.all(
        scrapers.map(scraper => fetchWithFallback(entity.name, scraper))
      );

      // Process results...
      const validSources = results
        .filter((result): result is { content: string; data: ExtractedData } => result !== null)
        .map((result, index) => ({
          name: scrapers[index].name,
          url: scrapers[index].url(entity.name),
          ...result.data
        }));

      if (validSources.length > 0) {
        const suggestion: EnrichmentSuggestion = {
          type: 'tenure',
          brandName: entity.name,
          confidence: Math.max(...validSources.map(s => s.confidence)),
          sources: validSources
        };
        suggestions.push(suggestion);

        // Update status tracker
        const newStatus: EnrichmentStatus = {
          entityId: entity.id,
          entityName: entity.name,
          entityType: 'brand',
          status: 'pending',
          lastChecked: new Date().toISOString(),
          sourcesChecked: scrapers.map(s => s.name)
        };

        const statusIndex = statusTracker.findIndex(s => s.entityId === entity.id);
        if (statusIndex >= 0) {
          statusTracker[statusIndex] = newStatus;
        } else {
          statusTracker.push(newStatus);
        }

        // Update knowledge base
        const relationship: EnrichedRelationship = {
          brandId: entity.id,
          brandName: entity.name,
          tenures: validSources.map(source => ({
            designerId: '',
            designerName: '',
            role: source.role || '',
            startYear: source.startYear || 0,
            endYear: source.endYear,
            confidence: source.confidence,
            sources: [source],
            verificationStatus: 'pending'
          }))
        };

        const relationshipIndex = knowledgeBase.findIndex(r => r.brandId === entity.id);
        if (relationshipIndex >= 0) {
          knowledgeBase[relationshipIndex] = relationship;
        } else {
          knowledgeBase.push(relationship);
        }
      }
    });

    // Wait for batch to complete
    await Promise.all(batchPromises);
    
    // Save progress after each batch
    saveJsonFile(PATHS.statusTracker, statusTracker);
    saveJsonFile(PATHS.knowledgeBase, knowledgeBase);
    console.log('Progress saved.');
  }

  return suggestions;
}

// Helper to check if entity was recently checked (within last 24 hours)
function isRecentlyChecked(lastChecked: string): boolean {
  const lastCheck = new Date(lastChecked).getTime();
  const now = new Date().getTime();
  const hoursSinceLastCheck = (now - lastCheck) / (1000 * 60 * 60);
  return hoursSinceLastCheck < 24;
}

// LLM-BASED DATA EXTRACTION
async function extractDataWithLLM(articleContent: string): Promise<LLMExtractedData | null> {
  try {
    // Construct the prompt
    const prompt = `Given the article content below, extract the following information:

1. Designer's full name  
2. Brand name  
3. Role (e.g., Creative Director, Head Designer, etc.)  
4. Start Year (when their tenure began)  
5. End Year (when their tenure ended, or "present" if still ongoing)  
6. Confidence score (0 to 1)  
7. Any relevant notes if the years are estimated or inferred

Return the result in the following JSON format:

{
  "designer": "",
  "brand": "",
  "role": "",
  "startYear": 0,
  "endYear": 0,
  "confidence": 0.0,
  "note": ""
}

Article:
"""
${articleContent}
"""`;

    // Call OpenAI API
    const completion = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        {
          role: "system",
          content: "You are a fashion industry data analyst specializing in extracting structured information about designer tenures at fashion houses. You should only respond with valid JSON in the specified format. If you cannot extract the required information with high confidence, set the confidence score appropriately low."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.1, // Low temperature for more deterministic outputs
      response_format: { type: "json_object" }
    });

    // Parse the response
    const response = completion.choices[0]?.message?.content;
    if (!response) {
      console.warn('No response from LLM');
      return null;
    }

    try {
      const extractedData = JSON.parse(response) as LLMExtractedData;
      
      // Validate the extracted data
      if (!extractedData.designer || !extractedData.brand || !extractedData.role || !extractedData.startYear) {
        console.warn('Incomplete data extracted by LLM');
        return null;
      }

      return extractedData;
    } catch (parseError) {
      console.error('Error parsing LLM response:', parseError);
      return null;
    }
  } catch (error) {
    console.error('Error in LLM extraction:', error);
    return null;
  }
}

// Modify the existing extraction to use both regex and LLM
async function enhancedDataExtraction(text: string): Promise<ExtractedData> {
  // First try regex-based extraction
  const regexResult = extractStructuredData(text);
  
  // Then try LLM-based extraction
  const llmResult = await extractDataWithLLM(text);
  
  if (llmResult) {
    // If LLM extraction succeeded, use it with high confidence
    return {
      role: llmResult.role,
      startYear: llmResult.startYear,
      endYear: typeof llmResult.endYear === 'number' ? llmResult.endYear : undefined,
      confidence: llmResult.confidence
    };
  }
  
  // Otherwise return regex-based result
  return regexResult;
}

// STRUCTURED DATA EXTRACTION
function extractStructuredData(text: string): ExtractedData {
  const result: ExtractedData = { confidence: 0 };
  
  // Base confidence for having any content
  if (text.trim().length > 0) {
    result.confidence += 0.1; // Base confidence for any match
  }
  
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

  // Additional confidence for having both role and dates
  if (result.role && result.startYear) {
    result.confidence += 0.2;
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
