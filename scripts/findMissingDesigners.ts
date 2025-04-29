import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Read the main data file
const mainDataPath = path.join(__dirname, '../src/data/fashionGenealogy.json');
const mainData = JSON.parse(fs.readFileSync(mainDataPath, 'utf8'));

// Collection stats
const stats = {
  brands: {
    total: mainData.brands.length,
    referencedIds: new Set<string>(),
    missingIds: new Set<string>(),
    duplicateIds: new Set<string>()
  },
  designers: {
    total: mainData.designers.length,
    referencedIds: new Set<string>(),
    missingIds: new Set<string>(),
    duplicateIds: new Set<string>()
  },
  tenures: {
    total: mainData.tenures.length,
    invalidBrandRefs: 0,
    invalidDesignerRefs: 0,
    duplicateIds: new Set<string>()
  },
  relationships: {
    total: mainData.relationships.length,
    invalidBrandRefs: 0,
    invalidSourceDesignerRefs: 0,
    invalidTargetDesignerRefs: 0,
    duplicateIds: new Set<string>()
  }
};

// Check for duplicate IDs in brands
const brandIds = new Set<string>();
mainData.brands.forEach((brand: any) => {
  if (brandIds.has(brand.id)) {
    stats.brands.duplicateIds.add(brand.id);
  }
  brandIds.add(brand.id);
});

// Check for duplicate IDs in designers
const designerIds = new Set<string>();
mainData.designers.forEach((designer: any) => {
  if (designerIds.has(designer.id)) {
    stats.designers.duplicateIds.add(designer.id);
  }
  designerIds.add(designer.id);
});

// Analyze tenures
mainData.tenures.forEach((tenure: any) => {
  if (tenure.brandId) {
    stats.brands.referencedIds.add(tenure.brandId);
    if (!brandIds.has(tenure.brandId)) {
      stats.brands.missingIds.add(tenure.brandId);
      stats.tenures.invalidBrandRefs++;
    }
  }
  if (tenure.designerId) {
    stats.designers.referencedIds.add(tenure.designerId);
    if (!designerIds.has(tenure.designerId)) {
      stats.designers.missingIds.add(tenure.designerId);
      stats.tenures.invalidDesignerRefs++;
    }
  }
});

// Analyze relationships
mainData.relationships.forEach((rel: any) => {
  if (rel.brandId) {
    stats.brands.referencedIds.add(rel.brandId);
    if (!brandIds.has(rel.brandId)) {
      stats.brands.missingIds.add(rel.brandId);
      stats.relationships.invalidBrandRefs++;
    }
  }
  if (rel.sourceDesignerId) {
    stats.designers.referencedIds.add(rel.sourceDesignerId);
    if (!designerIds.has(rel.sourceDesignerId)) {
      stats.designers.missingIds.add(rel.sourceDesignerId);
      stats.relationships.invalidSourceDesignerRefs++;
    }
  }
  if (rel.targetDesignerId) {
    stats.designers.referencedIds.add(rel.targetDesignerId);
    if (!designerIds.has(rel.targetDesignerId)) {
      stats.designers.missingIds.add(rel.targetDesignerId);
      stats.relationships.invalidTargetDesignerRefs++;
    }
  }
});

// Print summary
console.log('\nDatabase Statistics:');
console.log('===================');

console.log('\nBrands Collection:');
console.log(`Total Brands: ${stats.brands.total}`);
console.log(`Referenced Brand IDs: ${stats.brands.referencedIds.size}`);
console.log(`Missing Brand IDs: ${stats.brands.missingIds.size}`);
console.log(`Duplicate Brand IDs: ${stats.brands.duplicateIds.size}`);
if (stats.brands.missingIds.size > 0) {
  console.log('\nMissing Brand IDs:');
  Array.from(stats.brands.missingIds).forEach(id => console.log(`- ${id}`));
}

console.log('\nDesigners Collection:');
console.log(`Total Designers: ${stats.designers.total}`);
console.log(`Referenced Designer IDs: ${stats.designers.referencedIds.size}`);
console.log(`Missing Designer IDs: ${stats.designers.missingIds.size}`);
console.log(`Duplicate Designer IDs: ${stats.designers.duplicateIds.size}`);
if (stats.designers.missingIds.size > 0) {
  console.log('\nMissing Designer IDs:');
  Array.from(stats.designers.missingIds).forEach(id => console.log(`- ${id}`));
}

console.log('\nTenures Collection:');
console.log(`Total Tenures: ${stats.tenures.total}`);
console.log(`Invalid Brand References: ${stats.tenures.invalidBrandRefs}`);
console.log(`Invalid Designer References: ${stats.tenures.invalidDesignerRefs}`);

console.log('\nRelationships Collection:');
console.log(`Total Relationships: ${stats.relationships.total}`);
console.log(`Invalid Brand References: ${stats.relationships.invalidBrandRefs}`);
console.log(`Invalid Source Designer References: ${stats.relationships.invalidSourceDesignerRefs}`);
console.log(`Invalid Target Designer References: ${stats.relationships.invalidTargetDesignerRefs}`);
