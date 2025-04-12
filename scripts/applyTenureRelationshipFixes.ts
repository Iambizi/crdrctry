import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';
import { Brand, Relationship, Tenure } from '../src/types/fashion';

interface TenureUpdate {
  id: string;
  updates: Partial<Tenure>;
}

interface RelationshipUpdate {
  id: string;
  updates: Partial<Relationship>;
}

interface BrandUpdate {
  id: string;
}

interface Fixes {
  tenureUpdates: TenureUpdate[];
  brandUpdates?: BrandUpdate[];
  relationshipUpdates: RelationshipUpdate[];
}

// Load fashion genealogy data
const fashionGenealogyPath = join(__dirname, '../src/data/fashionGenealogy.json');
const fashionGenealogyData = JSON.parse(readFileSync(fashionGenealogyPath, 'utf-8'));

// Load fixes
const fixesPath = join(__dirname, '../src/data/updates/2025-tenure-relationship-fixes.json');
const fixes: Fixes = JSON.parse(readFileSync(fixesPath, 'utf-8'));

// Apply tenure updates
fixes.tenureUpdates.forEach((update) => {
  const tenure = fashionGenealogyData.tenures.find((t: Tenure) => t.id === update.id);
  if (tenure) {
    Object.assign(tenure, update.updates);
    console.log(`Updated tenure ${update.id}`);
  }
});

// Apply brand updates
if (fixes.brandUpdates) {
  fixes.brandUpdates.forEach((brand) => {
    const existingBrand = fashionGenealogyData.brands.find((b: Brand) => b.id === brand.id);
    if (existingBrand) {
      Object.assign(existingBrand, brand);
      console.log(`Updated brand ${brand.id}`);
    } else {
      fashionGenealogyData.brands.push(brand);
      console.log(`Created brand ${brand.id}`);
    }
  });
}

// Apply relationship updates
fixes.relationshipUpdates.forEach((update) => {
  const relationship = fashionGenealogyData.relationships.find((r: Relationship) => r.id === update.id);
  if (relationship) {
    Object.assign(relationship, update.updates);
    console.log(`Updated relationship ${update.id}`);
  }
});

// Save updated data
writeFileSync(fashionGenealogyPath, JSON.stringify(fashionGenealogyData, null, 2));
console.log('Saved updates to fashion genealogy data');

// Run verification
import('./verifyData');
