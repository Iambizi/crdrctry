import { readFileSync } from 'fs';
import { join } from 'path';
import { Brand, Designer, Relationship, Tenure, DesignerStatus, RelationshipType } from '../src/types/fashion';

// Load fashion genealogy data
const fashionGenealogyPath = join(__dirname, '../src/data/fashionGenealogy.json');
const fashionGenealogyData = JSON.parse(readFileSync(fashionGenealogyPath, 'utf-8'));

interface VerificationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  stats: {
    totalBrands: number;
    totalDesigners: number;
    totalTenures: number;
    totalRelationships: number;
    brandsWithoutDesigners: string[];
    designersWithoutTenures: string[];
    incompleteData: {
      brands: string[];
      designers: string[];
      tenures: string[];
      relationships: string[];
    };
  };
}

function verifyData(): VerificationResult {
  const result: VerificationResult = {
    isValid: true,
    errors: [],
    warnings: [],
    stats: {
      totalBrands: fashionGenealogyData.brands.length,
      totalDesigners: fashionGenealogyData.designers.length,
      totalTenures: fashionGenealogyData.tenures.length,
      totalRelationships: fashionGenealogyData.relationships.length,
      brandsWithoutDesigners: [],
      designersWithoutTenures: [],
      incompleteData: {
        brands: [],
        designers: [],
        tenures: [],
        relationships: [],
      },
    },
  };

  // Verify Brands
  fashionGenealogyData.brands.forEach((brand: Brand) => {
    // Required fields
    const requiredFields = [
      { field: 'id', value: brand.id },
      { field: 'name', value: brand.name },
      { field: 'foundedYear', value: brand.foundedYear },
      { field: 'founder', value: brand.founder },
      { field: 'createdAt', value: brand.createdAt },
      { field: 'updatedAt', value: brand.updatedAt }
    ];

    requiredFields.forEach(({ field, value }) => {
      if (!value) {
        result.errors.push(`Brand ${brand.name || brand.id} missing required field: ${field}`);
        if (!result.stats.incompleteData.brands.includes(brand.id)) {
          result.stats.incompleteData.brands.push(brand.id);
        }
        result.isValid = false;
      }
    });

    // Type validation
    if (typeof brand.foundedYear !== 'number') {
      result.errors.push(`Brand ${brand.name}: foundedYear must be a number`);
      result.isValid = false;
    }

    if (!(brand.createdAt instanceof Date) && !(typeof brand.createdAt === 'string')) {
      result.errors.push(`Brand ${brand.name}: createdAt must be a Date`);
      result.isValid = false;
    }

    if (!(brand.updatedAt instanceof Date) && !(typeof brand.updatedAt === 'string')) {
      result.errors.push(`Brand ${brand.name}: updatedAt must be a Date`);
      result.isValid = false;
    }

    // Optional fields type validation
    if (brand.specialties && !Array.isArray(brand.specialties)) {
      result.errors.push(`Brand ${brand.name}: specialties must be an array`);
      result.isValid = false;
    }

    if (brand.markets && !Array.isArray(brand.markets)) {
      result.errors.push(`Brand ${brand.name}: markets must be an array`);
      result.isValid = false;
    }

    if (brand.social_media && typeof brand.social_media !== 'object') {
      result.errors.push(`Brand ${brand.name}: social_media must be an object`);
      result.isValid = false;
    }

    // Designer associations
    const brandTenures = fashionGenealogyData.tenures.filter((t: Tenure) => t.brandId === brand.id);
    const brandRelationships = fashionGenealogyData.relationships.filter((r: Relationship) => r.brandId === brand.id);
    const designerIds = new Set([
      ...brandTenures.map((t: Tenure) => t.designerId),
      ...brandRelationships.map((r: Relationship) => r.sourceDesignerId),
      ...brandRelationships.map((r: Relationship) => r.targetDesignerId)
    ]);
    
    const hasHadDesigners = brandTenures.length > 0;
    if (designerIds.size === 0 && !hasHadDesigners) {
      result.warnings.push(`Brand ${brand.name} has no historical designer data`);
      result.stats.brandsWithoutDesigners.push(brand.name);
    }

    const hasCurrentCD = brandTenures.some((t: Tenure) => t.isCurrentRole);
    if (!hasCurrentCD) {
      console.log(`Note: ${brand.name} currently has no active Creative Director`);
    }
  });

  // Verify Designers
  fashionGenealogyData.designers.forEach((designer: Designer) => {
    // Required fields
    const requiredFields = [
      { field: 'id', value: designer.id },
      { field: 'name', value: designer.name },
      { field: 'isActive', value: designer.isActive !== undefined },
      { field: 'status', value: designer.status },
      { field: 'createdAt', value: designer.createdAt },
      { field: 'updatedAt', value: designer.updatedAt }
    ];

    requiredFields.forEach(({ field, value }) => {
      if (!value) {
        result.errors.push(`Designer ${designer.name || designer.id} missing required field: ${field}`);
        if (!result.stats.incompleteData.designers.includes(designer.id)) {
          result.stats.incompleteData.designers.push(designer.id);
        }
        result.isValid = false;
      }
    });

    // Type validation
    if (typeof designer.isActive !== 'boolean') {
      result.errors.push(`Designer ${designer.name}: isActive must be a boolean`);
      result.isValid = false;
    }

    if (!Object.values(DesignerStatus).includes(designer.status)) {
      result.errors.push(`Designer ${designer.name}: invalid status value`);
      result.isValid = false;
    }

    // Optional fields type validation
    if (designer.birthYear && typeof designer.birthYear !== 'number') {
      result.errors.push(`Designer ${designer.name}: birthYear must be a number`);
      result.isValid = false;
    }

    if (designer.deathYear && typeof designer.deathYear !== 'number') {
      result.errors.push(`Designer ${designer.name}: deathYear must be a number`);
      result.isValid = false;
    }

    if (designer.awards && !Array.isArray(designer.awards)) {
      result.errors.push(`Designer ${designer.name}: awards must be an array`);
      result.isValid = false;
    }

    if (designer.education && !Array.isArray(designer.education)) {
      result.errors.push(`Designer ${designer.name}: education must be an array`);
      result.isValid = false;
    }

    // Tenure associations
    const designerTenures = fashionGenealogyData.tenures.filter((t: Tenure) => t.designerId === designer.id);
    if (designerTenures.length === 0) {
      result.warnings.push(`Designer ${designer.name} has no associated tenures`);
      result.stats.designersWithoutTenures.push(designer.name);
    }
  });

  // Verify Tenures
  fashionGenealogyData.tenures.forEach((tenure: Tenure) => {
    // Required fields
    const requiredFields = [
      { field: 'id', value: tenure.id },
      { field: 'designerId', value: tenure.designerId },
      { field: 'brandId', value: tenure.brandId },
      { field: 'role', value: tenure.role },
      { field: 'startYear', value: tenure.startYear },
      { field: 'isCurrentRole', value: tenure.isCurrentRole !== undefined },
      { field: 'createdAt', value: tenure.createdAt },
      { field: 'updatedAt', value: tenure.updatedAt }
    ];

    requiredFields.forEach(({ field, value }) => {
      if (!value) {
        result.errors.push(`Tenure ${tenure.id} missing required field: ${field}`);
        if (!result.stats.incompleteData.tenures.includes(tenure.id)) {
          result.stats.incompleteData.tenures.push(tenure.id);
        }
        result.isValid = false;
      }
    });

    // Reference validation
    const designer = fashionGenealogyData.designers.find((d: Designer) => d.id === tenure.designerId);
    const brand = fashionGenealogyData.brands.find((b: Brand) => b.id === tenure.brandId);

    if (!designer) {
      result.errors.push(`Tenure ${tenure.id} references non-existent designer`);
      result.isValid = false;
    }
    if (!brand) {
      result.errors.push(`Tenure ${tenure.id} references non-existent brand`);
      result.isValid = false;
    }

    // Type validation
    if (typeof tenure.startYear !== 'number') {
      result.errors.push(`Tenure ${tenure.id}: startYear must be a number`);
      result.isValid = false;
    }

    if (tenure.endYear && typeof tenure.endYear !== 'number') {
      result.errors.push(`Tenure ${tenure.id}: endYear must be a number`);
      result.isValid = false;
    }

    if (typeof tenure.isCurrentRole !== 'boolean') {
      result.errors.push(`Tenure ${tenure.id}: isCurrentRole must be a boolean`);
      result.isValid = false;
    }

    // Optional fields type validation
    if (tenure.achievements && !Array.isArray(tenure.achievements)) {
      result.errors.push(`Tenure ${tenure.id}: achievements must be an array`);
      result.isValid = false;
    }

    if (tenure.notableWorks && !Array.isArray(tenure.notableWorks)) {
      result.errors.push(`Tenure ${tenure.id}: notableWorks must be an array`);
      result.isValid = false;
    }
  });

  // Verify Relationships
  fashionGenealogyData.relationships.forEach((relationship: Relationship) => {
    // Required fields
    const requiredFields = [
      { field: 'id', value: relationship.id },
      { field: 'sourceDesignerId', value: relationship.sourceDesignerId },
      { field: 'targetDesignerId', value: relationship.targetDesignerId },
      { field: 'brandId', value: relationship.brandId },
      { field: 'type', value: relationship.type },
      { field: 'createdAt', value: relationship.createdAt },
      { field: 'updatedAt', value: relationship.updatedAt }
    ];

    requiredFields.forEach(({ field, value }) => {
      if (!value) {
        result.errors.push(`Relationship ${relationship.id} missing required field: ${field}`);
        if (!result.stats.incompleteData.relationships.includes(relationship.id)) {
          result.stats.incompleteData.relationships.push(relationship.id);
        }
        result.isValid = false;
      }
    });

    // Reference validation
    const sourceDesigner = fashionGenealogyData.designers.find((d: Designer) => d.id === relationship.sourceDesignerId);
    const targetDesigner = fashionGenealogyData.designers.find((d: Designer) => d.id === relationship.targetDesignerId);
    const brand = fashionGenealogyData.brands.find((b: Brand) => b.id === relationship.brandId);

    if (!sourceDesigner) {
      result.errors.push(`Relationship ${relationship.id} references non-existent source designer`);
      result.isValid = false;
    }
    if (!targetDesigner) {
      result.errors.push(`Relationship ${relationship.id} references non-existent target designer`);
      result.isValid = false;
    }
    if (!brand) {
      result.errors.push(`Relationship ${relationship.id} references non-existent brand`);
      result.isValid = false;
    }

    // Type validation
    if (!Object.values(RelationshipType).includes(relationship.type)) {
      result.errors.push(`Relationship ${relationship.id}: invalid type value`);
      result.isValid = false;
    }

    if (relationship.startYear && typeof relationship.startYear !== 'number') {
      result.errors.push(`Relationship ${relationship.id}: startYear must be a number`);
      result.isValid = false;
    }

    if (relationship.endYear && typeof relationship.endYear !== 'number') {
      result.errors.push(`Relationship ${relationship.id}: endYear must be a number`);
      result.isValid = false;
    }

    // Optional fields type validation
    if (relationship.collaboration_projects && !Array.isArray(relationship.collaboration_projects)) {
      result.errors.push(`Relationship ${relationship.id}: collaboration_projects must be an array`);
      result.isValid = false;
    }
  });

  return result;
}

