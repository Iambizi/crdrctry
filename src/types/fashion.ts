export enum RelationshipType {
  mentorship = "mentorship",
  succession = "succession",
  collaboration = "collaboration",
  familial = "familial",
}

export enum DesignerStatus {
  active = "ACTIVE",
  retired = "RETIRED",
  deceased = "DECEASED",
}

// Base type for all entities
export interface BaseEntity {
  id?: string;
  createdAt?: string | Date;
  updatedAt?: string | Date;
}

export interface Designer extends BaseEntity {
  name: string;
  currentRole?: string;
  isActive: boolean;
  status: DesignerStatus;
  biography?: string;
  imageUrl?: string;
  nationality?: string;
  birthYear?: number;
  deathYear?: number;
  awards?: string[];
  education?: string[];
  signatureStyles?: string[];
  socialMedia?: {
    instagram?: string;
    twitter?: string;
    linkedin?: string;
    facebook?: string;
  };
}

export interface Brand extends BaseEntity {
  name: string;
  foundedYear: number;
  founder: string;
  parentCompany?: string;
  parentBrand?: string;
  category?: 'luxuryFashion' | 'designStudio' | 'collaborationLine' | 'historicalRetail' | 'designerLabel' | 'educationalInstitution' | 'collaborationPartner';
  logoUrl?: string;
  headquarters?: string;
  specialties?: string[];
  pricePoint?: string;
  markets?: string[];
  website?: string;
  hasHistoricalData?: boolean;
  notes?: string;
  lastCategorized?: string;
  socialMedia?: {
    instagram?: string;
    twitter?: string;
    facebook?: string;
  };
}

export enum Department {
  jewelry = "Jewelry",
  watches = "Watches",
  readyToWear = "Ready-to-Wear",
  accessories = "Accessories",
  leatherGoods = "Leather Goods",
  menswear = "Menswear",
  womenswear = "Womenswear",
  hauteCouture = "Haute Couture",
  allDepartments = "All Departments"
}

export interface Tenure extends BaseEntity {
  designerId: string;
  brandId: string;
  role: string;
  department?: Department;
  startYear: number;
  endYear?: number | null;
  isCurrentRole: boolean;
  achievements?: string[];
  notableWorks?: string[];
  notableCollections?: string[];
  impactDescription?: string;
}

export interface Relationship extends BaseEntity {
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

export interface HistoricalDesigner {
  id: string;
  name: string;
  role: string;
  department?: string;
  startYear: number;
  endYear?: number | null;
  isCurrentRole: boolean;
  achievements?: string[];
  notableWorks?: string[];
  notableCollections?: string[];
  impactDescription?: string;
  createdAt: string;
  updatedAt: string;
}

export interface DesignerTenure {
  brand: string;
  role: string;
  department?: string;
  startYear: number;
  endYear?: number | null;
  isCurrentRole: boolean;
  achievements?: string[];
  notableWorks?: string[];
  notableCollections?: string[];
  impactDescription?: string;
  createdAt: string;
  updatedAt: string;
}

export interface EnrichedDesigner {
  name: string;
  tenures: Array<{
    brand: string;
    role: string;
    department?: Department;
    startYear: number;
    endYear: number | null;
    achievements?: string[];
    confidence: number;
  }>;
}

export interface EnrichedBrandDesigner {
  name: string;
  role: string;
  department?: Department;
  startYear: number;
  endYear: number | null;
  notableWorks?: string[];
  confidence: number;
}

export interface EnrichedBrand {
  name: string;
  designers: EnrichedBrandDesigner[];
}
