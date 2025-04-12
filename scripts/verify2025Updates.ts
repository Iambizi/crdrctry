import fashionUpdates2025 from '../src/data/updates/2025-fashion-updates.json';

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

interface UpdateVerificationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  stats: {
    totalDesignerUpdates: number;
    totalBrandUpdates: number;
    totalRelationshipUpdates: number;
  };
}

function verify2025Updates(): UpdateVerificationResult {
  // Cast to unknown first to avoid type checking during the cast
  const updates = (fashionUpdates2025 as unknown) as FashionUpdates2025;
  const result: UpdateVerificationResult = {
    isValid: true,
    errors: [],
    warnings: [],
    stats: {
      totalDesignerUpdates: updates.designerStatusUpdates?.updates?.length || 0,
      totalBrandUpdates: updates.brandUpdates?.updates?.length || 0,
      totalRelationshipUpdates: updates.relationshipUpdates?.updates?.length || 0,
    }
  };

  // Verify metadata
  if (!updates.metadata?.version) {
    result.errors.push('Missing version in metadata');
    result.isValid = false;
  }
  if (!updates.metadata?.lastUpdated) {
    result.errors.push('Missing lastUpdated in metadata');
    result.isValid = false;
  }
  if (!updates.metadata?.confidence || 
      typeof updates.metadata.confidence !== 'number' ||
      updates.metadata.confidence < 0 ||
      updates.metadata.confidence > 1) {
    result.errors.push('Invalid or missing confidence score in metadata');
    result.isValid = false;
  }

  // Verify designer status updates
  if (updates.designerStatusUpdates?.updates) {
    updates.designerStatusUpdates.updates.forEach((update: DesignerUpdate) => {
      // Required fields
      const requiredFields = [
        { field: 'id', value: update.id },
        { field: 'name', value: update.name },
        { field: 'isActive', value: update.isActive },
        { field: 'status', value: update.status },
        { field: 'createdAt', value: update.createdAt },
        { field: 'updatedAt', value: update.updatedAt }
      ];

      requiredFields.forEach(({ field, value }) => {
        if (value === undefined || value === null) {
          result.errors.push(`Designer update ${update.id || 'unknown'} missing required field: ${field}`);
          result.isValid = false;
        }
      });

      // Status validation
      if (!['active', 'retired', 'deceased'].includes(update.status)) {
        result.errors.push(`Designer update ${update.id}: invalid status value`);
        result.isValid = false;
      }

      // Confidence validation
      if (typeof update.confidence !== 'number' || update.confidence < 0 || update.confidence > 1) {
        result.errors.push(`Designer update ${update.id}: invalid confidence score`);
        result.isValid = false;
      }
    });
  }

  // Verify brand updates
  if (updates.brandUpdates?.updates) {
    updates.brandUpdates.updates.forEach((update: BrandUpdate) => {
      // Required fields
      const requiredFields = [
        { field: 'brandName', value: update.brandName },
        { field: 'foundedYear', value: update.foundedYear },
        { field: 'founder', value: update.founder },
        { field: 'headquarters', value: update.headquarters },
        { field: 'specialties', value: update.specialties },
        { field: 'pricePoint', value: update.pricePoint },
        { field: 'markets', value: update.markets },
        { field: 'createdAt', value: update.createdAt },
        { field: 'updatedAt', value: update.updatedAt }
      ];

      requiredFields.forEach(({ field, value }) => {
        if (value === undefined || value === null) {
          result.errors.push(`Brand update ${update.brandName || 'unknown'} missing required field: ${field}`);
          result.isValid = false;
        }
      });

      // Type validation
      if (typeof update.foundedYear !== 'number') {
        result.errors.push(`Brand update ${update.brandName}: foundedYear must be a number`);
        result.isValid = false;
      }

      if (!Array.isArray(update.specialties)) {
        result.errors.push(`Brand update ${update.brandName}: specialties must be an array`);
        result.isValid = false;
      }

      if (!Array.isArray(update.markets)) {
        result.errors.push(`Brand update ${update.brandName}: markets must be an array`);
        result.isValid = false;
      }
    });
  }

  // Verify relationship updates
  if (updates.relationshipUpdates?.updates) {
    updates.relationshipUpdates.updates.forEach((update: RelationshipUpdate) => {
      // Required fields
      const requiredFields = [
        { field: 'sourceDesignerId', value: update.sourceDesignerId },
        { field: 'targetDesignerId', value: update.targetDesignerId },
        { field: 'brandId', value: update.brandId },
        { field: 'type', value: update.type },
        { field: 'createdAt', value: update.createdAt },
        { field: 'updatedAt', value: update.updatedAt }
      ];

      requiredFields.forEach(({ field, value }) => {
        if (value === undefined || value === null) {
          result.errors.push(`Relationship update ${update.sourceDesignerId || 'unknown'} missing required field: ${field}`);
          result.isValid = false;
        }
      });

      // Type validation
      if (!['mentorship', 'succession', 'collaboration', 'familial'].includes(update.type)) {
        result.errors.push(`Relationship update ${update.sourceDesignerId}: invalid relationship type`);
        result.isValid = false;
      }
    });
  }

  return result;
}

// Run verification
const verificationResult = verify2025Updates();

console.log('2025 Updates Verification Results:');
console.log('================================');
console.log(`Valid: ${verificationResult.isValid}`);
console.log('\nStatistics:');
console.log(`Total Designer Updates: ${verificationResult.stats.totalDesignerUpdates}`);
console.log(`Total Brand Updates: ${verificationResult.stats.totalBrandUpdates}`);
console.log(`Total Relationship Updates: ${verificationResult.stats.totalRelationshipUpdates}`);

if (verificationResult.errors.length > 0) {
  console.log('\nErrors:');
  verificationResult.errors.forEach(error => console.log(`- ${error}`));
}

if (verificationResult.warnings.length > 0) {
  console.log('\nWarnings:');
  verificationResult.warnings.forEach(warning => console.log(`- ${warning}`));
}

export { verify2025Updates };
export type { UpdateVerificationResult, DesignerUpdate, BrandUpdate, RelationshipUpdate };
