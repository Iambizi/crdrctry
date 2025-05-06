export interface ConnectionArgs {
  first?: number;
  after?: string;
  last?: number;
  before?: string;
}

export interface YearRange {
  start?: number;
  end?: number;
}

// Brand Types
export interface BrandFilter {
  category?: string;
  hasParentCompany?: boolean;
  foundedYearRange?: YearRange;
  search?: string;
}

export interface CreateBrandInput {
  name: string;
  description?: string;
  headquarters?: string;
  foundedYear?: number;
  category?: string;
  parentCompany?: string;
  logoUrl?: string;
  websiteUrl?: string;
}

export interface UpdateBrandInput {
  name?: string;
  description?: string;
  headquarters?: string;
  foundedYear?: number;
  category?: string;
  parentCompany?: string;
  logoUrl?: string;
  websiteUrl?: string;
}

export type BrandQueryArgs = ConnectionArgs & {
  filter?: BrandFilter;
};

// Designer Types
export interface DesignerFilter {
  status?: string;
  isActive?: boolean;
  nationality?: string;
  birthYearRange?: YearRange;
  hasAwards?: boolean;
  search?: string;
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
  status: string;
  imageUrl?: string;
  websiteUrl?: string;
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
  status?: string;
  imageUrl?: string;
  websiteUrl?: string;
}

// Tenure Types
export interface TenureFilter {
  department?: string;
  isActive?: boolean;
  brandId?: string;
  designerId?: string;
  startYearRange?: YearRange;
  endYearRange?: YearRange;
  search?: string;
}

export interface CreateTenureInput {
  brandId: string;
  designerId: string;
  title: string;
  department?: string;
  startYear: number;
  endYear?: number;
  isActive: boolean;
  notes?: string;
}

export interface UpdateTenureInput {
  brandId?: string;
  designerId?: string;
  title?: string;
  department?: string;
  startYear?: number;
  endYear?: number;
  isActive?: boolean;
  notes?: string;
}

export type TenureQueryArgs = ConnectionArgs & {
  filter?: TenureFilter;
};

// Relationship Types
export interface RelationshipFilter {
  type?: string;
  sourceDesigner?: string;
  targetDesigner?: string;
  brand?: string;
}

export interface CreateRelationshipInput {
  sourceDesigner: string;
  targetDesigner: string;
  type: string;
  brand?: string;
  startYear?: number;
  endYear?: number;
  notes?: string;
}

export interface UpdateRelationshipInput {
  sourceDesigner?: string;
  targetDesigner?: string;
  type?: string;
  brand?: string;
  startYear?: number;
  endYear?: number;
  notes?: string;
}
