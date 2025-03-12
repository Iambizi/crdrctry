export enum RelationshipType {
  MENTORSHIP = "mentorship",
  SUCCESSION = "succession",
  COLLABORATION = "collaboration",
  FAMILIAL = "familial",
}

export enum DesignerStatus {
  ACTIVE = "active",
  RETIRED = "retired",
  DECEASED = "deceased",
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
  logoUrl?: string;
  headquarters?: string;
  specialties?: string[];
  pricePoint?: string;
  markets?: string[];
  website?: string;
  social_media?: {
    instagram?: string;
    twitter?: string;
    facebook?: string;
  };
}

export interface Tenure extends BaseEntity {
  designerId: string;
  brandId: string;
  role: string;
  startYear: number;
  endYear?: number;
  isCurrentRole: boolean;
  achievements?: string[];
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
