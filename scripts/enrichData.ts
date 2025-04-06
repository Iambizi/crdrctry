// TOP: Existing imports
import fashionGenealogyData from '../src/data/fashionGenealogy.js';
import axios, { AxiosError } from 'axios';
import * as cheerio from 'cheerio';
import fs from 'fs';

// TYPES
interface EnrichmentSource {
  name: string;
  url: string;
  lastVerified?: Date;
}

interface EnrichmentSuggestion {
  type: 'tenure' | 'designer' | 'brand_association';
  brandName?: string;
  designerName?: string;
  role?: string;
  startYear?: number;
  endYear?: number;
  confidence: number;
  sources: EnrichmentSource[];
}

// HELPER: Generic fetcher with fallback logging
async function fetchWithFallback(name: string, site: string, url: string, selector: string): Promise<string | null> {
  try {
    const response = await axios.get(url);
    const $ = cheerio.load(response.data);
    const content = $(selector).text().trim();

    if (!content) {
      console.warn(`[${site}] No relevant content found for "${name}". Selector "${selector}" may be outdated.`);
      return null;
    }

    return content;
  } catch (error) {
    if (error instanceof AxiosError) {
      console.error(`[${site}] Error fetching data for "${name}":`, error.message);
    } else {
      console.error(`[${site}] Unexpected error for "${name}":`, error);
    }
    return null;
  }
}

// SOURCE-SPECIFIC SCRAPERS
const scrapers = [
  { name: 'Wikipedia', url: (n: string) => `https://en.wikipedia.org/wiki/${encodeURIComponent(n)}`, selector: '#mw-content-text' },
  { name: 'Vogue', url: (n: string) => `https://www.vogue.com/fashion-shows/designer/${encodeURIComponent(n)}`, selector: '.designer-header__bio' },
  { name: 'Business of Fashion', url: (n: string) => `https://www.businessoffashion.com/community/people/${encodeURIComponent(n)}`, selector: '.profile-header__bio' },
  { name: 'FMD', url: (n: string) => `https://www.fashionmodeldirectory.com/designers/${encodeURIComponent(n)}/`, selector: '.bio' },
  { name: 'L’Officiel', url: (n: string) => `https://www.lofficielusa.com/search?q=${encodeURIComponent(n)}`, selector: '.article-preview__title' },
  { name: 'ShowStudio', url: (n: string) => `https://www.showstudio.com/search?q=${encodeURIComponent(n)}`, selector: '.search-results' },
  { name: 'CFDA', url: (n: string) => `https://cfda.com/designer-directory/${encodeURIComponent(n)}`, selector: '.designer-content' },
  { name: 'Not Just A Label', url: (n: string) => `https://www.notjustalabel.com/search/node/${encodeURIComponent(n)}`, selector: '.views-field-title' },
  { name: 'Nowfashion', url: (n: string) => `https://www.nowfashion.com/search?q=${encodeURIComponent(n)}`, selector: '.show-list__item' },
  { name: 'Fashionista', url: (n: string) => `https://fashionista.com/search?q=${encodeURIComponent(n)}`, selector: '.article-card__title' },
  { name: 'WWD', url: (n: string) => `https://wwd.com/?s=${encodeURIComponent(n)}`, selector: '.search-result' }
];

// ENRICHMENT GENERATOR
async function generateEnrichmentSuggestions(): Promise<EnrichmentSuggestion[]> {
  const suggestions: EnrichmentSuggestion[] = [];
  const { brands, designers, tenures } = fashionGenealogyData;

  const processEntity = async (
    type: 'brand_association' | 'tenure',
    name: string
  ): Promise<EnrichmentSuggestion | null> => {
    const sourceResults = await Promise.all(
      scrapers.map(async scraper => {
        const content = await fetchWithFallback(name, scraper.name, scraper.url(name), scraper.selector);
        return content ? { name: scraper.name, url: scraper.url(name) } : null;
      })
    );

    const validSources = sourceResults.filter(Boolean) as EnrichmentSource[];

    if (validSources.length > 0) {
      return {
        type,
        ...(type === 'brand_association' ? { brandName: name } : { designerName: name }),
        confidence: validSources.length / scrapers.length,
        sources: validSources
      };
    }
    return null;
  };

  // Check brands with no known designer tenure
  for (const brand of brands) {
    const hasTenure = tenures.some(t => t.brandId === brand.id);
    if (!hasTenure) {
      console.log(`Checking brand: ${brand.name}`);
      const suggestion = await processEntity('brand_association', brand.name);
      if (suggestion) suggestions.push(suggestion);
    }
  }

  // Check designers with no known tenure
  for (const designer of designers) {
    const hasTenure = tenures.some(t => t.designerId === designer.id);
    if (!hasTenure) {
      console.log(`Checking designer: ${designer.name}`);
      const suggestion = await processEntity('tenure', designer.name);
      if (suggestion) suggestions.push(suggestion);
    }
  }

  return suggestions;
}

// RUN + EXPORT
generateEnrichmentSuggestions().then(suggestions => {
  console.log('\n✅ Enrichment Completed');
  suggestions.forEach(s => {
    console.log(`\n${s.type === 'tenure' ? s.designerName : s.brandName}`);
    console.log(`Confidence: ${Math.round(s.confidence * 100)}%`);
    s.sources.forEach(src => console.log(`- ${src.name}: ${src.url}`));
  });

  const outputPath = './scripts/suggestions.json';
  fs.writeFileSync(outputPath, JSON.stringify(suggestions, null, 2));
  console.log(`\n💾 Saved to ${outputPath}`);
}).catch(err => {
  console.error('❌ Error during enrichment:', err.message || err);
});
