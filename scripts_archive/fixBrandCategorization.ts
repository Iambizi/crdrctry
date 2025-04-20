import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';
import { Brand, Designer } from '../src/types/fashion';

interface FashionData {
  designers: Designer[];
  brands: Brand[];
}

// Read the fashion genealogy data
const dataPath = join(__dirname, '../src/data/fashionGenealogy.json');
const data: FashionData = JSON.parse(readFileSync(dataPath, 'utf-8'));

console.log('Fixing brand categorization...\n');

// 1. Fix incorrect brand entries
const brandUpdates: { [key: string]: { action: string; details: string } } = {
  'gianni-versace': { 
    action: 'rename', 
    details: 'Should be referenced as Versace' 
  },
  'miyake-design-studio': { 
    action: 'flag', 
    details: 'Design studio/innovation hub, not primary brand' 
  },
  'ann-demeulemeester-serax': { 
    action: 'split', 
    details: 'Homeware collaboration line, separate from main fashion label' 
  },
  'sex': { 
    action: 'recategorize', 
    details: 'Historical retail location/cultural incubator, not a traditional brand' 
  },
  'walter-van-beirendonck': { 
    action: 'recategorize', 
    details: 'Designer name, not brand - needs proper brand format' 
  },
  'royal-academy-antwerp': { 
    action: 'remove', 
    details: 'Educational institution, not a brand' 
  },
  'lacoste': { 
    action: 'flag', 
    details: 'Non-luxury sportswear brand with designer collaborations' 
  },
  'uniqlo': { 
    action: 'flag', 
    details: 'Mass-market retailer with luxury designer collaborations' 
  },
  'adidas': { 
    action: 'flag', 
    details: 'Sportswear brand with luxury designer collaborations' 
  }
};

// Process each brand
Object.entries(brandUpdates).forEach(([brandId, update]) => {
  const brand = data.brands.find(b => b.id === brandId);
  if (!brand) {
    console.log(`Brand not found: ${brandId}`);
    return;
  }

  switch (update.action) {
    case 'rename':
      if (brandId === 'gianni-versace') {
        brand.name = 'Versace';
        console.log(`Renamed ${brandId} to Versace`);
      }
      break;

    case 'flag':
      brand.category = 'collaboration_partner';
      if (brandId === 'miyake-design-studio') {
        brand.category = 'design_studio';
      }
      console.log(`Flagged ${brand.name} as ${brand.category}`);
      break;

    case 'split':
      if (brandId === 'ann-demeulemeester-serax') {
        brand.category = 'collaboration_line';
        brand.parentBrand = 'ann-demeulemeester';
        console.log(`Split ${brand.name} as collaboration line under Ann Demeulemeester`);
      }
      break;

    case 'recategorize':
      if (brandId === 'sex') {
        brand.category = 'historical_retail';
        console.log(`Recategorized ${brand.name} as historical retail location`);
      } else if (brandId === 'walter-van-beirendonck') {
        brand.category = 'designer_label';
        console.log(`Recategorized ${brand.name} as designer label`);
      }
      break;

    case 'remove':
      if (brandId === 'royal-academy-antwerp') {
        brand.category = 'educational_institution';
        console.log(`Marked ${brand.name} as educational institution`);
      }
      break;
  }

  // Add metadata about the change
  brand.notes = update.details;
  brand.lastCategorized = new Date().toISOString();
});

// Write the updated data back to the file
writeFileSync(dataPath, JSON.stringify(data, null, 2));

console.log('\nBrand categorization updates complete. Please run verify script to confirm changes.');
