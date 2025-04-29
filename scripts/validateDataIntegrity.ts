import { readFileSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { Brand, Designer, Relationship, Tenure } from '../src/types/fashion';

// Load fashion genealogy data
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const fashionGenealogyPath = join(__dirname, '../src/data/fashionGenealogy.json');
const fashionGenealogyData = JSON.parse(readFileSync(fashionGenealogyPath, 'utf-8')) as {
  brands: Brand[];
  designers: Designer[];
  tenures: Tenure[];
  relationships: Relationship[];
};

interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  stats: {
    totalBrands: number;
    totalDesigners: number;
    totalTenures: number;
    totalRelationships: number;
    nonUuidEntities: {
      brands: Array<{ id: string; name: string }>;
      designers: Array<{ id: string; name: string }>;
      tenures: Array<{ id: string; brandId: string; designerId: string }>;
      relationships: Array<{ id: string; sourceId: string; targetId: string; brandId: string }>;
    };
    invalidReferences: {
      tenures: Array<{ index: number; tenure: Tenure }>;
      relationships: Array<{ index: number; relationship: Relationship }>;
    };
  };
}

function isValidUUID(id: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(id);
}

function validateDataIntegrity(): ValidationResult {
  const result: ValidationResult = {
    isValid: true,
    errors: [],
    warnings: [],
    stats: {
      totalBrands: fashionGenealogyData.brands.length,
      totalDesigners: fashionGenealogyData.designers.length,
      totalTenures: fashionGenealogyData.tenures.length,
      totalRelationships: fashionGenealogyData.relationships.length,
      nonUuidEntities: {
        brands: [],
        designers: [],
        tenures: [],
        relationships: []
      },
      invalidReferences: {
        tenures: [],
        relationships: []
      }
    }
  };

  // Create lookup sets
  const designerIds = new Set<string>();
  const brandIds = new Set<string>();
  const seenIds = new Set<string>();

  // Check for duplicate IDs and valid UUIDs in designers
  fashionGenealogyData.designers.forEach(designer => {
    if (!designer.id) {
      result.errors.push(`Designer ${designer.name} is missing ID`);
      result.isValid = false;
    } else {
      if (seenIds.has(designer.id)) {
        result.errors.push(`Duplicate ID found: ${designer.id}`);
        result.isValid = false;
      } else {
        seenIds.add(designer.id);
        designerIds.add(designer.id);
      }
      if (!isValidUUID(designer.id)) {
        result.errors.push(`Invalid UUID format for designer: ${designer.id}`);
        result.stats.nonUuidEntities.designers.push({ id: designer.id, name: designer.name });
        result.isValid = false;
      }
    }
  });

  // Check for duplicate IDs and valid UUIDs in brands
  fashionGenealogyData.brands.forEach(brand => {
    if (!brand.id) {
      result.errors.push(`Brand ${brand.name} is missing ID`);
      result.isValid = false;
    } else {
      if (seenIds.has(brand.id)) {
        result.errors.push(`Duplicate ID found: ${brand.id}`);
        result.isValid = false;
      } else {
        seenIds.add(brand.id);
        brandIds.add(brand.id);
      }
      if (!isValidUUID(brand.id)) {
        result.errors.push(`Invalid UUID format for brand: ${brand.id}`);
        result.stats.nonUuidEntities.brands.push({ id: brand.id, name: brand.name });
        result.isValid = false;
      }
    }
  });

  // Validate tenure references
  fashionGenealogyData.tenures.forEach((tenure, index) => {
    let hasError = false;
    if (!designerIds.has(tenure.designerId)) {
      result.errors.push(`Tenure ${index} references non-existent designer ID: ${tenure.designerId}`);
      hasError = true;
      result.isValid = false;
    }
    if (!brandIds.has(tenure.brandId)) {
      result.errors.push(`Tenure ${index} references non-existent brand ID: ${tenure.brandId}`);
      hasError = true;
      result.isValid = false;
    }
    if (hasError) {
      result.stats.invalidReferences.tenures.push({ index, tenure });
    }
  });

  // Validate relationship references
  fashionGenealogyData.relationships.forEach((rel, index) => {
    let hasError = false;
    if (!designerIds.has(rel.sourceDesignerId)) {
      result.errors.push(`Relationship ${index} references non-existent source designer ID: ${rel.sourceDesignerId}`);
      hasError = true;
      result.isValid = false;
    }
    if (!designerIds.has(rel.targetDesignerId)) {
      result.errors.push(`Relationship ${index} references non-existent target designer ID: ${rel.targetDesignerId}`);
      hasError = true;
      result.isValid = false;
    }
    if (!brandIds.has(rel.brandId)) {
      result.errors.push(`Relationship ${index} references non-existent brand ID: ${rel.brandId}`);
      hasError = true;
      result.isValid = false;
    }
    if (hasError) {
      result.stats.invalidReferences.relationships.push({ index, relationship: rel });
    }
  });

  // Save detailed report
  const reportPath = join(__dirname, '../src/data/integrity_report.json');
  writeFileSync(reportPath, JSON.stringify({
    timestamp: new Date().toISOString(),
    nonUuidEntities: result.stats.nonUuidEntities,
    invalidReferences: result.stats.invalidReferences
  }, null, 2));

  return result;
}

// Run validation
try {
  console.log('Validating data integrity...');
  const result = validateDataIntegrity();
  
  if (result.errors.length > 0) {
    console.error('\nErrors found:');
    result.errors.forEach(error => console.error(`❌ ${error}`));
  } else {
    console.log('\n✅ No errors found!');
  }
  
  if (result.warnings.length > 0) {
    console.warn('\nWarnings:');
    result.warnings.forEach(warning => console.warn(`⚠️ ${warning}`));
  }
  
  console.log(`\nSummary:
  Total Designers: ${result.stats.totalDesigners}
  Total Brands: ${result.stats.totalBrands}
  Total Tenures: ${result.stats.totalTenures}
  Total Relationships: ${result.stats.totalRelationships}
  
  Non-UUID Entities:
  - Brands: ${result.stats.nonUuidEntities.brands.length}
  - Designers: ${result.stats.nonUuidEntities.designers.length}
  
  Invalid References:
  - Tenures: ${result.stats.invalidReferences.tenures.length}
  - Relationships: ${result.stats.invalidReferences.relationships.length}
  
  Overall Status: ${result.isValid ? '✅ Valid' : '❌ Invalid'}
  
  Detailed report saved to: src/data/integrity_report.json`);

} catch (error) {
  console.error('Failed to validate data:', error);
}
