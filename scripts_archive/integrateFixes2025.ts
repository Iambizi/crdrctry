import fs from 'fs';
import path from 'path';
import { Designer, Brand, Tenure, Relationship, DesignerStatus, Department } from '../src/types/fashion';

// Load data files
const fashionGenealogyPath = path.join(__dirname, '../src/data/fashionGenealogy.json');
const fashionFixes2025Path = path.join(__dirname, '../src/data/updates/2025-fashion-fixes.json');

interface FashionGenealogyData {
  designers: Designer[];
  brands: Brand[];
  tenures: Tenure[];
  relationships: Relationship[];
}

interface HistoricalDesigner {
  id: string;
  name: string;
  role: string;
  department?: string;
  startYear: number;
  endYear?: number | null;
  isCurrentRole: boolean;
  achievements?: string[];
  createdAt: string;
  updatedAt: string;
}

interface DesignerTenure {
  id: string;
  brand: string;
  role: string;
  department?: string;
  startYear: number;
  endYear?: number | null;
  isCurrentRole: boolean;
  achievements?: string[];
  createdAt: string;
  updatedAt: string;
}

interface FashionFixes2025 {
  historicalBrands: Array<{
    brandName: string;
    designers: HistoricalDesigner[];
  }>;
  tenures: DesignerTenure[];
}

// Load data
const fashionGenealogyData: FashionGenealogyData = JSON.parse(fs.readFileSync(fashionGenealogyPath, 'utf-8'));
const fashionFixes2025: FashionFixes2025 = JSON.parse(fs.readFileSync(fashionFixes2025Path, 'utf-8'));

// Create a deep clone of the data for updates
const updatedData: FashionGenealogyData = JSON.parse(JSON.stringify(fashionGenealogyData));

// Helper function to generate unique IDs
const generateUniqueId = (prefix: string, existingIds: string[]): string => {
  let counter = 1;
  let newId = `${prefix}-${counter}`;
  while (existingIds.includes(newId)) {
    counter++;
    newId = `${prefix}-${counter}`;
  }
  return newId;
};

// Helper function to convert string to Department
const toDepartment = (department: string | undefined): Department | undefined => {
  if (!department) return undefined;
  const validDepartments: Record<string, Department> = {
    'jewelry': Department.JEWELRY,
    'watches': Department.WATCHES,
    'ready-to-wear': Department.READY_TO_WEAR,
    'accessories': Department.ACCESSORIES,
    'leather goods': Department.LEATHER_GOODS,
    'menswear': Department.MENSWEAR,
    'womenswear': Department.WOMENSWEAR,
    'haute couture': Department.HAUTE_COUTURE,
    'all departments': Department.ALL_DEPARTMENTS
  };
  return validDepartments[department.toLowerCase()] || Department.ALL_DEPARTMENTS;
};

// Helper function to ensure tenure exists
const ensureTenureExists = (designerId: string, brandId: string, tenure: Partial<Tenure> & { department?: string | Department }): void => {
  const existingTenure = updatedData.tenures.find(t =>
    t.designerId === designerId &&
    t.brandId === brandId &&
    t.role === tenure.role
  );

  if (!existingTenure) {
    const newTenure: Tenure = {
      id: generateUniqueId('tnr', updatedData.tenures.map(t => t.id)),
      designerId,
      brandId,
      role: tenure.role || 'Creative Director',
      department: typeof tenure.department === 'string' ? toDepartment(tenure.department) : tenure.department || Department.ALL_DEPARTMENTS,
      startYear: tenure.startYear || new Date().getFullYear(),
      endYear: tenure.endYear || undefined,
      isCurrentRole: tenure.isCurrentRole || false,
      achievements: tenure.achievements || [],
      notableWorks: [],
      notable_collections: [],
      impact_description: '',
      createdAt: new Date(),
      updatedAt: new Date()
    };
    updatedData.tenures.push(newTenure);
    console.log(`Added new tenure for ${designerId} at ${brandId}`);
  } else {
    Object.assign(existingTenure, {
      department: typeof tenure.department === 'string' ? toDepartment(tenure.department) : tenure.department || existingTenure.department,
      startYear: tenure.startYear || existingTenure.startYear,
      endYear: tenure.endYear || existingTenure.endYear,
      isCurrentRole: tenure.isCurrentRole || existingTenure.isCurrentRole,
      achievements: tenure.achievements || existingTenure.achievements,
      updatedAt: new Date()
    });
    console.log(`Updated tenure for ${designerId} at ${brandId}`);
  }
};

