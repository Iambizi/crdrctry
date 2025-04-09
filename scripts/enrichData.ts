import * as fs from 'fs';
import * as path from 'path';
import OpenAI from 'openai';
import dotenv from 'dotenv';
import fashionGenealogyData from '../src/data/fashionGenealogy';

// Load environment variables
dotenv.config();

// Initialize OpenAI
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

// Types
interface EnrichmentStatus {
  entityId: string;
  entityName: string;
  entityType: 'brand' | 'designer';
  status: 'pending' | 'verified' | 'failed';
  timestamp: string;
}

interface EnrichmentSuggestion {
  entityId: string;
  entityName: string;
  entityType: 'brand' | 'designer';
  sources: string[];
  confidence: number;
  content: string;
}

interface LLMExtractedData {
  designer: string;
  role: string;
  startYear: number;
  endYear?: number;
  confidence: number;
}

interface EnrichedRelationship {
  brandId: string;
  brandName: string;
  tenures: {
    designerId: string;
    designerName: string;
    role: string;
    startYear: number;
    endYear?: number;
    confidence: number;
    sources: string[];
    verificationStatus: 'pending' | 'verified' | 'failed';
  }[];
}

// File paths
const PATHS = {
  statusTracker: path.join(__dirname, 'statusTracker.json'),
  knowledgeBase: path.join(__dirname, 'enrichedRelationships.json')
};

// Helper functions
function loadJsonFile<T>(filePath: string, defaultValue: T): T {
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
  } catch {
    return defaultValue;
  }
}

function saveJsonFile(filePath: string, data: unknown): void {
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
}

async function extractDataWithLLM(articleContent: string): Promise<LLMExtractedData | null> {
  try {
    const prompt = `Extract designer tenure information from this text. Format as JSON:
    {
      "designer": "Designer's full name",
      "role": "Role at the brand (e.g. Creative Director, Designer)",
      "startYear": Year they started (number),
      "endYear": Year they ended (number, optional),
      "confidence": Confidence score 0-1 based on information clarity
    }
    
    If no clear tenure information, return null.
    
    Text: ${articleContent}`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [{ role: "user", content: prompt }],
      temperature: 0
    });

    const result = completion.choices[0].message.content;
    if (!result || result.toLowerCase().includes('null')) {
      return null;
    }

    return JSON.parse(result);
  } catch (error) {
    console.error('Error extracting data with LLM:', error);
    return null;
  }
}

declare function search_web(params: { query: string; domain?: string }): Promise<Array<{ url: string }>>;
declare function read_url_content(params: { url: string }): Promise<string>;

// Main enrichment function
async function generateEnrichmentSuggestions(): Promise<EnrichmentSuggestion[]> {
  const suggestions: EnrichmentSuggestion[] = [];
  const statusTracker = loadJsonFile<EnrichmentStatus[]>(PATHS.statusTracker, []);
  const knowledgeBase = loadJsonFile<EnrichedRelationship[]>(PATHS.knowledgeBase, []);
  
  // Get all entities that need enrichment
  const entities = [
    ...fashionGenealogyData.brands.map(b => ({ ...b, type: 'brand' as const })),
    ...fashionGenealogyData.designers.map(d => ({ ...d, type: 'designer' as const }))
  ].filter(entity => {
    const status = statusTracker.find(s => s.entityId === entity.id);
    return !status || status.status === 'pending';
  });

  console.log(`Processing ${entities.length} entities in batches of 3...`);

  // Process in batches to avoid rate limits
  for (let i = 0; i < entities.length; i += 3) {
    const batch = entities.slice(i, i + 3);
    const batchPromises = batch.map(async entity => {
      try {
        // Use the built-in search_web tool
        const searchResults = await search_web({
          query: `${entity.name} fashion designer brand history tenure`,
          domain: 'wikipedia.org'
        });

        if (!searchResults || searchResults.length === 0) {
          console.log(`No search results found for ${entity.name}`);
          return;
        }

        // Use the built-in read_url_content tool
        const articleContent = await read_url_content({ url: searchResults[0].url });

        if (!articleContent) {
          console.log(`No article content found for ${entity.name}`);
          return;
        }

        // Extract structured data
        const extractedData = await extractDataWithLLM(articleContent);
        if (!extractedData) {
          console.log(`No structured data extracted for ${entity.name}`);
          return;
        }

        // Create suggestion
        const suggestion: EnrichmentSuggestion = {
          entityId: entity.id,
          entityName: entity.name,
          entityType: entity.type,
          sources: [searchResults[0].url],
          confidence: extractedData.confidence,
          content: JSON.stringify(extractedData)
        };

        suggestions.push(suggestion);

        // Update knowledge base
        const relationship: EnrichedRelationship = {
          brandId: entity.id,
          brandName: entity.name,
          tenures: [{
            designerId: entity.id,
            designerName: extractedData.designer,
            role: extractedData.role,
            startYear: extractedData.startYear,
            endYear: typeof extractedData.endYear === 'number' ? extractedData.endYear : undefined,
            confidence: extractedData.confidence,
            sources: suggestion.sources,
            verificationStatus: 'pending' as const
          }]
        };

        knowledgeBase.push(relationship);

        // Update status
        const newStatus: EnrichmentStatus = {
          entityId: entity.id,
          entityName: entity.name,
          entityType: entity.type,
          status: 'pending',
          timestamp: new Date().toISOString()
        };

        const existingStatusIndex = statusTracker.findIndex(s => s.entityId === entity.id);
        if (existingStatusIndex !== -1) {
          statusTracker[existingStatusIndex] = newStatus;
        } else {
          statusTracker.push(newStatus);
        }

      } catch (error) {
        console.error(`Error processing ${entity.name}:`, error);
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
  const highConfidence = suggestions.filter(s => s.confidence > 0.7);
  const mediumConfidence = suggestions.filter(s => s.confidence >= 0.4 && s.confidence <= 0.7);
  const lowConfidence = suggestions.filter(s => s.confidence < 0.4);

  console.log(`\n🎯 Confidence Levels:`);
  console.log(`High (>70%): ${highConfidence.length}`);
  console.log(`Medium (40-70%): ${mediumConfidence.length}`);
  console.log(`Low (<40%): ${lowConfidence.length}`);

  console.log(`\n💾 Files saved:`);
  console.log(`- Status Tracker: ${PATHS.statusTracker}`);
  console.log(`- Knowledge Base: ${PATHS.knowledgeBase}`);
});
