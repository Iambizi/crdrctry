import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Read the main data file
const mainDataPath = path.join(__dirname, '../src/data/fashionGenealogy.json');
const mainData = JSON.parse(fs.readFileSync(mainDataPath, 'utf8'));

// ID mappings
const idMappings: { [key: string]: string } = {
  // Brand ID mappings
  'a8cff255-6ea5-4912-a82a-d5524e25b53a': '63cb5e65-2f24-4ac5-9c57-e2270f612d4e', // Vera Wang
  'd36ddc62-5f4b-422a-9167-473edea6498d': 'cececf4e-866f-43b0-8e3e-49a0dbe3b1dc', // Versace
  '7865-7902': '49c7458d-ff31-452e-987c-a4debd9870a7', // Ralph Lauren
  '8f7e9c2d-1b3a-4e5f-9d8c-7b6a5c4d3e2f': '49c7458d-ff31-452e-987c-a4debd9870a7', // Ralph Lauren's current UUID
  // Add LTK Architecture mapping if found
};

interface Brand {
  id: string;
  name: string;
  foundedYear: number;
  founder: string;
  parentCompany?: string;
  category?: string;
  headquarters?: string;
  specialties?: string[];
  pricePoint?: string;
  markets?: string[];
  website?: string;
  hasHistoricalData?: boolean;
  notes?: string;
  lastCategorized?: string;
  socialMedia?: {
    instagram?: string;
    twitter?: string;
    facebook?: string;
  };
  confidence?: number;
  verificationStatus?: string;
  sources?: string[];
  lastVerified?: string;
}

// Update brand IDs
mainData.brands = mainData.brands.map((brand: Brand) => {
  const newId = idMappings[brand.id];
  if (newId) {
    console.log(`Updating brand ID from ${brand.id} to ${newId}`);
    return { ...brand, id: newId };
  }
  // Handle old format IDs
  if (brand.name === 'Ralph Lauren' && !brand.id.includes('-')) {
    const newId = '49c7458d-ff31-452e-987c-a4debd9870a7';
    console.log(`Updating Ralph Lauren ID from ${brand.id} to ${newId}`);
    return { ...brand, id: newId };
  }
  return brand;
});

// Write back to the main file
fs.writeFileSync(mainDataPath, JSON.stringify(mainData, null, 2));
console.log('Updates completed successfully!');
