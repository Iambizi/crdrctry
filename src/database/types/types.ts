import { Brand as BaseBrand, Designer as BaseDesigner, Tenure as BaseTenure, Relationship as BaseRelationship, Department, RelationshipType, DesignerStatus } from '../../types/fashion';

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
  collectionName: "designers";
  name: string;
  status: DesignerStatus;
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
  collectionName: "brands";
  name: string;
  description?: string;
  foundingYear?: number;
  headquarters?: string;
  parentCompany?: string;
  categories?: string[];
  website?: string;
  socialMedia?: Record<string, string>;
  logoUrl?: string;
}

export interface Tenure extends Omit<BaseTenure, keyof BaseRecord> {
  id: string;
  created: string;
  updated: string;
  collectionId: string;
  collectionName: "tenures";
  designerId: string;
  brandId: string;
  role: string;
  department: Department;
  startYear: number;
  endYear?: number;
  isCurrentRole: boolean;
  achievements?: string[];
  notableWorks?: string[];
  notableCollections?: string[];
  impactDescription?: string;
}

export interface Relationship extends Omit<BaseRelationship, keyof BaseRecord> {
  id: string;
  created: string;
  updated: string;
  collectionId: string;
  collectionName: "relationships";
  sourceDesignerId: string;
  targetDesignerId: string;
  brandId: string;
  type: RelationshipType;
  startYear?: number;
  endYear?: number;
  description?: string;
  impact?: string;
  collaborationProjects?: string[];
}

// Type helper for creating new records
export type CreateDesigner = Omit<Designer, keyof BaseRecord>;
export type CreateBrand = Omit<Brand, keyof BaseRecord>;
export type CreateTenure = Omit<Tenure, keyof BaseRecord>;
export type CreateRelationship = Omit<Relationship, keyof BaseRecord>;

// Re-export types from fashion.ts for convenience
export { Department, RelationshipType, DesignerStatus };
