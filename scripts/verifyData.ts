import { Brand, Designer, Relationship, Tenure } from '../src/types/fashion';
import fashionGenealogyData from '../src/data/fashionGenealogy';

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
    if (!brand.name || !brand.foundedYear || !brand.founder) {
      result.errors.push(`Brand ${brand.name || brand.id} missing required fields`);
      result.stats.incompleteData.brands.push(brand.id);
      result.isValid = false;
    }

    // Check if brand has any designers
    const brandTenures = fashionGenealogyData.tenures.filter(t => t.brandId === brand.id);
    if (brandTenures.length === 0) {
      result.warnings.push(`Brand ${brand.name} has no associated designers`);
      result.stats.brandsWithoutDesigners.push(brand.name);
    }
  });

  // Verify Designers
  fashionGenealogyData.designers.forEach((designer: Designer) => {
    if (!designer.name || designer.status === undefined) {
      result.errors.push(`Designer ${designer.name || designer.id} missing required fields`);
      result.stats.incompleteData.designers.push(designer.id);
      result.isValid = false;
    }

    // Check if designer has any tenures
    const designerTenures = fashionGenealogyData.tenures.filter(t => t.designerId === designer.id);
    if (designerTenures.length === 0) {
      result.warnings.push(`Designer ${designer.name} has no associated tenures`);
      result.stats.designersWithoutTenures.push(designer.name);
    }
  });

  // Verify Tenures
  fashionGenealogyData.tenures.forEach((tenure: Tenure) => {
    // Verify references
    const designer = fashionGenealogyData.designers.find(d => d.id === tenure.designerId);
    const brand = fashionGenealogyData.brands.find(b => b.id === tenure.brandId);

    if (!designer) {
      result.errors.push(`Tenure ${tenure.id} references non-existent designer`);
      result.isValid = false;
    }
    if (!brand) {
      result.errors.push(`Tenure ${tenure.id} references non-existent brand`);
      result.isValid = false;
    }

    if (!tenure.role || !tenure.startYear) {
      result.errors.push(`Tenure ${tenure.id} missing required fields`);
      result.stats.incompleteData.tenures.push(tenure.id);
      result.isValid = false;
    }
  });

  // Verify Relationships
  fashionGenealogyData.relationships.forEach((relationship: Relationship) => {
    // Verify references
    const sourceDesigner = fashionGenealogyData.designers.find(d => d.id === relationship.sourceDesignerId);
    const targetDesigner = fashionGenealogyData.designers.find(d => d.id === relationship.targetDesignerId);
    const brand = fashionGenealogyData.brands.find(b => b.id === relationship.brandId);

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

    if (!relationship.type) {
      result.errors.push(`Relationship ${relationship.id} missing required fields`);
      result.stats.incompleteData.relationships.push(relationship.id);
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