// Helper function to find designer by ID or name
const findDesigner = (designers: Designer[], idOrName: string): Designer | undefined => {
  return designers.find(d => d.id === idOrName || d.name === idOrName);
};

// Helper function to find brand by ID or name
const findBrand = (brands: Brand[], idOrName: string): Brand | undefined => {
  return brands.find(b => b.id === idOrName || b.name === idOrName);
};

// Process historical brand data
console.log('\nUpdating historical brand data...');
if (fashionFixes2025.historicalBrands) {
  fashionFixes2025.historicalBrands.forEach((brandData: { brandName: string, designers: HistoricalDesigner[] }) => {
    const existingBrand = findBrand(updatedData.brands, brandData.brandName);

    if (existingBrand) {
      // Process each designer
      brandData.designers.forEach((designer: HistoricalDesigner) => {
        // Add or update designer
        const existingDesigner = findDesigner(updatedData.designers, designer.id);
        if (existingDesigner) {
          Object.assign(existingDesigner, {
            name: designer.name,
            updatedAt: new Date(designer.updatedAt)
          });
          console.log(`Updated historical designer ${designer.name}`);
        } else {
          const newDesigner: Designer = {
            id: designer.id,
            name: designer.name,
            status: DesignerStatus.ACTIVE,
            isActive: true,
            createdAt: new Date(designer.createdAt),
            updatedAt: new Date(designer.updatedAt)
          };
          updatedData.designers.push(newDesigner);
          console.log(`Added historical designer ${designer.name}`);
        }

        // Add or update tenure
        ensureTenureExists(designer.id, existingBrand.id, {
          role: designer.role,
          department: toDepartment(designer.department),
          startYear: designer.startYear,
          endYear: designer.endYear || undefined,
          isCurrentRole: designer.isCurrentRole,
          achievements: designer.achievements,
          createdAt: new Date(designer.createdAt),
          updatedAt: new Date(designer.updatedAt)
        });
      });
    }
  });
}

// Update designer tenures
console.log('\nUpdating designer tenures...');
if (fashionFixes2025.tenures) {
  fashionFixes2025.tenures.forEach((tenure: DesignerTenure) => {
    const designer = findDesigner(updatedData.designers, tenure.id);
    const brand = findBrand(updatedData.brands, tenure.brand);

    if (designer && brand) {
      ensureTenureExists(designer.id, brand.id, {
        role: tenure.role,
        department: toDepartment(tenure.department),
        startYear: tenure.startYear,
        endYear: tenure.endYear || undefined,
        isCurrentRole: tenure.isCurrentRole,
        achievements: tenure.achievements,
        createdAt: new Date(tenure.createdAt),
        updatedAt: new Date(tenure.updatedAt)
      });
    }
  });
}

// Save updated data
fs.writeFileSync(fashionGenealogyPath, JSON.stringify(updatedData, null, 2));
console.log('\nIntegration complete. Updated statistics:');
console.log('--------------------------------------');
console.log(`Total Designers: ${updatedData.designers.length}`);
console.log(`Total Brands: ${updatedData.brands.length}`);
console.log(`Total Tenures: ${updatedData.tenures.length}`);
console.log(`Total Relationships: ${updatedData.relationships.length}`);
