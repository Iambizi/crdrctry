import fs from 'fs';
import path from 'path';
import fashionGenealogyData from '../src/data/fashionGenealogy';
import fashionUpdates2025 from '../src/data/updates/2025-fashion-updates.json';
import { Brand, Designer, Relationship } from '../src/types/fashion';

interface DesignerUpdate {
  id: string;
  name: string;
  isActive: boolean;
  status: string;
  currentRole?: string;
  confidence: number;
  createdAt: string;
  updatedAt: string;
}

interface BrandUpdate {
  brandName: string;
  foundedYear: number;
  founder: string;
  parentCompany?: string;
  headquarters: string;
  specialties: string[];
  pricePoint: string;
  markets: string[];
  social_media?: {
    instagram?: string;
    twitter?: string;
    facebook?: string;
  };
  createdAt: string;
  updatedAt: string;
}

interface RelationshipUpdate {
  sourceDesignerId: string;
  targetDesignerId: string;
  brandId: string;
  type: 'mentorship' | 'succession' | 'collaboration' | 'familial';
  startYear?: number;
  endYear?: number;
  description?: string;
  createdAt: string;
  updatedAt: string;
}

interface FashionUpdates2025 {
  metadata: {
    version: string;
    lastUpdated: string;
    description: string;
    confidence: number;
  };
  designerStatusUpdates: {
    file: string;
    updates: DesignerUpdate[];
  };
  brandUpdates?: {
    directory: string;
    updates: BrandUpdate[];
  };
  relationshipUpdates?: {
    directory: string;
    updates: RelationshipUpdate[];
  };
}

// Deep clone the existing data to avoid mutations
const updatedData = JSON.parse(JSON.stringify(fashionGenealogyData));
const updates = (fashionUpdates2025 as unknown) as FashionUpdates2025;

// Process designer updates
updates.designerStatusUpdates.updates.forEach((update: DesignerUpdate) => {
  const existingDesigner = updatedData.designers.find((d: Designer) => d.id === update.id);
  
  if (existingDesigner) {
    // Update existing designer
    Object.assign(existingDesigner, {
      status: update.status,
      isActive: update.isActive,
      currentRole: update.currentRole,
      updatedAt: update.updatedAt
    });
  } else {
    // Add new designer
    updatedData.designers.push({
      id: update.id,
      name: update.name,
      status: update.status,
      isActive: update.isActive,
      currentRole: update.currentRole,
      createdAt: update.createdAt,
      updatedAt: update.updatedAt
    });
  }
});

// Process brand updates
if (updates.brandUpdates?.updates) {
  updates.brandUpdates.updates.forEach((update: BrandUpdate) => {
    const existingBrand = updatedData.brands.find((b: Brand) => b.name === update.brandName);
    
    if (existingBrand) {
      // Update existing brand
      Object.assign(existingBrand, {
        foundedYear: update.foundedYear,
        founder: update.founder,
        parentCompany: update.parentCompany,
        headquarters: update.headquarters,
        specialties: update.specialties,
        pricePoint: update.pricePoint,
        markets: update.markets,
        social_media: update.social_media,
        updatedAt: update.updatedAt
      });
    } else {
      // Add new brand
      updatedData.brands.push({
        id: `brand-${updatedData.brands.length + 1}`,
        name: update.brandName,
        foundedYear: update.foundedYear,
        founder: update.founder,
        parentCompany: update.parentCompany,
        headquarters: update.headquarters,
        specialties: update.specialties,
        pricePoint: update.pricePoint,
        markets: update.markets,
        social_media: update.social_media,
        createdAt: update.createdAt,
        updatedAt: update.updatedAt
      });
    }
  });
}

// Process relationship updates
if (updates.relationshipUpdates?.updates) {
  updates.relationshipUpdates.updates.forEach((update: RelationshipUpdate) => {
    const existingRelationship = updatedData.relationships.find((r: Relationship) => 
      r.sourceDesignerId === update.sourceDesignerId && 
      r.targetDesignerId === update.targetDesignerId &&
      r.brandId === update.brandId
    );
    
    if (existingRelationship) {
      // Update existing relationship
      Object.assign(existingRelationship, {
        type: update.type,
        startYear: update.startYear,
        endYear: update.endYear,
        description: update.description,
        updatedAt: update.updatedAt
      });
    } else {
      // Add new relationship
      updatedData.relationships.push({
        id: `rel-${updatedData.relationships.length + 1}`,
        sourceDesignerId: update.sourceDesignerId,
        targetDesignerId: update.targetDesignerId,
        brandId: update.brandId,
        type: update.type,
        startYear: update.startYear,
        endYear: update.endYear,
        description: update.description,
        createdAt: update.createdAt,
        updatedAt: update.updatedAt
      });
    }
  });
}

// Save the updated data
const outputPath = path.join(__dirname, '../src/data/fashionGenealogy.json');
fs.writeFileSync(outputPath, JSON.stringify(updatedData, null, 2));

console.log('Integration complete. Updated statistics:');
console.log('--------------------------------------');
console.log(`Total Designers: ${updatedData.designers.length}`);
console.log(`Total Brands: ${updatedData.brands.length}`);
console.log(`Total Relationships: ${updatedData.relationships.length}`);
