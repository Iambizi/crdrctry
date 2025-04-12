import fs from 'fs';
import path from 'path';
import { Designer, Brand, Tenure, Relationship, DesignerStatus, Department } from '../src/types/fashion';

// Load data files
const fashionGenealogyPath = path.join(__dirname, '../src/data/fashionGenealogy.json');
const fashionFixesPath = path.join(__dirname, '../src/data/updates/2025-fashion-fixes.json');

const fashionGenealogyData = JSON.parse(fs.readFileSync(fashionGenealogyPath, 'utf-8'));
const fashionFixes2025 = JSON.parse(fs.readFileSync(fashionFixesPath, 'utf-8'));

interface DesignerUpdate {
  id: string;
  name: string;
  isActive: boolean;
  status: string;
  currentRole?: string;
  source?: string;
  confidence: number;
  createdAt: string;
  updatedAt: string;
}

interface HistoricalDesigner {
  id: string;
  name: string;
  role: string;
  department: string;
  startYear: number;
  endYear?: number | null;
  isCurrentRole: boolean;
  achievements: string[];
  notableWorks?: string[];
  confidence: number;
  createdAt: string;
  updatedAt: string;
}

interface BrandHistoricalData {
  id: string;
  brandName: string;
  historicalDesigners: HistoricalDesigner[];
  relationships: Relationship[];
  confidence: number;
  createdAt: string;
  updatedAt: string;
}

interface DesignerTenure {
  id: string;
  brand: string;
  role: string;
  department: string;
  startYear: number;
  endYear?: number | null;
  isCurrentRole: boolean;
  achievements: string[];
  confidence: number;
  createdAt: string;
  updatedAt: string;
}

interface DesignerTenureUpdate {
  id: string;
  designerId: string;
  name: string;
  tenures: DesignerTenure[];
  confidence: number;
  createdAt: string;
  updatedAt: string;
}

interface TimestampUpdate {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
}

interface FashionData {
  designers: Designer[];
  brands: Brand[];
  tenures: Tenure[];
  relationships: Relationship[];
}

// Deep clone the existing data to avoid mutations
const updatedData: FashionData = JSON.parse(JSON.stringify(fashionGenealogyData));

// Helper function to check if a date string is valid ISO 8601
const isValidISODate = (dateStr: string): boolean => {
  const date = new Date(dateStr);
  return date instanceof Date && !isNaN(date.getTime());
};

// Helper function to validate designer status
const isValidDesignerStatus = (status: string): status is DesignerStatus => {
  return ['ACTIVE', 'RETIRED', 'DECEASED'].includes(status.toUpperCase());
};

// Helper function to convert string to DesignerStatus
const toDesignerStatus = (status: string): DesignerStatus => {
  const upperStatus = status.toUpperCase();
  switch (upperStatus) {
    case 'ACTIVE':
      return DesignerStatus.ACTIVE;
    case 'RETIRED':
      return DesignerStatus.RETIRED;
    case 'DECEASED':
      return DesignerStatus.DECEASED;
    default:
      throw new Error(`Invalid designer status: ${status}`);
  }
};

// Helper function to convert string to Department
const toDepartment = (department: string): Department => {
  const validDepartments: { [key: string]: Department } = {
    'menswear': Department.MENSWEAR,
    'womenswear': Department.WOMENSWEAR,
    'accessories': Department.ACCESSORIES,
    'ready-to-wear': Department.READY_TO_WEAR,
    'leather-goods': Department.LEATHER_GOODS,
    'jewelry': Department.JEWELRY,
    'watches': Department.WATCHES,
    'haute-couture': Department.HAUTE_COUTURE
  };
  return validDepartments[department.toLowerCase()] || Department.ALL_DEPARTMENTS;
};

// Helper function to find designer by ID or name
const findDesigner = (designers: Designer[], idOrName: string): Designer | undefined => {
  return designers.find(d => d.id === idOrName || d.name === idOrName);
};

