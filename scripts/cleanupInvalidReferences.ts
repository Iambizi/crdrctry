import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';
import { Designer, Brand, Tenure, Relationship } from '../src/types/fashion';

interface FashionData {
  designers: Designer[];
  brands: Brand[];
  tenures: Tenure[];
  relationships: Relationship[];
}

// Read the fashion genealogy data
const dataPath = join(__dirname, '../src/data/fashionGenealogy.json');
const data: FashionData = JSON.parse(readFileSync(dataPath, 'utf-8'));

console.log('Cleaning up invalid references...\n');

// Helper functions to check if entities exist
function designerExists(designerId: string): boolean {
  return data.designers.some(d => d.id === designerId);
}

function brandExists(brandId: string): boolean {
  return data.brands.some(b => b.id === brandId);
}

// Clean up tenures
let removedTenures = 0;
data.tenures = data.tenures.filter(tenure => {
  const designerValid = designerExists(tenure.designerId);
  const brandValid = !tenure.brandId || brandExists(tenure.brandId);

  if (!designerValid || !brandValid) {
    console.log(`Removing invalid tenure ${tenure.id}:`);
    if (!designerValid) console.log(`  - Designer ${tenure.designerId} does not exist`);
    if (!brandValid) console.log(`  - Brand ${tenure.brandId} does not exist`);
    removedTenures++;
    return false;
  }
  return true;
});

// Clean up relationships
let removedRelationships = 0;
data.relationships = data.relationships.filter(rel => {
  const sourceValid = designerExists(rel.sourceDesignerId);
  const targetValid = designerExists(rel.targetDesignerId);
  const brandValid = !rel.brandId || brandExists(rel.brandId);

  if (!sourceValid || !targetValid || !brandValid) {
    console.log(`Removing invalid relationship ${rel.id}:`);
    if (!sourceValid) console.log(`  - Source designer ${rel.sourceDesignerId} does not exist`);
    if (!targetValid) console.log(`  - Target designer ${rel.targetDesignerId} does not exist`);
    if (!brandValid) console.log(`  - Brand ${rel.brandId} does not exist`);
    removedRelationships++;
    return false;
  }
  return true;
});

// Write the updated data back to the file
writeFileSync(dataPath, JSON.stringify(data, null, 2));

console.log(`\nRemoved ${removedTenures} invalid tenures`);
console.log(`Removed ${removedRelationships} invalid relationships`);
console.log('Please run verify script to confirm fixes.');
