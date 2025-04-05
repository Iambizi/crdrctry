import fashionGenealogyData from '../src/data/fashionGenealogy.js';
import axios from 'axios';
import * as cheerio from 'cheerio';

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

async function fetchWikipediaData(entityName: string): Promise<string | null> {
  try {
    const response = await axios.get(`https://en.wikipedia.org/wiki/${encodeURIComponent(entityName)}`);
    const $ = cheerio.load(response.data);
    // Remove unwanted elements
    $('.reference').remove();
    $('.mw-editsection').remove();
    
    // Get the main content
    const content = $('#mw-content-text').text();
    return content;
  } catch (error) {
    console.error(`Error fetching Wikipedia data for ${entityName}:`, error);
    return null;
  }
}

async function fetchVogueData(entityName: string): Promise<string | null> {
  try {
    const response = await axios.get(`https://www.vogue.com/fashion-shows/designer/${encodeURIComponent(entityName)}`);
    const $ = cheerio.load(response.data);
    const content = $('.designer-header__bio').text();
    return content;
  } catch (error) {
    console.error(`Error fetching Vogue data for ${entityName}:`, error);
    return null;
  }
}

async function fetchBOFData(entityName: string): Promise<string | null> {
  try {
    const response = await axios.get(`https://www.businessoffashion.com/community/people/${encodeURIComponent(entityName)}`);
    const $ = cheerio.load(response.data);
    const content = $('.profile-header__bio').text();
    return content;
  } catch (error) {
    console.error(`Error fetching BOF data for ${entityName}:`, error);
    return null;
  }
}

async function generateEnrichmentSuggestions(): Promise<EnrichmentSuggestion[]> {
  const suggestions: EnrichmentSuggestion[] = [];
  const { brands, designers, tenures } = fashionGenealogyData;

  // Process brands without designers
  for (const brand of brands) {
    const brandTenures = tenures.filter(t => t.brandId === brand.id);
    if (brandTenures.length === 0) {
      console.log(`Processing ${brand.name}...`);
      
      // Fetch data from multiple sources
      const [wikiData, vogueData, bofData] = await Promise.all([
        fetchWikipediaData(brand.name),
        fetchVogueData(brand.name),
        fetchBOFData(brand.name)
      ]);

      const sources: EnrichmentSource[] = [];
      if (wikiData) sources.push({ name: 'Wikipedia', url: `https://en.wikipedia.org/wiki/${encodeURIComponent(brand.name)}` });
      if (vogueData) sources.push({ name: 'Vogue', url: `https://www.vogue.com/fashion-shows/designer/${encodeURIComponent(brand.name)}` });
      if (bofData) sources.push({ name: 'Business of Fashion', url: `https://www.businessoffashion.com/community/people/${encodeURIComponent(brand.name)}` });

      // Add suggestion if we found any data
      if (sources.length > 0) {
        suggestions.push({
          type: 'brand_association',
          brandName: brand.name,
          confidence: sources.length / 3, // Confidence based on number of sources
          sources
        });
      }
    }
  }

  // Process designers without tenures
  for (const designer of designers) {
    const designerTenures = tenures.filter(t => t.designerId === designer.id);
    if (designerTenures.length === 0) {
      console.log(`Processing ${designer.name}...`);
      
      // Fetch data from multiple sources
      const [wikiData, vogueData, bofData] = await Promise.all([
        fetchWikipediaData(designer.name),
        fetchVogueData(designer.name),
        fetchBOFData(designer.name)
      ]);

      const sources: EnrichmentSource[] = [];
      if (wikiData) sources.push({ name: 'Wikipedia', url: `https://en.wikipedia.org/wiki/${encodeURIComponent(designer.name)}` });
      if (vogueData) sources.push({ name: 'Vogue', url: `https://www.vogue.com/fashion-shows/designer/${encodeURIComponent(designer.name)}` });
      if (bofData) sources.push({ name: 'Business of Fashion', url: `https://www.businessoffashion.com/community/people/${encodeURIComponent(designer.name)}` });

      // Add suggestion if we found any data
      if (sources.length > 0) {
        suggestions.push({
          type: 'tenure',
          designerName: designer.name,
          confidence: sources.length / 3,
          sources
        });
      }
    }
  }

  return suggestions;
}

// Run enrichment
generateEnrichmentSuggestions().then(suggestions => {
  console.log('\nData Enrichment Suggestions:');
  console.log('---------------------------');
  
  // Group suggestions by type
  const brandSuggestions = suggestions.filter(s => s.type === 'brand_association');
  const tenureSuggestions = suggestions.filter(s => s.type === 'tenure');

  if (brandSuggestions.length > 0) {
    console.log('\nBrands Needing Designer Associations:');
    brandSuggestions.forEach(suggestion => {
      console.log(`\n${suggestion.brandName}`);
      console.log(`Confidence: ${Math.round(suggestion.confidence * 100)}%`);
      console.log('Sources:');
      suggestion.sources.forEach(source => console.log(`- ${source.name}: ${source.url}`));
    });
  }

  if (tenureSuggestions.length > 0) {
    console.log('\nDesigners Needing Tenure Information:');
    tenureSuggestions.forEach(suggestion => {
      console.log(`\n${suggestion.designerName}`);
      console.log(`Confidence: ${Math.round(suggestion.confidence * 100)}%`);
      console.log('Sources:');
      suggestion.sources.forEach(source => console.log(`- ${source.name}: ${source.url}`));
    });
  }
}).catch(error => {
  console.error('Error running enrichment:', error);
});
