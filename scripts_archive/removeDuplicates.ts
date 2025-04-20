import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';
import { Designer, Brand, Tenure } from '../src/types/fashion';

interface FashionData {
  designers: Designer[];
  brands: Brand[];
  tenures: Tenure[];
}

// Read the fashion genealogy data
const dataPath = join(__dirname, '../src/data/fashionGenealogy.json');
const data: FashionData = JSON.parse(readFileSync(dataPath, 'utf-8'));

console.log('Checking for duplicates...\n');

// Find duplicate designers
const designerNameMap = new Map<string, Designer[]>();
data.designers.forEach(designer => {
  const name = designer.name.toLowerCase();
  const existing = designerNameMap.get(name) || [];
  existing.push(designer);
  designerNameMap.set(name, existing);
});

// Find duplicate brands
const brandNameMap = new Map<string, Brand[]>();
data.brands.forEach(brand => {
  const name = brand.name.toLowerCase();
  const existing = brandNameMap.get(name) || [];
  existing.push(brand);
  brandNameMap.set(name, existing);
});

let removedDesigners = 0;
let removedBrands = 0;

// Process duplicate designers
for (const [name, designers] of designerNameMap.entries()) {
  if (designers.length > 1) {
    console.log(`Found ${designers.length} duplicates for designer "${name}":`);
    designers.forEach(d => console.log(`  - ${d.id}: ${d.name}`));
    
    // Keep the one with more complete data or the first one
    const bestDesigner = designers.reduce((best, current) => {
      const bestScore = (best.biography ? 1 : 0) + 
                       (best.nationality ? 1 : 0) + 
                       (best.birthYear ? 1 : 0);
      const currentScore = (current.biography ? 1 : 0) + 
                          (current.nationality ? 1 : 0) + 
                          (current.birthYear ? 1 : 0);
      return currentScore > bestScore ? current : best;
    });
    
    console.log(`  Keeping ${bestDesigner.id} as it has the most complete data`);
    
    // Remove duplicates from data.designers
    data.designers = data.designers.filter(d => {
      if (d.name.toLowerCase() === name && d.id !== bestDesigner.id) {
        removedDesigners++;
        return false;
      }
      return true;
    });
  }
}

// Process duplicate brands
for (const [name, brands] of brandNameMap.entries()) {
  if (brands.length > 1) {
    console.log(`Found ${brands.length} duplicates for brand "${name}":`);
    brands.forEach(b => console.log(`  - ${b.id}: ${b.name}`));
    
    // Keep the one with more complete data or the first one
    const bestBrand = brands.reduce((best, current) => {
      const bestScore = (best.headquarters ? 1 : 0) + 
                       (best.specialties?.length || 0) + 
                       (best.website ? 1 : 0);
      const currentScore = (current.headquarters ? 1 : 0) + 
                          (current.specialties?.length || 0) + 
                          (current.website ? 1 : 0);
      return currentScore > bestScore ? current : best;
    });
    
    console.log(`  Keeping ${bestBrand.id} as it has the most complete data`);
    
    // Remove duplicates from data.brands
    data.brands = data.brands.filter(b => {
      if (b.name.toLowerCase() === name && b.id !== bestBrand.id) {
        removedBrands++;
        return false;
      }
      return true;
    });
  }
}

// Write the updated data back to the file
writeFileSync(dataPath, JSON.stringify(data, null, 2));

console.log(`\nRemoved ${removedDesigners} duplicate designers`);
console.log(`Removed ${removedBrands} duplicate brands`);
console.log('Please run verify script to confirm fixes.');
