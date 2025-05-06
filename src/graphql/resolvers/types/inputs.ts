import { DesignerStatus, VerificationStatus, Department, RelationshipType } from '../../../database/types/types';

export interface YearRange {
  start?: number;
  end?: number;
}

export interface DesignerFilter {
  search?: string;
  status?: DesignerStatus;
  isActive?: boolean;
  nationality?: string;
  birthYearRange?: YearRange;
  hasAwards?: boolean;
}

export interface BrandFilter {
  search?: string;
  category?: string;
  foundedYearRange?: YearRange;
  hasParentCompany?: boolean;
}

export interface TenureFilter {
  search?: string;
  department?: Department;
  startYearRange?: YearRange;
  endYearRange?: YearRange;
  isActive?: boolean;
  brandId?: string;
  designerId?: string;
}

export interface RelationshipFilter {
  search?: string;
  type?: RelationshipType;
  yearRange?: YearRange;
  sourceDesigner?: string;
  targetDesigner?: string;
  brand?: string;
}

export interface ConnectionArgs {
  first?: number;
  after?: string;
  last?: number;
  before?: string;
}

export interface CreateBrandInput {
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

export interface UpdateBrandInput {
  name?: string;
  description?: string;
  foundedYear?: number;
  founder?: string;
  headquarters?: string;
  parentCompany?: string;
  categories?: string[];
  website?: string;
  socialMedia?: Record<string, string>;
  logoUrl?: string;
  verificationStatus?: VerificationStatus;
}

export interface CreateTenureInput {
  brandId: string;
  designerId: string;
  startYear: number;
  endYear?: number;
  department: Department;
  title?: string;
  isActive: boolean;
  achievements?: string[];
  notes?: string;
}

export interface UpdateTenureInput {
  brandId?: string;
  designerId?: string;
  startYear?: number;
  endYear?: number;
  department?: Department;
  title?: string;
  isActive?: boolean;
  achievements?: string[];
  notes?: string;
}

export interface CreateRelationshipInput {
  sourceDesigner: string;
  targetDesigner: string;
  type: RelationshipType;
  startYear?: number;
  endYear?: number;
  description?: string;
  collaborationProjects?: string[];
  verificationStatus: VerificationStatus;
  brand?: string;
}

export interface UpdateRelationshipInput {
  sourceDesigner?: string;
  targetDesigner?: string;
  type?: RelationshipType;
  startYear?: number;
  endYear?: number;
  description?: string;
  collaborationProjects?: string[];
  verificationStatus?: VerificationStatus;
  brand?: string;
}

export interface CreateDesignerInput {
  name: string;
  biography?: string;
  nationality?: string;
  birthYear?: number;
  deathYear?: number;
  education?: string[];
  awards?: string[];
  isActive: boolean;
  status: DesignerStatus;
  imageUrl?: string;
  websiteUrl?: string;
  socialMedia?: Record<string, string>;
  verificationStatus: VerificationStatus;
}

export interface UpdateDesignerInput {
  name?: string;
  biography?: string;
  nationality?: string;
  birthYear?: number;
  deathYear?: number;
  education?: string[];
  awards?: string[];
  isActive?: boolean;
  status?: DesignerStatus;
  imageUrl?: string;
  websiteUrl?: string;
  socialMedia?: Record<string, string>;
  verificationStatus?: VerificationStatus;
}

export interface BrandQueryArgs {
  first?: number;
  after?: string;
  last?: number;
  before?: string;
  filter?: BrandFilter;
}

export interface TenureQueryArgs {
  first?: number;
  after?: string;
  last?: number;
  before?: string;
  filter?: TenureFilter;
}

export interface RelationshipQueryArgs {
  first?: number;
  after?: string;
  last?: number;
  before?: string;
  filter?: RelationshipFilter;
}

export interface DesignerQueryArgs {
  first?: number;
  after?: string;
  last?: number;
  before?: string;
  filter?: DesignerFilter;
}