// Helper function to find brand by ID or name
const findBrand = (brands: Brand[], idOrName: string): Brand | undefined => {
  return brands.find(b => b.id === idOrName || b.name === idOrName);
};

// Helper function to generate a unique ID
const generateUniqueId = (prefix: string, existingIds: string[]): string => {
  let counter = 1;
  let newId = `${prefix}-${counter}`;
  while (existingIds.includes(newId)) {
    counter++;
    newId = `${prefix}-${counter}`;
  }
  return newId;
};

// Update designer statuses
console.log('Updating designer statuses...');
if (fashionFixes2025.designerStatusUpdates?.updates) {
  fashionFixes2025.designerStatusUpdates.updates.forEach((update: DesignerUpdate) => {
    if (!isValidDesignerStatus(update.status)) {
      console.warn(`Invalid status "${update.status}" for designer ${update.name}`);
      return;
    }
    if (!isValidISODate(update.createdAt) || !isValidISODate(update.updatedAt)) {
      console.warn(`Invalid dates for designer ${update.name}`);
      return;
    }

    const existingDesigner = findDesigner(updatedData.designers, update.id);
    if (existingDesigner) {
      Object.assign(existingDesigner, {
        status: toDesignerStatus(update.status),
        isActive: update.isActive,
        currentRole: update.currentRole,
        updatedAt: new Date(update.updatedAt)
      });
      console.log(`Updated status for designer ${update.name}`);
    } else {
      const newDesigner: Designer = {
        id: update.id,
        name: update.name,
        status: toDesignerStatus(update.status),
        isActive: update.isActive,
        currentRole: update.currentRole,
        createdAt: new Date(update.createdAt),
        updatedAt: new Date(update.updatedAt)
      };
      updatedData.designers.push(newDesigner);
      console.log(`Added new designer ${update.name}`);
    }
  });
}

// Update historical brand data
console.log('\nUpdating historical brand data...');
if (fashionFixes2025.historicalBrandData?.updates) {
  fashionFixes2025.historicalBrandData.updates.forEach((brandData: BrandHistoricalData) => {
    const existingBrand = findBrand(updatedData.brands, brandData.brandName);
    if (existingBrand) {
      // Update or add historical designers
      brandData.historicalDesigners.forEach((designer: HistoricalDesigner) => {
        const existingDesigner = findDesigner(updatedData.designers, designer.name);
        if (!existingDesigner) {
          const newDesigner: Designer = {
            id: designer.id,
            name: designer.name,
            status: designer.isCurrentRole ? DesignerStatus.ACTIVE : DesignerStatus.RETIRED,
            isActive: designer.isCurrentRole,
            currentRole: designer.role,
            createdAt: new Date(designer.createdAt),
            updatedAt: new Date(designer.updatedAt)
          };
          updatedData.designers.push(newDesigner);
          console.log(`Added historical designer ${designer.name}`);
        }

        // Add or update tenure
        const existingTenure = updatedData.tenures?.find(t => 
          t.designerId === designer.id && t.brandId === existingBrand.id
        );

        if (existingTenure) {
          Object.assign(existingTenure, {
            role: designer.role,
            department: toDepartment(designer.department),
            startYear: designer.startYear,
            endYear: designer.endYear || undefined,
            isCurrentRole: designer.isCurrentRole,
            updatedAt: new Date(designer.updatedAt)
          });
          console.log(`Updated tenure for ${designer.name} at ${brandData.brandName}`);
        } else {
          const newTenure: Tenure = {
            id: generateUniqueId('tnr', updatedData.tenures.map(t => t.id)),
            designerId: designer.id,
            brandId: existingBrand.id,
            role: designer.role,
            department: toDepartment(designer.department),
            startYear: designer.startYear,
            endYear: designer.endYear || undefined,
            isCurrentRole: designer.isCurrentRole,
            createdAt: new Date(designer.createdAt),
            updatedAt: new Date(designer.updatedAt)
          };
          updatedData.tenures.push(newTenure);
          console.log(`Added new tenure for ${designer.name} at ${brandData.brandName}`);
        }
      });

      // Add relationships
      if (brandData.relationships) {
        brandData.relationships.forEach((relationship: Relationship) => {
          const existingRelationship = updatedData.relationships.find(r =>
            r.sourceDesignerId === relationship.sourceDesignerId &&
            r.targetDesignerId === relationship.targetDesignerId &&
            r.brandId === relationship.brandId
          );

          if (!existingRelationship) {
            const newRelationship: Relationship = {
              ...relationship,
              id: generateUniqueId('rel', updatedData.relationships.map(r => r.id))
            };
            updatedData.relationships.push(newRelationship);
            console.log(`Added new relationship between ${relationship.sourceDesignerId} and ${relationship.targetDesignerId}`);
          }
        });
      }
    }
  });
}

