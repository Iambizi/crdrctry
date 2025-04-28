// Enums for standardized values
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

export enum VerificationStatus {
  verified = "VERIFIED",
  unverified = "UNVERIFIED",
  pending = "PENDING"
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

export enum PricePoint {
  contemporary = "Contemporary",
  entryLuxury = "Entry Luxury",
  luxury = "Luxury",
  ultraLuxury = "Ultra Luxury",
  hauteCouture = "Haute Couture"
}

export enum Market {
  westernEurope = "Western Europe",
  northAmerica = "North America",
  eastAsia = "East Asia",
  southeastAsia = "Southeast Asia",
  middleEast = "Middle East",
  latinAmerica = "Latin America",
  oceania = "Oceania",
  africa = "Africa",
  global = "Global"
}

// Base type for all entities
export interface BaseEntity {
  id?: string;
  createdAt?: string | Date;
  updatedAt?: string | Date;
  /** Confidence score (0-1) indicating data reliability */
  confidence?: number;
  /** Verification status of the entity */
  verificationStatus?: VerificationStatus;
  /** List of sources used to verify the information */
  sources?: string[];
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
  // Verification fields
  confidence?: number; // Score between 0.0 and 1.0
  verificationStatus?: VerificationStatus;
  sources?: string[]; // URLs to official sources, press releases, etc.
  lastVerified?: string; // ISO 8601 date
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
  pricePoint?: PricePoint;
  markets?: Market[];
  website?: string;
  hasHistoricalData?: boolean;
  notes?: string;
  lastCategorized?: string;
  socialMedia?: {
    instagram?: string;
    twitter?: string;
    facebook?: string;
  };
  // Verification fields
  confidence?: number; // Score between 0.0 and 1.0
  verificationStatus?: VerificationStatus;
  sources?: string[]; // URLs to official sources, press releases, etc.
  lastVerified?: string; // ISO 8601 date
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

export interface FashionGenealogyData {
  brands: Brand[];
  designers: Designer[];
  tenures: Tenure[];
  relationships: Relationship[];
}
