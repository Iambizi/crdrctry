import { Brand as BaseBrand, Designer as BaseDesigner, Tenure as BaseTenure, Relationship as BaseRelationship, Department, RelationshipType, DesignerStatus, VerificationStatus } from '../../types/fashion';

// Base type for PocketBase records
interface BaseRecord {
  id: string;
  created: string;
  updated: string;
  collectionId: string;
  collectionName: string;
}

// Extend base types with PocketBase fields, overriding any conflicting fields
export interface Designer extends Omit<BaseDesigner, keyof BaseRecord> {
  id: string;
  created: string;
  updated: string;
  collectionId: string;
  collectionName: "fd_designers";
  name: string;
  status: DesignerStatus;
  verificationStatus: VerificationStatus;
  isActive: boolean;
  currentRole?: string;
  biography?: string;
  imageUrl?: string;
  nationality?: string;
  birthYear?: number;
  deathYear?: number;
  awards?: string[];
  education?: string[];
  signatureStyles?: string[];
  socialMedia?: Record<string, string>;
}

export interface Brand extends Omit<BaseBrand, keyof BaseRecord> {
  id: string;
  created: string;
  updated: string;
  collectionId: string;
  collectionName: "fd_brands";
  name: string;
  description?: string;
  foundedYear: number;
  founder: string;
  headquarters?: string;
  parentCompany?: string;
  categories?: string[];
  website?: string;
  socialMedia?: Record<string, string>;
  logoUrl?: string;
  verificationStatus: VerificationStatus;
}

export interface Tenure extends Omit<BaseTenure, keyof BaseRecord> {
  id: string;
  created: string;
  updated: string;
  collectionId: string;
  collectionName: "fd_tenures";
  designer: string;
  brand: string;
  role: string;
  department: Department;
  startYear: number;
  endYear?: number;
  isCurrentRole: boolean;
  achievements?: string[];
  notableWorks?: string[];
  notableCollections?: string[];
  impactDescription?: string;
  verificationStatus: VerificationStatus;
}

export interface Relationship extends Omit<BaseRelationship, keyof BaseRecord> {
  id: string;
  created: string;
  updated: string;
  collectionId: string;
  collectionName: "fd_relationships";
  field_sourceDesigner: string;
  field_targetDesigner: string;
  field_brand: string;
  field_type: RelationshipType;
  field_startYear?: number;
  field_endYear?: number;
  field_description?: string;
  field_collaborationProjects?: string[];
  field_verificationStatus: VerificationStatus;
  field_confidence?: number;
  field_sources?: string[];
}

// Type helper for creating new records - omit PocketBase system fields
export type CreateDesigner = Omit<Designer, keyof BaseRecord>;
export type CreateBrand = Omit<Brand, keyof BaseRecord>;
export type CreateTenure = {
  designer: string;
  brand: string;
  role: string;
  department: Department;
  startYear: number;
  endYear?: number;
  isCurrentRole: boolean;
  achievements?: string[];
  notableWorks?: string[];
  notableCollections?: string[];
  impactDescription?: string;
  verificationStatus: VerificationStatus;
};

export type CreateRelationship = {
  sourceDesigner: string;
  targetDesigner: string;
  brand: string;
  type: RelationshipType;
  startYear?: number;
  endYear?: number;
  description?: string;
  collaborationProjects?: string[];
  verificationStatus: VerificationStatus;
};

// Re-export types from fashion.ts for convenience
export { Department, RelationshipType, DesignerStatus, VerificationStatus };
