export type DesignerStatus = "ACTIVE" | "RETIRED" | "DECEASED";
export type RelationshipType =
  | "mentorship"
  | "succession"
  | "collaboration"
  | "familial";
export type Department =
  | "Jewelry"
  | "Watches"
  | "Ready-to-Wear"
  | "Accessories"
  | "Leather Goods"
  | "Menswear"
  | "Womenswear"
  | "Haute Couture"
  | "All Departments";

export type BrandCategory =
  | "luxury_fashion"
  | "design_studio"
  | "collaboration_line"
  | "historical_retail"
  | "designer_label"
  | "educational_institution"
  | "collaboration_partner";

// Base type for PocketBase records
interface BaseRecord {
  id: string;
  created: string;
  updated: string;
}

export interface Designer extends BaseRecord {
  collectionId: string;
  collectionName: "designers";
  name: string;
  current_role?: string;
  is_active: boolean;
  status: DesignerStatus;
  biography?: string;
  image_url?: string;
  nationality?: string;
  birth_year?: number;
  death_year?: number;
  awards?: string[];
  education?: string[];
  signature_styles?: string[];
  social_media?: Record<string, string>;
}

export interface Brand extends BaseRecord {
  collectionId: string;
  collectionName: "brands";
  name: string;
  founded_year: number;
  founder: string;
  category: BrandCategory;
  parent_company?: string;
  parent_brand?: string;
  logo_url?: string;
  headquarters?: string;
  specialties?: string[];
  price_point?: string;
  markets?: string[];
  website?: string;
  has_historical_data: boolean;
  notes?: string;
  social_media?: Record<string, string>;
}

export interface Tenure extends BaseRecord {
  collectionId: string;
  collectionName: "tenures";
  designer_id: string;
  brand_id: string;
  role: string;
  department?: Department;
  start_year: number;
  end_year?: number;
  is_current_role: boolean;
  achievements?: string[];
  notable_works?: string[];
  notable_collections?: string[];
  impact_description?: string;
  // PocketBase relations
  designer: string; // Relation to designers collection
  brand: string; // Relation to brands collection
}

export interface Relationship extends BaseRecord {
  collectionId: string;
  collectionName: "relationships";
  source_designer_id: string;
  target_designer_id: string;
  brand_id: string;
  type: RelationshipType;
  start_year?: number;
  end_year?: number;
  description?: string;
  impact?: string;
  collaboration_projects?: string[];
  // PocketBase relations
  source_designer: string; // Relation to designers collection
  target_designer: string; // Relation to designers collection
  brand: string; // Relation to brands collection
}

// Type helper for creating new records
export type CreateDesigner = Omit<
  Designer,
  keyof BaseRecord | "collectionId" | "collectionName"
>;
export type CreateBrand = Omit<
  Brand,
  keyof BaseRecord | "collectionId" | "collectionName"
>;
export type CreateTenure = Omit<
  Tenure,
  keyof BaseRecord | "collectionId" | "collectionName"
>;
export type CreateRelationship = Omit<
  Relationship,
  keyof BaseRecord | "collectionId" | "collectionName"
>;
