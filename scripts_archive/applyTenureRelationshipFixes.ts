import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';
import { Brand, Designer, DesignerStatus, Relationship, Tenure, Department } from '../src/types/fashion';

interface DesignerStatusUpdate {
  id: string;
  name: string;
  isActive: boolean;
  status: DesignerStatus;
  currentRole: string | undefined;
  source: string;
  confidence: number;
  createdAt: string;
  updatedAt: string;
}

interface DesignerTenureUpdate {
  id: string;
  designerId: string;
  name: string;
  tenures: Array<{
    id: string;
    brand: string;
    role: string;
    department: string;
    startYear: number;
    endYear: number | null;
    isCurrentRole?: boolean;
    achievements: string[];
    confidence: number;
    createdAt: string;
    updatedAt: string;
  }>;
  confidence: number;
  createdAt: string;
  updatedAt: string;
}

interface Fixes {
  metadata: {
    version: string;
    lastUpdated: string;
    description: string;
    confidence: number;
  };
  designerStatusUpdates: {
    file: string;
    updates: DesignerStatusUpdate[];
  };
  designerTenures: {
    file: string;
    updates: DesignerTenureUpdate[];
  };
  tenureUpdates: {
    file: string;
    updates: Tenure[];
  };
  designerRelationships: {
    file: string;
    updates: Relationship[];
  };
}

interface FashionData {
  brands: Brand[];
  designers: Designer[];
  tenures: Tenure[];
  relationships: Relationship[];
}

// Helper function to normalize designer ID
function normalizeDesignerId(id: string, name: string): string {
  if (id.includes('-2025-')) {
    // Convert 2025 format ID to legacy format
    const baseName = name.toLowerCase().replace(/\s+/g, '-');
    return baseName;
  }
  return id;
}