// Run verification
const verificationResult = verifyData();
console.log('Data Verification Results:');
console.log('-------------------------');
console.log(`Valid: ${verificationResult.isValid}`);
console.log('\nStatistics:');
console.log(`Total Brands: ${verificationResult.stats.totalBrands}`);
console.log(`Total Designers: ${verificationResult.stats.totalDesigners}`);
console.log(`Total Tenures: ${verificationResult.stats.totalTenures}`);
console.log(`Total Relationships: ${verificationResult.stats.totalRelationships}`);

if (verificationResult.errors.length > 0) {
  console.log('\nErrors:');
  verificationResult.errors.forEach(error => console.log(`- ${error}`));
}

if (verificationResult.warnings.length > 0) {
  console.log('\nWarnings:');
  verificationResult.warnings.forEach(warning => console.log(`- ${warning}`));
}

if (verificationResult.stats.brandsWithoutDesigners.length > 0) {
  console.log('\nBrands without designers:');
  verificationResult.stats.brandsWithoutDesigners.forEach(brand => console.log(`- ${brand}`));
}

if (verificationResult.stats.designersWithoutTenures.length > 0) {
  console.log('\nDesigners without tenures:');
  verificationResult.stats.designersWithoutTenures.forEach(designer => console.log(`- ${designer}`));
}

export { verifyData };
export type { VerificationResult };
