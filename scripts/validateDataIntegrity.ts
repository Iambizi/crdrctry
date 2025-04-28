import { readFileSync } from 'fs';
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
    duplicateIds: {
      brands: string[];
      designers: string[];
      tenures: string[];
      relationships: string[];
    };
    invalidReferences: {
      tenures: string[];
      relationships: string[];
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
      duplicateIds: {
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
        result.stats.duplicateIds.designers.push(designer.id);
        result.isValid = false;
      } else {
        seenIds.add(designer.id);
        designerIds.add(designer.id);
      }
      if (!isValidUUID(designer.id)) {
        result.errors.push(`Invalid UUID format: ${designer.id}`);
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
        result.stats.duplicateIds.brands.push(brand.id);
        result.isValid = false;
      } else {
        seenIds.add(brand.id);
        brandIds.add(brand.id);
      }
      if (!isValidUUID(brand.id)) {
        result.errors.push(`Invalid UUID format: ${brand.id}`);
        result.isValid = false;
      }
    }
  });

  // Validate tenure references
  fashionGenealogyData.tenures.forEach((tenure, index) => {
    if (!designerIds.has(tenure.designerId)) {
      result.errors.push(`Tenure ${index} references non-existent designer ID: ${tenure.designerId}`);
      result.stats.invalidReferences.tenures.push(tenure.designerId);
      result.isValid = false;
    }
    if (!brandIds.has(tenure.brandId)) {
      result.errors.push(`Tenure ${index} references non-existent brand ID: ${tenure.brandId}`);
      result.stats.invalidReferences.tenures.push(tenure.brandId);
      result.isValid = false;
    }
  });

  // Validate relationship references
  fashionGenealogyData.relationships.forEach((rel, index) => {
    if (!designerIds.has(rel.sourceDesignerId)) {
      result.errors.push(`Relationship ${index} references non-existent source designer ID: ${rel.sourceDesignerId}`);
      result.stats.invalidReferences.relationships.push(rel.sourceDesignerId);
      result.isValid = false;
    }
    if (!designerIds.has(rel.targetDesignerId)) {
      result.errors.push(`Relationship ${index} references non-existent target designer ID: ${rel.targetDesignerId}`);
      result.stats.invalidReferences.relationships.push(rel.targetDesignerId);
      result.isValid = false;
    }
    if (!brandIds.has(rel.brandId)) {
      result.errors.push(`Relationship ${index} references non-existent brand ID: ${rel.brandId}`);
      result.stats.invalidReferences.relationships.push(rel.brandId);
      result.isValid = false;
    }
  });

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
  
  Duplicate IDs found: ${Object.values(result.stats.duplicateIds).flat().length}
  Invalid References found: ${Object.values(result.stats.invalidReferences).flat().length}
  
  Overall Status: ${result.isValid ? '✅ Valid' : '❌ Invalid'}`);

} catch (error) {
  console.error('Failed to validate data:', error);
}
