export enum RelationshipType {
  MENTORSHIP = "mentorship",
  SUCCESSION = "succession",
  COLLABORATION = "collaboration",
  FAMILIAL = "familial",
}

export enum DesignerStatus {
  ACTIVE = "ACTIVE",
  RETIRED = "RETIRED",
  DECEASED = "DECEASED",
}

export interface BaseEntity {
  id: string;
  createdAt: Date;
  updatedAt: Date;
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
  signature_styles?: string[];
  social_media?: {
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
  category?: 'luxury_fashion' | 'design_studio' | 'collaboration_line' | 'historical_retail' | 'designer_label' | 'educational_institution' | 'collaboration_partner';
  logoUrl?: string;
  headquarters?: string;
  specialties?: string[];
  pricePoint?: string;
  markets?: string[];
  website?: string;
  hasHistoricalData?: boolean;
  notes?: string;
  lastCategorized?: string;
  social_media?: {
    instagram?: string;
    twitter?: string;
    facebook?: string;
  };
}

export enum Department {
  JEWELRY = "Jewelry",
  WATCHES = "Watches",
  READY_TO_WEAR = "Ready-to-Wear",
  ACCESSORIES = "Accessories",
  LEATHER_GOODS = "Leather Goods",
  MENSWEAR = "Menswear",
  WOMENSWEAR = "Womenswear",
  HAUTE_COUTURE = "Haute Couture",
  ALL_DEPARTMENTS = "All Departments"
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
  notable_collections?: string[];
  impact_description?: string;
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
  collaboration_projects?: string[];
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
  notable_collections?: string[];
  impact_description?: string;
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
  notable_collections?: string[];
  impact_description?: string;
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