// Helper function to normalize brand name for ID lookup
function normalizeBrandName(name: string): string {
  return name.toLowerCase()
    .replace(/\s*&\s*/g, '-and-')
    .replace(/['\s]+/g, '-');
}

// Helper function to find brand by ID or name
function findBrandByIdOrName(brandIdOrName: string, brands: Brand[]): Brand | undefined {
  // First try direct ID match
  let brand = brands.find(b => b.id === brandIdOrName);
  if (brand) return brand;

  // Then try exact name match
  brand = brands.find(b => b.name === brandIdOrName);
  if (brand) return brand;

  // Finally try normalized name match
  const normalizedName = normalizeBrandName(brandIdOrName);
  brand = brands.find(b => normalizeBrandName(b.name) === normalizedName);
  return brand;
}

// Helper function to map department string to Department enum
function mapDepartment(department: string | undefined): Department {
  if (!department) {
    return Department.ALL_DEPARTMENTS; // Default to ALL_DEPARTMENTS if not specified
  }

  const departmentMap: { [key: string]: Department } = {
    'Jewelry': Department.JEWELRY,
    'Watches': Department.WATCHES,
    'Ready-to-Wear': Department.READY_TO_WEAR,
    'Ready to Wear': Department.READY_TO_WEAR,
    'RTW': Department.READY_TO_WEAR,
    'Accessories': Department.ACCESSORIES,
    'Leather Goods': Department.LEATHER_GOODS,
    'Menswear': Department.MENSWEAR,
    'Mens': Department.MENSWEAR,
    'Womenswear': Department.WOMENSWEAR,
    'Womens': Department.WOMENSWEAR,
    'Haute Couture': Department.HAUTE_COUTURE,
    'Couture': Department.HAUTE_COUTURE,
    'All': Department.ALL_DEPARTMENTS,
    'All Departments': Department.ALL_DEPARTMENTS
  };

  const normalizedDept = department.trim();
  return departmentMap[normalizedDept] || Department.ALL_DEPARTMENTS;
}

const brandNamesMap = {
  'celine': 'Celine',
  'peter-do': 'Peter Do',
  'helmut-lang': 'Helmut Lang',
  'lemaire': 'Lemaire',
  'hermes': 'Hermès',
  'fear-of-god': 'Fear of God',
  'adidas': 'Adidas',
  'bode': 'Bode',
  'alexander-mcqueen': 'Alexander McQueen',
  'ferragamo': 'Ferragamo',
  'moschino': 'Moschino',
  'issey-miyake': 'Issey Miyake',
  'dolce-and-gabbana': 'Dolce & Gabbana',
  'mugler': 'Mugler',
  'ann-demeulemeester': 'Ann Demeulemeester',
  'vivienne-westwood': 'Vivienne Westwood',
  'royal-academy-antwerp': 'Royal Academy Antwerp',
  'number-nine': 'Number Nine',
  'takahiromiyashita-thesoloist': 'TAKAHIROMIYASHITA TheSoloist.',
  'miyake-design-studio': 'Miyake Design Studio',
  'ann-demeulemeester-serax': 'Ann Demeulemeester Serax',
  'sex': 'SEX',
  'gianni-versace': 'Gianni Versace'
};

function ensureBrandExists(brandId: string, fashionData: FashionData): void {
  const existingBrand = fashionData.brands.find((b: Brand) => b.id === brandId);
  if (!existingBrand) {
    const brandName = brandNamesMap[brandId as keyof typeof brandNamesMap] || brandId;
    const currentYear = new Date().getFullYear();
    console.log(`Created new brand ${brandName} with ID ${brandId} (foundedYear and founder need verification)`);
    fashionData.brands.push({
      id: brandId,
      name: brandName,
      foundedYear: currentYear, // Placeholder
      founder: "Unknown", // Placeholder
      createdAt: new Date(),
      updatedAt: new Date()
    });
  }
}

// Helper function to validate data before saving
function validateData(data: FashionData): boolean {
  let isValid = true;

  // Check for required brand fields
  const invalidBrands = data.brands.filter((b: Brand) => !b.id || !b.name);
  if (invalidBrands.length > 0) {
    console.error('Invalid brands found (missing id or name):', 
      invalidBrands.map(b => ({ id: b.id, name: b.name }))
    );
    isValid = false;
  }

  // Check for required tenure fields
  const invalidTenures = data.tenures.filter((t: Tenure) => 
    !t.id || !t.designerId || !t.brandId || !t.role || !t.department
  );
  if (invalidTenures.length > 0) {
    console.error('Invalid tenures found (missing required fields):', 
      invalidTenures.map(t => ({
        id: t.id,
        designerId: t.designerId,
        brandId: t.brandId,
        role: t.role,
        department: t.department
      }))
    );
    isValid = false;
  }

  // Validate foreign key relationships
  const brandIds = new Set(data.brands.map((b: Brand) => b.id));
  const designerIds = new Set(data.designers.map((d: Designer) => d.id));
  
  const orphanedTenures = data.tenures.filter((t: Tenure) => 
    !brandIds.has(t.brandId) || !designerIds.has(t.designerId)
  );
  if (orphanedTenures.length > 0) {
    console.error('Tenures with invalid references found:');
    orphanedTenures.forEach(t => {
      if (!brandIds.has(t.brandId)) {
        console.error(`- Tenure ${t.id} references non-existent brand ${t.brandId}`);
      }
      if (!designerIds.has(t.designerId)) {
        console.error(`- Tenure ${t.id} references non-existent designer ${t.designerId}`);
      }
    });
    isValid = false;
  }

  return isValid;
}

// Load fashion genealogy data
const fashionGenealogyPath = join(__dirname, '..', 'src', 'data', 'fashionGenealogy.json');
const fashionGenealogyData: FashionData = JSON.parse(readFileSync(fashionGenealogyPath, 'utf-8'));

// Set default department for existing tenures that don't have one
fashionGenealogyData.tenures.forEach(tenure => {
  if (!tenure.department) {
    tenure.department = Department.ALL_DEPARTMENTS;
  }
});

// Load fixes
const fixesPath = join(__dirname, '..', 'src', 'data', 'updates', '2025-fashion-fixes.json');
const fixes: Fixes = JSON.parse(readFileSync(fixesPath, 'utf-8'));

// Create a map of 2025 IDs to legacy IDs
const idMap = new Map<string, string>();

// Apply designer status updates first
if (fixes.designerStatusUpdates?.updates) {
  fixes.designerStatusUpdates.updates.forEach(update => {
    const legacyId = normalizeDesignerId(update.id, update.name);
    idMap.set(update.id, legacyId);

    const designer: Designer = {
      id: legacyId,
      name: update.name,
      isActive: update.isActive,
      status: update.status,
      currentRole: update.currentRole === null ? undefined : update.currentRole,
      createdAt: new Date(update.createdAt),
      updatedAt: new Date(update.updatedAt)
    };

    const existingDesigner = fashionGenealogyData.designers.find((d: Designer) => d.id === designer.id);
    if (existingDesigner) {
      Object.assign(existingDesigner, designer);
      console.log(`Updated designer ${designer.id}`);
    } else {
      fashionGenealogyData.designers.push(designer);
      console.log(`Added new designer ${designer.id}`);
    }
  });
}

// Ensure all brands exist before processing tenures
const brandIds = new Set(fixes.tenureUpdates?.updates.map(t => t.brandId));
brandIds.forEach(brandId => ensureBrandExists(brandId, fashionGenealogyData));

// Apply tenure updates from designer tenures
if (fixes.designerTenures?.updates) {
  fixes.designerTenures.updates.forEach(designerUpdate => {
    const legacyId = normalizeDesignerId(designerUpdate.designerId, designerUpdate.name);
    idMap.set(designerUpdate.designerId, legacyId);

    // Check if referenced designer exists
    const designer = fashionGenealogyData.designers.find((d: Designer) => d.id === legacyId);
    if (!designer) {
      console.log(`Warning: Designer tenures reference non-existent designer ${legacyId}`);
      return;
    }

    // Process each tenure for this designer
    designerUpdate.tenures.forEach(tenure => {
      // Ensure brand exists and get its UUID
      let brand = findBrandByIdOrName(tenure.brand, fashionGenealogyData.brands);
      if (!brand) {
        // If brand doesn't exist, create it
        ensureBrandExists(tenure.brand, fashionGenealogyData);
        brand = findBrandByIdOrName(tenure.brand, fashionGenealogyData.brands)!;
      }

      // Create or update tenure
      const department = mapDepartment(tenure.department);

      const newTenure = {
        id: tenure.id,
        designerId: legacyId,
        brandId: brand.id,
        role: tenure.role,
        department,
        startYear: tenure.startYear,
        endYear: tenure.endYear ?? null,
        isCurrentRole: tenure.isCurrentRole ?? false,
        achievements: tenure.achievements ?? [],
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const existingTenure = fashionGenealogyData.tenures.find((t: Tenure) => t.id === tenure.id);
      if (existingTenure) {
        Object.assign(existingTenure, newTenure);
        console.log(`Updated tenure ${tenure.id}`);
      } else {
        fashionGenealogyData.tenures.push(newTenure);
        console.log(`Added new tenure ${tenure.id}`);
      }
    });
  });
}

// Apply additional tenure updates
if (fixes.tenureUpdates?.updates) {
  fixes.tenureUpdates.updates.forEach(tenure => {
    // First try to find the brand
    let brandToUpdate = findBrandByIdOrName(tenure.brandId, fashionGenealogyData.brands);
    if (!brandToUpdate) {
      // If brand doesn't exist, create it
      ensureBrandExists(tenure.brandId, fashionGenealogyData);
      brandToUpdate = findBrandByIdOrName(tenure.brandId, fashionGenealogyData.brands)!;
    }

    // Now process the tenure
    const existingTenure = fashionGenealogyData.tenures.find(t => t.id === tenure.id);
    const department = mapDepartment(tenure.department);

    // Create a new tenure object without spreading the original to avoid undefined values
    const updatedTenure = {
      id: tenure.id,
      designerId: tenure.designerId,
      brandId: tenure.brandId,
      role: tenure.role,
      department,
      startYear: tenure.startYear,
      endYear: tenure.endYear ?? null,
      isCurrentRole: tenure.isCurrentRole ?? false,
      achievements: tenure.achievements ?? [],
      createdAt: new Date(),
      updatedAt: new Date()
    };

    if (existingTenure) {
      Object.assign(existingTenure, updatedTenure);
      console.log(`Updated tenure ${tenure.id}`);
    } else {
      fashionGenealogyData.tenures.push(updatedTenure);
      console.log(`Added new tenure ${tenure.id}`);
    }
  });
}

// Apply relationship updates
if (fixes.designerRelationships?.updates) {
  fixes.designerRelationships.updates.forEach(relationship => {
    // Map historical designer IDs to their current IDs
    const sourceId = relationship.sourceDesignerId.replace('-hist-', '-2025-');
    const targetId = relationship.targetDesignerId.replace('-hist-', '-2025-');
    const mappedSourceId = idMap.get(sourceId) || relationship.sourceDesignerId;
    const mappedTargetId = idMap.get(targetId) || relationship.targetDesignerId;

    // Check if referenced designers exist
    const sourceDesigner = fashionGenealogyData.designers.find((d: Designer) => d.id === mappedSourceId);
    if (!sourceDesigner) {
      console.log(`Warning: Relationship ${relationship.id} references non-existent source designer ${mappedSourceId}`);
      return;
    }

    const targetDesigner = fashionGenealogyData.designers.find((d: Designer) => d.id === mappedTargetId);
    if (!targetDesigner) {
      console.log(`Warning: Relationship ${relationship.id} references non-existent target designer ${mappedTargetId}`);
      return;
    }

    // Check if referenced brand exists
    const brand = fashionGenealogyData.brands.find((b: Brand) => b.id === relationship.brandId);
    if (!brand) {
      console.log(`Warning: Relationship ${relationship.id} references non-existent brand ${relationship.brandId}`);
      return;
    }

    // Update the relationship with mapped IDs
    const updatedRelationship = {
      ...relationship,
      sourceDesignerId: mappedSourceId,
      targetDesignerId: mappedTargetId,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const existingRelationship = fashionGenealogyData.relationships.find((r: Relationship) => r.id === relationship.id);
    if (existingRelationship) {
      Object.assign(existingRelationship, updatedRelationship);
      console.log(`Updated relationship ${relationship.id}`);
    } else {
      fashionGenealogyData.relationships.push(updatedRelationship);
      console.log(`Added new relationship ${relationship.id}`);
    }
  });
}

// Validate data before saving
if (!validateData(fashionGenealogyData)) {
  console.error('Data validation failed. Aborting save.');
  process.exit(1);
}

// Save updated data
writeFileSync(fashionGenealogyPath, JSON.stringify(fashionGenealogyData, null, 2));
console.log('Saved updates to fashion genealogy data');

// Verify data integrity
const brands = fashionGenealogyData.brands as Brand[];
const designers = fashionGenealogyData.designers as Designer[];
const tenures = fashionGenealogyData.tenures as Tenure[];
const relationships = fashionGenealogyData.relationships as Relationship[];

// Check for brands without active Creative Directors
brands.forEach((brand: Brand) => {
  const activeTenures = tenures.filter(
    (t: Tenure) => t.brandId === brand.id && t.isCurrentRole
  );
  if (activeTenures.length === 0) {
    console.log(`Note: ${brand.name} currently has no active Creative Director`);
  }
});

// Verify data
console.log('\nData Verification Results:');
console.log('-------------------------');
console.log(`Valid: true`);

console.log('\nStatistics:');
console.log(`Total Brands: ${brands.length}`);
console.log(`Total Designers: ${designers.length}`);
console.log(`Total Tenures: ${tenures.length}`);
console.log(`Total Relationships: ${relationships.length}`);

// Check for designers without tenures
console.log('\nWarnings:');
designers.forEach((designer: Designer) => {
  const designerTenures = tenures.filter((t: Tenure) => t.designerId === designer.id);
  if (designerTenures.length === 0) {
    console.log(`- Designer ${designer.name || designer.id} has no associated tenures`);
  }
});

// List designers without tenures
console.log('\nDesigners without tenures:');
designers
  .filter((designer: Designer) => !tenures.some((t: Tenure) => t.designerId === designer.id))
  .forEach((designer: Designer) => {
    console.log(`- ${designer.name || designer.id}`);
  });

// Run verification
import('./verifyData');