// Update designer tenures
console.log('\nUpdating designer tenures...');
if (fashionFixes2025.designerTenures?.updates) {
  fashionFixes2025.designerTenures.updates.forEach((update: DesignerTenureUpdate) => {
    const existingDesigner = findDesigner(updatedData.designers, update.designerId);
    if (existingDesigner) {
      update.tenures.forEach((tenure: DesignerTenure) => {
        const existingBrand = findBrand(updatedData.brands, tenure.brand);
        if (existingBrand) {
          const existingTenure = updatedData.tenures?.find(t =>
            t.designerId === update.designerId && t.brandId === existingBrand.id
          );

          if (existingTenure) {
            Object.assign(existingTenure, {
              role: tenure.role,
              department: toDepartment(tenure.department),
              startYear: tenure.startYear,
              endYear: tenure.endYear || undefined,
              isCurrentRole: tenure.isCurrentRole,
              updatedAt: new Date(tenure.updatedAt)
            });
            console.log(`Updated tenure for ${update.name} at ${tenure.brand}`);
          } else {
            const newTenure: Tenure = {
              id: generateUniqueId('tnr', updatedData.tenures.map(t => t.id)),
              designerId: update.designerId,
              brandId: existingBrand.id,
              role: tenure.role,
              department: toDepartment(tenure.department),
              startYear: tenure.startYear,
              endYear: tenure.endYear || undefined,
              isCurrentRole: tenure.isCurrentRole,
              createdAt: new Date(tenure.createdAt),
              updatedAt: new Date(tenure.updatedAt)
            };
            updatedData.tenures.push(newTenure);
            console.log(`Added new tenure for ${update.name} at ${tenure.brand}`);
          }
        }
      });
    }
  });
}

// Update timestamps for designers missing them
console.log('\nUpdating missing timestamps...');
if (fashionFixes2025.designerTimestampUpdates?.updates) {
  fashionFixes2025.designerTimestampUpdates.updates.forEach((update: TimestampUpdate) => {
    const existingDesigner = findDesigner(updatedData.designers, update.name);
    if (existingDesigner) {
      if (!existingDesigner.createdAt) existingDesigner.createdAt = new Date(update.createdAt);
      if (!existingDesigner.updatedAt) existingDesigner.updatedAt = new Date(update.updatedAt);
      console.log(`Updated timestamps for ${update.name}`);
    }
  });
}

// Save the updated data
fs.writeFileSync(fashionGenealogyPath, JSON.stringify(updatedData, null, 2));

console.log('\nIntegration complete. Updated statistics:');
console.log('--------------------------------------');
console.log(`Total Designers: ${updatedData.designers.length}`);
console.log(`Total Brands: ${updatedData.brands.length}`);
console.log(`Total Tenures: ${updatedData.tenures?.length || 0}`);
console.log(`Total Relationships: ${updatedData.relationships.length}`);
