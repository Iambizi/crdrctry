import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';
import { Relationship, Designer, Brand } from '../src/types/fashion';

interface FashionData {
  designers: Designer[];
  brands: Brand[];
  relationships: Relationship[];
}

// Read the fashion genealogy data
const dataPath = join(__dirname, '../src/data/fashionGenealogy.json');
const data: FashionData = JSON.parse(readFileSync(dataPath, 'utf-8'));

console.log('Fixing invalid relationships...\n');

// Helper function to check if a designer exists
function designerExists(designerId: string): boolean {
  return data.designers.some(d => d.id === designerId);
}

// Helper function to check if a brand exists
function brandExists(brandId: string): boolean {
  return data.brands.some(b => b.id === brandId);
}

// Remove invalid relationships
let removedCount = 0;
data.relationships = data.relationships.filter(rel => {
  // Check if all referenced entities exist
  const sourceExists = designerExists(rel.sourceDesignerId);
  const targetExists = designerExists(rel.targetDesignerId);
  const brandValid = !rel.brandId || brandExists(rel.brandId); // brandId is optional

  if (!sourceExists || !targetExists || !brandValid) {
    console.log(`Removing invalid relationship ${rel.id}:`);
    if (!sourceExists) console.log(`  - Source designer ${rel.sourceDesignerId} does not exist`);
    if (!targetExists) console.log(`  - Target designer ${rel.targetDesignerId} does not exist`);
    if (!brandValid) console.log(`  - Brand ${rel.brandId} does not exist`);
    removedCount++;
    return false;
  }
  return true;
});

// Write the updated data back to the file
writeFileSync(dataPath, JSON.stringify(data, null, 2));

console.log(`\nRemoved ${removedCount} invalid relationships`);
console.log('Please run verify script to confirm fixes.');
